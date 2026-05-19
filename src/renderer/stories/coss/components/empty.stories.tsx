import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Data Display/Empty",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("empty", "Default");
export const Variants: Story = cossCatalogStory("empty", "Variants");
export const States: Story = cossCatalogStory("empty", "States");
export const Composition: Story = cossCatalogStory("empty", "Composition");
export const Examples: Story = cossCatalogStory("empty", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("empty");
