import { SQS } from "@aws-sdk/client-sqs";

/*
Default function for getting an SQS client for SQS interactions.
Uses the LOCAL_DEV env var for configuring local client.
*/
export const getSQS = (queueUrl?: string, region?: string) => {
  return process.env.NODE_ENV === "local"
    ? new SQS({
        region: "local",
        endpoint: queueUrl,
        credentials: {
          accessKeyId: "local",
          secretAccessKey: "local",
        },
      })
    : new SQS({
        endpoint: queueUrl,
        region,
      });
};
