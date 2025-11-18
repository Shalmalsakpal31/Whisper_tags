/**
 * Password Generation and Validation Utilities
 */

/**
 * Generate a secure random password
 * @param {Object} options - Password generation options
 * @param {number} options.length - Password length (default: 12)
 * @param {boolean} options.includeUppercase - Include uppercase letters (default: true)
 * @param {boolean} options.includeLowercase - Include lowercase letters (default: true)
 * @param {boolean} options.includeNumbers - Include numbers (default: true)
 * @param {boolean} options.includeSymbols - Include symbols (default: false)
 * @param {boolean} options.excludeSimilar - Exclude similar characters (default: true)
 * @returns {string} Generated password
 */
function generatePassword(options = {}) {
  const {
    length = 12,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = false,
    excludeSimilar = true
  } = options;

  let charset = '';
  
  if (includeUppercase) {
    charset += excludeSimilar ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  
  if (includeLowercase) {
    charset += excludeSimilar ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  }
  
  if (includeNumbers) {
    charset += excludeSimilar ? '23456789' : '0123456789';
  }
  
  if (includeSymbols) {
    charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  }

  if (charset.length === 0) {
    throw new Error('At least one character type must be included');
  }

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  return password;
}

/**
 * Generate multiple password options
 * @param {number} count - Number of passwords to generate (default: 3)
 * @param {Object} options - Password generation options
 * @returns {Array<string>} Array of generated passwords
 */
function generatePasswordOptions(count = 3, options = {}) {
  const passwords = [];
  for (let i = 0; i < count; i++) {
    passwords.push(generatePassword(options));
  }
  return passwords;
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with score and feedback
 */
function validatePasswordStrength(password) {
  const result = {
    score: 0,
    feedback: [],
    isValid: false
  };

  if (!password || password.length < 6) {
    result.feedback.push('Password must be at least 6 characters long');
    return result;
  }

  // Length scoring
  if (password.length >= 8) result.score += 1;
  if (password.length >= 12) result.score += 1;
  if (password.length >= 16) result.score += 1;

  // Character type scoring
  if (/[a-z]/.test(password)) result.score += 1;
  if (/[A-Z]/.test(password)) result.score += 1;
  if (/[0-9]/.test(password)) result.score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) result.score += 1;

  // Pattern detection
  if (/(.)\1{2,}/.test(password)) {
    result.score -= 1;
    result.feedback.push('Avoid repeating characters');
  }

  if (/123|abc|qwe/i.test(password)) {
    result.score -= 1;
    result.feedback.push('Avoid common sequences');
  }

  // Strength level
  if (result.score >= 6) {
    result.feedback.push('Strong password');
    result.isValid = true;
  } else if (result.score >= 4) {
    result.feedback.push('Medium strength');
    result.isValid = true;
  } else {
    result.feedback.push('Weak password - consider using a longer password with mixed characters');
  }

  return result;
}

/**
 * Generate a memorable password using word combinations
 * @param {number} wordCount - Number of words to use (default: 3)
 * @param {string} separator - Separator between words (default: '-')
 * @returns {string} Memorable password
 */
function generateMemorablePassword(wordCount = 3, separator = '-') {
  const words = [
    'apple', 'banana', 'cherry', 'dragon', 'eagle', 'forest', 'garden', 'happy',
    'island', 'jungle', 'knight', 'lizard', 'mountain', 'ocean', 'panda', 'queen',
    'river', 'sunset', 'tiger', 'umbrella', 'violet', 'winter', 'yellow', 'zebra',
    'bright', 'clever', 'dancing', 'elegant', 'flying', 'gentle', 'hearty', 'incredible',
    'joyful', 'kind', 'lively', 'magical', 'noble', 'optimistic', 'peaceful', 'quiet',
    'radiant', 'smooth', 'tranquil', 'unique', 'vibrant', 'wonderful', 'xenial', 'youthful'
  ];

  const selectedWords = [];
  for (let i = 0; i < wordCount; i++) {
    const randomWord = words[Math.floor(Math.random() * words.length)];
    selectedWords.push(randomWord);
  }

  return selectedWords.join(separator);
}

/**
 * Generate a PIN-style password
 * @param {number} length - PIN length (default: 6)
 * @returns {string} Numeric PIN
 */
function generatePIN(length = 6) {
  let pin = '';
  for (let i = 0; i < length; i++) {
    pin += Math.floor(Math.random() * 10).toString();
  }
  return pin;
}

module.exports = {
  generatePassword,
  generatePasswordOptions,
  validatePasswordStrength,
  generateMemorablePassword,
  generatePIN
};
