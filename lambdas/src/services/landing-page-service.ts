import fs from "fs";
import path from "path";
import moment from "moment-timezone";
import { promisify } from "util";
import {
  BBLogger,
  ConfigCat,
  RedisClient,
  RedisClientV2,
  S3Client,
  getOrCreateDbConnection,
  fetchCustomerOrder,
  resolvePurchaseAmount,
  formatPurchaseAmount,
  shouldFetchOrderAmount,
  OrderLike,
  LandingPageError,
  ERROR_KEYS,
} from "../utils";
import MTCartService from "../services/mt-cart-service";
import {
  ContactEventCheckout,
  Checkoutflows,
  ContactContactsList,
  Accounts,
  MergeTag,
} from "../entities";
import logger from "../utils/logger";
import {
  redisMigrationFlag,
  landingPageQueueFlag,
  mergeTagsInLandingPage,
  includeTaxInLandingPages,
  enableReachAdvancedIdentification,
  validateCheckoutProduct,
} from "../types";
import { getSQS } from "../utils/sqs";
import { IsNull } from "typeorm";
import { productMatchesConfiguredProduct } from "../utils/checkout-product";

const readFileAsync = promisify(fs.readFile).bind(fs);

const sqs = getSQS();

class LandingPageService {

  getTemplateFileDir() {
    const env = process.env.ENV;
    if (env === 'test' || env === 'local') {
      return path.join(__dirname, '..', 'utils', 'template.html');
    }
    if (env === 'local') {
      return `${process.env.LAMBDA_TASK_ROOT}/utils/template.html`;
    }
    return `${process.env.LAMBDA_TASK_ROOT}/dist/utils/template.html`;
  }

  async publishLandingPage(landingPageUUID: string):Promise<any> {
    let settings = await this.getLandingPageConfig(landingPageUUID);
    settings.uuid = landingPageUUID;

    const accountCredentials = await RedisClient.getMTCredentials(settings.account_id);
    // This is crazy.
    // the subdomain we save in the landing page params is different then the
    // api "subdomain" in credentials
    const vanitySubdomain = settings.subdomain;
    const APISubdomain = accountCredentials.subdomain
    settings.subdomain = APISubdomain;

    let templateFile = await readFileAsync(this.getTemplateFileDir(), 'utf8');
    templateFile = templateFile.toString('utf8');

    let hostedFile = this.replaceTemplateKeys(templateFile, settings);
    hostedFile = hostedFile.replace(/\n|\r/g, '');

    const params = {
      ACL: 'public-read',
      Bucket: 'brandbot-checkout.com',
      Key: `${vanitySubdomain}/${settings.vanity}.html`,
      ContentType: 'text/html',
      ContentEncoding: 'utf8',
      CacheControl: 'max-age=0',
      Body: hostedFile,
    };

    await S3Client.client.putObject(params).promise();
  }

  async getLandingPageHTML(landingPageUUID: string):Promise<any> {
    let settings = await this.getLandingPageConfig(landingPageUUID);
    settings.uuid = landingPageUUID;
    const accountCredentials = await RedisClient.getMTCredentials(settings.account_id);
    const APISubdomain = accountCredentials.subdomain
    settings.subdomain = APISubdomain;
    let template = (await readFileAsync(this.getTemplateFileDir(), 'utf8')).toString('utf8');
    template = this.replaceTemplateKeys(template, settings);
    return template.replace(/\n|\r/g, '');
  }

