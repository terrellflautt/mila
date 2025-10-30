/**
 * Daily Message System
 * Rotates through poetic messages - one per day
 * Never repeats until all messages have been seen
 */

import { generateDailySeed } from './seed.js';
import { getStorageKey } from './storage.js';

// Pool of daily messages organized by theme
const MESSAGE_POOL = {
  act1: [
    "You make ordinary days feel choreographed.",
    "The way you see art — that's how I see you.",
    "Even when you're busy, I hope today gives you one quiet breath.",
    "Flamingos mate for life. Just saying.",
    "The world's better every time you show up.",
    "Keep dancing. The universe notices.",
    "Before the stage knew your name, it already waited for your light.",
    "Even silence moves when you enter a room.",
    "I saw your reflection before I saw your face.",
    "Some days, grace looks like just showing up.",
    "You don't have to rush. The music waits for you."
  ],
  act2: [
    "We move through the same quiet rhythm, even when silence keeps the beat.",
    "Each memory paints its own portrait, and somehow, your color fills them all.",
    "Words became choreography—and meaning danced between us.",
    "It's not about the steps. It's about who you're dancing with.",
    "The world hums a different frequency when you're near.",
    "Your presence is its own kind of poetry.",
    "Every moment with you feels like a remembered dream.",
    "Distance is just the space between heartbeats.",
    "You're the reason soft things feel important.",
    "In a room full of noise, you're the only sound that matters."
  ],
  act3: [
    "Some connections don't need explaining—they just are.",
    "You're the constellation I didn't know I was looking for.",
    "Time moves differently around you—slower, warmer, more intentional.",
    "Your laugh is the best song I've ever heard.",
    "Every day I'm grateful the universe put you in my path.",
    "You make me want to be better at being present.",
    "If I could give you one gift, it would be to see yourself through my eyes.",
    "The most beautiful art is the life you're living.",
    "You're not just a chapter—you're the whole story.",
    "Thank you for being exactly who you are."
  ]
};

// Flatten all messages into one pool
const ALL_MESSAGES = [
  ...MESSAGE_POOL.act1,
  ...MESSAGE_POOL.act2,
  ...MESSAGE_POOL.act3
];

/**
 * Get the daily message for today
 * @param {string} visitorId - Unique visitor ID
 * @returns {string} Today's message
 */
export function getDailyMessage(visitorId) {
  // Generate seed from today's date
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const seed = generateDailySeed(visitorId);

  // Get list of seen messages from localStorage
  const seenKey = getStorageKey('seen-messages');
  const seenData = localStorage.getItem(seenKey);
  let seenMessages = seenData ? JSON.parse(seenData) : [];

  // Reset if all messages have been seen
  if (seenMessages.length >= ALL_MESSAGES.length) {
    seenMessages = [];
    localStorage.setItem(seenKey, JSON.stringify([]));
  }

  // Get unseen messages
  const unseenMessages = ALL_MESSAGES.filter(msg => !seenMessages.includes(msg));

  // Pick message based on today's seed
  const messageIndex = seed % unseenMessages.length;
  const message = unseenMessages[messageIndex];

  // Check if we already showed a message today
  const todayKey = getStorageKey('message-date');
  const lastDate = localStorage.getItem(todayKey);

  if (lastDate !== today) {
    // New day - mark this message as seen
    seenMessages.push(message);
    localStorage.setItem(seenKey, JSON.stringify(seenMessages));
    localStorage.setItem(todayKey, today);
  }

  return message;
}

/**
 * Get a themed message based on current act
 * @param {string} act - Current act (act1, act2, act3)
 * @param {number} seed - Random seed
 * @returns {string} Themed message
 */
export function getThemedMessage(act, seed) {
  const pool = MESSAGE_POOL[act] || MESSAGE_POOL.act1;
  const index = seed % pool.length;
  return pool[index];
}

/**
 * Reset all seen messages (for testing or special occasions)
 */
export function resetSeenMessages() {
  localStorage.removeItem(getStorageKey('seen-messages'));
  localStorage.removeItem(getStorageKey('message-date'));
}

/**
 * Get stats about message viewing
 * @returns {object} Stats object
 */
export function getMessageStats() {
  const seenData = localStorage.getItem(getStorageKey('seen-messages'));
  const seenMessages = seenData ? JSON.parse(seenData) : [];

  return {
    totalMessages: ALL_MESSAGES.length,
    seenCount: seenMessages.length,
    remainingCount: ALL_MESSAGES.length - seenMessages.length,
    percentSeen: Math.round((seenMessages.length / ALL_MESSAGES.length) * 100)
  };
}
