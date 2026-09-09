import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MoleculesInfoCard from '../../app/components/MoleculesInfoCard.vue'
import type { InfoCardItem } from '../../app/types/components'

describe('MoleculesInfoCard.vue', () => {
  const mockItems: InfoCardItem[] = [
    {
      id: 1,
      title: '第1回 システムメンテナンスのお知らせ',
      date: '2026-09-01',
      desc: '定期メンテナンスを実施します。',
      version: 'v2.1.0',
    },
    {
      id: 2,
      title: '新機能リリース',
      date: '2026-09-05',
      desc: '配管計算機能が追加されました。',
      version: 'v2.0.0',
    },
  ]

  it('renders items with date, title, and description correctly', () => {
    const wrapper = mount(MoleculesInfoCard, {
      props: {
        items: mockItems,
      },
      global: {
        stubs: {
          AtomsPanel: {
            template: '<div class="panel-stub"><slot /></div>',
          },
          AtomsIcon: true,
        },
      },
    })

    expect(wrapper.text()).toContain('2026-09-01')
    expect(wrapper.text()).toContain('第1回 システムメンテナンスのお知らせ')
    expect(wrapper.text()).toContain('定期メンテナンスを実施します。')
    expect(wrapper.text()).toContain('2026-09-05')
    expect(wrapper.text()).toContain('新機能リリース')
  })

  it('renders injected badge via slot correctly', () => {
    const wrapper = mount(MoleculesInfoCard, {
      props: {
        items: mockItems,
      },
      slots: {
        badge: '<template #badge="{ item }"><span class="badge-stub">{{ item.version }}</span></template>',
      },
      global: {
        stubs: {
          AtomsPanel: {
            template: '<div class="panel-stub"><slot /></div>',
          },
          AtomsIcon: true,
        },
      },
    })

    expect(wrapper.text()).toContain('v2.1.0')
    expect(wrapper.text()).toContain('v2.0.0')
    expect(wrapper.findAll('.badge-stub')).toHaveLength(2)
  })

  it('renders loading status when pending is true', () => {
    const wrapper = mount(MoleculesInfoCard, {
      props: {
        pending: true,
        loadingText: 'データ読み込み中...',
      },
      global: {
        stubs: {
          AtomsPanel: {
            template: '<div class="panel-stub"><slot /></div>',
          },
          AtomsIcon: true,
        },
      },
    })

    expect(wrapper.text()).toContain('データ読み込み中...')
  })

  it('renders empty status when no items are provided', () => {
    const wrapper = mount(MoleculesInfoCard, {
      props: {
        items: [],
        emptyText: '現在データはありません',
      },
      global: {
        stubs: {
          AtomsPanel: {
            template: '<div class="panel-stub"><slot /></div>',
          },
          AtomsIcon: true,
        },
      },
    })

    expect(wrapper.text()).toContain('現在データはありません')
  })

  it('respects maxCount prop by limiting item count', () => {
    const manyItems: InfoCardItem[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `Item ${i + 1}`,
      date: '2026-09-01',
      desc: `Description ${i + 1}`,
    }))

    const wrapper = mount(MoleculesInfoCard, {
      props: {
        items: manyItems,
        maxCount: 3,
      },
      global: {
        stubs: {
          AtomsPanel: {
            template: '<div class="panel-stub"><slot /></div>',
          },
          AtomsIcon: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Item 1')
    expect(wrapper.text()).toContain('Item 2')
    expect(wrapper.text()).toContain('Item 3')
    expect(wrapper.text()).not.toContain('Item 4')
  })
})
