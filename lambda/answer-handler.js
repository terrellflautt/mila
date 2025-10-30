/**
 * Lambda Function: Answer Handler
 * Stores answers in DynamoDB and forwards to email via Web3Forms
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'MilasWorld-Answers';
const WEB3FORMS_URL = 'https://api.web3forms.com/submit';
const WEB3FORMS_ACCESS_KEY = process.env.WEB3FORMS_ACCESS_KEY || 'eafc242f-6c42-4d16-9253-28c7b6969aa7';
const EMAIL_TO = process.env.EMAIL_TO || 'terrell.flautt@gmail.com';

export const handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const body = JSON.parse(event.body);

    // Validate required fields
    if (!body.userId || !body.questionId || !body.questionText || !body.answerValue) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required fields',
          required: ['userId', 'questionId', 'questionText', 'answerValue']
        })
      };
    }

    const timestamp = new Date().toISOString();

    // Prepare item for DynamoDB
    const item = {
      userId: body.userId,
      timestamp: timestamp,
      questionId: body.questionId,
      questionText: body.questionText,
      answerType: body.answerType || 'text',
      answerValue: body.answerValue,
      seed: body.seed || 0,
      puzzleId: body.puzzleId || null,
      deviceFingerprint: body.deviceFingerprint || null,
      sentToEmail: false,
      metadata: {
        userAgent: event.headers['User-Agent'] || 'unknown',
        visitCount: body.visitCount || 1
      }
    };

    // Save to DynamoDB
    await ddbDocClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));

    console.log('Saved to DynamoDB:', item);

    // Forward to Web3Forms
    let emailSuccess = false;
    try {
      const emailPayload = {
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `New answer from Mila - ${body.questionId}`,
        from_name: 'Mila\'s World',
        to: EMAIL_TO,
        message: formatEmailMessage(body)
      };

      const emailResponse = await fetch(WEB3FORMS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });

      const emailResult = await emailResponse.json();
      emailSuccess = emailResult.success || false;

      console.log('Email response:', emailResult);

      // Update DynamoDB with email status
      if (emailSuccess) {
        await ddbDocClient.send(new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            userId: item.userId,
            timestamp: timestamp
          },
          UpdateExpression: 'set sentToEmail = :s',
          ExpressionAttributeValues: {
            ':s': true
          }
        }));
      }
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the whole request if email fails
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Answer saved successfully',
        emailSent: emailSuccess,
        timestamp: timestamp
      })
    };

  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

/**
 * Format email message
 */
function formatEmailMessage(data) {
  return `
New Answer from Mila's World
════════════════════════════

Question: ${data.questionText}

Answer: ${data.answerValue}

Answer Type: ${data.answerType}

━━━━━━━━━━━━━━━━━━━━━━━━━━

Details:
• Question ID: ${data.questionId}
• User ID: ${data.userId}
• Visit Count: ${data.visitCount || 'Unknown'}
• Seed: ${data.seed}
• Puzzle: ${data.puzzleId || 'None'}

━━━━━━━━━━━━━━━━━━━━━━━━━━

Sent with love from Mila's World
mila.terrellflautt.com
  `.trim();
}
