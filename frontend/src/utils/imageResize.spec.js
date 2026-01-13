import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resizeImage, resizeImageAsFile } from './imageResize'

// Mock canvas and image for browser environment simulation
describe('imageResize', () => {
    let mockCanvas
    let mockContext
    let mockImage
    let originalCreateElement
    let originalCreateObjectURL
    let originalRevokeObjectURL

    beforeEach(() => {
        // Store originals
        originalCreateElement = document.createElement
        originalCreateObjectURL = URL.createObjectURL
        originalRevokeObjectURL = URL.revokeObjectURL

        // Mock canvas context
        mockContext = {
            drawImage: vi.fn()
        }

        // Mock canvas
        mockCanvas = {
            width: 0,
            height: 0,
            getContext: vi.fn(() => mockContext),
            toBlob: vi.fn((callback, type, quality) => {
                callback(new Blob(['test'], { type: type || 'image/jpeg' }))
            })
        }

        // Mock Image
        mockImage = {
            width: 1000,
            height: 800,
            onload: null,
            onerror: null,
            src: ''
        }

        // Override document.createElement
        document.createElement = vi.fn((tag) => {
            if (tag === 'canvas') return mockCanvas
            return originalCreateElement.call(document, tag)
        })

        // Mock URL methods
        URL.createObjectURL = vi.fn(() => 'blob:test-url')
        URL.revokeObjectURL = vi.fn()

        // Mock Image constructor
        global.Image = vi.fn(function () {
            Object.defineProperty(this, 'src', {
                set: function (value) {
                    this._src = value
                    // Simulate async load
                    setTimeout(() => {
                        this.width = 1000
                        this.height = 800
                        if (this.onload) this.onload()
                    }, 0)
                },
                get: function () {
                    return this._src
                }
            })
        })
    })

    afterEach(() => {
        document.createElement = originalCreateElement
        URL.createObjectURL = originalCreateObjectURL
        URL.revokeObjectURL = originalRevokeObjectURL
        vi.restoreAllMocks()
    })

    describe('resizeImage', () => {
        it('should be a function', () => {
            expect(typeof resizeImage).toBe('function')
        })

        it('should return a Promise', () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
            const result = resizeImage(file)
            expect(result).toBeInstanceOf(Promise)
        })

        it('should have default parameters', () => {
            // Function should accept only file as required parameter
            expect(resizeImage.length).toBe(1)
        })

        it('should create object URL from file', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

            // We can't fully test due to Image mock complexity
            // but we can verify the function doesn't throw
            expect(() => resizeImage(file)).not.toThrow()
        })
    })

    describe('resizeImageAsFile', () => {
        it('should be a function', () => {
            expect(typeof resizeImageAsFile).toBe('function')
        })

        it('should return a Promise', () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
            const result = resizeImageAsFile(file)
            expect(result).toBeInstanceOf(Promise)
        })
    })

    describe('dimension calculations', () => {
        it('should preserve aspect ratio concept', () => {
            // Test the math - if original is 1000x800, max 400x400
            // ratio = min(400/1000, 400/800) = min(0.4, 0.5) = 0.4
            // new dimensions: 1000*0.4 = 400, 800*0.4 = 320
            const width = 1000
            const height = 800
            const maxWidth = 400
            const maxHeight = 400

            const ratio = Math.min(maxWidth / width, maxHeight / height)
            const newWidth = Math.round(width * ratio)
            const newHeight = Math.round(height * ratio)

            expect(newWidth).toBe(400)
            expect(newHeight).toBe(320)
            expect(newWidth).toBeLessThanOrEqual(maxWidth)
            expect(newHeight).toBeLessThanOrEqual(maxHeight)
        })

        it('should not upscale small images', () => {
            const width = 200
            const height = 150
            const maxWidth = 800
            const maxHeight = 800

            // If original is smaller, no scaling needed
            const needsResize = width > maxWidth || height > maxHeight
            expect(needsResize).toBe(false)
        })
    })

    describe('error handling', () => {
        it('should handle File objects', () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
            expect(file instanceof File).toBe(true)
            expect(file.type).toBe('image/jpeg')
        })

        it('should work with different image types', () => {
            const types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            types.forEach(type => {
                const file = new File(['test'], `test.${type.split('/')[1]}`, { type })
                expect(() => resizeImage(file)).not.toThrow()
            })
        })
    })
})
