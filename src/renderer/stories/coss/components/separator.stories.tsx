import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Layout/Separator",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("separator", "Default");
export const Variants: Story = cossCatalogStory("separator", "Variants");
export const States: Story = cossCatalogStory("separator", "States");
export const Composition: Story = cossCatalogStory("separator", "Composition");
export const Examples: Story = cossCatalogStory("separator", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("separator");
