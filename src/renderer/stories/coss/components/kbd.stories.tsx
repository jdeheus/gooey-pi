import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Data Display/Kbd",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("kbd", "Default");
export const Variants: Story = cossCatalogStory("kbd", "Variants");
export const States: Story = cossCatalogStory("kbd", "States");
export const Composition: Story = cossCatalogStory("kbd", "Composition");
export const Examples: Story = cossCatalogStory("kbd", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("kbd");
