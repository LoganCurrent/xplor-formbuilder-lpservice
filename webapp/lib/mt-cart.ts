// import axios  from 'axios';
// import redis from 'redis';
// import moment from 'moment-timezone';
// import { promisify } from 'util';
// const redisClient = redis.createClient({
//   // host: process.env.REDIS_HOST,
//   // port: process.env.REDIS_PORT,
//   host: 'localhost'
// });
// const getAsync = promisify(redisClient.get).bind(redisClient);

// class MTCart {
//   async getPartnerForGateway(subdomain, token, sharedGatewayId) {
//     // Right now, we only have a sharedGatewayId but need to grab a partner.
//     // A share_gateway can have many partners, so the best we can do right now
//     // is find the FIRST partner that matches our target shared gateway.
//     // TODO;ask Audrey for a better filtering option here.
//     const response = await axios.get(
//       `https://${subdomain}.marianatek.com/api/partners?include=shared_gateway&page_size=100`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     const partner = response.data.data.find((partner) => {
//       const sharedGateway = partner.relationships.shared_gateway.data;
//       return sharedGateway != null && sharedGateway.id === sharedGatewayId;
//     });
//     return partner;
//   }

//   async getOrCreateCart(subdomain, token, partnerId) {
//     // If a cart is not found for a user, MT API creates the cart.
//     const GET_CART_URL = `https://${subdomain}.marianatek.com/api/carts/self?fulfillment_partner=${partnerId}&include=cart_lines&originating_partner=1`;
//     const response = await axios.get(GET_CART_URL, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     return response.data;
//   }

//   async emptyCart(subdomain, token, cartId) {
//     const EMPTY_CART_URL = `https://${subdomain}.marianatek.com/api/carts/${Number(
//       cartId
//     )}/clear`;
//     const response = await axios.post(
//       EMPTY_CART_URL,
//       {},
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/vnd.api+json',
//         },
//       }
//     );
//     return response.data;
//   }

//   async applyVoucher(subdomain, token, cartId, discountCode) {
//     const payload = {
//       data: {
//         code: discountCode,
//       },
//     };
//     const response = await axios.post(
//       `https://${subdomain}.marianatek.com/api/carts/${cartId}/apply_voucher`,
//       JSON.stringify(payload),
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/vnd.api+json',
//         },
//       }
//     );
//     return response.data.data;
//   }
//   async createCartLine(subdomain, token, cartId, partnerId, productId) {
//     const CREATE_CART_LINE_URL = `https://${subdomain}.marianatek.com/api/cart_lines`;

//     const payload = {
//       data: {
//         attributes: {
//           quantity: 1,
//         },
//         relationships: {
//           cart: {
//             data: {
//               type: 'carts',
//               id: cartId,
//             },
//           },
//           partner: {
//             data: {
//               type: 'partners',
//               id: partnerId,
//             },
//           },
//           product: {
//             data: {
//               type: 'child_products',
//               id: productId,
//             },
//           },
//         },
//         type: 'cart_lines',
//       },
//     };

//     const response = await axios.post(
//       CREATE_CART_LINE_URL,
//       JSON.stringify(payload),
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/vnd.api+json',
//         },
//       }
//     );
//     return response.data;
//   }

// }

// module.exports = new MTCart();