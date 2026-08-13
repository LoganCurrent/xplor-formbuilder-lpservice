import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
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
      this.client.incrAsync = promisify(this.client.incr).bind(this.client);
      this.client.smembersAsync = promisify(this.client.smembers).bind(
        this.client
      );
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

  async getMTCredentials(bbAccountId: string) {
    await this.connect();
    const key = `mariana:accounts:${bbAccountId}:credentials`;
    const accountCredentials = await this.client.hgetallAsync(key);
    if (!accountCredentials)
      throw Error(`No credentials found for ${key}`);
    return accountCredentials;
  }

  async getContactForMTUserId(subdomain: string, mtUserId: string) {
    await this.connect();
    const key = `marianatek:${subdomain}:userId:${mtUserId}`;
    const userData = await this.client.hgetallAsync(key);
    if (!userData) {
      throw Error(`No user data found for ${key}`);
    }
    return userData.id;

  }

  async getLandingPageConfig(landingPageUUID: string) {
    await this.connect();
    const key = `brandbot:checkoutflows.${landingPageUUID}`;
    const parameters = await this.client.getAsync(key);
    if (!parameters) {
      throw Error(`No landing page data found for ${key}`);
    }
    return JSON.parse(parameters);
  }

  async getLandingPageTotalPurchases(landingPageUUID) {
    await this.connect();
    const key = `brandbot:checkoutflows.${landingPageUUID}.totalPurchased`;
    const data = await this.client.getAsync(key);
    return data;
  }

  async getContactTags(contactId: number) {
    await this.connect();
    const key = `contacts:${contactId}:tags`;
    const contactTags = await this.client.hgetallAsync(key);
    return contactTags;
  }

  async getMTAccountLinkedLocations (bbAccountId: string): Promise<string[]> {
    await this.connect();
    const key = `marianatek:${bbAccountId}:linkedLocations`;
    const locations = await this.client.smembersAsync(key);
    return locations[0];
  }
}

export default new RedisClient();
