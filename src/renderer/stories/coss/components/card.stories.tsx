import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Layout/Card",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("card", "Default");
export const Variants: Story = cossCatalogStory("card", "Variants");
export const States: Story = cossCatalogStory("card", "States");
export const Composition: Story = cossCatalogStory("card", "Composition");
export const Examples: Story = cossCatalogStory("card", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("card");
