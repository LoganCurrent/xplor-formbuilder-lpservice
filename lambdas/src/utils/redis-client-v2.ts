import redis from 'redis';
import { promisify } from 'util';
import { camelCase, isPlainObject, mapKeys, snakeCase } from 'lodash';

class RedisClientV2 {
  client: any
  host: string
  port: number
  db: number

  async connect() {
    return new Promise((resolve, reject) => {
      if (this.client) {
        return resolve(this.client);
      }

      this.client = redis.createClient({
        host: this.host,
        port: this.port,
        db: this.db ? this.db : 0,
      });

      this.client.setAsync = promisify(this.client.set).bind(this.client);
      this.client.getAsync = promisify(this.client.get).bind(this.client);
      this.client.delAsync = promisify(this.client.del).bind(this.client);
      this.client.hgetAsync = promisify(this.client.hget).bind(this.client);
      this.client.hgetallAsync = promisify(this.client.hgetall).bind(this.client);
      this.client.hmgetAsync = promisify(this.client.hmget).bind(this.client);
      this.client.hmsetAsync = promisify(this.client.hmset).bind(this.client);
      this.client.incrAsync = promisify(this.client.incr).bind(this.client);
      this.client.smembersAsync = promisify(this.client.smembers).bind(
        this.client
      );
      this.client.expireAsync = promisify(this.client.expire).bind(this.client);
      this.client.existsAsync = promisify(this.client.exists).bind(this.client);
      // For dev
      this.client.flushallAsync = promisify(this.client.flushall).bind(this.client);
      this.client.quitAsync = promisify(this.client.quit).bind(this.client);
      this.client.endAsync = promisify(this.client.end).bind(this.client);
      this.client.hsetAsync = promisify(this.client.hset).bind(this.client);
    
      this.client.on('ready', () => {
        resolve(this.client);
      });
      this.client.on('error', (err) => {
        console.log(err);
        reject(err);
      });
    });
  }

  async getLandingPage(landingPageUUID: string) {
    await this.connect();
    const key = `brandbot:checkoutflows:${landingPageUUID}`;
    let landingPage = await this.client.hgetallAsync(key);

    if (!landingPage || Object.keys(landingPage).length === 0) {
      throw Error(`No landing page data found for ${key}`);
    }

    landingPage['settings'] = JSON.parse(landingPage['settings'] ?? '{}');
    landingPage = mapKeys(landingPage, (value, key) => {
      return camelCase(key);
    });

    return landingPage;
  }

  async setLandingPage(landingPageUUID: string, landingPage: any) {
    await this.connect();
    const mapKey = `brandbot:checkoutflows:${landingPageUUID}`;
    const transaction = this.client.multi();

    for (const key in landingPage) {
      let value = landingPage[key];

      // Serialize objects and arrays
      if (isPlainObject(value) || Array.isArray(value)) {
        value = JSON.stringify(value);
      }

      // Serialize Date objects
      if (value instanceof Date) {
        value = value.toISOString();
      }
    
      transaction.hset(mapKey, snakeCase(key), value);
    }

    transaction.expire(mapKey, 60 * 60); // 1 hour
    await promisify(transaction.exec).call(transaction);
  }
}

export default new RedisClientV2();
