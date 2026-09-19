import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import InfoList from '../../../app/components/dashboard/InfoList.vue'
import type { InfoListItem } from '../../../app/types/components'

interface MockFeedItem extends InfoListItem {
  desc?: string
  version?: string
}

describe('InfoList.vue (app/components/dashboard/InfoList.vue)', () => {
  const mockItems: MockFeedItem[] = [
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

  it('renders items with date and title correctly', () => {
    const wrapper = mount(InfoList, {
      props: {
        items: mockItems,
      },
      global: {
        stubs: {
          Panel: {
            template: '<div class="panel-stub"><slot /></div>',
          },
          EmptyState: true,
        },
      },
    })

    expect(wrapper.text()).toContain('2026-09-01')
    expect(wrapper.text()).toContain('第1回 システムメンテナンスのお知らせ')
    expect(wrapper.text()).toContain('2026-09-05')
    expect(wrapper.text()).toContain('新機能リリース')
  })

  it('renders injected badge via slot correctly', () => {
    const wrapper = mount(InfoList, {
      props: {
        items: mockItems,
      },
      slots: {
        badge: '<template #badge="{ item }"><span class="badge-stub">{{ item.version }}</span></template>',
      },
      global: {
        stubs: {
          Panel: {
            template: '<div class="panel-stub"><slot /></div>',
          },
          EmptyState: true,
        },
      },
    })

    expect(wrapper.text()).toContain('v2.1.0')
    expect(wrapper.text()).toContain('v2.0.0')
    expect(wrapper.findAll('.badge-stub')).toHaveLength(2)
  })

  it('renders loading status (EmptyState) when pending is true', () => {
    const wrapper = mount(InfoList, {
      props: {
        pending: true,
        loadingText: 'データ読み込み中...',
      },
      global: {
        stubs: {
          Panel: {
            template: '<div class="panel-stub"><slot /></div>',
          },
          EmptyState: {
            props: ['title', 'icon', 'spin'],
            template: '<div class="empty-stub">{{ title }}</div>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('データ読み込み中...')
  })

  it('renders empty status (EmptyState) when no items are provided', () => {
    const wrapper = mount(InfoList, {
      props: {
        items: [],
        emptyText: '現在データはありません',
      },
      global: {
        stubs: {
          Panel: {
            template: '<div class="panel-stub"><slot /></div>',
          },
          EmptyState: {
            props: ['title', 'icon', 'spin'],
            template: '<div class="empty-stub">{{ title }}</div>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('現在データはありません')
  })

  it('emits select event with item payload when clicked', async () => {
    const wrapper = mount(InfoList, {
      props: {
        items: mockItems,
      },
      global: {
        stubs: {
          Panel: {
            template: '<div class="panel-stub"><slot /></div>',
          },
          EmptyState: true,
        },
      },
    })

    const items = wrapper.findAll('li')

    expect(items).toHaveLength(2)

    await items[0].trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual([mockItems[0]])

    await items[1].trigger('click')
    expect(wrapper.emitted('select')![1]).toEqual([mockItems[1]])
  })
})
