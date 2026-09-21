import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SiteListMaster from '../../../app/components/portal/organisms/SiteListMaster.vue'
import type { Site } from '../../../app/types/admin'

describe('SiteListMaster.vue', () => {
  const dummySites: Site[] = [
    { id: 'site-a', name: '新宿現場', status: 'in_progress', createdAt: '2026-09-01' },
    { id: 'site-b', name: '渋谷現場', status: 'planning', createdAt: '2026-09-02' },
    { id: 'site-c', name: '品川現場', status: 'completed', createdAt: '2026-09-03' },
  ]

  it('renders list of sites and allows selection', async () => {
    const wrapper = mount(SiteListMaster, {
      props: {
        sites: dummySites,
        selectedSiteId: 'site-a',
      },
    })

    expect(wrapper.text()).toContain('新宿現場')
    expect(wrapper.text()).toContain('渋谷現場')
    expect(wrapper.text()).toContain('品川現場')

    const items = wrapper.findAllComponents({ name: 'Panel' })

    expect(items.length).toBe(3)

    await items[1]?.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([dummySites[1]])
  })

  it('filters sites by search query', async () => {
    const wrapper = mount(SiteListMaster, {
      props: {
        sites: dummySites,
        selectedSiteId: null,
      },
    })

    const input = wrapper.find('input[type="text"]')

    await input.setValue('渋谷')

    const items = wrapper.findAllComponents({ name: 'Panel' })

    expect(items.length).toBe(1)
    expect(items[0]?.text()).toContain('渋谷現場')
  })

  it('filters sites by status', async () => {
    const wrapper = mount(SiteListMaster, {
      props: {
        sites: dummySites,
        selectedSiteId: null,
      },
    })

    const radioGroup = wrapper.findComponent({ name: 'RadioGroup' })

    await radioGroup.vm.$emit('update:modelValue', 'completed')

    const items = wrapper.findAllComponents({ name: 'Panel' })

    expect(items.length).toBe(1)
    expect(items[0]?.text()).toContain('品川現場')
  })

  it('shows EmptyState when no sites match filter', async () => {
    const wrapper = mount(SiteListMaster, {
      props: {
        sites: dummySites,
        selectedSiteId: null,
      },
    })

    const input = wrapper.find('input[type="text"]')

    await input.setValue('存在しない現場')

    expect(wrapper.findComponent({ name: 'EmptyState' }).exists()).toBe(true)
    expect(wrapper.findAllComponents({ name: 'Panel' }).length).toBe(0)
  })

  it('emits create event when new button is clicked', async () => {
    const wrapper = mount(SiteListMaster, {
      props: {
        sites: dummySites,
        selectedSiteId: null,
      },
    })

    const createBtn = wrapper.findComponent({ name: 'Button' })

    await createBtn.trigger('click')

    expect(wrapper.emitted('create')).toBeTruthy()
  })
})
