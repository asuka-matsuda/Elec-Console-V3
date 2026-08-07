import type { Meta, StoryObj } from "@storybook/vue3";
import AppButtonSecondary from "./AppButtonSecondary.vue";

const meta = {
  title: "Components/AppButtonSecondary",
  component: AppButtonSecondary,
  tags: ["autodocs"],
  argTypes: {
    default: { control: "text", description: "Slot content" },
  },
  args: {
    default: "Secondary Button",
  },
} satisfies Meta<typeof AppButtonSecondary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { AppButtonSecondary },
    setup() {
      return { args };
    },
    template:
      '<AppButtonSecondary v-bind="args">{{ args.default }}</AppButtonSecondary>',
  }),
};
