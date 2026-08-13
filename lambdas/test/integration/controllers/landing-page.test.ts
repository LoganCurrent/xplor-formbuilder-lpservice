import AWSMock from "mock-aws-s3";

import { useSeeding, factory } from "typeorm-seeding";
import { Connection } from "typeorm";

import LANDING_PAGE_PARAMS from "../../fixtures/landing-page-params";
import {
  publishLandingPage,
  getLandingPageParams,
  captureLandingPageVisitEvent,
  captureCompetedCheckout,
} from "../../../src/controllers";
import {
  Checkoutflows,
  Contacts,
  ContactEvent,
  ContactContactsList,
  ContactEventCheckout,
  Accounts,
  MergeTag,
} from "../../../src/entities";
import {
  RedisClient,
  RedisClientV2,
  S3Client,
  getOrCreateDbConnection,
  ConfigCat,
} from "../../../src/utils";
import LandingPageService from "../../../src/services/landing-page-service";
import Axios from "axios";
import logger from "../../../src/utils/logger";
import { redisMigrationFlag } from "../../../src/types";
import { SQS } from "@aws-sdk/client-sqs";

jest.mock("axios", () => {
  const mockAxios = {
    get: jest.fn(),
    post: jest.fn(),
  };
  return mockAxios;
});

jest.mock("@aws-sdk/client-sqs", () => {
  const sqsMethods = {
    sendMessage: jest.fn().mockReturnThis(),
  };

  return {
    SQS: jest.fn(() => sqsMethods),
  };
});

const LANDING_PAGE_UUID = "1234-1234-1234-1234";
const MT_USER_ID = "167002356";

const sqs = new SQS({});

