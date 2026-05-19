import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/Form",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("form", "Default");
export const Variants: Story = cossCatalogStory("form", "Variants");
export const States: Story = cossCatalogStory("form", "States");
export const Composition: Story = cossCatalogStory("form", "Composition");
export const Examples: Story = cossCatalogStory("form", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("form");
