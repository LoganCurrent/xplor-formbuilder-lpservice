import type { Request, Response, NextFunction } from 'express';
import ConfigCat from './configcat';
import BBLogger from './logger';
import { ERROR_KEYS, buildErrorBody } from './errorKeys';
import { landingPageTranslations } from '../types';

const errorCodes = {
  DUPLICATE_ENTRY: 'ER_DUP_ENTRY',
};

const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again later.';

export class LandingPageError extends Error {
  errorKey?: string;
  statusCode: number;

  constructor(message: string, errorKey?: string, statusCode = 400) {
    super(message);
    this.name = 'LandingPageError';
    this.errorKey = errorKey;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, LandingPageError.prototype);
  }
}

async function resolveUseErrorKeys(): Promise<boolean> {
  try {
    return await ConfigCat.getFeatureFlag(landingPageTranslations, false);
  } catch {
    return false;
  }
}

async function catchAllErrorHandler(
  error: Error & { errorKey?: string; statusCode?: number },
  request: Request,
  response: Response,
  _next: NextFunction
): Promise<void> {
  try {
    BBLogger.logError(
      error,
      `Unhandled error on ${request.method} ${request.originalUrl || request.url}`
    );
  } catch {
  }

  const useErrorKeys = await resolveUseErrorKeys();

  if (error instanceof LandingPageError) {
    response.status(error.statusCode).json(
      buildErrorBody({
        message: error.message,
        errorKey: error.errorKey,
        useErrorKeys,
      })
    );
    return;
  }

  response.status(500).json(
    buildErrorBody({
      message: GENERIC_ERROR_MESSAGE,
      errorKey: ERROR_KEYS.SERVER_ERROR,
      useErrorKeys,
    })
  );
}

export { catchAllErrorHandler, errorCodes, GENERIC_ERROR_MESSAGE };
