import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/Radio Group",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("radio-group", "Default");
export const Variants: Story = cossCatalogStory("radio-group", "Variants");
export const States: Story = cossCatalogStory("radio-group", "States");
export const Composition: Story = cossCatalogStory("radio-group", "Composition");
export const Examples: Story = cossCatalogStory("radio-group", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("radio-group");
