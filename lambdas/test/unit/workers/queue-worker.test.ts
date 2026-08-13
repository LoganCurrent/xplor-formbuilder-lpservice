import { SQSEvent } from "aws-lambda";
import { handler } from "../../../src/workers/queue-worker";
import LandingPageService from "../../../src/services/landing-page-service";

jest.mock("../../../src/services/landing-page-service", () => ({
  insertLandingPageContactEvent: jest.fn(),
  insertContactIntoContactlist: jest.fn(),
}));

jest.mock("../../../src/utils/logger", () => ({
  logMessage: jest.fn(),
  logError: jest.fn(),
}));

describe("Queue Worker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process "landed" type message successfully', async () => {
    const mockEvent: SQSEvent = {
      Records: [
        {
          messageId: "test-message-id",
          body: JSON.stringify({
            type: "landed",
            contactId: "test-contact-id",
            metadata: { page: "home" },
          }),
          attributes: {
            ApproximateReceiveCount: "",
            SentTimestamp: "",
            SenderId: "",
            ApproximateFirstReceiveTimestamp: "",
          },
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "",
          eventSourceARN: "",
          awsRegion: "",
          receiptHandle: "",
        },
      ],
    };

    await handler(mockEvent);

    expect(
      LandingPageService.insertLandingPageContactEvent
    ).toHaveBeenCalledWith("test-contact-id", { page: "home" });
  });

  it('should process "finished" type message successfully', async () => {
    const mockEvent: SQSEvent = {
      Records: [
        {
          messageId: "test-message-id",
          body: JSON.stringify({
            type: "finished",
            contactId: "test-contact-id",
            contactListId: "test-list-id",
            metadata: { completed: true },
          }),
          attributes: {
            ApproximateReceiveCount: "",
            SentTimestamp: "",
            SenderId: "",
            ApproximateFirstReceiveTimestamp: "",
          },
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "",
          eventSourceARN: "",
          awsRegion: "",
          receiptHandle: "",
        },
      ],
    };

    await handler(mockEvent);

    expect(
      LandingPageService.insertContactIntoContactlist
    ).toHaveBeenCalledWith("test-list-id", "test-contact-id");
    expect(
      LandingPageService.insertLandingPageContactEvent
    ).toHaveBeenCalledWith("test-contact-id", { completed: true });
  });

  it('should process "finished" type message without contactListId', async () => {
    const mockEvent: SQSEvent = {
      Records: [
        {
          messageId: "test-message-id",
          body: JSON.stringify({
            type: "finished",
            contactId: "test-contact-id",
            metadata: { completed: true },
          }),
          attributes: {
            ApproximateReceiveCount: "",
            SentTimestamp: "",
            SenderId: "",
            ApproximateFirstReceiveTimestamp: "",
          },
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "",
          eventSourceARN: "",
          awsRegion: "",
          receiptHandle: "",
        },
      ],
    };

    await handler(mockEvent);

    expect(
      LandingPageService.insertContactIntoContactlist
    ).not.toHaveBeenCalled();
    expect(
      LandingPageService.insertLandingPageContactEvent
    ).toHaveBeenCalledWith("test-contact-id", { completed: true });
  });

  it("should handle unknown message type", async () => {
    const mockEvent: SQSEvent = {
      Records: [
        {
          messageId: "test-message-id",
          body: JSON.stringify({
            type: "unknown",
            contactId: "test-contact-id",
            metadata: {},
          }),
          attributes: {
            ApproximateReceiveCount: "",
            SentTimestamp: "",
            SenderId: "",
            ApproximateFirstReceiveTimestamp: "",
          },
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "",
          eventSourceARN: "",
          awsRegion: "",
          receiptHandle: "",
        },
      ],
    };

    await handler(mockEvent);

    expect(
      LandingPageService.insertLandingPageContactEvent
    ).not.toHaveBeenCalled();
    expect(
      LandingPageService.insertContactIntoContactlist
    ).not.toHaveBeenCalled();
  });

  it("should throw error when message processing fails", async () => {
    const mockEvent: SQSEvent = {
      Records: [
        {
          messageId: "test-message-id",
          body: "invalid-json",
          attributes: {
            ApproximateReceiveCount: "",
            SentTimestamp: "",
            SenderId: "",
            ApproximateFirstReceiveTimestamp: "",
          },
          messageAttributes: {},
          md5OfBody: "",
          eventSource: "",
          eventSourceARN: "",
          awsRegion: "",
          receiptHandle: "",
        },
      ],
    };

    await expect(handler(mockEvent)).rejects.toThrow();
  });
});
