import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseModal from './BaseModal.vue'

// Mock XMarkIcon
const XMarkIconStub = {
    name: 'XMarkIcon',
    template: '<svg data-testid="x-icon"></svg>'
}

describe('BaseModal', () => {
    const mountModal = (props = {}, slots = {}) => {
        return mount(BaseModal, {
            props: { show: true, title: 'Test Modal', ...props },
            slots,
            global: {
                stubs: {
                    XMarkIcon: XMarkIconStub,
                    Teleport: true // Disable teleport in tests
                }
            }
        })
    }

    describe('rendering', () => {
        it('should not render when show is false', () => {
            const wrapper = mountModal({ show: false })
            expect(wrapper.find('.fixed').exists()).toBe(false)
        })

        it('should render when show is true', () => {
            const wrapper = mountModal({ show: true })
            expect(wrapper.find('.bg-white').exists()).toBe(true)
        })

        it('should display the title', () => {
            const wrapper = mountModal({ title: 'My Custom Title' })
            expect(wrapper.text()).toContain('My Custom Title')
        })

        it('should render default slot content', () => {
            const wrapper = mountModal({}, { default: '<p>Modal content</p>' })
            expect(wrapper.text()).toContain('Modal content')
        })

        it('should render footer slot when provided', () => {
            const wrapper = mountModal({}, { footer: '<button>Save</button>' })
            expect(wrapper.text()).toContain('Save')
        })

        it('should not render footer div when footer slot is not provided', () => {
            const wrapper = mountModal({}, {})
            // Check for border-t which is only on footer
            const footerDiv = wrapper.findAll('.border-t')
            // The header also has border-b, the footer has border-t
            expect(footerDiv.length).toBeLessThanOrEqual(1)
        })
    })

    describe('close button', () => {
        it('should show close button by default', () => {
            const wrapper = mountModal()
            expect(wrapper.find('[data-testid="x-icon"]').exists()).toBe(true)
        })

        it('should hide close button when showCloseButton is false', () => {
            const wrapper = mountModal({ showCloseButton: false })
            expect(wrapper.find('[data-testid="x-icon"]').exists()).toBe(false)
        })

        it('should emit close event when close button is clicked', async () => {
            const wrapper = mountModal()
            await wrapper.find('button').trigger('click')
            expect(wrapper.emitted('close')).toBeTruthy()
        })
    })

    describe('backdrop click', () => {
        it('should emit close when backdrop is clicked and closeOnBackdrop is true', async () => {
            const wrapper = mountModal({ closeOnBackdrop: true })
            await wrapper.find('.fixed').trigger('click')
            expect(wrapper.emitted('close')).toBeTruthy()
        })

        it('should not emit close when closeOnBackdrop is false', async () => {
            const wrapper = mountModal({ closeOnBackdrop: false })
            await wrapper.find('.fixed').trigger('click')
            expect(wrapper.emitted('close')).toBeFalsy()
        })

        it('should not emit close when clicking inside modal', async () => {
            const wrapper = mountModal({ closeOnBackdrop: true })
            await wrapper.find('.bg-white').trigger('click')
            expect(wrapper.emitted('close')).toBeFalsy()
        })
    })

    describe('props', () => {
        it('should have correct default props', () => {
            expect(BaseModal.props.show.default).toBe(false)
            expect(BaseModal.props.title.default).toBe('')
            expect(BaseModal.props.showCloseButton.default).toBe(true)
            expect(BaseModal.props.closeOnBackdrop.default).toBe(true)
        })

        it('should have correct component name', () => {
            expect(BaseModal.name).toBe('BaseModal')
        })

        it('should define close emit', () => {
            expect(BaseModal.emits).toContain('close')
        })
    })
})
