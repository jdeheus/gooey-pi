import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/Autocomplete",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("autocomplete", "Default");
export const Variants: Story = cossCatalogStory("autocomplete", "Variants");
export const States: Story = cossCatalogStory("autocomplete", "States");
export const Composition: Story = cossCatalogStory("autocomplete", "Composition");
export const Examples: Story = cossCatalogStory("autocomplete", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("autocomplete");
