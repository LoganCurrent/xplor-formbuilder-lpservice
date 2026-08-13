import AWS from 'aws-sdk';


async function getSecret(secretName: string) {
    const client = new AWS.SecretsManager();
    const data = await client.getSecretValue({SecretId: secretName}).promise();
    return JSON.parse(data.SecretString);
}

export default getSecret; 