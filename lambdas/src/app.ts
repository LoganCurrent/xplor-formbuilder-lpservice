import 'reflect-metadata';
import type { Express } from 'express';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import awsServerlessExpressMiddleware from 'aws-serverless-express/middleware';
import useRoutes from './routes';
import { RedisClient, RedisClientV2 } from './utils';
import { BBLogger, catchAllErrorHandler } from './utils';
import winston from 'winston';
import expressWinston from 'express-winston';


const app: Express = express();

app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

RedisClient.host = process.env.REDIS_HOST;
RedisClient.port = parseInt(process.env.REDIS_PORT);

RedisClientV2.host = process.env.REDIS_V2_HOST;
RedisClientV2.port = parseInt(process.env.REDIS_V2_PORT);

const loggerMiddleWare = expressWinston.logger({
  winstonInstance: BBLogger.logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
});

app.use(loggerMiddleWare);
useRoutes(app);
app.use(expressWinston.errorLogger({
  winstonInstance: BBLogger.logger,
  msg: 'ERROR HTTP {{req.method}} {{req.url}}',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json()
  )
}));
app.use(catchAllErrorHandler);

export default app;
