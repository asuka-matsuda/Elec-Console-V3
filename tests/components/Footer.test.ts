import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Footer from '../../app/components/common/organisms/Footer.vue'

describe('Footer.vue', () => {
  it('renders default copyright with current year', () => {
    const currentYear = new Date().getFullYear()
    const wrapper = mount(Footer, {
      global: {
        stubs: {
          Divider: true,
        },
      },
    })

    expect(wrapper.text()).toContain(`© ${currentYear} Mat.Operate & Gemini 3.8 Flash. / Elec-Console All rights reserved.`)
  })

  it('renders custom year when year prop is provided', () => {
    const wrapper = mount(Footer, {
      props: {
        year: 2028,
      },
      global: {
        stubs: {
          Divider: true,
        },
      },
    })

    expect(wrapper.text()).toContain('© 2028 Mat.Operate & Gemini 3.8 Flash. / Elec-Console All rights reserved.')
  })

  it('renders custom text when text prop is provided', () => {
    const wrapper = mount(Footer, {
      props: {
        text: 'Custom Copyright Notice',
      },
      global: {
        stubs: {
          Divider: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Custom Copyright Notice')
  })

  it('renders slot content when slot is provided', () => {
    const wrapper = mount(Footer, {
      slots: {
        default: 'Custom Slot Footer Content',
      },
      global: {
        stubs: {
          Divider: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Custom Slot Footer Content')
  })
})
