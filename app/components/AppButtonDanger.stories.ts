import type { Meta, StoryObj } from "@storybook/vue3";
import AppButtonDanger from "./AppButtonDanger.vue";

const meta = {
  title: "Components/AppButtonDanger",
  component: AppButtonDanger,
  tags: ["autodocs"],
  argTypes: {
    default: { control: "text", description: "Slot content" },
  },
  args: {
    default: "Danger Button",
  },
} satisfies Meta<typeof AppButtonDanger>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { AppButtonDanger },
    setup() {
      return { args };
    },
    template:
      '<AppButtonDanger v-bind="args">{{ args.default }}</AppButtonDanger>',
  }),
};
