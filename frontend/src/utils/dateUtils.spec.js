import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatDate, formatDateTime, formatRelativeTime } from './dateUtils'

describe('dateUtils', () => {
    describe('formatDate', () => {
        it('should format date as dd.mm.yyyy', () => {
            const date = new Date('2024-03-15')
            expect(formatDate(date)).toBe('15.03.2024')
        })

        it('should handle date string input', () => {
            expect(formatDate('2024-01-05')).toBe('05.01.2024')
        })

        it('should pad single digit day and month with zero', () => {
            expect(formatDate('2024-01-01')).toBe('01.01.2024')
            expect(formatDate('2024-09-05')).toBe('05.09.2024')
        })

        it('should return empty string for null input', () => {
            expect(formatDate(null)).toBe('')
        })

        it('should return empty string for undefined input', () => {
            expect(formatDate(undefined)).toBe('')
        })

        it('should return empty string for empty string input', () => {
            expect(formatDate('')).toBe('')
        })

        it('should handle ISO date strings', () => {
            // Use a date in the middle of the month to avoid timezone edge cases
            const result = formatDate('2024-06-15T12:00:00.000Z')
            expect(result).toMatch(/^\d{2}\.\d{2}\.2024$/)
        })
    })

    describe('formatDateTime', () => {
        it('should format date and time as dd.mm.yyyy HH:MM', () => {
            // Use a fixed date object with specific time
            const date = new Date(2024, 2, 15, 14, 30) // March 15, 2024 14:30
            expect(formatDateTime(date)).toBe('15.03.2024 14:30')
        })

        it('should pad single digit hours and minutes with zero', () => {
            const date = new Date(2024, 0, 5, 9, 5) // Jan 5, 2024 09:05
            expect(formatDateTime(date)).toBe('05.01.2024 09:05')
        })

        it('should return empty string for null input', () => {
            expect(formatDateTime(null)).toBe('')
        })

        it('should return empty string for undefined input', () => {
            expect(formatDateTime(undefined)).toBe('')
        })

        it('should handle midnight', () => {
            const date = new Date(2024, 5, 1, 0, 0)
            expect(formatDateTime(date)).toBe('01.06.2024 00:00')
        })
    })

    describe('formatRelativeTime', () => {
        beforeEach(() => {
            vi.useFakeTimers()
            vi.setSystemTime(new Date('2024-06-15T12:00:00'))
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('should return "kilku dni" for dates less than 7 days ago', () => {
            const date = new Date('2024-06-12')
            expect(formatRelativeTime(date)).toBe('kilku dni')
        })

        it('should return "tygodnia" for exactly 1 week ago', () => {
            const date = new Date('2024-06-08')
            expect(formatRelativeTime(date)).toBe('tygodnia')
        })

        it('should return "X tygodni" for multiple weeks', () => {
            const date = new Date('2024-06-01')
            expect(formatRelativeTime(date)).toBe('2 tygodni')
        })

        it('should return "miesiąca" for 1 month ago', () => {
            const date = new Date('2024-05-15')
            expect(formatRelativeTime(date)).toBe('miesiąca')
        })

        it('should return "X miesięcy" for multiple months', () => {
            const date = new Date('2024-02-15')
            expect(formatRelativeTime(date)).toBe('4 miesięcy')
        })

        it('should return "roku" for 1 year ago', () => {
            const date = new Date('2023-06-15')
            expect(formatRelativeTime(date)).toBe('roku')
        })

        it('should return "X lat" for multiple years', () => {
            const date = new Date('2021-06-15')
            expect(formatRelativeTime(date)).toBe('3 lat')
        })

        it('should return empty string for null input', () => {
            expect(formatRelativeTime(null)).toBe('')
        })

        it('should return empty string for undefined input', () => {
            expect(formatRelativeTime(undefined)).toBe('')
        })
    })
})
