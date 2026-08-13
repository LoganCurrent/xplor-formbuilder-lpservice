import redis from 'redis-mock';
import { promisify } from 'util';
import { camelCase, snakeCase } from 'lodash';

jest.mock('redis', () => redis);

const { shutdown } = require('../utils/quit-redis');

import RedisClientV2 from '../../../src/utils/redis-client-v2';

describe('RedisClientV2', () => {
  let redisClient;
  
  beforeAll(() => {
    redisClient = redis.createClient();
    
    redisClient.hsetAsync = promisify(redisClient.hset).bind(redisClient);
    redisClient.hgetallAsync = promisify(redisClient.hgetall).bind(redisClient);
    redisClient.delAsync = promisify(redisClient.del).bind(redisClient);
    redisClient.expireAsync = promisify(redisClient.expire).bind(redisClient);
  });
  
  afterAll(async () => {
    await shutdown(redisClient);
  });
  
  beforeEach(async () => {
    await redisClient.flushall();
  });
  
  describe('getLandingPage', () => {
    it('should retrieve landing page data from Redis when available', async () => {
      const landingPageUUID = 'test-uuid';
      const landingPageData = {
        id: 123,
        uuid: landingPageUUID,
        name: 'Test Landing Page',
        account_id: 456,
        settings: JSON.stringify({ template: 'default' })
      };
      
      const mapKey = `brandbot:checkoutflows:${landingPageUUID}`;
      for (const [key, value] of Object.entries(landingPageData)) {
        await redisClient.hsetAsync(mapKey, key, value);
      }
      
      const result = await RedisClientV2.getLandingPage(landingPageUUID);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(landingPageData.id.toString());
      expect(result.uuid).toBe(landingPageData.uuid);
      expect(result.name).toBe(landingPageData.name);
      expect(result.accountId).toBe(landingPageData.account_id.toString());
      expect(result.settings).toEqual({ template: 'default' });
    });
    
    it('should throw an error when landing page data is not found in Redis', async () => {
      const landingPageUUID = 'non-existent-uuid';
      
      await expect(RedisClientV2.getLandingPage(landingPageUUID))
        .rejects
        .toThrow(`No landing page data found for brandbot:checkoutflows:${landingPageUUID}`);
    });
    
    it('should parse JSON settings field correctly', async () => {
      const landingPageUUID = 'test-uuid';
      const complexSettings = {
        template: 'advanced',
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00'
        },
        features: ['checkout', 'cart', 'payment']
      };
      
      const landingPageData = {
        id: 123,
        settings: JSON.stringify(complexSettings)
      };
      
      const mapKey = `brandbot:checkoutflows:${landingPageUUID}`;
      for (const [key, value] of Object.entries(landingPageData)) {
        await redisClient.hsetAsync(mapKey, key, value);
      }
      
      const result = await RedisClientV2.getLandingPage(landingPageUUID);
      
      expect(result.settings).toEqual(complexSettings);
    });
    
    it('should handle empty settings field', async () => {
      const landingPageUUID = 'test-uuid';
      const landingPageData = {
        id: 123,
      };
      
      const mapKey = `brandbot:checkoutflows:${landingPageUUID}`;
      for (const [key, value] of Object.entries(landingPageData)) {
        await redisClient.hsetAsync(mapKey, key, value);
      }
      
      const result = await RedisClientV2.getLandingPage(landingPageUUID);
      
      expect(result.settings).toEqual({});
    });
  });
  
  describe('setLandingPage', () => {
    it('should store landing page data in Redis with correct key structure', async () => {
      const landingPageUUID = 'test-uuid';
      const landingPage = {
        id: 123,
        uuid: landingPageUUID,
        name: 'Test Landing Page',
        accountId: 456,
        settings: { template: 'default' }
      };
      
      await RedisClientV2.setLandingPage(landingPageUUID, landingPage);
      
      const mapKey = `brandbot:checkoutflows:${landingPageUUID}`;
      const storedData = await redisClient.hgetallAsync(mapKey);
      
      expect(storedData).toBeDefined();
      expect(storedData.id).toBe(landingPage.id.toString());
      expect(storedData.uuid).toBe(landingPage.uuid);
      expect(storedData.name).toBe(landingPage.name);
      expect(storedData.account_id).toBe(landingPage.accountId.toString());
      expect(storedData.settings).toBe(JSON.stringify(landingPage.settings));
    });
    
    it('should serialize complex objects into JSON strings', async () => {
      const landingPageUUID = 'test-uuid';
      const complexObject = {
        nestedObject: { 
          key1: 'value1',
          key2: 'value2'
        },
        numberValue: 123,
        stringValue: 'test'
      };
      
      const landingPage = {
        id: 123,
        complexField: complexObject
      };
      
      await RedisClientV2.setLandingPage(landingPageUUID, landingPage);
      
      const mapKey = `brandbot:checkoutflows:${landingPageUUID}`;
      const storedData = await redisClient.hgetallAsync(mapKey);
      
      expect(storedData).toBeDefined();
      expect(storedData.complex_field).toBe(JSON.stringify(complexObject));
    });
    
    it('should serialize arrays into JSON strings', async () => {
      const landingPageUUID = 'test-uuid';
      const arrayData = [1, 2, 3, 'test', { key: 'value' }];
      
      const landingPage = {
        id: 123,
        arrayField: arrayData
      };
      
      await RedisClientV2.setLandingPage(landingPageUUID, landingPage);
      
      const mapKey = `brandbot:checkoutflows:${landingPageUUID}`;
      const storedData = await redisClient.hgetallAsync(mapKey);
      
      expect(storedData).toBeDefined();
      expect(storedData.array_field).toBe(JSON.stringify(arrayData));
    });
    
    it('should serialize Date objects as ISO strings', async () => {
      const landingPageUUID = 'test-uuid';
      const testDate = new Date('2023-01-01T12:00:00Z');
      
      const landingPage = {
        id: 123,
        createdAt: testDate
      };
      
      await RedisClientV2.setLandingPage(landingPageUUID, landingPage);
      
      const mapKey = `brandbot:checkoutflows:${landingPageUUID}`;
      const storedData = await redisClient.hgetallAsync(mapKey);
      
      expect(storedData).toBeDefined();
      expect(storedData.created_at).toBe(testDate.toISOString());
    });
  });
  
  describe('integration between set and get', () => {
    it('should be able to retrieve data after setting it', async () => {
      const landingPageUUID = 'test-uuid';
      const landingPage = {
        id: 123,
        uuid: landingPageUUID,
        name: 'Test Landing Page',
        accountId: 456,
        settings: { 
          template: 'default',
          colors: {
            primary: '#ff0000',
            secondary: '#00ff00'
          }
        },
        createdAt: new Date('2023-01-01T12:00:00Z')
      };
      
      await RedisClientV2.setLandingPage(landingPageUUID, landingPage);
      const result = await RedisClientV2.getLandingPage(landingPageUUID);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(landingPage.id.toString());
      expect(result.uuid).toBe(landingPage.uuid);
      expect(result.name).toBe(landingPage.name);
      expect(result.accountId).toBe(landingPage.accountId.toString());
      expect(result.settings).toEqual(landingPage.settings);
      expect(result.createdAt).toBe(landingPage.createdAt.toISOString());
    });
  });
});
