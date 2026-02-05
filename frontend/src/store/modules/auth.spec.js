import { describe, it, expect, beforeEach, vi } from 'vitest'
import authModule from './auth'

// Mock AuthService
vi.mock('@/services/AuthService', () => ({
    default: {
        login: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn()
    }
}))

// Mock router
vi.mock('@/router', () => ({
    default: {
        push: vi.fn()
    }
}))

describe('auth Vuex module', () => {
    let state

    beforeEach(() => {
        // Clear storage
        localStorage.clear()
        sessionStorage.clear()

        // Fresh state
        state = {
            user: null,
            accessToken: null,
            refreshToken: null
        }
    })

    describe('mutations', () => {
        describe('SET_USER', () => {
            it('should set user in state', () => {
                const user = { id: '123', username: 'testuser', role: 'user' }
                authModule.mutations.SET_USER(state, { user, rememberMe: true })
                expect(state.user).toEqual(user)
            })

            it('should save user to localStorage when rememberMe is true', () => {
                const user = { id: '123', username: 'testuser' }
                authModule.mutations.SET_USER(state, { user, rememberMe: true })
                expect(localStorage.getItem('user')).toBe(JSON.stringify(user))
            })

            it('should save user to sessionStorage when rememberMe is false', () => {
                const user = { id: '123', username: 'testuser' }
                authModule.mutations.SET_USER(state, { user, rememberMe: false })
                expect(sessionStorage.getItem('user')).toBe(JSON.stringify(user))
            })

            it('should clear user from both storages when user is null', () => {
                localStorage.setItem('user', '{"id":"123"}')
                sessionStorage.setItem('user', '{"id":"456"}')
                authModule.mutations.SET_USER(state, { user: null, rememberMe: true })
                expect(localStorage.getItem('user')).toBeNull()
                expect(sessionStorage.getItem('user')).toBeNull()
            })
        })

        describe('UPDATE_USER', () => {
            it('should update existing user fields', () => {
                state.user = { id: '123', username: 'old', email: 'old@test.com' }
                authModule.mutations.UPDATE_USER(state, { username: 'new' })
                expect(state.user.username).toBe('new')
                expect(state.user.email).toBe('old@test.com')
            })

            it('should not throw when user is null', () => {
                state.user = null
                expect(() => {
                    authModule.mutations.UPDATE_USER(state, { username: 'new' })
                }).not.toThrow()
            })

            it('should update storage', () => {
                state.user = { id: '123', username: 'old' }
                localStorage.setItem('rememberMe', 'true')
                authModule.mutations.UPDATE_USER(state, { username: 'new' })
                expect(JSON.parse(localStorage.getItem('user')).username).toBe('new')
            })
        })

        describe('SET_TOKENS', () => {
            it('should set tokens in state', () => {
                authModule.mutations.SET_TOKENS(state, {
                    accessToken: 'access123',
                    refreshToken: 'refresh123',
                    rememberMe: true
                })
                expect(state.accessToken).toBe('access123')
                expect(state.refreshToken).toBe('refresh123')
            })

            it('should save tokens to localStorage when rememberMe is true', () => {
                authModule.mutations.SET_TOKENS(state, {
                    accessToken: 'access123',
                    refreshToken: 'refresh123',
                    rememberMe: true
                })
                expect(localStorage.getItem('accessToken')).toBe('access123')
                expect(localStorage.getItem('refreshToken')).toBe('refresh123')
            })

            it('should save tokens to sessionStorage when rememberMe is false', () => {
                authModule.mutations.SET_TOKENS(state, {
                    accessToken: 'access123',
                    refreshToken: 'refresh123',
                    rememberMe: false
                })
                expect(sessionStorage.getItem('accessToken')).toBe('access123')
                expect(sessionStorage.getItem('refreshToken')).toBe('refresh123')
            })

            it('should clear tokens from both storages when null', () => {
                localStorage.setItem('accessToken', 'old')
                sessionStorage.setItem('accessToken', 'old')
                authModule.mutations.SET_TOKENS(state, {
                    accessToken: null,
                    refreshToken: null,
                    rememberMe: true
                })
                expect(localStorage.getItem('accessToken')).toBeNull()
                expect(sessionStorage.getItem('accessToken')).toBeNull()
            })
        })

        describe('LOGOUT', () => {
            it('should clear state', () => {
                state.user = { id: '123' }
                state.accessToken = 'token'
                state.refreshToken = 'refresh'
                authModule.mutations.LOGOUT(state)
                expect(state.user).toBeNull()
                expect(state.accessToken).toBeNull()
                expect(state.refreshToken).toBeNull()
            })

            it('should clear all storage items', () => {
                localStorage.setItem('accessToken', 'token')
                localStorage.setItem('refreshToken', 'refresh')
                localStorage.setItem('user', '{}')
                localStorage.setItem('rememberMe', 'true')
                sessionStorage.setItem('accessToken', 'token')
                sessionStorage.setItem('refreshToken', 'refresh')
                sessionStorage.setItem('user', '{}')

                authModule.mutations.LOGOUT(state)

                expect(localStorage.getItem('accessToken')).toBeNull()
                expect(localStorage.getItem('refreshToken')).toBeNull()
                expect(localStorage.getItem('user')).toBeNull()
                expect(localStorage.getItem('rememberMe')).toBeNull()
                expect(sessionStorage.getItem('accessToken')).toBeNull()
                expect(sessionStorage.getItem('refreshToken')).toBeNull()
                expect(sessionStorage.getItem('user')).toBeNull()
            })
        })
    })

    describe('getters', () => {
        describe('isAuthenticated', () => {
            it('should return true when user exists', () => {
                state.user = { id: '123' }
                expect(authModule.getters.isAuthenticated(state)).toBe(true)
            })

            it('should return false when user is null', () => {
                state.user = null
                expect(authModule.getters.isAuthenticated(state)).toBe(false)
            })
        })

        describe('isAdmin', () => {
            it('should return true when user role is admin', () => {
                state.user = { id: '123', role: 'admin' }
                expect(authModule.getters.isAdmin(state)).toBe(true)
            })

            it('should return false when user role is not admin', () => {
                state.user = { id: '123', role: 'user' }
                expect(authModule.getters.isAdmin(state)).toBe(false)
            })

            it('should return false when user is null', () => {
                state.user = null
                expect(authModule.getters.isAdmin(state)).toBe(false)
            })
        })

        describe('isBlocked', () => {
            it('should return true when user isActive is false', () => {
                state.user = { id: '123', isActive: false }
                expect(authModule.getters.isBlocked(state)).toBe(true)
            })

            it('should return false when user isActive is true', () => {
                state.user = { id: '123', isActive: true }
                expect(authModule.getters.isBlocked(state)).toBe(false)
            })

            it('should return false when user is null', () => {
                state.user = null
                expect(authModule.getters.isBlocked(state)).toBe(false)
            })
        })
    })
})