  async getParams(landingPageUUID:string):Promise<any> {
    const parameters = await this.getLandingPageConfig(landingPageUUID);
    const totalPurchased = await RedisClient.getLandingPageTotalPurchases(landingPageUUID);
    if (parameters.globalLimit) {
      let remaining = parameters.globalLimitNumber - Number(totalPurchased);
      if (remaining < 0) {
        remaining = 0;
      }
      parameters.remaining = remaining;
    }

    if (parameters.isTimed && parameters.dates && parameters.dates.length) {
      const beginning = moment(parameters.dates[0]);
      const end = moment(parameters.dates[1]).endOf('day');
      const isExpired = !moment().tz(parameters.timezone || 'America/New_York').isBetween(beginning, end);

      if (isExpired) {
        return {
          expired: true,
          uuid: landingPageUUID,
          phone: parameters.phone,
          email: parameters.email,
          button_color: parameters.button_color,
          template: parameters.template,
          vanity: parameters.vanity,
        };
      }
    }
    const accountCredentials = await RedisClient.getMTCredentials(parameters.account_id);

    let resolvedDescription = parameters.description;
    const useMergeTags = await ConfigCat.getFeatureFlag(
      mergeTagsInLandingPage,
      false
    );
    if (useMergeTags && resolvedDescription && resolvedDescription.indexOf("[%") !== -1) {
      try {
        const accountMergeTags = await this.getAccountMergeTags(
          parameters.account_id
        );
        resolvedDescription = this.resolveMergeTagsInText(
          resolvedDescription,
          accountMergeTags
        );
      } catch (error) {
        logger.logError(
          error,
          `Failed to resolve merge tags for account ${parameters.account_id}`
        );
      }
    }

    if (parameters.discountMergeTag) {
      const mergeTag = await this.getMergeTag(parameters.discountMergeTag, parameters.account_id);
      const discount = mergeTag?.value ? parseFloat(mergeTag.value) : 0;
      const originalPrice = parameters.product.price;
      const finalPrice = originalPrice - discount;

      if (finalPrice >= 0) {
        parameters.displayPrice = Number(Number(originalPrice - finalPrice).toFixed(2));
        parameters.isDiscounted = true;
      } else {
        parameters.isDiscounted = false;
        parameters.displayPrice = null;
      }
    }

    if (parameters.displayPrice <= 0 && parameters.displayPrice !== null) {
      parameters.displayPrice = null;
      parameters.isDiscounted = false;
    }

    // Resolve merge tag in redirect URL if present
    let resolvedLink = parameters.link;
    if (resolvedLink && /^\[%[a-zA-Z0-9_-]+%\]$/.test(resolvedLink)) {
      const identifier = resolvedLink.match(/^\[%([a-zA-Z0-9_-]+)%\]$/)?.[1];
      if (identifier) {
        try {
          const mergeTag = await this.getMergeTag(identifier, parameters.account_id);
          if (mergeTag && mergeTag.value) {
            resolvedLink = mergeTag.value;
          } else {
            resolvedLink = null;
          }
        } catch (error) {
          logger.logError(
            error,
            `Failed to resolve redirect URL merge tag for account ${parameters.account_id}`
          );
          resolvedLink = null;
        }
      }
    }

    const includeTaxFlag = await ConfigCat.getFeatureFlagWithUser(
      includeTaxInLandingPages,
      ConfigCat.standardUser(parameters.account_id, parameters.vendor),
      false
    );

    const enableReachFlag = await ConfigCat.getFeatureFlagWithUser(
      enableReachAdvancedIdentification,
      ConfigCat.standardUser(parameters.account_id, parameters.vendor),
      false
    );

    const validateCheckoutProductFlag = await ConfigCat.getFeatureFlagWithUser(
      validateCheckoutProduct,
      ConfigCat.standardUser(parameters.account_id, parameters.vendor),
      false
    );

    const response: any = {
      subdomain: accountCredentials.subdomain,
      account_id: parameters.account_id,
      pixel: parameters.pixel,
      name: parameters.name,
      product: parameters.product,
      template: parameters.template,
      displayPrice: parameters.displayPrice,
      currency: parameters.currency,
      isDiscounted: parameters.isDiscounted,
      globalLimit: parameters.globalLimit,
      remaining: parameters.remaining,
      button_color: parameters.button_color,
      button_text: parameters.button_text,
      phone: parameters.phone,
      email: parameters.email,
      success: parameters.success,
      redirect: parameters.redirect,
      link: resolvedLink,
      description: resolvedDescription,
      customerType: parameters.customerType,
      test: 2022,
      enableReachAdvancedIdentification: enableReachFlag,
      validateCheckoutProduct: validateCheckoutProductFlag,
      vanity: parameters.vanity,
    };

    if (includeTaxFlag) {
      response.displayInclusiveTax = parameters.displayInclusiveTax;
      response.tax_rate = parameters.tax_rate;
    }

    return response;
  }

