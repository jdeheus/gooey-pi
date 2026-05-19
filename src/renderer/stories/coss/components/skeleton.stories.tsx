import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Feedback/Skeleton",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("skeleton", "Default");
export const Variants: Story = cossCatalogStory("skeleton", "Variants");
export const States: Story = cossCatalogStory("skeleton", "States");
export const Composition: Story = cossCatalogStory("skeleton", "Composition");
export const Examples: Story = cossCatalogStory("skeleton", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("skeleton");
