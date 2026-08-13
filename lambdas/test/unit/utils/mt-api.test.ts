import mt_child_products_response from "../../fixtures/mt-child-products-response";
import mt_get_or_create_cart from "../../fixtures/mt-get-or-create-cart";
import mt_add_to_cart from "../../fixtures/mt-add-to-cart";

// Mock SQS
jest.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: jest.fn(),
  SendMessageCommand: jest.fn(),
}));

jest.mock("../../../src/utils/sqs", () => ({
  sendMessage: jest.fn(),
  getSQS: jest.fn().mockReturnValue({
    sendMessage: jest.fn().mockResolvedValue({}),
  }),
}));

const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
};

jest.mock('axios', () => {
  return mockAxios;
});

import redis from 'redis-mock'
jest.mock('redis', () => redis)

jest.mock('../../../src/utils/configcat', () => ({
  getFeatureFlag: jest.fn().mockResolvedValue(false),
}));

const { shutdown } = require('../utils/quit-redis');
const { promisify } = require('util');

import { getProductListingId } from "../../../src/utils/mt-api";
import MTCartService from "../../../src/services/mt-cart-service";
import BBLogger from "../../../src/utils/logger";
import { doesNotMatch } from "assert";
import { ConsoleTransportOptions } from "winston/lib/winston/transports";

