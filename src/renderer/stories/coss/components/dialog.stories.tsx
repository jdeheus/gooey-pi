import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Overlays/Dialog",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("dialog", "Default");
export const Variants: Story = cossCatalogStory("dialog", "Variants");
export const States: Story = cossCatalogStory("dialog", "States");
export const Composition: Story = cossCatalogStory("dialog", "Composition");
export const Examples: Story = cossCatalogStory("dialog", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("dialog");
