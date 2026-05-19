import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Overlays/Menu",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("menu", "Default");
export const Variants: Story = cossCatalogStory("menu", "Variants");
export const States: Story = cossCatalogStory("menu", "States");
export const Composition: Story = cossCatalogStory("menu", "Composition");
export const Examples: Story = cossCatalogStory("menu", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("menu");
