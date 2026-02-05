import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getImageUrl } from './imageUrl'

describe('imageUrl', () => {
    describe('getImageUrl', () => {
        it('should return empty string for null input', () => {
            expect(getImageUrl(null)).toBe('')
        })

        it('should return empty string for undefined input', () => {
            expect(getImageUrl(undefined)).toBe('')
        })

        it('should return empty string for empty string input', () => {
            expect(getImageUrl('')).toBe('')
        })

        it('should return http URLs unchanged', () => {
            const url = 'http://example.com/image.jpg'
            expect(getImageUrl(url)).toBe(url)
        })

        it('should return https URLs unchanged', () => {
            const url = 'https://example.com/image.jpg'
            expect(getImageUrl(url)).toBe(url)
        })

        it('should prepend backend URL to /uploads paths', () => {
            const result = getImageUrl('/uploads/image.jpg')
            expect(result).toContain('/uploads/image.jpg')
            expect(result).toMatch(/^https?:\/\//)
        })

        it('should prepend backend URL to other relative paths', () => {
            const result = getImageUrl('/images/avatar.png')
            expect(result).toContain('/images/avatar.png')
            expect(result).toMatch(/^https?:\/\//)
        })

        it('should return non-URL strings unchanged', () => {
            const url = 'some-random-string'
            expect(getImageUrl(url)).toBe(url)
        })

        it('should handle paths with special characters', () => {
            const result = getImageUrl('/uploads/image-name_123.jpg')
            expect(result).toContain('/uploads/image-name_123.jpg')
        })

        it('should handle deep nested paths', () => {
            const result = getImageUrl('/uploads/2024/01/15/image.jpg')
            expect(result).toContain('/uploads/2024/01/15/image.jpg')
        })
    })
})
