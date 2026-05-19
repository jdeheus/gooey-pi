import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Feedback/Spinner",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("spinner", "Default");
export const Variants: Story = cossCatalogStory("spinner", "Variants");
export const States: Story = cossCatalogStory("spinner", "States");
export const Composition: Story = cossCatalogStory("spinner", "Composition");
export const Examples: Story = cossCatalogStory("spinner", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("spinner");
