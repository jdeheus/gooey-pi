import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Feedback/Toast",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("toast", "Default");
export const Variants: Story = cossCatalogStory("toast", "Variants");
export const States: Story = cossCatalogStory("toast", "States");
export const Composition: Story = cossCatalogStory("toast", "Composition");
export const Examples: Story = cossCatalogStory("toast", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("toast");
