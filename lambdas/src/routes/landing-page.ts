import express from 'express';
import {
  getLandingPageParams,
  getLandingPageHTML,
  getOrCreateCart,
  captureLandingPageVisitEvent,
  publishLandingPage,
  captureCompetedCheckout
} from '../controllers';

import mtCartService from '../services/mt-cart-service';
import { ConfigCat, ERROR_KEYS, buildErrorBody } from '../utils';
import { landingPageTranslations } from '../types';

const router = express.Router();

async function resolveUseErrorKeys(): Promise<boolean> {
  try {
    return await ConfigCat.getFeatureFlag(landingPageTranslations, false);
  } catch {
    return false;
  }
}


router.post(
  '/landing-pages/:uuid/publish',
  async function (req, res, next) {
    try {
      const landingPageUUID = req.params.uuid;
      await publishLandingPage(landingPageUUID);
      res.json({ 'ok': 'ok' });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/landing-pages/:uuid/params',
  async function (req, res, next) {
    try {
      const landingPageUUID = req.params.uuid;
      const parameters = await getLandingPageParams(landingPageUUID);
      res.json({ 'parameters': parameters }); 
    } catch (error) {
      next(error);
    } 
  }
);

router.get(
    '/landing-pages/:uuid/preview',
    async function (req, res, next) {
        try {
            const landingPageUUID = req.params.uuid;
            const html = await getLandingPageHTML(landingPageUUID);
            res.json({ 'preview': html });
        } catch (error) {
            next(error);
        }
    }
);

router.post(
  '/landing-pages/:uuid/cart',
  async function (req, res, next) {
    try {
      const landingPageUUID = req.params.uuid;
      const mtAccessToken = req.body.accessToken;
      const cart = await getOrCreateCart(landingPageUUID, mtAccessToken);
      res.json({ cart });
    } catch (error) {
      next(error);
    }
  }
);


router.post(
  '/landing-pages/:uuid/calculate-cart-data',
  async function (req, res, next) {
    try {
      const landingPageUUID = req.params.uuid;
      const mtAccessToken = req.body.accessToken;
      const { cartLocationId, childProductId } = await mtCartService.calculateCartData(landingPageUUID, mtAccessToken);
      res.json({ 
        cartLocationId,
        childProductId
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/landing-pages/:uuid/build-cart',
  async function (req, res, next) {
    try {
      const landingPageUUID = req.params.uuid;
      const{ accessToken, locationId, childProductId } = req.body;
      await mtCartService.addProductToCart(landingPageUUID, accessToken, locationId, childProductId);
      res.json({ ok: 'ok' });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/landing-pages/:uuid/apply-discount',
  async function (req, res, next) {
    try {
      const landingPageUUID = req.params.uuid;
      const{ accessToken, locationId } = req.body;
      await mtCartService.applyDiscountToCart(landingPageUUID, accessToken, locationId);
      res.json({ ok: 'ok' });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/landing-pages/:uuid/capture-view',
  async function (req, res, next) {
    try {
      const landingPageUUID = req.params.uuid;
      const accessToken = req.body.accessToken;
      await captureLandingPageVisitEvent(landingPageUUID, accessToken);
      res.json({ 'ok': 'ok' });
    } catch (error) {
      const useErrorKeys = await resolveUseErrorKeys();
      const errorKey = error?.errorKey ?? ERROR_KEYS.LP_CAPTURE_VIEW_FAILED;
      const message = error?.message || 'Could not capture LP view.';
      const status = error?.statusCode ?? 400;
      return res
        .status(status)
        .json(buildErrorBody({ message, errorKey, useErrorKeys }));
    }
  }
);

router.post(
  '/landing-pages/:uuid/capture-checkout',
  async function (req, res, next) {
    try {
      const landingPageUUID = req.params.uuid;
      const { mtUserId, purchaseAmount, productId, accessToken, order, orderId } = req.body;
      await captureCompetedCheckout(
        landingPageUUID,
        mtUserId,
        purchaseAmount,
        productId,
        accessToken,
        order,
        orderId
      );
      res.json({ 'ok': 'ok' });
    } catch (error) {
      const useErrorKeys = await resolveUseErrorKeys();
      const errorKey = error?.errorKey ?? ERROR_KEYS.LP_CAPTURE_CHECKOUT_FAILED;
      const message = error?.message || 'Could not complete LP checkout.';
      const status = error?.statusCode ?? 400;
      return res
        .status(status)
        .json(buildErrorBody({ message, errorKey, useErrorKeys }));
    }
  }
);

export default router;
