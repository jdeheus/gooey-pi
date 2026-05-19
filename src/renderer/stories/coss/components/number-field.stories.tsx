import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/Number Field",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("number-field", "Default");
export const Variants: Story = cossCatalogStory("number-field", "Variants");
export const States: Story = cossCatalogStory("number-field", "States");
export const Composition: Story = cossCatalogStory("number-field", "Composition");
export const Examples: Story = cossCatalogStory("number-field", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("number-field");
