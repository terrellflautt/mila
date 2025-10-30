const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const https = require('https');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamodb = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
    'Content-Type': 'application/json'
  };

  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const timestamp = new Date().toISOString();
    const visitorId = body.visitorId || 'anonymous';

    // Store in DynamoDB
    await dynamodb.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        visitorId,
        timestamp,
        questionId: body.questionId || 'unknown',
        answer: body.answer || '',
        puzzle: body.puzzle || '',
        metadata: JSON.stringify(body)
      }
    }));

    console.log('Stored answer in DynamoDB:', { visitorId, questionId: body.questionId });

    // Send email via Web3Forms
    const emailData = {
      access_key: process.env.WEB3FORMS_ACCESS_KEY,
      subject: `💕 New Answer from Mila's World - ${body.questionId}`,
      from_name: "Mila's World",
      to: process.env.EMAIL_TO,
      message: formatEmail(body, timestamp, visitorId)
    };

    await sendWeb3FormsEmail(emailData);
    console.log('Email sent successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Answer stored' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};

function formatEmail(body, timestamp, visitorId) {
  return `
╔════════════════════════════════════════╗
║   💕 NEW ANSWER FROM MILA'S WORLD 💕   ║
╚════════════════════════════════════════╝

Question ID: ${body.questionId}
Puzzle: ${body.puzzle}

ANSWER:
${body.answer}

════════════════════════════════════════
Timestamp: ${timestamp}
Visitor ID: ${visitorId}

${body.dialogueResponses ? `
DIALOGUE RESPONSES:
${JSON.stringify(body.dialogueResponses, null, 2)}

Emotional Harmony: ${body.harmony || 'N/A'}
` : ''}
  `;
}

function sendWeb3FormsEmail(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'api.web3forms.com',
      port: 443,
      path: '/submit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`Web3Forms returned ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}
