import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CollectionCard from './CollectionCard.vue'

// Mock router-link
const RouterLinkStub = {
    name: 'RouterLink',
    props: ['to'],
    template: '<a :href="to"><slot /></a>'
}

// Mock Heroicons
const IconStub = {
    template: '<svg></svg>'
}

describe('CollectionCard', () => {
    const defaultProps = {
        data: {
            _id: '123',
            name: 'Test Collection',
            description: 'Test description',
            coverImage: '/test.jpg',
            itemsCount: 5,
            likesCount: 10,
            views: 100,
            owner: {
                _id: '456',
                username: 'testuser'
            }
        },
        type: 'collection'
    }

    const mountCard = (props = {}) => {
        return mount(CollectionCard, {
            props: { ...defaultProps, ...props },
            global: {
                stubs: {
                    RouterLink: RouterLinkStub,
                    UserIcon: IconStub,
                    DocumentTextIcon: IconStub,
                    EyeIcon: IconStub,
                    HeartIcon: IconStub,
                    ChatBubbleLeftIcon: IconStub
                }
            }
        })
    }

    describe('rendering', () => {
        it('renders collection name', () => {
            const wrapper = mountCard()
            expect(wrapper.text()).toContain('Test Collection')
        })

        it('renders description when provided', () => {
            const wrapper = mountCard()
            expect(wrapper.text()).toContain('Test description')
        })

        it('does not render description when not provided', () => {
            const wrapper = mountCard({
                data: { ...defaultProps.data, description: null }
            })
            expect(wrapper.find('.card-description').exists()).toBe(false)
        })
    })

    describe('links', () => {
        it('generates correct link for collection type', () => {
            const wrapper = mountCard({ type: 'collection' })
            expect(wrapper.find('a').attributes('href')).toBe('/collections/123')
        })

        it('generates correct link for item type', () => {
            const wrapper = mountCard({ type: 'item' })
            expect(wrapper.find('a').attributes('href')).toBe('/items/123')
        })

        it('generates correct link for category type', () => {
            const wrapper = mountCard({ type: 'category' })
            expect(wrapper.find('a').attributes('href')).toBe('/categories/123/collections')
        })
    })

    describe('stats display', () => {
        it('shows stats when showStats is true', () => {
            const wrapper = mountCard({ showStats: true })
            expect(wrapper.find('.card-stats').exists()).toBe(true)
        })

        it('hides stats when showStats is false', () => {
            const wrapper = mountCard({ showStats: false })
            expect(wrapper.find('.card-stats').exists()).toBe(false)
        })

        it('shows owner when showOwner is true', () => {
            const wrapper = mountCard({ showStats: true, showOwner: true })
            expect(wrapper.text()).toContain('testuser')
        })

        it('hides owner when showOwner is false', () => {
            const wrapper = mountCard({ showStats: true, showOwner: false })
            expect(wrapper.text()).not.toContain('testuser')
        })
    })

    describe('badge', () => {
        it('shows public badge for public collections', () => {
            const wrapper = mountCard({
                data: { ...defaultProps.data, privacy: 'public' }
            })
            expect(wrapper.text()).toContain('Publiczna')
        })

        it('shows private badge for private collections', () => {
            const wrapper = mountCard({
                data: { ...defaultProps.data, privacy: 'private' }
            })
            expect(wrapper.text()).toContain('Prywatna')
        })
    })
})
