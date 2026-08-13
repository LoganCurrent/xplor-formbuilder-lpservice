import type { Connection } from 'typeorm';
import { 
  getConnectionManager, 
  createConnection, 
  getConnectionOptions } from 'typeorm';
import getSecret from './secrets-manager';


async function getCredentials() {
  // Always check if we have an AWS secret set first
  // If not, fallback to to env vars!
  if (process.env.DB_SECRET_NAME) {
    const creds = await getSecret(process.env.DB_SECRET_NAME);
    return {
      host: creds.host,
      port: creds.port,
      database: 'brandbot',
      username: creds.username,
      password: creds.password
    }
  }
  return {
    host: process.env.TYPEORM_HOST,
    port: parseInt(process.env.TYPEORM_PORT),
    database: process.env.TYPEORM_DATABASE,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD
  }
}

async function getOrCreateDbConnection(): Promise<Connection> {
  let connection;
  const manager = await getConnectionManager();
  if (!manager.connections.length) {
    const connectionOptions = await getConnectionOptions();
    
    if (process.env.NODE_ENV !== 'test') {
      // Test Credentials are loaded via ormconfig for simplicty. 
      // Otherwise try AWS secrets or process.env
      const credentials = await getCredentials();
      Object.assign(connectionOptions, credentials);
    }   
    connection = await createConnection(connectionOptions);
  } else {
    connection = manager.connections[0];
  }

  return connection;
}

export { getOrCreateDbConnection };