import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/Input Group",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("input-group", "Default");
export const Variants: Story = cossCatalogStory("input-group", "Variants");
export const States: Story = cossCatalogStory("input-group", "States");
export const Composition: Story = cossCatalogStory("input-group", "Composition");
export const Examples: Story = cossCatalogStory("input-group", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("input-group");
