import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Overlays/Alert Dialog",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("alert-dialog", "Default");
export const Variants: Story = cossCatalogStory("alert-dialog", "Variants");
export const States: Story = cossCatalogStory("alert-dialog", "States");
export const Composition: Story = cossCatalogStory("alert-dialog", "Composition");
export const Examples: Story = cossCatalogStory("alert-dialog", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("alert-dialog");
