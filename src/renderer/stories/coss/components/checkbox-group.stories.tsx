import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/Checkbox Group",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("checkbox-group", "Default");
export const Variants: Story = cossCatalogStory("checkbox-group", "Variants");
export const States: Story = cossCatalogStory("checkbox-group", "States");
export const Composition: Story = cossCatalogStory("checkbox-group", "Composition");
export const Examples: Story = cossCatalogStory("checkbox-group", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("checkbox-group");
