import LandingPageService from '../../../src/services/landing-page-service';
import MTCartService from '../../../src/services/mt-cart-service';
import {
  RedisClient,
  ConfigCat,
  LandingPageError,
  ERROR_KEYS,
  getOrCreateDbConnection,
} from '../../../src/utils';
import BBLogger from '../../../src/utils/logger';
import { validateCheckoutProduct } from '../../../src/types';

jest.mock('../../../src/services/mt-cart-service', () => ({
  __esModule: true,
  default: {
    getContactFromToken: jest.fn(),
  },
}));

jest.mock('../../../src/utils', () => {
  const actual = jest.requireActual('../../../src/utils');
  return {
    ...actual,
    getOrCreateDbConnection: jest.fn(),
    RedisClient: {
      getMTCredentials: jest.fn(),
      client: {
        incrAsync: jest.fn(),
      },
    },
    ConfigCat: {
      getFeatureFlagWithUser: jest.fn(),
      standardUser: jest.fn((accountId, vendor) => ({ accountId, vendor })),
    },
  };
});

jest.mock('../../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    logMessage: jest.fn(),
    logError: jest.fn(),
  },
}));

describe('LandingPageService.completeLandingPageCheckout', () => {
  const landingPageUUID = 'lp-uuid';
  const settings = {
    account_id: 1458,
    vendor: 'marianatek',
    isPermissioned: false,
    product: { id: 14694 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(LandingPageService, 'getLandingPageConfig').mockResolvedValue(settings);
    (RedisClient.getMTCredentials as jest.Mock).mockResolvedValue({ subdomain: 'demo' });
    (MTCartService.getContactFromToken as jest.Mock).mockResolvedValue({ id: 99 });
    jest.spyOn(LandingPageService, 'validateContact').mockResolvedValue(true);
    (RedisClient.client.incrAsync as jest.Mock).mockResolvedValue(1);
    jest.spyOn(LandingPageService, 'fetchLandingPageDataFromDb').mockResolvedValue({
      id: 1,
      contactListId: null,
    });
    (ConfigCat.getFeatureFlagWithUser as jest.Mock).mockResolvedValue(false);
    jest.spyOn(LandingPageService, 'insertLandingPageContactEvent').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects checkout attribution when purchased product does not match configured product', async () => {
    (ConfigCat.getFeatureFlagWithUser as jest.Mock).mockImplementation(
      (flagName) => flagName === validateCheckoutProduct
    );

    await expect(
      LandingPageService.completeLandingPageCheckout(
        landingPageUUID,
        'mt-user',
        '100.00',
        55555,
        'access-token'
      )
    ).rejects.toMatchObject({
      message: 'Product does not match landing page',
      errorKey: ERROR_KEYS.LP_PRODUCT_MISMATCH,
      statusCode: 400,
    });

    expect(RedisClient.client.incrAsync).not.toHaveBeenCalled();
    expect(LandingPageService.insertLandingPageContactEvent).not.toHaveBeenCalled();
    expect(BBLogger.logMessage).toHaveBeenCalledWith(
      expect.stringContaining('product mismatch purchased [55555] vs configured [14694]'),
      'warn'
    );
  });

  it('records checkout attribution when purchased product matches configured product', async () => {
    (ConfigCat.getFeatureFlagWithUser as jest.Mock).mockImplementation(
      (flagName) => flagName === validateCheckoutProduct
    );

    await LandingPageService.completeLandingPageCheckout(
      landingPageUUID,
      'mt-user',
      '100.00',
      14694,
      'access-token'
    );

    expect(RedisClient.client.incrAsync).toHaveBeenCalled();
    expect(LandingPageService.insertLandingPageContactEvent).toHaveBeenCalledWith(99, {
      amount: '100.00',
      checkoutflow_id: 1,
      id: 1,
      product_id: 14694,
      status: 'finished',
    });
  });

  it('allows mismatched product checkout when validateCheckoutProduct flag is off', async () => {
    (ConfigCat.getFeatureFlagWithUser as jest.Mock).mockResolvedValue(false);

    await LandingPageService.completeLandingPageCheckout(
      landingPageUUID,
      'mt-user',
      '100.00',
      55555,
      'access-token'
    );

    expect(RedisClient.client.incrAsync).toHaveBeenCalled();
    expect(LandingPageService.insertLandingPageContactEvent).toHaveBeenCalledWith(99, {
      amount: '100.00',
      checkoutflow_id: 1,
      id: 1,
      product_id: 55555,
      status: 'finished',
    });
  });
});

describe('LandingPageService.insertContactIntoAccount', () => {
  const query = jest.fn().mockResolvedValue(undefined);
  const createdContact = { id: 99, email: 'referee@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    (getOrCreateDbConnection as jest.Mock).mockResolvedValue({ query });
    (MTCartService.getContactFromToken as jest.Mock).mockResolvedValue(
      createdContact
    );
  });

  it('inserts first_name, last_name, and mobile_phone from MT user attributes', async () => {
    await LandingPageService.insertContactIntoAccount(
      'reformedpilates',
      'token',
      '9999',
      {
        email: 'referee@example.com',
        first_name: 'Aurora',
        last_name: 'Brigham',
        phone_number: '+15551234567',
      }
    );

    expect(query).toHaveBeenCalledTimes(1);
    const sql = query.mock.calls[0][0] as string;
    expect(sql).toContain('first_name');
    expect(sql).toContain('last_name');
    expect(sql).toContain('mobile_phone');
    expect(sql).toContain("'referee@example.com'");
    expect(sql).toContain("'Aurora'");
    expect(sql).toContain("'Brigham'");
    expect(sql).toContain("'+15551234567'");
    expect(sql).toContain("'marianatek'");
    expect(MTCartService.getContactFromToken).toHaveBeenCalledWith(
      'reformedpilates',
      'token',
      '9999'
    );
  });

  it('inserts NULL for missing optional demographics', async () => {
    await LandingPageService.insertContactIntoAccount(
      'reformedpilates',
      'token',
      '9999',
      {
        email: 'email-only@example.com',
      }
    );

    const sql = query.mock.calls[0][0] as string;
    expect(sql).toContain("'email-only@example.com'");
    expect(sql).toMatch(
      /values \(uuid\(\), 9999, 'email-only@example\.com', NULL, NULL, NULL, 'marianatek'/
    );
  });

  it('escapes single quotes in demographic fields', async () => {
    await LandingPageService.insertContactIntoAccount(
      'reformedpilates',
      'token',
      '9999',
      {
        email: "o'brien@example.com",
        first_name: "O'Brien",
        last_name: "D'Angelo",
        phone_number: '',
      }
    );

    const sql = query.mock.calls[0][0] as string;
    expect(sql).toContain("'o\\'brien@example.com'");
    expect(sql).toContain("'O\\'Brien'");
    expect(sql).toContain("'D\\'Angelo'");
    expect(sql).toMatch(/NULL, 'marianatek'/);
  });
});
