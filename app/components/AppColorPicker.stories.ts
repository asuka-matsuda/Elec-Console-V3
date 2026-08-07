import type { Meta, StoryObj } from "@storybook/vue3";
import AppColorPicker from "./AppColorPicker.vue";

const meta: Meta<typeof AppColorPicker> = {
  title: "Components/AppColorPicker",
  component: AppColorPicker,
  tags: ["autodocs"],
  argTypes: {
    modelValue: {
      control: "color",
      description: "選択されたカラーのHEXコード",
    },
    label: {
      control: "text",
      description: "カラーピッカーのラベル",
    },
    disabled: {
      control: "boolean",
      description: "非活性状態にするかどうか",
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppColorPicker>;

export const Default: Story = {
  args: {
    modelValue: "#3b82f6",
    label: "背景色",
  },
};

export const Disabled: Story = {
  args: {
    modelValue: "#ec4899",
    label: "グラデーション終了色",
    disabled: true,
  },
};

export const WithoutLabel: Story = {
  args: {
    modelValue: "#10b981",
  },
};
