import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/Label",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("label", "Default");
export const Variants: Story = cossCatalogStory("label", "Variants");
export const States: Story = cossCatalogStory("label", "States");
export const Composition: Story = cossCatalogStory("label", "Composition");
export const Examples: Story = cossCatalogStory("label", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("label");