describe("product-listing-id", () => {
  let redisClient
  beforeAll(() => {
    redisClient = redis.createClient();

    const setAsync = promisify(redisClient.set).bind(redisClient);
    const hmsetAsync = promisify(redisClient.hmset).bind(redisClient);

    setAsync(`brandbot:checkoutflows.6f1c1bac-f95c-4147-95e4-bf55b281ae20`, '{"name":"Credit - Drop In","email":"dev+staging@brandbot.com","phone":"123456","siteId":null,"vanity":"caitr-w3l","product":{"id":14692,"name":"Credit - Drop In","price":"23.99","description":"A standard credit that expires one year after date of purchase","is_discountable":true},"contract":null,"discount":null,"saleType":"credit","template":{"key-logo":"https:\/\/assets.brandbot.com\/accounts\/3495\/f6cbd9f7-a0fa-451d-aef1-b500abcdd592.png","key-logo-width":"202","key-page-color":"#F3F7F9","key-page-header-color":"#FFFFFF"},"subdomain":"brandbot-dev","button_text":"Buy now","description":"A standard credit that expires one year after date of purchase","navbar_logo":"https:\/\/assets.brandbot.com\/accounts\/3495\/dfd5eca0-c808-4384-8bab-0436e19eade4.png","button_color":"#BADA55","customerType":"existing","displayPrice":null,"isDiscounted":false,"discount_code":"ERERE","pricing_option":null,"selectedTemplate":12,"isCustomStartDate":false,"navbar_logo_width":"nullpx","shared_gateway_id":53203,"displayInclusiveTax":false,"isChargedImmediately":true,"currency":"USD","waiver_text":"test","account_name":"Xplor Growth - East Hampton","timezone":"America\/New_York","account_id":2030,"vendor":"marianatek","locations":[]}');
    hmsetAsync(`mariana:accounts:2030:credentials`, 'subdomain', 'brandbot.dev', 'access_token', 'access', 'refresh_token', 'refresh');
  });

  afterAll((done) => {
    shutdown(redisClient);
  });

  test("calculateCartData Missing location", async () => {
    mockAxios.get = jest.fn(() => {
      return mt_child_products_response
    });

    const landingPageUUID = "6f1c1bac-f95c-4147-95e4-bf55b281ae20";
    const customerAccessToken = "irrelevant";
    const response = await MTCartService.calculateCartData(landingPageUUID, customerAccessToken);
    expect(response).toEqual({ "cartLocationId": undefined, "childProductId": "memberships-14692" });
  });

  test("getOrCreateCart missing location", async () => {
    mockAxios.get = jest.fn((url) => {
      if (url === 'https://brandbot.dev.marianatek.com/api/child_products/14692?include=product_class') {
        return mt_child_products_response
      } else if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart') {
        return mt_get_or_create_cart
      }
    });
    mockAxios.post = jest.fn((url) => {
      if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart/clear') {
        return mt_get_or_create_cart
      } else if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart/add_product_listing') {
        return mt_add_to_cart
      }
    });

    const landingPageUUID = "6f1c1bac-f95c-4147-95e4-bf55b281ae20";
    const customerAccessToken = "irrelevant";

    let response;
    expect(async () => {
      response = await MTCartService.getOrCreateCart(landingPageUUID, customerAccessToken);
    }).not.toThrow();
    expect(response?.data).not.toBeDefined();
  });

  test("calculateCartData 1 location", async () => {
    const saddAsync = promisify(redisClient.sadd).bind(redisClient);
    saddAsync('marianatek:2030:linkedLocations', '1111');
    mockAxios.get = jest.fn(() => {
      return mt_child_products_response
    });

    const landingPageUUID = "6f1c1bac-f95c-4147-95e4-bf55b281ae20";
    const customerAccessToken = "irrelevant";

    const response = await MTCartService.calculateCartData(landingPageUUID, customerAccessToken);
    expect(response).toEqual({ "cartLocationId": "1111", "childProductId": "memberships-14692" });
  });

  test("getOrCreateCart 1 location", async () => {
    mockAxios.get = jest.fn((url) => {
      if (url === 'https://brandbot.dev.marianatek.com/api/child_products/14692?include=product_class') {
        return mt_child_products_response
      } else if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart') {
        return mt_get_or_create_cart
      }
    });
    mockAxios.post = jest.fn((url) => {
      if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart/clear') {
        return mt_get_or_create_cart
      } else if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart/add_product_listing') {
        return mt_add_to_cart
      }
    });

    const landingPageUUID = "6f1c1bac-f95c-4147-95e4-bf55b281ae20";
    const customerAccessToken = "irrelevant";

    const response = await MTCartService.getOrCreateCart(landingPageUUID, customerAccessToken);
    expect(response).toEqual({ "id": "41944", "locationId": "1111" });
  });

  test("calculateCartData 2 locations", async () => {
    const saddAsync = promisify(redisClient.sadd).bind(redisClient);
    saddAsync('marianatek:2030:linkedLocations', '2222');
    mockAxios.get = jest.fn(() => {
      return mt_child_products_response
    });

    const landingPageUUID = "6f1c1bac-f95c-4147-95e4-bf55b281ae20";
    const customerAccessToken = "irrelevant";

    const response = await MTCartService.calculateCartData(landingPageUUID, customerAccessToken);
    expect(response).toEqual({ "cartLocationId": "1111", "childProductId": "memberships-14692" });
  });

  test("getOrCreateCart 2 locations", async () => {
    mockAxios.get = jest.fn((url) => {
      if (url === 'https://brandbot.dev.marianatek.com/api/child_products/14692?include=product_class') {
        return mt_child_products_response
      } else if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart') {
        return mt_get_or_create_cart
      }
    });
    mockAxios.post = jest.fn((url) => {
      if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart/clear') {
        return mt_get_or_create_cart
      } else if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart/add_product_listing') {
        return mt_add_to_cart
      }
    });

    const landingPageUUID = "6f1c1bac-f95c-4147-95e4-bf55b281ae20";
    const customerAccessToken = "irrelevant";

    const response = await MTCartService.getOrCreateCart(landingPageUUID, customerAccessToken);
    expect(response).toEqual({ "id": "41944", "locationId": "1111" });
  });

  test("getProductListingId found", async () => {
    mockAxios.get = jest.fn(() => {
      return mt_child_products_response
    });

    const subdomain = "barre3";
    const token = "irrelevant";
    const childProductId = "14692";

    const response = await getProductListingId(subdomain, token, childProductId);
    expect(response).toEqual("memberships-14692");
  });

  test("getProductListingId missing", async () => {
    mockAxios.get = jest.fn(() => {
      return mt_child_products_response
    });

    const subdomain = "barre3";
    const token = "irrelevant";
    const childProductId = "missing";

    const response = await getProductListingId(subdomain, token, childProductId);
    expect(response).toEqual("memberships-missing");
  });

  test("calculateCartData missing landing page", async () => {
    mockAxios.get = jest.fn(() => {
      return mt_child_products_response
    });

    const landingPageUUID = "";
    const customerAccessToken = "irrelevant";

    let response;
    expect(async () => {
      response = await MTCartService.calculateCartData(landingPageUUID, customerAccessToken);
    }).not.toThrow();
    expect(response?.data).not.toBeDefined();
  });

  test("getOrCreateCart missing landing page", async () => {
    mockAxios.get = jest.fn((url) => {
      if (url === 'https://brandbot.dev.marianatek.com/api/child_products/14692?include=product_class') {
        return mt_child_products_response
      } else if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart') {
        return mt_get_or_create_cart
      }
    });
    mockAxios.post = jest.fn((url) => {
      if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart/clear') {
        return mt_get_or_create_cart
      } else if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart/add_product_listing') {
        return mt_add_to_cart
      }
    });

    const landingPageUUID = "";
    const customerAccessToken = "irrelevant";

    let response;
    expect(async () => {
      response = await MTCartService.getOrCreateCart(landingPageUUID, customerAccessToken);
    }).not.toThrow();
    expect(response?.data).not.toBeDefined();
  });

  test("calculateCartData missing mt_child_products_response", async () => {
    mockAxios.get = jest.fn(() => {
      return '';
    });

    const landingPageUUID = "6f1c1bac-f95c-4147-95e4-bf55b281ae20";
    const customerAccessToken = "irrelevant";

    let response;
    expect(async () => {
      response = await MTCartService.calculateCartData(landingPageUUID, customerAccessToken);
    }).not.toThrow();
    expect(response?.data).not.toBeDefined();
  });

  test("getOrCreateCart missing mt_child_products_response", async () => {
    mockAxios.get = jest.fn((url) => {
      if (url === 'https://brandbot.dev.marianatek.com/api/child_products/14692?include=product_class') {
        return '';
      } else if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart') {
        return mt_get_or_create_cart
      }
    });
    mockAxios.post = jest.fn((url) => {
      if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart/clear') {
        return mt_get_or_create_cart
      } else if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart/add_product_listing') {
        return mt_add_to_cart
      }
    });

    const landingPageUUID = "6f1c1bac-f95c-4147-95e4-bf55b281ae20";
    const customerAccessToken = "irrelevant";

    let response;
    expect(async () => {
      response = await MTCartService.getOrCreateCart(landingPageUUID, customerAccessToken);
    }).not.toThrow();
    expect(response?.data).not.toBeDefined();
  });

  test("getOrCreateCart missing mt_get_or_create_cart", async () => {
    mockAxios.get = jest.fn((url) => {
      if (url === 'https://brandbot.dev.marianatek.com/api/child_products/14692?include=product_class') {
        return mt_child_products_response
      } else if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart') {
        return '';
      }
    });
    mockAxios.post = jest.fn((url) => {
      if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart/clear') {
        return mt_get_or_create_cart
      } else if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart/add_product_listing') {
        return mt_add_to_cart
      }
    });

    const landingPageUUID = "6f1c1bac-f95c-4147-95e4-bf55b281ae20";
    const customerAccessToken = "irrelevant";

    let response;
    expect(async () => {
      response = await MTCartService.getOrCreateCart(landingPageUUID, customerAccessToken);
    }).not.toThrow();
    expect(response?.data).not.toBeDefined();
  });

  test("getOrCreateCart missing mt_get_or_create_cart", async () => {
    mockAxios.get = jest.fn((url) => {
      if (url === 'https://brandbot.dev.marianatek.com/api/child_products/14692?include=product_class') {
        return mt_child_products_response
      } else if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart') {
        return mt_get_or_create_cart
      }
    });
    mockAxios.post = jest.fn((url) => {
      if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart/clear') {
        return ''
      } else if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart/add_product_listing') {
        return mt_add_to_cart
      }
    });

    const landingPageUUID = "6f1c1bac-f95c-4147-95e4-bf55b281ae20";
    const customerAccessToken = "irrelevant";

    const response = await MTCartService.getOrCreateCart(landingPageUUID, customerAccessToken);
    expect(response).toEqual({ "id": "41944", "locationId": "1111" });
  });

  test("getOrCreateCart missing mt_add_to_cart", async () => {
    mockAxios.get = jest.fn((url) => {
      if (url === 'https://brandbot.dev.marianatek.com/api/child_products/14692?include=product_class') {
        return mt_child_products_response
      } else if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart') {
        return mt_get_or_create_cart
      }
    });
    mockAxios.post = jest.fn((url) => {
      if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart/clear') {
        return mt_get_or_create_cart
      } else if (url === 'https://brandbot.dev.marianatek.com/api/customer/v1/locations/1111/cart/add_product_listing') {
        return ''
      }
    });

    const landingPageUUID = "6f1c1bac-f95c-4147-95e4-bf55b281ae20";
    const customerAccessToken = "irrelevant";

    const response = await MTCartService.getOrCreateCart(landingPageUUID, customerAccessToken);
    expect(response).toEqual({ "id": "41944", "locationId": "1111" });
  });
});

