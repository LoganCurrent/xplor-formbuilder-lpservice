import { LandingPageService, MTCartService } from '../services';
import { OrderLike } from '../utils/resolve-purchase-amount';


export async function publishLandingPage(landingPageUUID: string): Promise<any> {
  return LandingPageService.publishLandingPage(landingPageUUID);
}

export async function getLandingPageParams(landingPageUUID: string): Promise<any> {
  return LandingPageService.getParams(landingPageUUID);
}
export async function getLandingPageHTML(landingPageUUID: string): Promise<any> {
  return LandingPageService.getLandingPageHTML(landingPageUUID);
}

export async function getOrCreateCart(landingPageUUID: string, customerAccessToken: string): Promise<any> {
  return MTCartService.getOrCreateCart(landingPageUUID, customerAccessToken);
}

export async function captureLandingPageVisitEvent(landingPageUUID: string, accessToken: string): Promise<any> { 
  return LandingPageService.saveLandingPageVisitEvent(landingPageUUID, accessToken);
}

export async function captureCompetedCheckout(
  landingPageUUID: string,
  mtUserId: string,
  purchaseAmount: string | number | null | undefined,
  productId: number,
  accessToken: string,
  order?: OrderLike | null,
  orderId?: number | string | null
): Promise<any> {
  return LandingPageService.completeLandingPageCheckout(
    landingPageUUID,
    mtUserId,
    purchaseAmount,
    productId,
    accessToken,
    order,
    orderId
  );
}
