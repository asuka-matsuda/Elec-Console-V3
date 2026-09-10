import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import ToolOrganismsMathBasisModal from '../../app/components/tool/OrganismsMathBasisModal.vue'

describe('ToolOrganismsMathBasisModal.vue', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.open = true
    })
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.open = false
    })
  })

  const commonStubs = {
    OrganismsModal: {
      props: ['modelValue', 'title', 'icon', 'variant', 'size'],
      template: `
        <div v-if="modelValue" class="modal-stub">
          <div class="modal-title">{{ title }}</div>
          <slot />
          <slot name="footer" />
        </div>
      `,
    },
    AtomsPanel: {
      template: '<div class="panel-stub"><slot /></div>',
    },
    MoleculesSectionHeader: {
      props: ['title', 'size'],
      template: '<div class="section-header-stub">{{ title }}</div>',
    },
    AtomsButton: {
      props: ['variant', 'size'],
      template: '<button class="button-stub"><slot /></button>',
    },
    ClientOnly: {
      template: '<div><slot /></div>',
    },
  }

  it('renders modal with steps and legends correctly', () => {
    const steps = [
      {
        title: '計算式1: 電圧降下の計算',
        tex: 'e = \\frac{17.8 \\cdot L \\cdot I}{1000 \\cdot A}',
        legend: [
          'e: 電圧降下 [V]',
          'L: 電線長 [m]',
          'I: 電流 [A]',
          'A: 導体断面積 [mm²]',
        ],
      },
    ]

    const wrapper = mount(ToolOrganismsMathBasisModal, {
      props: {
        modelValue: true,
        steps,
        title: '電圧降下の計算根拠',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('電圧降下の計算根拠')
    expect(wrapper.text()).toContain('計算式1: 電圧降下の計算')
    expect(wrapper.text()).toContain('【凡例】')
    expect(wrapper.text()).toContain('電圧降下 [V]')
    expect(wrapper.text()).toContain('電線長 [m]')
  })

  it('renders default slot content when provided', () => {
    const wrapper = mount(ToolOrganismsMathBasisModal, {
      props: {
        modelValue: true,
      },
      slots: {
        default: '<div class="extra-content">補足情報テキスト</div>',
      },
      global: {
        stubs: commonStubs,
      },
    })

    expect(wrapper.text()).toContain('補足情報テキスト')
  })

  it('handles closing via inject context if modelValue is not bound', async () => {
    const isOpen = ref(true)
    const closeMock = vi.fn(() => {
      isOpen.value = false
    })

    const wrapper = mount(ToolOrganismsMathBasisModal, {
      global: {
        provide: {
          toolBasisModal: {
            isOpen,
            open: vi.fn(),
            close: closeMock,
          },
        },
        stubs: commonStubs,
      },
    })

    const closeButton = wrapper.find('button')

    expect(closeButton.exists()).toBe(true)
    await closeButton.trigger('click')

    expect(closeMock).toHaveBeenCalledTimes(1)
  })
})
