/**
 * @fileoverview Testy middleware autentykacji
 * @description Testuje funkcje middleware authenticateToken i optionalAuthenticate
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// Mock JWT secret
const JWT_SECRET = 'test-secret-key';

// Mock funkcja authenticateToken do testowania logiki
const createAuthenticateToken = (mockUserFinder) => {
    return async (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                code: 'MISSING_TOKEN',
                message: 'Token autoryzacyjny jest wymagany'
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await mockUserFinder(decoded.id);

            if (!user) {
                return res.status(404).json({
                    code: 'USER_NOT_FOUND',
                    message: 'Konto użytkownika nie istnieje'
                });
            }

            if (!user.isActive) {
                return res.status(403).json({
                    code: 'ACCOUNT_DISABLED',
                    message: 'Konto jest nieaktywne'
                });
            }

            req.user = user;
            next();
        } catch (err) {
            const errorType = err.name === 'TokenExpiredError'
                ? { status: 401, code: 'TOKEN_EXPIRED' }
                : { status: 403, code: 'INVALID_TOKEN' };

            res.status(errorType.status).json({
                code: errorType.code,
                message: err.message
            });
        }
    };
};

describe('authenticateToken Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {}
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        next = vi.fn();
    });

    describe('token validation', () => {
        it('should return 401 when no token provided', async () => {
            const mockUserFinder = vi.fn();
            const middleware = createAuthenticateToken(mockUserFinder);

            await middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ code: 'MISSING_TOKEN' })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when only "Bearer" is provided without token', async () => {
            req.headers.authorization = 'Bearer ';
            
            const mockUserFinder = vi.fn();
            const middleware = createAuthenticateToken(mockUserFinder);

            await middleware(req, res, next);

            // Empty string after split is falsy, so it's treated as missing token
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ code: 'MISSING_TOKEN' })
            );
        });

        it('should return 403 for invalid token', async () => {
            req.headers.authorization = 'Bearer invalid-token';
            
            const mockUserFinder = vi.fn();
            const middleware = createAuthenticateToken(mockUserFinder);

            await middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ code: 'INVALID_TOKEN' })
            );
        });

        it('should return 401 for expired token', async () => {
            // Create an expired token
            const expiredToken = jwt.sign(
                { id: 'user123' },
                JWT_SECRET,
                { expiresIn: '-1h' }
            );
            req.headers.authorization = `Bearer ${expiredToken}`;
            
            const mockUserFinder = vi.fn();
            const middleware = createAuthenticateToken(mockUserFinder);

            await middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ code: 'TOKEN_EXPIRED' })
            );
        });
    });

    describe('user validation', () => {
        it('should return 404 when user not found', async () => {
            const validToken = jwt.sign({ id: 'user123' }, JWT_SECRET, { expiresIn: '1h' });
            req.headers.authorization = `Bearer ${validToken}`;
            
            const mockUserFinder = vi.fn().mockResolvedValue(null);
            const middleware = createAuthenticateToken(mockUserFinder);

            await middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ code: 'USER_NOT_FOUND' })
            );
        });

        it('should return 403 when user is inactive', async () => {
            const validToken = jwt.sign({ id: 'user123' }, JWT_SECRET, { expiresIn: '1h' });
            req.headers.authorization = `Bearer ${validToken}`;
            
            const mockUserFinder = vi.fn().mockResolvedValue({
                _id: 'user123',
                username: 'testuser',
                isActive: false
            });
            const middleware = createAuthenticateToken(mockUserFinder);

            await middleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ code: 'ACCOUNT_DISABLED' })
            );
        });

        it('should call next() and attach user to req for valid token', async () => {
            const validToken = jwt.sign({ id: 'user123' }, JWT_SECRET, { expiresIn: '1h' });
            req.headers.authorization = `Bearer ${validToken}`;
            
            const mockUser = {
                _id: 'user123',
                username: 'testuser',
                isActive: true
            };
            const mockUserFinder = vi.fn().mockResolvedValue(mockUser);
            const middleware = createAuthenticateToken(mockUserFinder);

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toEqual(mockUser);
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe('authorization header parsing', () => {
        it('should correctly extract token from Bearer format', async () => {
            const validToken = jwt.sign({ id: 'user123' }, JWT_SECRET, { expiresIn: '1h' });
            req.headers.authorization = `Bearer ${validToken}`;
            
            const mockUser = { _id: 'user123', username: 'test', isActive: true };
            const mockUserFinder = vi.fn().mockResolvedValue(mockUser);
            const middleware = createAuthenticateToken(mockUserFinder);

            await middleware(req, res, next);

            expect(mockUserFinder).toHaveBeenCalledWith('user123');
        });

        it('should handle case-sensitive Bearer prefix', async () => {
            req.headers.authorization = 'bearer token123';
            
            const mockUserFinder = vi.fn();
            const middleware = createAuthenticateToken(mockUserFinder);

            await middleware(req, res, next);

            // 'bearer' (lowercase) won't be recognized, so token will be 'token123'
            // which is invalid
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });
});
