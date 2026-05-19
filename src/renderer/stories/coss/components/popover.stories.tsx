import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Overlays/Popover",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("popover", "Default");
export const Variants: Story = cossCatalogStory("popover", "Variants");
export const States: Story = cossCatalogStory("popover", "States");
export const Composition: Story = cossCatalogStory("popover", "Composition");
export const Examples: Story = cossCatalogStory("popover", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("popover");
