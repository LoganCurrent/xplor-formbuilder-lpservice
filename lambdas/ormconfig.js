
let defaultConfig =  {
  // Local Dev database credentials - loaded by default
  "type": "mysql",
  "host": "localhost",
  "port": 3307,
  "username": "user",
  "password": "password",
  "database": "brandbot",
  "logging": false,
  "synchronize": false,
  "entities": [
    "dist/entities/**/*.js"
  ],
  "factories": [
    "dist/factories/**/*.js"
  ],
};

function assembleConfig () {
  // eslint-disable-next-line no-undef
  switch(process.env.NODE_ENV) {
  case 'test':
    defaultConfig.synchronize = true;
    defaultConfig.port = 3306;
    defaultConfig.entities = [
      "src/entities/**/*.ts"
    ];
    defaultConfig.factories = [
      "src/factories/**/*.ts"
    ];
    break;
  case 'dev':
    // synchronize will auto-create tables if not present. Be careful. 
    defaultConfig.synchronize = false;
    defaultConfig.logging = true;
    break;
  default:
    // Prod/Staging ORM config 
    break;
  }
  return defaultConfig;
}

module.exports = assembleConfig();