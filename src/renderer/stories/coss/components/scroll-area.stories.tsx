import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Layout/Scroll Area",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("scroll-area", "Default");
export const Variants: Story = cossCatalogStory("scroll-area", "Variants");
export const States: Story = cossCatalogStory("scroll-area", "States");
export const Composition: Story = cossCatalogStory("scroll-area", "Composition");
export const Examples: Story = cossCatalogStory("scroll-area", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("scroll-area");
