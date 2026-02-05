import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSpinner from './AppSpinner.vue'

describe('AppSpinner', () => {
    it('should render spinner element', () => {
        const wrapper = mount(AppSpinner)
        expect(wrapper.find('.spinner').exists()).toBe(true)
    })

    it('should have correct component name', () => {
        expect(AppSpinner.name).toBe('AppSpinner')
    })

    it('should render as a div', () => {
        const wrapper = mount(AppSpinner)
        expect(wrapper.element.tagName).toBe('DIV')
    })

    it('should have spinner class', () => {
        const wrapper = mount(AppSpinner)
        expect(wrapper.classes()).toContain('spinner')
    })
})
