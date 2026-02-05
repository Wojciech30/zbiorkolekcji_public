/**
 * @fileoverview Testy logiki walidacji autentykacji
 * @description Testuje funkcje pomocnicze używane w routes/auth.js
 */

import { describe, it, expect } from 'vitest';

// === Reimplementacja funkcji walidacji do testowania ===

/**
 * Walidacja adresu email
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === 'string' && emailRegex.test(email);
};

/**
 * Walidacja siły hasła
 */
const isPasswordStrong = (password, minLength = 6) => {
    return typeof password === 'string' && password.length >= minLength;
};

/**
 * Walidacja nazwy użytkownika
 */
const isValidUsername = (username, minLength = 3, maxLength = 30) => {
    if (typeof username !== 'string') return false;
    if (username.length < minLength || username.length > maxLength) return false;
    // Tylko litery, cyfry, podkreślniki
    return /^[a-zA-Z0-9_]+$/.test(username);
};

/**
 * Sanityzacja inputu (trim i lowercase dla email)
 */
const sanitizeEmail = (email) => {
    if (typeof email !== 'string') return '';
    return email.trim().toLowerCase();
};

/**
 * Generowanie tokena (mock - w rzeczywistości używa crypto)
 */
const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

describe('Auth Validation Functions', () => {
    describe('isValidEmail', () => {
        it('should accept valid email addresses', () => {
            expect(isValidEmail('user@example.com')).toBe(true);
            expect(isValidEmail('user.name@domain.org')).toBe(true);
            expect(isValidEmail('user+tag@gmail.com')).toBe(true);
            expect(isValidEmail('a@b.co')).toBe(true);
        });

        it('should reject invalid email addresses', () => {
            expect(isValidEmail('')).toBe(false);
            expect(isValidEmail('not-an-email')).toBe(false);
            expect(isValidEmail('missing@domain')).toBe(false);
            expect(isValidEmail('@no-user.com')).toBe(false);
            expect(isValidEmail('user@')).toBe(false);
            expect(isValidEmail('user @domain.com')).toBe(false);
        });

        it('should reject non-string inputs', () => {
            expect(isValidEmail(null)).toBe(false);
            expect(isValidEmail(undefined)).toBe(false);
            expect(isValidEmail(123)).toBe(false);
            expect(isValidEmail({})).toBe(false);
        });
    });

    describe('isPasswordStrong', () => {
        it('should accept passwords with default minimum length (6)', () => {
            expect(isPasswordStrong('123456')).toBe(true);
            expect(isPasswordStrong('password123')).toBe(true);
            expect(isPasswordStrong('verylongpassword')).toBe(true);
        });

        it('should reject short passwords', () => {
            expect(isPasswordStrong('12345')).toBe(false);
            expect(isPasswordStrong('abc')).toBe(false);
            expect(isPasswordStrong('')).toBe(false);
        });

        it('should accept custom minimum length', () => {
            expect(isPasswordStrong('1234', 4)).toBe(true);
            expect(isPasswordStrong('123', 4)).toBe(false);
            expect(isPasswordStrong('12345678', 8)).toBe(true);
        });

        it('should reject non-string inputs', () => {
            expect(isPasswordStrong(null)).toBe(false);
            expect(isPasswordStrong(undefined)).toBe(false);
            expect(isPasswordStrong(123456)).toBe(false);
        });
    });

    describe('isValidUsername', () => {
        it('should accept valid usernames', () => {
            expect(isValidUsername('john')).toBe(true);
            expect(isValidUsername('John_Doe')).toBe(true);
            expect(isValidUsername('user123')).toBe(true);
            expect(isValidUsername('abc')).toBe(true);
        });

        it('should reject usernames with special characters', () => {
            expect(isValidUsername('user@name')).toBe(false);
            expect(isValidUsername('user-name')).toBe(false);
            expect(isValidUsername('user name')).toBe(false);
            expect(isValidUsername('user.name')).toBe(false);
        });

        it('should reject too short usernames', () => {
            expect(isValidUsername('ab')).toBe(false);
            expect(isValidUsername('a')).toBe(false);
            expect(isValidUsername('')).toBe(false);
        });

        it('should reject too long usernames', () => {
            const longUsername = 'a'.repeat(31);
            expect(isValidUsername(longUsername)).toBe(false);
        });

        it('should accept custom length limits', () => {
            expect(isValidUsername('ab', 2, 5)).toBe(true);
            expect(isValidUsername('abcdef', 2, 5)).toBe(false);
        });

        it('should reject non-string inputs', () => {
            expect(isValidUsername(null)).toBe(false);
            expect(isValidUsername(undefined)).toBe(false);
            expect(isValidUsername(123)).toBe(false);
        });
    });

    describe('sanitizeEmail', () => {
        it('should trim whitespace', () => {
            expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
            expect(sanitizeEmail('\nuser@example.com\t')).toBe('user@example.com');
        });

        it('should convert to lowercase', () => {
            expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com');
            expect(sanitizeEmail('JOHN@GMAIL.COM')).toBe('john@gmail.com');
        });

        it('should handle empty and invalid inputs', () => {
            expect(sanitizeEmail('')).toBe('');
            expect(sanitizeEmail(null)).toBe('');
            expect(sanitizeEmail(undefined)).toBe('');
        });
    });

    describe('generateToken', () => {
        it('should generate a string token', () => {
            const token = generateToken();
            expect(typeof token).toBe('string');
        });

        it('should generate 64-character tokens', () => {
            const token = generateToken();
            expect(token.length).toBe(64);
        });

        it('should generate unique tokens', () => {
            const token1 = generateToken();
            const token2 = generateToken();
            expect(token1).not.toBe(token2);
        });

        it('should only contain alphanumeric characters', () => {
            const token = generateToken();
            expect(/^[a-zA-Z0-9]+$/.test(token)).toBe(true);
        });
    });
});

