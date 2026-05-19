import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/Field",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("field", "Default");
export const Variants: Story = cossCatalogStory("field", "Variants");
export const States: Story = cossCatalogStory("field", "States");
export const Composition: Story = cossCatalogStory("field", "Composition");
export const Examples: Story = cossCatalogStory("field", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("field");