  /**
   * Validates contact has the appropriate tags if the LP is permissioned with tags set.
   * @param settings LP settings object
   * @param contactId BB contact id (mapped from MT user token)
   * @returns true or false if contact has been validated for LP.
   */
  async validateContact(settings: any, contactId: number): Promise<boolean> {
    const isPermissioned = settings.isPermissioned;
    let isAllowed = true;

    if (isPermissioned) {
      isAllowed = false;

      if (contactId) {
        const permissions = settings.selected_permissions.map(s => s.id);
        let currentPermissions = await RedisClient.getContactTags(contactId);

        if (currentPermissions && Object.keys(currentPermissions).length) {
          currentPermissions = Object.keys(currentPermissions).map(p => Number(p));
          isAllowed = currentPermissions.some(r => permissions.indexOf(r) >= 0);
        }
      }
    }

    return isAllowed;
  }

  async saveLandingPageVisitEvent(landingPageUUID:string, customerAccessToken:string):Promise<any> {
    const settings = await this.getLandingPageConfig(landingPageUUID);
    const accountCredentials = await RedisClient.getMTCredentials(settings.account_id);
    let contact = await MTCartService.getContactFromToken(accountCredentials.subdomain, customerAccessToken, settings.account_id);

    let isAllowed = false;
    if (contact) { // check user to see if have permission (correct tag) or if page is not permissioned
      isAllowed = await this.validateContact(settings, contact.id);
    }
    else { // if new user and permissioned, they are not allowed...
      isAllowed = !settings.isPermissioned;
    }
    if (!isAllowed) {
      const noPermissionMsg = (settings.followUpNotice) ? settings.followUpNotice : 'Do not have right permissions to use this page.';
      const contactId = (contact) ? contact.id : 'new MT user';
      BBLogger.logMessage(`MT Landing Page: UUID = [${landingPageUUID}], Msg = [${noPermissionMsg}], contact = [${contactId}]`, 'error');
      throw new LandingPageError(noPermissionMsg, ERROR_KEYS.LP_PERMISSION_DENIED, 400);
    }

    if (!contact) {
      const user = await MTCartService.getMTUser(accountCredentials.subdomain, customerAccessToken);
      const attributes = user.data.attributes || {};
      BBLogger.logMessage(`MT Landing Page: UUID = [${landingPageUUID}], contact (${attributes.email}) not found in BB for ${settings.account_id}, creating.`);
      contact = await this.insertContactIntoAccount(
        accountCredentials.subdomain,
        customerAccessToken,
        settings.account_id,
        attributes
      );
    }

    const landingPageData = await this.fetchLandingPageDataFromDb(landingPageUUID);
    await this.updateContactMergeTag(settings.subdomain, settings.vanity, contact.id, settings.name);
    const metadata = {
      status: 'landed',
      id: landingPageData.id
    };

    const useQueueBasedOnAccount = await ConfigCat.getFeatureFlagWithUser(
      landingPageQueueFlag,
      ConfigCat.standardUser(settings.account_id, settings.vendor)
    );
    if (useQueueBasedOnAccount) {
      await sqs.sendMessage({
        QueueUrl: process.env.LANDING_EVENT_QUEUE_URL,
        MessageBody: JSON.stringify({
          type: "landed",
          contactId: contact.id,
          metadata,
        }),
      });
    } else {
      await this.insertLandingPageContactEvent(contact.id, metadata);
    }
  }

  async resolveRecordedPurchaseAmount(
    purchaseAmount: string | number | null | undefined,
    order: OrderLike | null | undefined,
    orderId: number | string | null | undefined,
    subdomain: string,
    customerAccessToken: string
  ): Promise<string> {
    let resolvedAmount = resolvePurchaseAmount(order);
    if (resolvedAmount === 0 && purchaseAmount !== null && purchaseAmount !== undefined && purchaseAmount !== '') {
      resolvedAmount = resolvePurchaseAmount({ total: purchaseAmount });
    }

    if (shouldFetchOrderAmount(resolvedAmount, orderId)) {
      try {
        const orderResponse = await fetchCustomerOrder(subdomain, customerAccessToken, orderId as number | string);
        resolvedAmount = resolvePurchaseAmount(orderResponse);
      } catch (error) {
        BBLogger.logMessage(
          `MT Landing Page: Failed to fetch order ${orderId} for purchase amount with error ${error.message}`,
          'warn'
        );
      }
    }

    return formatPurchaseAmount(resolvedAmount);
  }

