const { body, validationResult } = require('express-validator');

/**
 * Password validation middleware
 */
const validatePassword = [
  body('password')
    .isLength({ min: 4 })
    .withMessage('Password must be at least 4 characters long')
    .custom((value) => {
      // Check for extremely weak patterns only
      const weakPatterns = [
        /(.)\1{5,}/, // 6 or more repeated characters
        /123456|234567|345678|456789|567890/, // Long sequential numbers
        /qwertyuiop|asdfghjkl|zxcvbnm/i, // Long keyboard patterns
        /password123|admin123|user123/i // Common weak passwords with numbers
      ];
      
      for (const pattern of weakPatterns) {
        if (pattern.test(value)) {
          throw new Error('Password contains weak patterns and is not secure');
        }
      }
      
      return true;
    })
];

/**
 * Optional password validation (for when password is provided but not required)
 */
const validateOptionalPassword = [
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long if provided')
    .custom((value) => {
      if (value) {
        const weakPatterns = [
          /(.)\1{3,}/, // 4 or more repeated characters
          /123|234|345|456|567|678|789/, // Sequential numbers
          /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, // Sequential letters
          /qwerty|asdfgh|zxcvbn/i, // Keyboard patterns
          /password|admin|user|guest/i // Common weak passwords
        ];
        
        for (const pattern of weakPatterns) {
          if (pattern.test(value)) {
            throw new Error('Password contains weak patterns and is not secure');
          }
        }
      }
      return true;
    })
];

/**
 * Generate a secure password with specified criteria
 * @param {Object} options - Password generation options
 * @returns {string} Generated password
 */
function generateSecurePassword(options = {}) {
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

  // Ensure the generated password meets minimum requirements
  const hasUppercase = includeUppercase && /[A-Z]/.test(password);
  const hasLowercase = includeLowercase && /[a-z]/.test(password);
  const hasNumber = includeNumbers && /\d/.test(password);
  
  if (includeUppercase && !hasUppercase) {
    const randomIndex = Math.floor(Math.random() * password.length);
    password = password.substring(0, randomIndex) + 
               'ABCDEFGHJKMNPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 23)) + 
               password.substring(randomIndex + 1);
  }
  
  if (includeLowercase && !hasLowercase) {
    const randomIndex = Math.floor(Math.random() * password.length);
    password = password.substring(0, randomIndex) + 
               'abcdefghjkmnpqrstuvwxyz'.charAt(Math.floor(Math.random() * 23)) + 
               password.substring(randomIndex + 1);
  }
  
  if (includeNumbers && !hasNumber) {
    const randomIndex = Math.floor(Math.random() * password.length);
    password = password.substring(0, randomIndex) + 
               '23456789'.charAt(Math.floor(Math.random() * 8)) + 
               password.substring(randomIndex + 1);
  }

  return password;
}

/**
 * Validate password strength server-side
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
function validatePasswordStrength(password) {
  const result = {
    score: 0,
    feedback: [],
    isValid: false,
    strength: 'weak'
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
    result.strength = 'strong';
  } else if (result.score >= 4) {
    result.feedback.push('Medium strength');
    result.isValid = true;
    result.strength = 'medium';
  } else {
    result.feedback.push('Weak password - consider using a longer password with mixed characters');
    result.strength = 'weak';
  }

  return result;
}

module.exports = {
  validatePassword,
  validateOptionalPassword,
  generateSecurePassword,
  validatePasswordStrength
};
