import type { Meta, StoryObj } from '@storybook/vue3'
import AppTable from './AppTable.vue'

const meta: Meta<typeof AppTable> = {
  title: 'Components/AppTable',
  component: AppTable,
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof AppTable>

export const Default: Story = {
  render: () => ({
    components: { AppTable },
    template: `
      <AppTable>
        <template #header>
          <tr>
            <th>種別</th>
            <th>サイズ (sq)</th>
            <th>許容電流 (A)</th>
            <th>外径 (mm)</th>
          </tr>
        </template>
        <template #body>
          <tr>
            <td>CVT</td>
            <td>22</td>
            <td>105</td>
            <td>24.0</td>
          </tr>
          <tr>
            <td>CVT</td>
            <td>38</td>
            <td>140</td>
            <td>28.5</td>
          </tr>
          <tr>
            <td>CVT</td>
            <td>60</td>
            <td>190</td>
            <td>34.0</td>
          </tr>
        </template>
      </AppTable>
    `
  })
}
