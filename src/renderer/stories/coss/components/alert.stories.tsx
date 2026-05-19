import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Feedback/Alert",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("alert", "Default");
export const Variants: Story = cossCatalogStory("alert", "Variants");
export const States: Story = cossCatalogStory("alert", "States");
export const Composition: Story = cossCatalogStory("alert", "Composition");
export const Examples: Story = cossCatalogStory("alert", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("alert");
