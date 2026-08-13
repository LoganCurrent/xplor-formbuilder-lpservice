import type { Request, Response, NextFunction } from 'express';

import {
  catchAllErrorHandler,
  GENERIC_ERROR_MESSAGE,
  LandingPageError,
} from '../../../src/utils/errors';
import { ERROR_KEYS } from '../../../src/utils/errorKeys';
import ConfigCat from '../../../src/utils/configcat';
import BBLogger from '../../../src/utils/logger';

function buildRes(): Response {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

function buildReq(): Request {
  return { method: 'POST', originalUrl: '/v2/landing-pages/abc/cart' } as Request;
}

describe('catchAllErrorHandler', () => {
  let getFlagSpy: jest.SpyInstance;
  let logErrorSpy: jest.SpyInstance;
  const next = jest.fn() as unknown as NextFunction;

  beforeEach(() => {
    getFlagSpy = jest
      .spyOn(ConfigCat, 'getFeatureFlag')
      .mockResolvedValue(false);
    logErrorSpy = jest
      .spyOn(BBLogger, 'logError')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generic Error', () => {
    it('returns 500 with generic message and no error_key when flag is off', async () => {
      getFlagSpy.mockResolvedValue(false);
      const res = buildRes();
      const err = new Error('database is on fire');

      await catchAllErrorHandler(err, buildReq(), res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: GENERIC_ERROR_MESSAGE,
      });
    });

    it('returns 500 with generic message and error.server when flag is on', async () => {
      getFlagSpy.mockResolvedValue(true);
      const res = buildRes();
      const err = new Error('database is on fire');

      await catchAllErrorHandler(err, buildReq(), res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: GENERIC_ERROR_MESSAGE,
        error_key: ERROR_KEYS.SERVER_ERROR,
      });
    });

    it('logs the real error via BBLogger.logError', async () => {
      const res = buildRes();
      const err = new Error('database is on fire');

      await catchAllErrorHandler(err, buildReq(), res, next);

      expect(logErrorSpy).toHaveBeenCalledWith(
        err,
        expect.stringContaining('POST /v2/landing-pages/abc/cart')
      );
    });

    it('does not leak the raw error message to the client', async () => {
      const res = buildRes();
      const err = new Error('SECRET internal stack trace');

      await catchAllErrorHandler(err, buildReq(), res, next);

      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body.message).toBe(GENERIC_ERROR_MESSAGE);
      expect(JSON.stringify(body)).not.toContain('SECRET');
    });

    it('still responds with 500 generic message if the flag lookup throws', async () => {
      getFlagSpy.mockRejectedValue(new Error('configcat down'));
      const res = buildRes();

      await catchAllErrorHandler(new Error('boom'), buildReq(), res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: GENERIC_ERROR_MESSAGE,
      });
    });
  });

  describe('LandingPageError', () => {
    it('uses its statusCode and message and omits error_key when flag is off', async () => {
      getFlagSpy.mockResolvedValue(false);
      const res = buildRes();
      const err = new LandingPageError(
        'custom permission notice',
        ERROR_KEYS.LP_PERMISSION_DENIED,
        400
      );

      await catchAllErrorHandler(err, buildReq(), res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'custom permission notice',
      });
    });

    it('uses its errorKey when flag is on', async () => {
      getFlagSpy.mockResolvedValue(true);
      const res = buildRes();
      const err = new LandingPageError(
        'cart could not be built',
        ERROR_KEYS.LP_CART_BUILD_FAILED,
        400
      );

      await catchAllErrorHandler(err, buildReq(), res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'cart could not be built',
        error_key: ERROR_KEYS.LP_CART_BUILD_FAILED,
      });
    });

    it('logs LandingPageError via BBLogger.logError as well', async () => {
      const res = buildRes();
      const err = new LandingPageError('x', ERROR_KEYS.LP_NOT_FOUND, 404);

      await catchAllErrorHandler(err, buildReq(), res, next);

      expect(logErrorSpy).toHaveBeenCalledWith(err, expect.any(String));
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
