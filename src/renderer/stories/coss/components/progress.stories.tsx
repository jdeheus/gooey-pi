import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Feedback/Progress",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("progress", "Default");
export const Variants: Story = cossCatalogStory("progress", "Variants");
export const States: Story = cossCatalogStory("progress", "States");
export const Composition: Story = cossCatalogStory("progress", "Composition");
export const Examples: Story = cossCatalogStory("progress", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("progress");
