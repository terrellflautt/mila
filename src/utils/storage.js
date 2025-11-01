/**
 * Storage utilities for progress tracking and session management
 */

// Check if we're in test mode
const isTestMode = window.location.search.includes('test=') || window.location.pathname.includes('test.html');
const PREFIX = isTestMode ? 'mila-test:' : 'mila:';

/**
 * Get storage key with correct prefix (test or production)
 * Use this for any custom localStorage keys
 */
export function getStorageKey(key) {
  return `${PREFIX}${key}`;
}

const STORAGE_KEYS = {
  ACCESS: `${PREFIX}access`,
  VISITOR_ID: `${PREFIX}visitorId`,
  PROGRESS: `${PREFIX}progress`,
  COMPLETED_PUZZLES: `${PREFIX}completedPuzzles`,
  ANSWERED_QUESTIONS: `${PREFIX}answeredQuestions`,
  CURRENT_ACT: `${PREFIX}currentAct`,
  LAST_VISIT: `${PREFIX}lastVisit`,
  DEVICE_FINGERPRINT: `${PREFIX}fingerprint`
};

/**
 * Check if user has access (passed the gate)
 */
export function hasAccess() {
  const access = localStorage.getItem(STORAGE_KEYS.ACCESS);

  // TEMPORARILY DISABLED: Device fingerprint check for testing
  // Just check if they've authenticated at all
  return !!access;

  // Original code (re-enable after testing):
  // const fingerprint = localStorage.getItem(STORAGE_KEYS.DEVICE_FINGERPRINT);
  // if (!access || !fingerprint) return false;
  // const currentFingerprint = generateDeviceFingerprint();
  // return fingerprint === currentFingerprint;
}

/**
 * Grant access after successful gate answer
 */
export function grantAccess() {
  const fingerprint = generateDeviceFingerprint();

  localStorage.setItem(STORAGE_KEYS.ACCESS, 'granted');
  localStorage.setItem(STORAGE_KEYS.DEVICE_FINGERPRINT, fingerprint);

  // Set secure cookie as well
  document.cookie = `mila_access=granted; Secure; SameSite=Strict; max-age=${60*60*24*365}`;
}

/**
 * Generate device fingerprint
 * Combines multiple device characteristics for unique ID
 */
function generateDeviceFingerprint() {
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
  return hashFingerprint(fingerprint);
}

function hashFingerprint(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Progress tracking
 */
export function getProgress() {
  const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
  return data ? JSON.parse(data) : {
    currentAct: 'act1',
    completedPuzzles: [],
    answeredQuestions: [],
    unlockedRewards: [],
    visitCount: 0,
    lastVisit: null
  };
}

export function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
}

export function updateProgress(updates) {
  const current = getProgress();
  const updated = { ...current, ...updates };
  saveProgress(updated);
  return updated;
}

/**
 * Track visit
 */
export function recordVisit() {
  const progress = getProgress();
  progress.visitCount = (progress.visitCount || 0) + 1;
  progress.lastVisit = new Date().toISOString();
  saveProgress(progress);
  return progress;
}

/**
 * Puzzle completion
 */
export function isPuzzleCompleted(puzzleId) {
  const progress = getProgress();
  return progress.completedPuzzles.includes(puzzleId);
}

export function markPuzzleCompleted(puzzleId) {
  const progress = getProgress();
  if (!progress.completedPuzzles.includes(puzzleId)) {
    progress.completedPuzzles.push(puzzleId);
    saveProgress(progress);
  }
}

/**
 * Question tracking
 */
export function isQuestionAnswered(questionId) {
  const progress = getProgress();
  return progress.answeredQuestions.some(q => q.id === questionId);
}

export function saveQuestionAnswer(questionId, answer) {
  const progress = getProgress();
  progress.answeredQuestions.push({
    id: questionId,
    answer,
    timestamp: new Date().toISOString()
  });
  saveProgress(progress);
}

/**
 * Get questions available today based on progress
 */
export function getQuestionsForToday(allQuestions, progress) {
  const today = new Date().toISOString().slice(0, 10);
  const visitCount = progress.visitCount || 0;
  const answeredToday = progress.answeredQuestions.filter(q => {
    return q.timestamp?.startsWith(today);
  });

  // Max 3 questions per day
  if (answeredToday.length >= 3) return [];

  // Get questions appropriate for visit count
  const availableQuestions = allQuestions.filter(q => {
    return q.day <= visitCount && !isQuestionAnswered(q.id);
  });

  return availableQuestions.slice(0, 3 - answeredToday.length);
}

/**
 * Reward tracking
 */
export function unlockReward(rewardId) {
  const progress = getProgress();
  if (!progress.unlockedRewards.includes(rewardId)) {
    progress.unlockedRewards.push(rewardId);
    saveProgress(progress);
  }
}

export function isRewardUnlocked(rewardId) {
  const progress = getProgress();
  return progress.unlockedRewards.includes(rewardId);
}

/**
 * Act progression
 */
export function getCurrentAct() {
  const progress = getProgress();
  return progress.currentAct || 'act1';
}

export function advanceToAct(actName) {
  updateProgress({ currentAct: actName });
}

/**
 * Points system - each experience awards points
 */
const EXPERIENCE_POINTS = {
  'Echo Chamber': 100,
  'Eternal Garden': 100,
  'Reflections': 150,
  'Choreographer': 150,
  'Gallery of Us': 200,
  'The Dialogue': 150,
  'Constellation You': 200,
  'Mirror of Moments': 200,
  'Grace': 50, // Bonus experience
  'Stage Light': 200, // Acrostic poem experience
  // Final experience unlocks after all others
  'Monuments of Love': 500
};

export function getExperiencePoints(experienceName) {
  return EXPERIENCE_POINTS[experienceName] || 0;
}

export function getTotalPointsEarned() {
  const progress = getProgress();
  let total = 0;
  progress.completedPuzzles.forEach(puzzleName => {
    total += getExperiencePoints(puzzleName);
  });
  return total;
}

export function getTotalPointsAvailable() {
  return Object.values(EXPERIENCE_POINTS).reduce((sum, points) => sum + points, 0);
}

export function getPointsProgress() {
  const earned = getTotalPointsEarned();
  const total = getTotalPointsAvailable();
  const percentage = total > 0 ? (earned / total) * 100 : 0;

  return {
    earned,
    total,
    percentage: Math.round(percentage)
  };
}

/**
 * Check if final experience is unlocked (all others completed)
 */
export function isFinalExperienceUnlocked() {
  const progress = getProgress();
  const requiredExperiences = [
    'Echo Chamber',
    'Eternal Garden',
    'Reflections',
    'Choreographer',
    'Gallery of Us',
    'The Dialogue',
    'Constellation You',
    'Mirror of Moments',
    'Grace',
    'Monuments of Love'
    // Stage Light is bonus epilogue, not required
  ];

  return requiredExperiences.every(exp => progress.completedPuzzles.includes(exp));
}

/**
 * Clear all data (for testing or "forget me" feature)
 */
export function clearAllData() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  // Clear discovered experiences using correct namespaced key
  localStorage.removeItem(getStorageKey('world-discovered'));
  document.cookie = 'mila_access=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}
