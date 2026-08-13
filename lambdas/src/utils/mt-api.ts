import axios from 'axios';
import { suppressDeprecationWarnings } from 'moment';
import BBLogger from './logger';

function safeStringify(value: any): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export async function getOrCreateCart(subdomain, token, locationId): Promise<any> {
  // IF a cart is not found in the MT API, it gets created and returned
  const GET_CART_URL = `https://${subdomain}.marianatek.com/api/customer/v1/locations/${locationId}/cart`;
  const response = await axios.get(GET_CART_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

export async function clearCart(subdomain, token, locationId): Promise<any> {
  const CLEAR_CART_URL = `https://${subdomain}.marianatek.com/api/customer/v1/locations/${locationId}/cart/clear`;
  const response = await axios.post(CLEAR_CART_URL, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    },
  });
  return response.data;
}

export async function getProductListingId(subdomain, token, childProductId): Promise<any> {
  const GET_PRODUCT_URL = `https://${subdomain}.marianatek.com/api/child_products/${childProductId}?include=product_class`;
  try {
    const response = await axios.get(GET_PRODUCT_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const included = response?.data?.included;
    if (!included || !included.length) {
      BBLogger.logMessage(
        `getProductListingId: MT child_products returned no included product_class for child product [${childProductId}] on subdomain [${subdomain}]. response.data=${safeStringify(response?.data)}`,
        'error'
      );
    }

    const productClassSlug = response.data.included[0].attributes.slug;
    return `${productClassSlug}-${childProductId}`;
  } catch (error) {
    BBLogger.logError(
      error,
      `getProductListingId failed for child product [${childProductId}] on subdomain [${subdomain}] - MT status [${error?.response?.status}], MT body [${safeStringify(error?.response?.data)}]`
    );
    throw error;
  }
}

export async function addProductToCart(subdomain, token, locationId, productListingId): Promise<any> {
  const payload = {
    'product_listing_id': `${productListingId}`,
    'quantity': 1
  };
  const ADD_PRODUCT_URL = `https://${subdomain}.marianatek.com/api/customer/v1/locations/${locationId}/cart/add_product_listing`;
  const response = await axios.post(
    ADD_PRODUCT_URL,
    JSON.stringify(payload),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    }
  );
  return response.data;
}

export async function applyDiscountToCart(subdomain, token, locationId, discountCode): Promise<any> {
  const payload = {
    'code': `${discountCode}`
  };
  const ADD_DISCOUNT_URL = `https://${subdomain}.marianatek.com/api/customer/v1/locations/${locationId}/cart/apply_discount_code`;
  return axios.post(
    ADD_DISCOUNT_URL,
    JSON.stringify(payload),
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    }
  );
}

export async function fetchUser(subdomain, token): Promise<any> {
  const response = await axios.get(`https://${subdomain}.marianatek.com/api/users/self`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

export async function fetchCustomerOrder(
  subdomain: string,
  token: string,
  orderId: number | string
): Promise<any> {
  const response = await axios.get(
    `https://${subdomain}.marianatek.com/api/orders/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}
