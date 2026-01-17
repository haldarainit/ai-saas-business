import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generate a secure random password
 * @param length - Length of password (default 12)
 * @returns Generated password
 */
export function generatePassword(length: number = 12): string {
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
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if passwords match
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Generate a unique verification token
 * @returns Random token
 */
export function generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a unique attendance token (shorter, URL-friendly)
 * @returns Random token
 */
export function generateAttendanceToken(): string {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate token expiry time
 * @param hours - Hours until expiry (default 24)
 * @returns Expiry date
 */
export function generateTokenExpiry(hours: number = 24): Date {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Check if token has expired
 * @param expiryDate - Token expiry date
 * @returns True if expired
 */
export function isTokenExpired(expiryDate: Date | string): boolean {
    return new Date() > new Date(expiryDate);
}