describe("LandingPageController", () => {
  let connection: Connection;
  let checkoutFlow: Checkoutflows;
  let bbContact: Contacts;
  let bbContactId: string;
  let account: Accounts;

  beforeAll(async (done) => {
    connection = await getOrCreateDbConnection();
    await useSeeding();

    const mockS3 = AWSMock.S3();
    S3Client.client = mockS3;

    // Create account for testing missing settings
    account = await factory(Accounts)().create({
      id: LANDING_PAGE_PARAMS.account_id,
      name: "Test Account",
      timezone: "America/New_York",
      liability_waiver: "Test waiver text",
      currency: "USD",
      vendor: "marianatek",
      metadata: {
        subdomain: "test-subdomain",
      },
    });

    checkoutFlow = await factory(Checkoutflows)().create({
      uuid: LANDING_PAGE_UUID,
      accountId: LANDING_PAGE_PARAMS.account_id,
      settings: LANDING_PAGE_PARAMS,
      name: LANDING_PAGE_PARAMS.name,
    });
    bbContact = await factory(Contacts)().create({
      email: LANDING_PAGE_PARAMS.email,
      account_id: LANDING_PAGE_PARAMS.account_id,
    });
    bbContactId = bbContact.id.toString();

    await factory(MergeTag)().create({
      identifier: "price",
      value: "$24",
      account_id: LANDING_PAGE_PARAMS.account_id,
      label: "Price",
      franchise: true,
      label_is_locked: false,
    });
    await factory(MergeTag)().create({
      identifier: "period",
      value: "one week",
      account_id: LANDING_PAGE_PARAMS.account_id,
      label: "Period",
      franchise: true,
      label_is_locked: false,
    });

    // Setup Redis for both client versions
    RedisClient.host = process.env.REDIS_HOST
      ? process.env.REDIS_HOST
      : "localhost";
    RedisClient.port = process.env.REDIS_PORT
      ? parseInt(process.env.REDIS_PORT)
      : 6379;
    RedisClient.db = 15;

    RedisClientV2.host = process.env.REDIS_HOST
      ? process.env.REDIS_HOST
      : "localhost";
    RedisClientV2.port = process.env.REDIS_PORT
      ? parseInt(process.env.REDIS_PORT)
      : 6379;
    RedisClientV2.db = 15;

    await RedisClient.connect();
    await RedisClientV2.connect();

    done();
  });

  afterAll(async () => {
    const entities = connection.entityMetadatas;
    for (const entity of entities) {
      const repository = await connection.getRepository(entity.name);
      await repository.clear(); // Clear each entity table's content
    }

    // Reset Axios mock
    Object.keys(Axios).forEach((key) => {
      Axios[key] = jest.fn();
    });

    connection.close();
    await RedisClient.client.flushallAsync();
    RedisClient.client.end(true);
    await RedisClientV2.client.flushallAsync();
    await RedisClientV2.client.end(true);
    await S3Client.client
      .deleteBucket({ Bucket: "brandbot-checkout.com" })
      .promise();
  });

  beforeEach(async () => {
    await connection
      .getRepository(ContactEventCheckout)
      .createQueryBuilder()
      .delete()
      .execute();

    // Setup checkout flow cache
    await RedisClient.client.setAsync(
      `brandbot:checkoutflows.${LANDING_PAGE_UUID}`,
      JSON.stringify(LANDING_PAGE_PARAMS)
    );
    await RedisClient.client.setAsync(
      `brandbot:checkoutflows.${LANDING_PAGE_UUID}.totalPurchased`,
      0
    );
    // Setup BB -> MT mapping
    await RedisClient.client.hsetAsync(
      `marianatek:brandbot.sandbox:userId:${MT_USER_ID}`,
      "email",
      "tauren@brandbot.com"
    );
    await RedisClient.client.hsetAsync(
      `marianatek:brandbot.sandbox:userId:${MT_USER_ID}`,
      "id",
      bbContactId
    );
    // Setup Credentials
    await RedisClient.client.hsetAsync(
      `mariana:accounts:1458:credentials`,
      "access_token",
      "123abc"
    );
    await RedisClient.client.hsetAsync(
      `mariana:accounts:1458:credentials`,
      "subdomain",
      "brandbot.sandbox"
    );
  });

  describe("publishLandingPage", () => {
    it(" writes correct html file.", async () => {
      await publishLandingPage(LANDING_PAGE_UUID);
      const data = await S3Client.client
        .getObject({
          Bucket: "brandbot-checkout.com",
          Key: "marianatek-sandbox/test-1vO.html",
        })
        .promise();
      expect(data.Key).toBe("marianatek-sandbox/test-1vO.html");
    });
  });

  describe("getLandingPageParams", () => {
    it(" properly return expected landing page config (no merge tag resolution).", async () => {
      jest
        .spyOn(ConfigCat, "getFeatureFlag")
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);
      jest
        .spyOn(ConfigCat, "getFeatureFlagWithUser")
        .mockResolvedValue(false);
      const params = await getLandingPageParams(LANDING_PAGE_UUID);
      expect(params).toStrictEqual({
        name: LANDING_PAGE_PARAMS.name,
        subdomain: "brandbot.sandbox",
        account_id: LANDING_PAGE_PARAMS.account_id,
        vanity: LANDING_PAGE_PARAMS.vanity,
        success: "Thank you for your purchase!!",
        product: LANDING_PAGE_PARAMS.product,
        template: LANDING_PAGE_PARAMS.template,
        displayPrice: LANDING_PAGE_PARAMS.displayPrice,
        currency: LANDING_PAGE_PARAMS.currency,
        isDiscounted: LANDING_PAGE_PARAMS.isDiscounted,
        link: LANDING_PAGE_PARAMS.link,
        email: LANDING_PAGE_PARAMS.email,
        pixel: LANDING_PAGE_PARAMS.pixel,
        globalLimit: false,
        phone: LANDING_PAGE_PARAMS.phone,
        redirect: false,
        remaining: undefined,
        button_color: LANDING_PAGE_PARAMS.button_color,
        button_text: LANDING_PAGE_PARAMS.button_text,
        description: LANDING_PAGE_PARAMS.description,
        customerType: LANDING_PAGE_PARAMS.customerType,
        test: 2022,
        enableReachAdvancedIdentification: false,
        validateCheckoutProduct: false,
      });
    });
  });

  describe("getLandingPageParams", () => {
    it(" properly return expected landing page config.", async () => {
      jest.spyOn(ConfigCat, "getFeatureFlag").mockImplementation(async (flag: string) => {
        if (flag === 'redisMigrationFlag') return false;
        if (flag === 'mergeTagsInLandingPage') return true;
        return false;
      });
      jest
        .spyOn(ConfigCat, "getFeatureFlagWithUser")
        .mockResolvedValue(false);
      const params = await getLandingPageParams(LANDING_PAGE_UUID);
      expect(params).toStrictEqual({
        name: LANDING_PAGE_PARAMS.name,
        subdomain: "brandbot.sandbox",
        account_id: LANDING_PAGE_PARAMS.account_id,
        vanity: LANDING_PAGE_PARAMS.vanity,
        success: "Thank you for your purchase!!",
        product: LANDING_PAGE_PARAMS.product,
        template: LANDING_PAGE_PARAMS.template,
        displayPrice: LANDING_PAGE_PARAMS.displayPrice,
        currency: LANDING_PAGE_PARAMS.currency,
        isDiscounted: LANDING_PAGE_PARAMS.isDiscounted,
        link: LANDING_PAGE_PARAMS.link,
        email: LANDING_PAGE_PARAMS.email,
        pixel: LANDING_PAGE_PARAMS.pixel,
        globalLimit: false,
        phone: LANDING_PAGE_PARAMS.phone,
        redirect: false,
        remaining: undefined,
        button_color: LANDING_PAGE_PARAMS.button_color,
        button_text: LANDING_PAGE_PARAMS.button_text,
        description: LANDING_PAGE_PARAMS.description
          .replace("[%period%]", "one week")
          .replace("[%price%]", "$24"),
        customerType: LANDING_PAGE_PARAMS.customerType,
        test: 2022,
        enableReachAdvancedIdentification: false,
        validateCheckoutProduct: false,
      });
    });

    it("applies discount from merge tag to displayPrice", async () => {
      jest
        .spyOn(ConfigCat, "getFeatureFlag")
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);
      jest
        .spyOn(ConfigCat, "getFeatureFlagWithUser")
        .mockResolvedValue(false);

      const DISCOUNT_TAG = "discount-amount";

      // Create merge tag used for discount
      await factory(MergeTag)().create({
        identifier: DISCOUNT_TAG,
        value: "10",
        account_id: LANDING_PAGE_PARAMS.account_id,
        label: "Discount",
        franchise: true,
        label_is_locked: false,
      });

      // Update cached landing page settings to include discountMergeTag
      const paramsWithDiscount = {
        ...LANDING_PAGE_PARAMS,
        discountMergeTag: DISCOUNT_TAG,
      };

      await RedisClient.client.setAsync(
        `brandbot:checkoutflows.${LANDING_PAGE_UUID}`,
        JSON.stringify(paramsWithDiscount)
      );

      const params = await getLandingPageParams(LANDING_PAGE_UUID);

      expect(params).toStrictEqual({
        name: LANDING_PAGE_PARAMS.name,
        subdomain: "brandbot.sandbox",
        account_id: LANDING_PAGE_PARAMS.account_id,
        vanity: LANDING_PAGE_PARAMS.vanity,
        success: "Thank you for your purchase!!",
        product: LANDING_PAGE_PARAMS.product,
        template: LANDING_PAGE_PARAMS.template,
        displayPrice: 10,
        currency: LANDING_PAGE_PARAMS.currency,
        isDiscounted: true,
        link: LANDING_PAGE_PARAMS.link,
        email: LANDING_PAGE_PARAMS.email,
        pixel: LANDING_PAGE_PARAMS.pixel,
        globalLimit: false,
        phone: LANDING_PAGE_PARAMS.phone,
        redirect: false,
        remaining: undefined,
        button_color: LANDING_PAGE_PARAMS.button_color,
        button_text: LANDING_PAGE_PARAMS.button_text,
        description: LANDING_PAGE_PARAMS.description,
        customerType: LANDING_PAGE_PARAMS.customerType,
        test: 2022,
        enableReachAdvancedIdentification: false,
        validateCheckoutProduct: false,
      });
    });

    it("sets displayPrice to null and isDiscounted to false when displayPrice is less than or equal to 0", async () => {
      jest
        .spyOn(ConfigCat, "getFeatureFlag")
        .mockResolvedValueOnce(false) // redisMigrationFlag
        .mockResolvedValueOnce(false) // mergeTagsInLandingPage
        .mockResolvedValueOnce(true); // enableMergeTagsInDisplayPrice
      jest
        .spyOn(ConfigCat, "getFeatureFlagWithUser")
        .mockResolvedValueOnce(false); // includeTaxInLandingPages

      const paramsWithDiscount = {
        ...LANDING_PAGE_PARAMS,
        displayPrice: -10.00,
      };

      await RedisClient.client.setAsync(
        `brandbot:checkoutflows.${LANDING_PAGE_UUID}`,
        JSON.stringify(paramsWithDiscount)
      );

      const params = await getLandingPageParams(LANDING_PAGE_UUID);

      expect(params.displayPrice).toBe(null);
      expect(params.isDiscounted).toBe(false);
    });

    it("resolves merge tag in redirect URL to actual value", async () => {
      jest.spyOn(ConfigCat, "getFeatureFlag").mockImplementation(async (flag: string) => {
        if (flag === 'redisMigrationFlag') return false;
        return false;
      });
      jest
        .spyOn(ConfigCat, "getFeatureFlagWithUser")
        .mockResolvedValueOnce(false); // includeTaxInLandingPages

      const REDIRECT_TAG = "redirect_url";
      const REDIRECT_VALUE = "https://resolved-redirect.com";

      // Create merge tag for redirect URL
      await factory(MergeTag)().create({
        identifier: REDIRECT_TAG,
        value: REDIRECT_VALUE,
        account_id: LANDING_PAGE_PARAMS.account_id,
        label: "Redirect URL",
        franchise: true,
        label_is_locked: false,
      });

      // Update cached landing page with merge tag reference
      const paramsWithMergeTag = {
        ...LANDING_PAGE_PARAMS,
        link: `[%${REDIRECT_TAG}%]`,
        redirect: true,
      };

      await RedisClient.client.setAsync(
        `brandbot:checkoutflows.${LANDING_PAGE_UUID}`,
        JSON.stringify(paramsWithMergeTag)
      );

      await RedisClientV2.setLandingPage(LANDING_PAGE_UUID, {
        id: checkoutFlow.id,
        uuid: LANDING_PAGE_UUID,
        accountId: checkoutFlow.accountId,
        name: checkoutFlow.name,
        settings: paramsWithMergeTag,
        contactListId: checkoutFlow.contactListId,
      });

      const params = await getLandingPageParams(LANDING_PAGE_UUID);

      expect(params.link).toBe(REDIRECT_VALUE);
      expect(params.redirect).toBe(true);
    });

    it("returns displayInclusiveTax and tax_rate in params when feature flag is enabled", async () => {
      jest
        .spyOn(ConfigCat, "getFeatureFlag")
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);
      jest
        .spyOn(ConfigCat, "getFeatureFlagWithUser")
        .mockResolvedValueOnce(true);

      const paramsWithTax = {
        ...LANDING_PAGE_PARAMS,
        displayInclusiveTax: true,
        tax_rate: 0.10,
      };

      await RedisClient.client.setAsync(
        `brandbot:checkoutflows.${LANDING_PAGE_UUID}`,
        JSON.stringify(paramsWithTax)
      );

      const params = await getLandingPageParams(LANDING_PAGE_UUID);

      expect(params.displayInclusiveTax).toBe(true);
      expect(params.tax_rate).toBe(0.10);
    });

    it("does not return tax parameters when feature flag is disabled", async () => {
      jest
        .spyOn(ConfigCat, "getFeatureFlag")
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);
      jest
        .spyOn(ConfigCat, "getFeatureFlagWithUser")
        .mockResolvedValueOnce(false);

      const params = await getLandingPageParams(LANDING_PAGE_UUID);

      expect(params.displayInclusiveTax).toBeUndefined();
      expect(params.tax_rate).toBeUndefined();
    });

    it("keeps manual redirect URL unchanged", async () => {
      jest
        .spyOn(ConfigCat, "getFeatureFlag")
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);
      jest
        .spyOn(ConfigCat, "getFeatureFlagWithUser")
        .mockResolvedValueOnce(false);

      const MANUAL_URL = "https://manual-redirect.com";

      const paramsWithManualUrl = {
        ...LANDING_PAGE_PARAMS,
        link: MANUAL_URL,
        redirect: true,
      };

      await RedisClient.client.setAsync(
        `brandbot:checkoutflows.${LANDING_PAGE_UUID}`,
        JSON.stringify(paramsWithManualUrl)
      );

      const params = await getLandingPageParams(LANDING_PAGE_UUID);

      expect(params.link).toBe(MANUAL_URL);
      expect(params.redirect).toBe(true);
    });
  });

  describe("captureLandingPageVisitEvent", () => {
    it(" should set contact metadata and create a contactEvent record.", async () => {
      jest
        .spyOn(ConfigCat, "getFeatureFlagWithUser")
        .mockResolvedValueOnce(false);
      Axios.get = jest.fn().mockResolvedValueOnce({
        data: {
          data: {
            id: "167002356",
            type: "users",
            attributes: {
              first_name: "Test",
              last_name: "User",
              email: bbContact.email,
            },
          },
        },
      });

      await captureLandingPageVisitEvent(LANDING_PAGE_UUID, MT_USER_ID);
      const contactRecord = await connection
        .getRepository(Contacts)
        .findOne(bbContactId);
      expect(contactRecord.metadata.merge_tags.last_landing_purchase_name).toBe(
        "Intro Offer"
      );
      expect(contactRecord.metadata.merge_tags.last_landing_url).toBe(
        "https://marianatek-sandbox.brandbot-checkout.com/test-1vO.html"
      );

      expect(Axios.get).toHaveBeenCalledWith(
        "https://brandbot.sandbox.marianatek.com/api/users/self",
        expect.any(Object)
      );
      const contactEventRecords = await connection
        .getRepository(ContactEventCheckout)
        .find({ contactId: bbContact.id });
      expect(contactEventRecords.length).toBe(1);
      expect(contactEventRecords[0].metadata.status).toBe("landed");
    });

    it("should send SQS message and create a contactEvent record when feature flag is on", async () => {
      jest
        .spyOn(ConfigCat, "getFeatureFlagWithUser")
        .mockResolvedValueOnce(true);
      Axios.get = jest.fn().mockResolvedValueOnce({
        data: {
          data: {
            id: "167002356",
            type: "users",
            attributes: {
              first_name: "Test",
              last_name: "User",
              email: bbContact.email,
            },
          },
        },
      });

      await captureLandingPageVisitEvent(LANDING_PAGE_UUID, MT_USER_ID);
      const contactRecord = await connection
        .getRepository(Contacts)
        .findOne(bbContactId);
      expect(contactRecord.metadata.merge_tags.last_landing_purchase_name).toBe(
        "Intro Offer"
      );
      expect(contactRecord.metadata.merge_tags.last_landing_url).toBe(
        "https://marianatek-sandbox.brandbot-checkout.com/test-1vO.html"
      );

      expect(Axios.get).toHaveBeenCalledWith(
        "https://brandbot.sandbox.marianatek.com/api/users/self",
        expect.any(Object)
      );

      // Verify SQS message was sent
      expect(sqs.sendMessage).toBeCalled();
    });
  });

  describe("captureCompetedCheckout", () => {
    it(" properly record a checkout.", async () => {
      jest
        .spyOn(ConfigCat, "getFeatureFlagWithUser")
        .mockResolvedValue(false);
      Axios.get = jest.fn().mockResolvedValueOnce({
        data: {
          data: {
            id: "167002356",
            type: "users",
            attributes: {
              first_name: "Test",
              last_name: "User",
              email: bbContact.email,
            },
          },
        },
      });

      const orginalPurchasedCount = await RedisClient.client.getAsync(
        `brandbot:checkoutflows.${LANDING_PAGE_UUID}.totalPurchased`
      );
      expect(orginalPurchasedCount).toBe("0");
      const customerPurchasedCount = await RedisClient.client.getAsync(
        `contacts:${bbContactId}:checkoutflows:${LANDING_PAGE_UUID}:purchased`
      );
      expect(customerPurchasedCount).toBe(null);

      await captureCompetedCheckout(
        LANDING_PAGE_UUID,
        MT_USER_ID,
        "100.00",
        LANDING_PAGE_PARAMS.product.id,
        "my_access"
      );
      expect(Axios.get).toHaveBeenCalledWith(
        "https://brandbot.sandbox.marianatek.com/api/users/self",
        expect.any(Object)
      );

      const contactList = await connection
        .getRepository(ContactContactsList)
        .find({ contactId: bbContact.id });
      expect(contactList.length).toBe(1);
      expect(contactList[0].contactId).toBe(bbContact.id);
      expect(contactList[0].contactListId).toBe(checkoutFlow.contactListId);

      const contactEventRecords = await connection
        .getRepository(ContactEventCheckout)
        .find({ contactId: bbContact.id });
      expect(contactEventRecords.length).toBe(1);
      expect(contactEventRecords[0].contactId).toBe(bbContact.id);
      expect(contactEventRecords[0].metadata).toEqual({
        id: 1,
        amount: "100.00",
        status: "finished",
        product_id: 14694,
        checkoutflow_id: checkoutFlow.id,
      });

      const newPurchasedCount = await RedisClient.client.getAsync(
        `brandbot:checkoutflows.${LANDING_PAGE_UUID}.totalPurchased`
      );
      expect(newPurchasedCount).toBe("1");
      const newCustomerPurchasedCount = await RedisClient.client.getAsync(
        `contacts:${bbContact.id}:checkoutflows:${LANDING_PAGE_UUID}:purchased`
      );
      expect(newCustomerPurchasedCount).toBe("1");
      RedisClient.client.delAsync(
        `brandbot:checkoutflows.${LANDING_PAGE_UUID}.totalPurchased`
      );
      RedisClient.client.delAsync(
        `contacts:${bbContact.id}:checkoutflows:${LANDING_PAGE_UUID}:purchased`
      );
    });

    it("should record a checkout when feature flag is on", async () => {
      jest
        .spyOn(ConfigCat, "getFeatureFlagWithUser")
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      Axios.get = jest.fn().mockResolvedValueOnce({
        data: {
          data: {
            id: "167002356",
            type: "users",
            attributes: {
              first_name: "Test",
              last_name: "User",
              email: bbContact.email,
            },
          },
        },
      });

      const orginalPurchasedCount = await RedisClient.client.getAsync(
        `brandbot:checkoutflows.${LANDING_PAGE_UUID}.totalPurchased`
      );
      expect(orginalPurchasedCount).toBe("0");
      const customerPurchasedCount = await RedisClient.client.getAsync(
        `contacts:${bbContactId}:checkoutflows:${LANDING_PAGE_UUID}:purchased`
      );
      expect(customerPurchasedCount).toBe(null);

      await captureCompetedCheckout(
        LANDING_PAGE_UUID,
        MT_USER_ID,
        "100.00",
        LANDING_PAGE_PARAMS.product.id,
        "my_access"
      );
      expect(Axios.get).toHaveBeenCalledWith(
        "https://brandbot.sandbox.marianatek.com/api/users/self",
        expect.any(Object)
      );

      const newPurchasedCount = await RedisClient.client.getAsync(
        `brandbot:checkoutflows.${LANDING_PAGE_UUID}.totalPurchased`
      );
      expect(newPurchasedCount).toBe("1");
      const newCustomerPurchasedCount = await RedisClient.client.getAsync(
        `contacts:${bbContact.id}:checkoutflows:${LANDING_PAGE_UUID}:purchased`
      );
      expect(newCustomerPurchasedCount).toBe("1");

      expect(sqs.sendMessage).toBeCalled();
    });

    it('records line total when checkout total is zero', async () => {
      jest
        .spyOn(ConfigCat, 'getFeatureFlagWithUser')
        .mockResolvedValue(false);
      Axios.get = jest.fn().mockResolvedValueOnce({
        data: {
          data: {
            id: '167002356',
            type: 'users',
            attributes: {
              first_name: 'Test',
              last_name: 'User',
              email: bbContact.email,
            },
          },
        },
      });

      await captureCompetedCheckout(
        LANDING_PAGE_UUID,
        MT_USER_ID,
        0,
        LANDING_PAGE_PARAMS.product.id,
        'my_access',
        {
          total: 0,
          orderLines: [{ lineTotal: 100 }],
        }
      );

      const contactEventRecords = await connection
        .getRepository(ContactEventCheckout)
        .find({ contactId: bbContact.id });
      expect(contactEventRecords.length).toBe(1);
      expect(contactEventRecords[0].metadata).toEqual({
        id: 1,
        amount: '100.00',
        status: 'finished',
        product_id: 14694,
        checkoutflow_id: checkoutFlow.id,
      });
    });

    it('fetches order amount when checkout payload is zero and order id is present', async () => {
      jest
        .spyOn(ConfigCat, 'getFeatureFlagWithUser')
        .mockResolvedValue(false);
      Axios.get = jest.fn().mockImplementation((url) => {
        if (url.includes('/api/orders/98765')) {
          return Promise.resolve({
            data: {
              data: {
                attributes: {
                  total: '100.00',
                },
              },
            },
          });
        }

        if (url.includes('/api/users/self')) {
          return Promise.resolve({
            data: {
              data: {
                id: '167002356',
                type: 'users',
                attributes: {
                  first_name: 'Test',
                  last_name: 'User',
                  email: bbContact.email,
                },
              },
            },
          });
        }

        return Promise.reject(new Error(`Unexpected axios get: ${url}`));
      });

      await captureCompetedCheckout(
        LANDING_PAGE_UUID,
        MT_USER_ID,
        0,
        LANDING_PAGE_PARAMS.product.id,
        'my_access',
        { total: 0 },
        98765
      );

      expect(Axios.get).toHaveBeenCalledWith(
        'https://brandbot.sandbox.marianatek.com/api/orders/98765',
        expect.any(Object)
      );

      const contactEventRecords = await connection
        .getRepository(ContactEventCheckout)
        .find({ contactId: bbContact.id });
      expect(contactEventRecords[0].metadata.amount).toBe('100.00');
    });
  });

  describe("getLandingPage", () => {
    it("should retrieve landing page data from Redis cache when available", async () => {
      // Setup Redis cache with landing page data
      await RedisClientV2.setLandingPage(checkoutFlow.uuid, checkoutFlow);

      const result = await LandingPageService.getLandingPage(checkoutFlow.uuid);

      expect(result).toBeDefined();
      expect(result.id).toEqual(checkoutFlow.id.toString());
      expect(result.uuid).toEqual(checkoutFlow.uuid);
      expect(result.accountId).toEqual(checkoutFlow.accountId.toString());
      expect(result.name).toEqual(checkoutFlow.name);
      expect(result.settings).toEqual(LANDING_PAGE_PARAMS);
      expect(result.contactListId).toEqual(
        checkoutFlow.contactListId.toString()
      );
    });

    it("should fetch landing page data from DB on Redis cache miss", async () => {
      // Clear any existing Redis cache
      await RedisClient.client.delAsync(
        `brandbot:checkoutflows.${LANDING_PAGE_UUID}`
      );

      const result = await LandingPageService.getLandingPage(LANDING_PAGE_UUID);

      expect(result).toBeDefined();
      expect(result.id).toEqual(checkoutFlow.id.toString());
      expect(result.uuid).toEqual(LANDING_PAGE_UUID);
      expect(result.accountId).toEqual(checkoutFlow.accountId.toString());

      const redisValue = await RedisClientV2.client.hgetallAsync(
        `brandbot:checkoutflows:${LANDING_PAGE_UUID}`
      );
      expect(redisValue).toBeDefined();
      expect(redisValue.uuid).toEqual(LANDING_PAGE_UUID);
      expect(redisValue.account_id).toEqual(checkoutFlow.accountId.toString());
      expect(redisValue.contact_list_id).toEqual(
        checkoutFlow.contactListId.toString()
      );
    });

    it("should throw error when landing page is not found", async () => {
      const nonExistentUUID = "9999-9999-9999-9999";

      await expect(
        LandingPageService.getLandingPage(nonExistentUUID)
      ).rejects.toThrow(
        `Could not find checkoutflows record in db for uuid ${nonExistentUUID}`
      );
    });
  });

  describe("getLandingPageConfig", () => {
    it("should use RedisClient V1 when feature flag is off", async () => {
      ConfigCat.getFeatureFlag = jest.fn().mockResolvedValue(false);

      const getLandingPageConfigSpy = jest.spyOn(
        RedisClient,
        "getLandingPageConfig"
      );

      const result = await LandingPageService.getLandingPageConfig(
        LANDING_PAGE_UUID
      );

      expect(ConfigCat.getFeatureFlag).toHaveBeenCalledWith(
        redisMigrationFlag,
        false
      );
      expect(getLandingPageConfigSpy).toHaveBeenCalledWith(LANDING_PAGE_UUID);
      expect(result).toEqual(LANDING_PAGE_PARAMS);
    });

    it("should use RedisClient V2 when feature flag is on", async () => {
      ConfigCat.getFeatureFlag = jest.fn().mockResolvedValue(true);

      const getLandingPageSpy = jest.spyOn(
        LandingPageService,
        "getLandingPage"
      );

      await RedisClientV2.setLandingPage(LANDING_PAGE_UUID, {
        id: checkoutFlow.id,
        uuid: LANDING_PAGE_UUID,
        accountId: checkoutFlow.accountId,
        name: checkoutFlow.name,
        settings: LANDING_PAGE_PARAMS,
        contactListId: checkoutFlow.contactListId,
      });

      const result = await LandingPageService.getLandingPageConfig(
        LANDING_PAGE_UUID
      );

      expect(ConfigCat.getFeatureFlag).toHaveBeenCalledWith(
        redisMigrationFlag,
        false
      );
      expect(getLandingPageSpy).toHaveBeenCalledWith(LANDING_PAGE_UUID);

      expect(result).toHaveProperty("account_id");
      expect(result).toEqual({
        ...LANDING_PAGE_PARAMS,
        account_id: checkoutFlow.accountId.toString(),
      });
    });

    it("should fetch missing settings from database", async () => {
      ConfigCat.getFeatureFlag = jest.fn().mockResolvedValue(true);

      const incompleteSettings = {
        name: "Incomplete Settings Page",
        product: { id: 123 },
        template: "default",
      };

      const incompleteUUID = "incomplete-uuid";

      const incompleteFlow = await factory(Checkoutflows)().create({
        uuid: incompleteUUID,
        accountId: account.id,
        settings: incompleteSettings,
        name: "Incomplete Settings Page",
      });

      await RedisClientV2.setLandingPage(incompleteUUID, {
        id: incompleteFlow.id,
        uuid: incompleteUUID,
        accountId: account.id,
        name: incompleteFlow.name,
        settings: incompleteSettings,
        contactListId: incompleteFlow.contactListId,
      });

      const redisHsetSpy = jest.spyOn(RedisClientV2.client, "hset");

      const result = await LandingPageService.getLandingPageConfig(
        incompleteUUID
      );

      expect(result).toHaveProperty("account_name", account.name);
      expect(result).toHaveProperty("subdomain", account.metadata.subdomain);
      expect(result).toHaveProperty("timezone", account.timezone);
      expect(result).toHaveProperty("waiver_text", account.liability_waiver);
      expect(result).toHaveProperty("currency", account.currency);
      expect(result).toHaveProperty("vendor", account.vendor);
      expect(result).toHaveProperty("account_id", account.id.toString());

      expect(redisHsetSpy).toHaveBeenCalled();
    });

    it("should throw an error when account is not found for missing settings", async () => {
      ConfigCat.getFeatureFlag = jest.fn().mockResolvedValue(true);

      const incompleteSettings = {
        name: "Incomplete Settings Page",
        product: { id: 123 },
        template: "default",
      };

      const nonExistentAccountId = 99999; // Account that doesn't exist
      const incompleteUUID = "nonexistent-account-uuid";

      const incompleteFlow = await factory(Checkoutflows)().create({
        uuid: incompleteUUID,
        accountId: nonExistentAccountId,
        settings: incompleteSettings,
        name: "Incomplete Settings Page",
      });

      await RedisClientV2.setLandingPage(incompleteUUID, {
        id: incompleteFlow.id,
        uuid: incompleteUUID,
        accountId: nonExistentAccountId,
        name: incompleteFlow.name,
        settings: incompleteSettings,
        contactListId: incompleteFlow.contactListId,
      });

      await expect(
        LandingPageService.getLandingPageConfig(incompleteUUID)
      ).rejects.toThrow(
        `Could not find account record in db for id ${nonExistentAccountId}`
      );
    });

    it("should handle Redis update errors gracefully", async () => {
      ConfigCat.getFeatureFlag = jest.fn().mockResolvedValue(true);

      const incompleteSettings = {
        name: "Incomplete Settings Page",
        product: { id: 123 },
        template: {},
      };

      const incompleteUUID = "error-handling-uuid";

      const incompleteFlow = await factory(Checkoutflows)().create({
        uuid: incompleteUUID,
        accountId: account.id,
        settings: incompleteSettings,
        name: "Incomplete Settings Page",
      });

      await RedisClientV2.setLandingPage(incompleteUUID, {
        id: incompleteFlow.id,
        uuid: incompleteUUID,
        accountId: account.id,
        name: incompleteFlow.name,
        settings: incompleteSettings,
        contactListId: incompleteFlow.contactListId,
      });

      const redisError = new Error("Redis connection error");
      RedisClientV2.client.hset = jest.fn().mockImplementation(() => {
        throw redisError;
      });

      const logErrorSpy = jest.spyOn(logger, "logError");

      const result = await LandingPageService.getLandingPageConfig(
        incompleteUUID
      );

      expect(logErrorSpy).toHaveBeenCalledWith(redisError, expect.any(String));

      expect(result).toHaveProperty("account_name", account.name);
      expect(result).toHaveProperty("subdomain", account.metadata.subdomain);
      expect(result).toHaveProperty("timezone", account.timezone);
      expect(result).toHaveProperty("waiver_text", account.liability_waiver);
      expect(result).toHaveProperty("currency", account.currency);
      expect(result).toHaveProperty("vendor", account.vendor);
      expect(result).toHaveProperty("account_id", account.id.toString());
    });
  });
});
