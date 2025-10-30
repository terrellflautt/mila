/**
 * API utilities for communicating with backend
 */

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://your-api-gateway-url.amazonaws.com/prod';

/**
 * Submit answer to backend
 * Stores in DynamoDB and sends email notification
 */
export async function submitAnswer(answerData) {
  try {
    const response = await fetch(`${API_ENDPOINT}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(answerData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error('Error submitting answer:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Prepare answer data for submission
 */
export function prepareAnswerPayload({
  userId,
  questionId,
  questionText,
  answerValue,
  answerType = 'text',
  seed = 0,
  puzzleId = null,
  visitCount = 1
}) {
  return {
    userId,
    questionId,
    questionText,
    answerValue,
    answerType,
    seed,
    puzzleId,
    visitCount,
    deviceFingerprint: getDeviceFingerprint(),
    timestamp: new Date().toISOString()
  };
}

/**
 * Get device fingerprint (for tracking unique visitors)
 */
function getDeviceFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    navigator.platform
  ];

  const fingerprint = components.join('|');
  return hashString(fingerprint);
}

/**
 * Simple hash function
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Test API connectivity
 */
export async function testConnection() {
  try {
    const response = await fetch(`${API_ENDPOINT}/answer`, {
      method: 'OPTIONS'
    });
    return response.ok;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
}
