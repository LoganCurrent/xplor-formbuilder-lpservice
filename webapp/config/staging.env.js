'use strict'

require('./loadDotenv')

module.exports = {
  API_BASE_URL: '"https://landing-pages.brndbot.net/staging/"',
  NODE_ENV: '"staging"',
  CONFIGCAT_SDK_KEY: JSON.stringify(process.env.CONFIGCAT_SDK_KEY || ''),
  VUE_APP_CROWDIN_CDN_URL: JSON.stringify(process.env.VUE_APP_CROWDIN_CDN_URL || '')
}
