import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Data Display/Table",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("table", "Default");
export const Variants: Story = cossCatalogStory("table", "Variants");
export const States: Story = cossCatalogStory("table", "States");
export const Composition: Story = cossCatalogStory("table", "Composition");
export const Examples: Story = cossCatalogStory("table", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("table");
