import { APIGatewayProxyHandler } from 'aws-lambda';
import AWS from 'aws-sdk';

const isLocalEnvironment = process.env.AWS_SAM_LOCAL === 'true';

const dynamoDBConfig = isLocalEnvironment
    ? {
        region: 'localhost',
        endpoint: 'http://dynamodb-local:8000',
    }
    : {}; // AWS SDK will use default configuration for AWS Lambda


const dynamoDb = new AWS.DynamoDB.DocumentClient(dynamoDBConfig);

export const handler: APIGatewayProxyHandler = async (event, _context) => {
    try {
        // Extract the catType from the path parameters
        const breed = event.pathParameters?.breed;
        if (!breed) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing breed parameter' }),
            };
        }

        // Query the DynamoDB table
        const params = {
            TableName: process.env.DYNAMODB_TABLE,
            IndexName: 'BreedIndex',
            KeyConditionExpression: '#breed = :breed',
            ExpressionAttributeNames: {
                '#breed': 'breed',
            },
            ExpressionAttributeValues: {
                ':breed': breed,
            },
        };

        const result = await dynamoDb.query(params).promise();

        const response = {
            statusCode: 200,
            body: JSON.stringify(result),
            headers: {
                'Access-Control-Allow-Origin': '*', // CORS support, change to restrict origins if needed
            },
        };

        return response;
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