describe("getProductListingId diagnostic logging", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("logs an error when MT returns no included product_class", async () => {
    const logSpy = jest.spyOn(BBLogger, "logMessage").mockImplementation(() => {});
    // 200 response but the product_class was not included (e.g. archived / stale product)
    mockAxios.get = jest.fn(() => Promise.resolve({ data: { data: { id: "15868" } } }));

    await expect(
      getProductListingId("barrecoderivernorth", "token", "15868")
    ).rejects.toBeDefined();

    expect(logSpy).toHaveBeenCalledTimes(1);
    const [message, level] = logSpy.mock.calls[0];
    expect(level).toBe("error");
    expect(message).toContain("no included product_class");
    expect(message).toContain("15868");
    expect(message).toContain("barrecoderivernorth");
  });

  test("logs MT status and body when the MT request throws", async () => {
    const errorSpy = jest.spyOn(BBLogger, "logError").mockImplementation(() => {});
    const mtError: any = new Error("Request failed with status code 404");
    mtError.response = { status: 404, data: { detail: "Not found." } };
    mockAxios.get = jest.fn(() => Promise.reject(mtError));

    await expect(
      getProductListingId("barrecoderivernorth", "token", "15868")
    ).rejects.toBe(mtError);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [errArg, message] = errorSpy.mock.calls[0];
    expect(errArg).toBe(mtError);
    expect(message).toContain("404");
    expect(message).toContain("Not found");
    expect(message).toContain("15868");
  });

  test("does not log when MT returns a valid product_class", async () => {
    const logSpy = jest.spyOn(BBLogger, "logMessage").mockImplementation(() => {});
    const errorSpy = jest.spyOn(BBLogger, "logError").mockImplementation(() => {});
    mockAxios.get = jest.fn(() => mt_child_products_response);

    const result = await getProductListingId("barre3", "token", "14692");

    expect(result).toBe("memberships-14692");
    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
