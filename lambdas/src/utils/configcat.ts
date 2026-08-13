import {
  createFlagOverridesFromMap,
  OverrideBehaviour,
  getClient,
  PollingMode,
  User,
  createConsoleLogger,
  LogLevel,
} from 'configcat-node';
import logger from './logger';

class ConfigCat {
  configCatClient;

  constructor() {
    try {
      const configcatOptions = {
        // need to set, otherwise testing dumps cc error logs in a lot of places
        logger: createConsoleLogger(LogLevel.Off),
        defaultUser: new User('landing-page-API', '', ''),
        cacheTimeToLiveSeconds: 30,
      };

      const configcatOverrides = process.env.CONFIGCAT_OVERRIDES;
      if (configcatOverrides) {
        try {
          const overrideMap = JSON.parse(configcatOverrides);
          configcatOptions['flagOverrides'] = createFlagOverridesFromMap(
            overrideMap,
            OverrideBehaviour.LocalOverRemote
          );
        } catch (error) {
          logger.logError(
            error,
            'Failed to parse configcat overrides - configcat'
          );
        }
      }

      const configcatSdkKey = process.env.CONFIGCAT_SDK_KEY || '';

      // instantiate client
      this.configCatClient = getClient(
        configcatSdkKey,
        PollingMode.LazyLoad,
        configcatOptions
      );
    } catch (error) {
      logger.logError(
        error,
        'Failed to instantiate configcat client - configcat'
      );
      this.configCatClient = null;
    }
  }

  standardUser(accountId: number|string, vendor: string) {
    return new User(`${accountId || vendor}`, '', '', {
      account_id: accountId || undefined,
      vendor: vendor || undefined,
    });
  }

  async getFeatureFlag(featureFlag: string, defaultValue = false) {
    if (this.configCatClient) {
      return await this.configCatClient.getValueAsync(
        featureFlag,
        defaultValue
      );
    } else {
      return defaultValue;
    }
  }

  async getFeatureFlagWithUser(featureFlag: string, user: User, defaultValue = false) {
    if (this.configCatClient) {
      return await this.configCatClient.getValueAsync(
        featureFlag,
        defaultValue,
        user
      );
    } else {
      return defaultValue;
    }
  }
}

export default new ConfigCat();
