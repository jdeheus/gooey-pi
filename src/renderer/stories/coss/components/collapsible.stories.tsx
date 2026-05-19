import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Disclosure/Collapsible",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("collapsible", "Default");
export const Variants: Story = cossCatalogStory("collapsible", "Variants");
export const States: Story = cossCatalogStory("collapsible", "States");
export const Composition: Story = cossCatalogStory("collapsible", "Composition");
export const Examples: Story = cossCatalogStory("collapsible", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("collapsible");
