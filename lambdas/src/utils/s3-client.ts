import AWS from 'aws-sdk';

class S3Client {
    client: any
    constructor() {
      this.client = new AWS.S3();
    }
}
export default new S3Client();