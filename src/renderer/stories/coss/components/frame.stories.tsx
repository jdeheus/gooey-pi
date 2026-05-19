import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Layout/Frame",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("frame", "Default");
export const Variants: Story = cossCatalogStory("frame", "Variants");
export const States: Story = cossCatalogStory("frame", "States");
export const Composition: Story = cossCatalogStory("frame", "Composition");
export const Examples: Story = cossCatalogStory("frame", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("frame");
