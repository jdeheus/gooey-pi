import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Overlays/Tooltip",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("tooltip", "Default");
export const Variants: Story = cossCatalogStory("tooltip", "Variants");
export const States: Story = cossCatalogStory("tooltip", "States");
export const Composition: Story = cossCatalogStory("tooltip", "Composition");
export const Examples: Story = cossCatalogStory("tooltip", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("tooltip");
