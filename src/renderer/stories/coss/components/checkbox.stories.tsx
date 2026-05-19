import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/Checkbox",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("checkbox", "Default");
export const Variants: Story = cossCatalogStory("checkbox", "Variants");
export const States: Story = cossCatalogStory("checkbox", "States");
export const Composition: Story = cossCatalogStory("checkbox", "Composition");
export const Examples: Story = cossCatalogStory("checkbox", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("checkbox");
