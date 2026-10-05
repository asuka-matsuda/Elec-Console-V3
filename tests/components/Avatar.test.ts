import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Avatar from '../../app/components/common/atoms/Avatar.vue'

describe('Avatar.vue', () => {
  it('renders default avatar with size="md" and fallback icon when no src or text', () => {
    const wrapper = mount(Avatar, {
      global: {
        stubs: {
          Icon: true,
        },
      },
    })

    expect(wrapper.classes()).toContain('avatar')
    expect(wrapper.classes()).toContain('avatar--md')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('renders image when src is provided', () => {
    const wrapper = mount(Avatar, {
      props: {
        src: 'https://example.com/avatar.png',
        alt: 'User Avatar',
      },
      global: {
        stubs: {
          Icon: true,
        },
      },
    })

    const img = wrapper.find('img')

    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/avatar.png')
    expect(img.attributes('alt')).toBe('User Avatar')
  })

  it('renders initials when text is provided without src', () => {
    const wrapperEnglish = mount(Avatar, {
      props: { text: 'Jane Doe' },
      global: { stubs: { Icon: true } },
    })

    expect(wrapperEnglish.text()).toBe('JD')

    const wrapperSingle = mount(Avatar, {
      props: { text: 'Asuka' },
      global: { stubs: { Icon: true } },
    })

    expect(wrapperSingle.text()).toBe('AS')

    const wrapperJapanese = mount(Avatar, {
      props: { text: '松田' },
      global: { stubs: { Icon: true } },
    })

    expect(wrapperJapanese.text()).toBe('松田')
  })

  it('falls back to text on image error', async () => {
    const wrapper = mount(Avatar, {
      props: {
        src: 'https://example.com/broken.png',
        text: 'John Doe',
      },
      global: {
        stubs: {
          Icon: true,
        },
      },
    })

    expect(wrapper.find('img').exists()).toBe(true)

    // Trigger error event on img
    await wrapper.find('img').trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('JD')
  })

  it('applies sizes correctly', () => {
    const smWrapper = mount(Avatar, {
      props: { size: 'sm' },
      global: { stubs: { Icon: true } },
    })

    expect(smWrapper.classes()).toContain('avatar--sm')

    const lgWrapper = mount(Avatar, {
      props: { size: 'lg' },
      global: { stubs: { Icon: true } },
    })

    expect(lgWrapper.classes()).toContain('avatar--lg')
  })
})
