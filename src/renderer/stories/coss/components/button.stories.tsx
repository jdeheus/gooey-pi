import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Actions/Button",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("button", "Default");
export const Variants: Story = cossCatalogStory("button", "Variants");
export const States: Story = cossCatalogStory("button", "States");
export const Composition: Story = cossCatalogStory("button", "Composition");
export const Examples: Story = cossCatalogStory("button", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("button");
