/**
 * Lambda Function: Date Request Handler
 * Handles date requests from Mila and sends email notifications
 */

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
    if (!body.urgency) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing urgency field',
          required: ['urgency']
        })
      };
    }

    const timestamp = new Date().toISOString();

    // Format email message
    const emailMessage = formatDateRequest(body, timestamp);

    // Send to Web3Forms
    const emailPayload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: `💕 DATE REQUEST FROM MILA! 💕`,
      from_name: "Mila's World",
      to: EMAIL_TO,
      message: emailMessage
    };

    const emailResponse = await fetch(WEB3FORMS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const emailResult = await emailResponse.json();
    const emailSuccess = emailResult.success || false;

    console.log('Date request email sent:', emailResult);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Date request sent successfully!',
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
 * Format date request email
 */
function formatDateRequest(data, timestamp) {
  const { urgency, date, time, place, note } = data;

  let urgencyText = urgency;
  if (urgency === 'asap') {
    urgencyText = '🔥 ASAP! 🔥';
  } else if (urgency === 'figure-it-out') {
    urgencyText = '💭 "idk, just figure it out before I change my mind"';
  } else if (date) {
    urgencyText = `📅 ${date}${time ? ` at ${time}` : ''}`;
  }

  let placeText = place ? `📍 ${place}` : '📍 Anywhere';
  let noteText = note ? `\n\n💌 Her note:\n"${note}"` : '';

  return `
╔══════════════════════════════════╗
║   💕 DATE REQUEST FROM MILA! 💕   ║
╔══════════════════════════════════╗

She wants to see you!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHEN:
${urgencyText}

WHERE:
${placeText}
${noteText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Request Details:
• Timestamp: ${timestamp}
• User Agent: ${data.userAgent || 'Unknown'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 GO GET HER! 🎉

This request came from: mila.terrellflautt.com
  `.trim();
}
