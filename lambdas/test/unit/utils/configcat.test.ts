import configcat from 'configcat-node';
import configcatInstance from '../../../src/utils/configcat';

jest.mock('configcat-node', () => {
  const configCatClientMock = {
    getValueAsync: jest.fn().mockResolvedValue(true),
  };

  return {
    ...(jest.requireActual('configcat-node') as Object),
    getClient: jest.fn().mockReturnValue(configCatClientMock),
  };
});

describe('configcat', () => {
  it('should instantiate the configcat client', () => {
    jest.isolateModules(() => {
      require('../../../src/utils/configcat');
      expect(configcat.getClient).toHaveBeenCalled();
    });
  });

  it('should return a standard user', () => {
    const user = configcatInstance.standardUser('123', 'vendor');
    expect(user.identifier).toBe('123');
    expect(user.custom).toEqual({ account_id: '123', vendor: 'vendor' });
  });

  it('should get feature flag', async () => {
    const value = await configcatInstance.getFeatureFlag('featureFlag');
    expect(
      configcatInstance.configCatClient.getValueAsync
    ).toHaveBeenCalledWith('featureFlag', false);
    expect(value).toBe(true);
  });

  it('should get feature flag with user', async () => {
    const value = await configcatInstance.getFeatureFlagWithUser(
      'featureFlag',
      new configcat.User('123', 'vendor')
    );
    expect(value).toBe(true);
  });

  it('should get feature flag with user and default value', async () => {
    configcatInstance.configCatClient = null;
    const value = await configcatInstance.getFeatureFlagWithUser(
      'featureFlag',
      new configcat.User('123', 'vendor'),
      false
    );
    expect(value).toBe(false);
  });

  it('should get feature flag with default value', async () => {
    configcatInstance.configCatClient = null;
    const value = await configcatInstance.getFeatureFlag('featureFlag', false);
    expect(value).toBe(false);
  });
});
