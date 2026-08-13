import 'reflect-metadata';
import type { Context } from 'aws-lambda';

import awsServerlessExpress from 'aws-serverless-express';
import app from './app';

const server = awsServerlessExpress.createServer(app);

function handler(event: never, context: Context): unknown {
  return awsServerlessExpress.proxy(server, event, context);
}

export { handler };