  async completeLandingPageCheckout(
    landingPageUUID:string,
    mtUserId:string,
    purchaseAmount: string | number | null | undefined,
    productId: number,
    customerAccessToken: string,
    order?: OrderLike | null,
    orderId?: number | string | null
  ):Promise<any> {
    const settings = await this.getLandingPageConfig(landingPageUUID);
    const accountCredentials = await RedisClient.getMTCredentials(settings.account_id);
    const recordedPurchaseAmount = await this.resolveRecordedPurchaseAmount(
      purchaseAmount,
      order,
      orderId,
      accountCredentials.subdomain,
      customerAccessToken
    );
    const contact = await MTCartService.getContactFromToken(accountCredentials.subdomain, customerAccessToken, settings.account_id);

    let isAllowed = false;
    if (contact) { // check user to see if have permission (correct tag) or if page is not permissioned
      isAllowed = await this.validateContact(settings, contact.id);
    }
    else { // if new user and permissioned, they are not allowed...
      isAllowed = !settings.isPermissioned;
    }
    if (!isAllowed) {
      const noPermissionMsg = (settings.followUpNotice) ? settings.followUpNotice : 'Do not have right permissions to use this page.';
      const contactId = (contact) ? contact.id : 'new MT user';
      BBLogger.logMessage(`MT Landing Page: UUID = [${landingPageUUID}], Msg = [${noPermissionMsg}], contact = [${contactId}]`, 'error');
      throw new LandingPageError(noPermissionMsg, ERROR_KEYS.LP_PERMISSION_DENIED, 400);
    }

    if (!contact) {
      BBLogger.logMessage(`MT Landing Page: UUID = [${landingPageUUID}], MT User ID = [${mtUserId}] - contact not found in BB.`, 'error');
    }

    const shouldValidateProduct = await ConfigCat.getFeatureFlagWithUser(
      validateCheckoutProduct,
      ConfigCat.standardUser(settings.account_id, settings.vendor),
      false
    );

    if (shouldValidateProduct) {
      const configuredProductId = settings.product?.id;
      if (!productMatchesConfiguredProduct(configuredProductId, productId)) {
        BBLogger.logMessage(
          `MT Landing Page: UUID = [${landingPageUUID}], product mismatch purchased [${productId}] vs configured [${configuredProductId}]`,
          'warn'
        );
        throw new LandingPageError(
          'Product does not match landing page',
          ERROR_KEYS.LP_PRODUCT_MISMATCH,
          400
        );
      }
    }

    // 1. Increment global checkoutflow counter
    await RedisClient.client.incrAsync(`brandbot:checkoutflows.${landingPageUUID}.totalPurchased`);

    const purchasedCountKey = `contacts:${contact.id}:checkoutflows:${landingPageUUID}:purchased`;
    try {
      // 2. Increment contact's checkoutflows counter
      // Code review:
      // https://github.com/BrandyBots/brandbot-microservices/blob/master/landing-pages-service/marianatek/carts/checkout-handler.js#L227
      await RedisClient.client.incrAsync(purchasedCountKey);
    } catch (error) {
      BBLogger.logMessage(`Failed to update ${purchasedCountKey} with error ${error.message}`, 'error');
    }

    // 3. Fetch landing page info from database
    const landingPageData = await this.fetchLandingPageDataFromDb(
      landingPageUUID
    );

    const useQueueBasedOnAccount = await ConfigCat.getFeatureFlagWithUser(
      landingPageQueueFlag,
      ConfigCat.standardUser(settings.account_id, settings.vendor)
    );
    if (useQueueBasedOnAccount) {
      await sqs.sendMessage({
        QueueUrl: process.env.LANDING_EVENT_QUEUE_URL,
        MessageBody: JSON.stringify({
          type: "finished",
          contactId: contact.id,
          metadata: {
            amount: recordedPurchaseAmount,
            checkoutflow_id: landingPageData.id,
            id: landingPageData.id,
            product_id: productId,
            status: "finished",
          },
          contactListId: landingPageData.contactListId,
        }),
      });
    } else {
      if (landingPageData.contactListId) {
        await this.insertContactIntoContactlist(
          landingPageData.contactListId,
          contact.id
        );
      }

      // 4. Insert an contact event for a finished checkout
      const metadata = {
        amount: recordedPurchaseAmount,
        checkoutflow_id: landingPageData.id,
        id: landingPageData.id,
        product_id: productId,
        status: "finished",
      };
      await this.insertLandingPageContactEvent(contact.id, metadata);
    }
  }

