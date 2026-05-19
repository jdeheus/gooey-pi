import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Actions/Toggle",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("toggle", "Default");
export const Variants: Story = cossCatalogStory("toggle", "Variants");
export const States: Story = cossCatalogStory("toggle", "States");
export const Composition: Story = cossCatalogStory("toggle", "Composition");
export const Examples: Story = cossCatalogStory("toggle", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("toggle");
