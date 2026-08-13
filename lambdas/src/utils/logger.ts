import * as winston from 'winston';
import * as os from 'os';


class BBLogger {
    httpTransportOptions: winston.transports.HttpTransportOptions;
    logger: winston.Logger;
    appName: string;
    subsystemName: string;
    environment: string;

    constructor() {
        this.appName = process.env.CORALOGIX_APP_NAME;
        this.environment = process.env.ENV;
        this.subsystemName = `${process.env.APP_NAME}.${this.environment}`;
        this.httpTransportOptions = {
            level: 'info',
            format: winston.format((info) => ({
                // Coralogix expects `severity` not `level`
                level: info.level,
                applicationName: this.appName,
                subsystemName: this.subsystemName,
                computerName: os.hostname(),
                environment: this.environment,
                timestamp: Date.now(),
                severity: {
                    silly: 1,
                    debug: 1,
                    verbose: 2,
                    info: 3,
                    warn: 4,
                    error: 5,
                    critical: 6
                }[info.level] || 3,
                // Coralogix expects `text` not `message`
                message: '',
                text: {
                    ...info,
                    teamName: 'xplor-growth'
                }
            }))(),
            headers: {
                'Authorization': `Bearer ${process.env.CORALOGIX_API_KEY}`
            },
            host: process.env.CORALOGIX_API_HOST,
            path: process.env.CORALOGIX_API_PATH,
            ssl: true,
        };

        this.logger = winston.createLogger({
            level: 'info',
            exitOnError: false,
            format: winston.format.json(),
            transports: [
                new winston.transports.Http(this.httpTransportOptions),
                new winston.transports.Console(),
            ],
        });
    }

    logMessage(message, level='info') {
      if (this.environment === 'test') return;
      this.logger.log(
        level,
        {
          message,
          environment: this.environment,  
          serviceName: this.appName
        }
      );
    }

    logError(error, message, level='error') {
      if (this.environment === 'test') return;
      this.logger.log(
        level,
        {
          message,
          error: error.message,
          errorName: error.name,
          errorCode: error.code,
          errorType: error.type,
          stack: error.stack,
          environment: this.environment,  
          serviceName: this.appName,
        }
      );
    }
}

export default new BBLogger();
