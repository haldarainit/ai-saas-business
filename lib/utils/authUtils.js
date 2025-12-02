import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generate a secure random password
 * @param {number} length - Length of password (default 12)
 * @returns {string} Generated password
 */
export function generatePassword(length = 12) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';

    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

/**
 * Generate a unique verification token
 * @returns {string} Random token
 */
export function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a unique attendance token (shorter, URL-friendly)
 * @returns {string} Random token
 */
export function generateAttendanceToken() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate token expiry time
 * @param {number} hours - Hours until expiry (default 24)
 * @returns {Date} Expiry date
 */
export function generateTokenExpiry(hours = 24) {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Check if token has expired
 * @param {Date} expiryDate - Token expiry date
 * @returns {boolean} True if expired
 */
export function isTokenExpired(expiryDate) {
    return new Date() > new Date(expiryDate);
}