  async getLandingPage(landingPageUUID:string):Promise<any> {
    let landingPage;
    try {
      landingPage = await RedisClientV2.getLandingPage(landingPageUUID);
      return landingPage;
    } catch (error) {
      logger.logMessage(`Cache miss for landing page of uuid ${landingPageUUID}`, 'warn');
    }

    landingPage = await this.fetchLandingPageDataFromDb(landingPageUUID);

    // Set the landing page data in Redis
    try {
      await RedisClientV2.setLandingPage(landingPageUUID, landingPage);
    } catch (error) {
      logger.logError(error, `Failed to set landing page data in Redis for uuid ${landingPageUUID}`);
    }

    return landingPage;
  }

  async getLandingPageConfig(landingPageUUID:string):Promise<any> {
    const useV2 = await ConfigCat.getFeatureFlag(redisMigrationFlag, false);
    if (!useV2) {
      return await RedisClient.getLandingPageConfig(landingPageUUID);
    }

    const landingPage = await this.getLandingPage(landingPageUUID);
    const settings = {
      ...landingPage.settings,
      account_id: landingPage.accountId
    };

    // Check if any required settings are missing for backward compatibility
    if (
      !settings.subdomain ||
      !settings.currency ||
      !settings.waiver_text ||
      !settings.account_name ||
      !settings.timezone
    ) {
      const connection = await getOrCreateDbConnection();
      const account = await connection.getRepository(Accounts)
        .findOne({
          select: [
            'id',
            'name',
            'metadata',
            'timezone',
            'liability_waiver',
            'currency',
            'vendor'
          ],
          where: { 
            id: settings.account_id,
          }
        });

      if (!account) {
        throw new Error(`Could not find account record in db for id ${settings.account_id}`);
      }

      // Fill in missing settings from account data
      settings.account_name = account.name;
      settings.subdomain = account.metadata.subdomain;
      settings.timezone = account.timezone;
      settings.waiver_text = account.liability_waiver;
      settings.currency = account.currency;
      settings.vendor = account.vendor;

      // Update the settings in Redis
      try {
        await RedisClientV2.client.hset(
          `brandbot:checkoutflows:${landingPageUUID}`,
          'settings',
          JSON.stringify(settings)
        );
      } catch (error) {
        logger.logError(error, `Failed to set landing page data in Redis for uuid ${landingPageUUID}`);
      }
    }
    
    return settings;
  }

  async fetchLandingPageDataFromDb(landingPageUUID:string):Promise<any> {
    const connection = await getOrCreateDbConnection();

    const landingPage = await connection
      .createQueryBuilder()
      .select('checkoutflows')
      .from(Checkoutflows, 'checkoutflows')
      .where('uuid = :uuid', { uuid: landingPageUUID })
      .getOne();
    if (!landingPage) {
      throw Error(`Could not find checkoutflows record in db for uuid ${landingPageUUID}`);
    }
    return landingPage;
  }

