import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Feedback/Meter",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("meter", "Default");
export const Variants: Story = cossCatalogStory("meter", "Variants");
export const States: Story = cossCatalogStory("meter", "States");
export const Composition: Story = cossCatalogStory("meter", "Composition");
export const Examples: Story = cossCatalogStory("meter", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("meter");
