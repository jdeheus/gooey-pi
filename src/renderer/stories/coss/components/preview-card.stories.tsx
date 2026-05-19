import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Overlays/Preview Card",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("preview-card", "Default");
export const Variants: Story = cossCatalogStory("preview-card", "Variants");
export const States: Story = cossCatalogStory("preview-card", "States");
export const Composition: Story = cossCatalogStory("preview-card", "Composition");
export const Examples: Story = cossCatalogStory("preview-card", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("preview-card");
