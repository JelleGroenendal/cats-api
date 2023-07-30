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
        // Parse and set the limit parameter (max 50)
        let limit = parseInt(event?.queryStringParameters?.limit || '10', 10);
        if (isNaN(limit) || limit < 1) {
            limit = 10; // Default to 10 if limit is not a valid number or less than 1
        }
        limit = Math.min(limit, 50); // Cap the limit at a maximum of 50

        // Parse and set the page parameter
        let page = parseInt(event?.queryStringParameters?.page || '1', 10);
        page = Math.max(page, 1); // Cap the page at a minimum of 1

        // Calculate the starting point for pagination
        let exclusiveStartKey;
        if (page > 1 && event?.queryStringParameters?.lastEvaluatedKey) {
            exclusiveStartKey = JSON.parse(
                Buffer.from(event.queryStringParameters.lastEvaluatedKey, 'base64').toString('utf-8')
            );
        }

        // Query the DynamoDB table to get the total count of entries
        const totalCountParams = {
            TableName: process.env.DYNAMODB_TABLE,
            Select: 'COUNT',
        };
        const totalCountResult = await dynamoDb.scan(totalCountParams).promise();
        const totalCount = totalCountResult.Count || 0;

        // Calculate the number of pages available based on the limit and total count
        const totalPages = Math.ceil(totalCount / limit);

        // Query the DynamoDB table to fetch the paginated data
        const params = {
            TableName: process.env.DYNAMODB_TABLE,
            Limit: limit,
            ExclusiveStartKey: exclusiveStartKey,
        };
        const result = await dynamoDb.scan(params).promise();

        const response = {
            statusCode: 200,
            body: JSON.stringify(result),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'X-Total-Count': totalCount.toString(),
                'X-Total-Pages': totalPages.toString(),
            },
        };

        // Check if there are more items to paginate
        if (result.LastEvaluatedKey) {
            // Include the X-Next-Page header with the next page number
            response.headers['X-Next-Page'] = (page + 1).toString();
            response.headers['X-Next-Page-Key'] = Buffer.from(
                JSON.stringify(result.LastEvaluatedKey)
            ).toString('base64');
        }

        return response;
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
