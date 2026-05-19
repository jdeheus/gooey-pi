import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/Input",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("input", "Default");
export const Variants: Story = cossCatalogStory("input", "Variants");
export const States: Story = cossCatalogStory("input", "States");
export const Composition: Story = cossCatalogStory("input", "Composition");
export const Examples: Story = cossCatalogStory("input", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("input");