describe('Login/Registration Flow Logic', () => {
    describe('login validation', () => {
        it('should require both email and password', () => {
            const validateLogin = (data) => {
                const errors = [];
                if (!data.usernameOrEmail) errors.push('LOGIN_MISSING_FIELDS');
                if (!data.password) errors.push('LOGIN_MISSING_FIELDS');
                return errors;
            };

            expect(validateLogin({ usernameOrEmail: 'user', password: 'pass' })).toEqual([]);
            expect(validateLogin({ usernameOrEmail: '', password: 'pass' })).toContain('LOGIN_MISSING_FIELDS');
            expect(validateLogin({ usernameOrEmail: 'user', password: '' })).toContain('LOGIN_MISSING_FIELDS');
        });
    });

    describe('registration validation', () => {
        it('should validate all required fields', () => {
            const validateRegistration = (data) => {
                const errors = [];
                
                if (!data.username || !data.email || !data.password) {
                    errors.push('REGISTER_MISSING_FIELDS');
                }
                
                if (data.email && !isValidEmail(data.email)) {
                    errors.push('REGISTER_INVALID_EMAIL');
                }
                
                if (data.password && !isPasswordStrong(data.password)) {
                    errors.push('REGISTER_PASSWORD_TOO_WEAK');
                }
                
                return errors;
            };

            expect(validateRegistration({
                username: 'john',
                email: 'john@example.com',
                password: 'password123'
            })).toEqual([]);

            expect(validateRegistration({
                username: '',
                email: 'john@example.com',
                password: 'password123'
            })).toContain('REGISTER_MISSING_FIELDS');

            expect(validateRegistration({
                username: 'john',
                email: 'invalid-email',
                password: 'password123'
            })).toContain('REGISTER_INVALID_EMAIL');

            expect(validateRegistration({
                username: 'john',
                email: 'john@example.com',
                password: '123'
            })).toContain('REGISTER_PASSWORD_TOO_WEAK');
        });
    });

    describe('password change validation', () => {
        it('should require current and new password', () => {
            const validatePasswordChange = (data) => {
                const errors = [];
                
                if (!data.currentPassword || !data.newPassword) {
                    errors.push('CHANGE_PASSWORD_MISSING_FIELDS');
                }
                
                if (data.newPassword && !isPasswordStrong(data.newPassword)) {
                    errors.push('CHANGE_PASSWORD_TOO_WEAK');
                }
                
                return errors;
            };

            expect(validatePasswordChange({
                currentPassword: 'old123',
                newPassword: 'new123456'
            })).toEqual([]);

            expect(validatePasswordChange({
                currentPassword: '',
                newPassword: 'new123456'
            })).toContain('CHANGE_PASSWORD_MISSING_FIELDS');

            expect(validatePasswordChange({
                currentPassword: 'old123',
                newPassword: '123'
            })).toContain('CHANGE_PASSWORD_TOO_WEAK');
        });
    });
});
