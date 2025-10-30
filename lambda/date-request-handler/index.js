const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const https = require('https');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamodb = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
        questionId: 'date-request',
        answer: JSON.stringify(body),
        puzzle: 'date-request',
        metadata: JSON.stringify(body)
      }
    }));

    console.log('Stored date request in DynamoDB');

    // Send email via Web3Forms
    const emailData = {
      access_key: process.env.WEB3FORMS_ACCESS_KEY,
      subject: '💕💕💕 DATE REQUEST FROM MILA! 💕💕💕',
      from_name: "Mila's World",
      to: process.env.EMAIL_TO,
      message: formatDateRequest(body, timestamp)
    };

    await sendWeb3FormsEmail(emailData);
    console.log('Date request email sent successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
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

function formatDateRequest(data, timestamp) {
  const urgencyMap = {
    'asap': '🔥 ASAP - She wants to see you NOW!',
    'idk': '💭 "idk, just figure it out before I change my mind"',
    'pick-date': `📅 ${data.date || 'Not specified'} at ${data.time || 'anytime'}`
  };

  const urgencyText = urgencyMap[data.urgency] || data.urgency || 'Not specified';
  const placeText = data.place || 'Surprise me ✨';
  const noteText = data.note ? `\n"${data.note}"` : '\n(No note)';

  return `
╔══════════════════════════════════════╗
║   💕💕💕 DATE REQUEST FROM MILA! 💕💕💕   ║
╚══════════════════════════════════════╝

WHEN:
${urgencyText}

WHERE:
${placeText}

MILA'S NOTE:${noteText}

══════════════════════════════════════

📅 Submitted: ${timestamp}
🆔 Visitor: ${data.visitorId || 'anonymous'}

══════════════════════════════════════

Time to make her smile! 😊
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
