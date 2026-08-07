import type { Meta, StoryObj } from "@storybook/vue3";
import AppSelect from "./AppSelect.vue";
import { ref } from "vue";

const meta = {
  title: "Components/AppSelect",
  component: AppSelect,
  tags: ["autodocs"],
  argTypes: {
    modelValue: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    error: { control: "boolean" },
  },
} satisfies Meta<typeof AppSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

const MOCK_OPTIONS = [
  { label: "Option A", value: "a" },
  { label: "Option B", value: "b" },
  { label: "Option C", value: "c" },
];

export const Default: Story = {
  render: (args) => ({
    components: { AppSelect },
    setup() {
      const selectedValue = ref(args.options?.[0]?.value);
      return { args, selectedValue };
    },
    template: `
      <div style="width: 300px;">
        <AppSelect v-bind="args" v-model="selectedValue" />
        <div style="margin-top: 1rem; color: var(--color-text-muted);">
          Selected Value: {{ selectedValue }}
        </div>
      </div>
    `,
  }),
  args: {
    options: MOCK_OPTIONS,
  },
};

export const WithPlaceholder: Story = {
  render: (args) => ({
    components: { AppSelect },
    setup() {
      const selectedValue = ref("");
      return { args, selectedValue };
    },
    template: `
      <div style="width: 300px;">
        <AppSelect v-bind="args" v-model="selectedValue" />
        <div style="margin-top: 1rem; color: var(--color-text-muted);">
          Selected Value: {{ selectedValue || 'None' }}
        </div>
      </div>
    `,
  }),
  args: {
    options: MOCK_OPTIONS,
    placeholder: "項目を選択してください",
  },
};

export const Disabled: Story = {
  render: (args) => ({
    components: { AppSelect },
    setup() {
      const selectedValue = ref("");
      return { args, selectedValue };
    },
    template: `
      <div style="width: 300px;">
        <AppSelect v-bind="args" v-model="selectedValue" />
      </div>
    `,
  }),
  args: {
    options: MOCK_OPTIONS,
    placeholder: "操作不可",
    disabled: true,
  },
};

export const ErrorState: Story = {
  render: (args) => ({
    components: { AppSelect },
    setup() {
      const selectedValue = ref("");
      return { args, selectedValue };
    },
    template: `
      <div style="width: 300px;">
        <AppSelect v-bind="args" v-model="selectedValue" />
      </div>
    `,
  }),
  args: {
    options: MOCK_OPTIONS,
    placeholder: "エラーが発生しています",
    error: true,
  },
};
