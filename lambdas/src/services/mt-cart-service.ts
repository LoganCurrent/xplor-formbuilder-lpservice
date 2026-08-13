
import { 
  RedisClient,
  getOrCreateCart,
  clearCart,
  getProductListingId,
  addProductToCart,
  applyDiscountToCart,
  getOrCreateDbConnection
} from '../utils';

import {
  Contacts,
} from '../entities';

import {
  fetchUser
} from '../utils/mt-api';
import { LandingPageService } from '.';
import { applyAutoDiscountToCart } from "../types";
import { ConfigCat } from '../utils';

class MTCartService {

  async getMTUser(mtSubdomain: string, customerAccessToken: string): Promise<any> {
    const user = await fetchUser(mtSubdomain, customerAccessToken);
    return user;
  }

  async getContactFromToken(mtSubdomain: string, customerAccessToken: string, accountId: string): Promise<any> {
    const user = await this.getMTUser(mtSubdomain, customerAccessToken);
    const email = user.data.attributes.email; 

    const conn = await getOrCreateDbConnection();
    const contact = await conn
      .createQueryBuilder()
      .select('contacts')
      .from(Contacts, 'contacts')
      .where('email = :email', {
        email: email
      })
      .andWhere('account_id = :account_id', {
        'account_id': accountId
      })
      .getOne();
    return contact
  }

  async calculateCartData(landingPageUUID:string, customerAccessToken:string): Promise<any> {
    const landingPageInfo = await LandingPageService.getLandingPageConfig(landingPageUUID);
    const accountCredentials = await RedisClient.getMTCredentials(landingPageInfo.account_id);
    const cartLocationId = await RedisClient.getMTAccountLinkedLocations(landingPageInfo.account_id);
       
    const childProductId = await getProductListingId(
      accountCredentials.subdomain,
      customerAccessToken,
      landingPageInfo.product.id
    );

    return {
      cartLocationId,
      childProductId
    };
  }

  async addProductToCart(landingPageUUID: string, customerAccessToken: string, cartLocationId: string, childProductId: string): Promise<any> {
    const landingPageInfo = await LandingPageService.getLandingPageConfig(landingPageUUID);
    const accountCredentials = await RedisClient.getMTCredentials(landingPageInfo.account_id);
    
    await clearCart(
      accountCredentials.subdomain,
      customerAccessToken,
      cartLocationId
    );

    await addProductToCart(
      accountCredentials.subdomain,
      customerAccessToken,
      cartLocationId,
      childProductId
    );
  }

  async applyDiscountToCart(landingPageUUID:string, customerAccessToken:string, cartLocationId:string): Promise<any> {
    const landingPageInfo = await LandingPageService.getLandingPageConfig(landingPageUUID);
    const accountCredentials = await RedisClient.getMTCredentials(landingPageInfo.account_id);
    const shouldApplyAutoDiscountToCart = await ConfigCat.getFeatureFlag(applyAutoDiscountToCart, true);

    if (landingPageInfo.isDiscounted && landingPageInfo.discount_code && shouldApplyAutoDiscountToCart) {
      await applyDiscountToCart(
        accountCredentials.subdomain,
        customerAccessToken,
        cartLocationId,
        landingPageInfo.discount_code
      );
    }
  }

  async getOrCreateCart(landingPageUUID:string, customerAccessToken:string):Promise<any> {
    const landingPageInfo = await LandingPageService.getLandingPageConfig(landingPageUUID);
    const accountCredentials = await RedisClient.getMTCredentials(landingPageInfo.account_id);
    const gatewayLocationId = await RedisClient.getMTAccountLinkedLocations(landingPageInfo.account_id);
    const shouldApplyAutoDiscountToCart = await ConfigCat.getFeatureFlag(applyAutoDiscountToCart, true);
    
    let userCart = await getOrCreateCart(
      accountCredentials.subdomain,
      customerAccessToken,
      gatewayLocationId
    );

    await clearCart(
      accountCredentials.subdomain,
      customerAccessToken,
      gatewayLocationId
    );

    const productListingId = await getProductListingId(
      accountCredentials.subdomain,
      customerAccessToken,
      landingPageInfo.product.id
    );
    
    await addProductToCart(
      accountCredentials.subdomain,
      customerAccessToken,
      gatewayLocationId,
      productListingId
    );

    if (landingPageInfo.isDiscounted && landingPageInfo.discount_code && shouldApplyAutoDiscountToCart) {
      await applyDiscountToCart(
        accountCredentials.subdomain,
        customerAccessToken,
        gatewayLocationId,
        landingPageInfo.discount_code
      );
    }

    // Refetch cart to ensure latest data
    userCart =  await getOrCreateCart(
      accountCredentials.subdomain,
      customerAccessToken,
      gatewayLocationId
    );

    return {
      id: userCart.id,
      locationId: gatewayLocationId,
    };
  }
}

export default new MTCartService();
