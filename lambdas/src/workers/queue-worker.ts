import { SQSHandler } from "aws-lambda";
import logger from "../utils/logger";
import LandingPageService from "../services/landing-page-service";

export const handler = async (event) => {
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      const { type, contactId, metadata, contactListId } = message;

      switch (type) {
        case "landed":
          await LandingPageService.insertLandingPageContactEvent(
            contactId,
            metadata
          );
          break;

        case "finished":
          if (contactListId) {
            await LandingPageService.insertContactIntoContactlist(
              contactListId,
              contactId
            );
          }
          await LandingPageService.insertLandingPageContactEvent(
            contactId,
            metadata
          );
          break;

        default:
          logger.logMessage(`Unknown message type: ${type}`, "error");
      }
    } catch (error) {
      logger.logError(error, "Failed to process queue message");
      throw error; // move to DLQ
    }
  }
};
