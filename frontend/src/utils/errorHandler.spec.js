import { describe, it, expect } from 'vitest'
import { normalizeApiError, getUserFriendlyErrorMessage } from './errorHandler'

describe('errorHandler', () => {
    describe('normalizeApiError', () => {
        it('should return unknown type for null error', () => {
            const result = normalizeApiError(null)
            expect(result.type).toBe('unknown')
            expect(result.status).toBeNull()
            expect(result.code).toBeNull()
            expect(result.message).toBe('Wystąpił nieoczekiwany błąd.')
        })

        it('should return unknown type for undefined error', () => {
            const result = normalizeApiError(undefined)
            expect(result.type).toBe('unknown')
        })

        it('should use custom fallback message', () => {
            const result = normalizeApiError(null, 'Custom error')
            expect(result.message).toBe('Custom error')
        })

        it('should handle network error', () => {
            const error = { message: 'Network Error' }
            const result = normalizeApiError(error)
            expect(result.type).toBe('network')
            expect(result.code).toBe('NETWORK_ERROR')
            expect(result.message).toContain('Brak połączenia')
        })

        it('should handle timeout error', () => {
            const error = { code: 'ECONNABORTED' }
            const result = normalizeApiError(error)
            expect(result.type).toBe('timeout')
            expect(result.code).toBe('TIMEOUT')
            expect(result.message).toContain('czas oczekiwania')
        })

        it('should handle no response error', () => {
            const error = { request: {}, response: undefined }
            const result = normalizeApiError(error)
            expect(result.type).toBe('network')
            expect(result.code).toBe('NO_RESPONSE')
        })

        it('should handle 400 validation error', () => {
            const error = {
                response: {
                    status: 400,
                    data: { message: 'Validation failed' }
                }
            }
            const result = normalizeApiError(error)
            expect(result.type).toBe('validation')
            expect(result.status).toBe(400)
            expect(result.message).toBe('Validation failed')
        })

        it('should handle 401 auth error', () => {
            const error = {
                response: {
                    status: 401,
                    data: {}
                }
            }
            const result = normalizeApiError(error)
            expect(result.type).toBe('auth')
            expect(result.status).toBe(401)
        })

        it('should handle 403 forbidden error', () => {
            const error = {
                response: {
                    status: 403,
                    data: {}
                }
            }
            const result = normalizeApiError(error)
            expect(result.type).toBe('auth')
            expect(result.status).toBe(403)
        })

        it('should handle 404 not found error', () => {
            const error = {
                response: {
                    status: 404,
                    data: {}
                }
            }
            const result = normalizeApiError(error)
            expect(result.type).toBe('not_found')
            expect(result.status).toBe(404)
        })

        it('should handle 500 server error', () => {
            const error = {
                response: {
                    status: 500,
                    data: {}
                }
            }
            const result = normalizeApiError(error)
            expect(result.type).toBe('server')
            expect(result.status).toBe(500)
        })

        it('should map known backend codes to Polish messages', () => {
            const error = {
                response: {
                    status: 400,
                    data: { code: 'INVALID_CREDENTIALS' }
                }
            }
            const result = normalizeApiError(error)
            expect(result.code).toBe('INVALID_CREDENTIALS')
            expect(result.message).toBe('Nieprawidłowy login lub hasło.')
        })

        it('should map LOGIN_MISSING_FIELDS code', () => {
            const error = {
                response: {
                    status: 400,
                    data: { code: 'LOGIN_MISSING_FIELDS' }
                }
            }
            const result = normalizeApiError(error)
            expect(result.message).toBe('Podaj login oraz hasło.')
        })

        it('should map EMAIL_NOT_VERIFIED code', () => {
            const error = {
                response: {
                    status: 400,
                    data: { code: 'EMAIL_NOT_VERIFIED' }
                }
            }
            const result = normalizeApiError(error)
            expect(result.message).toContain('e-mail nie został jeszcze potwierdzony')
        })

        it('should map REGISTER_USER_EXISTS code', () => {
            const error = {
                response: {
                    status: 400,
                    data: { code: 'REGISTER_USER_EXISTS' }
                }
            }
            const result = normalizeApiError(error)
            expect(result.message).toContain('już istnieje')
        })

        it('should handle array of messages', () => {
            const error = {
                response: {
                    status: 400,
                    data: { message: ['Error 1', 'Error 2'] }
                }
            }
            const result = normalizeApiError(error)
            expect(result.message).toBe('Error 1 Error 2')
        })

        it('should preserve raw error object', () => {
            const originalError = { response: { status: 400, data: {} } }
            const result = normalizeApiError(originalError)
            expect(result.raw).toBe(originalError)
        })
    })

    describe('getUserFriendlyErrorMessage', () => {
        it('should return message string from normalized error', () => {
            const error = {
                response: {
                    status: 400,
                    data: { code: 'INVALID_CREDENTIALS' }
                }
            }
            const result = getUserFriendlyErrorMessage(error)
            expect(typeof result).toBe('string')
            expect(result).toBe('Nieprawidłowy login lub hasło.')
        })

        it('should return fallback message for null error', () => {
            const result = getUserFriendlyErrorMessage(null)
            expect(result).toBe('Wystąpił nieoczekiwany błąd.')
        })

        it('should use custom fallback message', () => {
            const result = getUserFriendlyErrorMessage(null, 'My custom error')
            expect(result).toBe('My custom error')
        })

        it('should handle network error', () => {
            const error = { message: 'Network Error' }
            const result = getUserFriendlyErrorMessage(error)
            expect(result).toContain('Brak połączenia')
        })
    })
})
