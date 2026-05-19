import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Compositions/Date Picker",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("date-picker", "Default");
export const Variants: Story = cossCatalogStory("date-picker", "Variants");
export const States: Story = cossCatalogStory("date-picker", "States");
export const Composition: Story = cossCatalogStory("date-picker", "Composition");
export const Examples: Story = cossCatalogStory("date-picker", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("date-picker");