  async updateContactMergeTag(subdomain, vanityName, contactId, name) {
    const landingPageUrl = `https://${subdomain}.brandbot-checkout.com/${vanityName}.html`;
    const encodedName = (name) ? name.replace(/'/g, "\\'") : 'unknown product';
    const query = `
      UPDATE contacts
        SET metadata = JSON_SET(metadata, '$.merge_tags', JSON_OBJECT('last_landing_url', '${landingPageUrl}')),
          metadata = JSON_SET(metadata, '$.merge_tags.last_landing_purchase_name', '${encodedName}')
          WHERE id = ${contactId}`;

    const connection = await getOrCreateDbConnection();
    await connection.query(query);
  }

  // Populate name/phone from MT /users/self when creating a missing BB contact (BTQ1-412).
  async insertContactIntoAccount(
    mtSubdomain: string,
    customerAccessToken: string,
    accountId: string,
    mtUserAttributes: {
      email: string;
      first_name?: string;
      last_name?: string;
      phone_number?: string;
    }
  ): Promise<any> {
    const sqlString = (value: string | null | undefined): string => {
      if (value === null || value === undefined || value === '') {
        return 'NULL';
      }
      return `'${String(value).replace(/'/g, "\\'")}'`;
    };

    const email = sqlString(mtUserAttributes.email);
    const firstName = sqlString(mtUserAttributes.first_name);
    const lastName = sqlString(mtUserAttributes.last_name);
    const mobilePhone = sqlString(mtUserAttributes.phone_number);

    const query = `
      INSERT INTO contacts (uuid, account_id, email, first_name, last_name, mobile_phone, source, metadata, created_at, updated_at)
        values (uuid(), ${accountId}, ${email}, ${firstName}, ${lastName}, ${mobilePhone}, 'marianatek', '{}', now(), now())`;

    const connection = await getOrCreateDbConnection();
    await connection.query(query);

    return await MTCartService.getContactFromToken(mtSubdomain, customerAccessToken, accountId);
  }

  async insertLandingPageContactEvent(contactId:number, metadata):Promise<any> {
    const connection = await getOrCreateDbConnection();
    const now =  moment().toISOString();
    BBLogger.logMessage(`Inserting to contact_event_checkout ${contactId}`, 'info');
    await connection
      .createQueryBuilder()
      .insert()
      .into(ContactEventCheckout)
      .values([
        {
          contactId,
          metadata: metadata,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        }
      ])
      .execute();
  }

  async insertContactIntoContactlist(contactListId, contactId):Promise<any> {
    const connection = await getOrCreateDbConnection();


    const contactListEntry = await connection
      .createQueryBuilder()
      .select("contactContactsList")
      .from(ContactContactsList, "contactContactsList")
      .where({contactListId, contactId})
      .getOne();

    if (!contactListEntry) {
      await connection
        .createQueryBuilder()
        .insert()
        .into(ContactContactsList)
        .values([
          {
            contactListId,
            contactId,
            createdAt: moment().toISOString()
          }
        ])
        .execute();
    }
  }

  replaceTemplateKeys(templateFile, settings) {
    let stringIndex = templateFile;
    const matches = stringIndex.match(/({{)(.*?)(}})/g);
    if (matches) {
      for (let i = matches.length - 1; i >= 0; i--) {
        const key = matches[i].replace('{{ ', '').replace(' }}', '');
        if (key.indexOf('.') > -1) {
          continue;
        }

        if (key === 'canonical') {
          stringIndex = stringIndex.replace('{{ canonical }}', `https://${settings.subdomain}.brandbot-checkout.com/${settings.vanity}.html`);
          continue;
        }

        if (key === 'account_name') {
          stringIndex = stringIndex.replace('{{ account_name }}', settings.account_name);
        }

        if (key === 'uuid') {
          stringIndex = stringIndex.replace('{{ uuid }}', settings.uuid);
        }

        if (key === 'env') {
          stringIndex = stringIndex.replace('{{ env }}', process.env.ENV);
        }

        let replace = '';
        if (settings[key]) {
          replace = settings[key];
        } else if (settings.template && settings.template[key]) {
          replace = settings.template[key];
        } else {
          replace = process.env.ENV;
        }

        stringIndex = stringIndex.replace(matches[i], replace);
      }
    }

    return stringIndex;
  }

  async getAccountMergeTags(accountId: number | string): Promise<MergeTag[]> {
    const connection = await getOrCreateDbConnection();
    const mergeTags = await connection.getRepository(MergeTag).find({
      where: {
        account_id: accountId,
        deletedAt: IsNull(),
      },
    });

    return mergeTags || [];
  }

  resolveMergeTagsInText(text: string, mergeTags: MergeTag[]): string {
    if (!text) return text;

    if (!mergeTags || !mergeTags.length)
      return text.replace(/\[%(.+?)%\]/g, "");
    return text.replace(/\[%(.+?)%\]/g, (_match: string, p1: string) => {
      const key = String(p1 || "").trim();
      const value = mergeTags.find((tag) => tag.identifier === key)?.value;
      if (value === null || value === undefined) return "";
      return String(value);
    });
  }

  async getMergeTag(identifier: string, accountId: number): Promise<MergeTag> {
    const connection = await getOrCreateDbConnection();
    const mergeTag = await connection.getRepository(MergeTag).findOne({
      where: { identifier, account_id: accountId, deletedAt: IsNull() },
    });
    return mergeTag;
  }
}

export default new LandingPageService();
