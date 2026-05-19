import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/Slider",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("slider", "Default");
export const Variants: Story = cossCatalogStory("slider", "Variants");
export const States: Story = cossCatalogStory("slider", "States");
export const Composition: Story = cossCatalogStory("slider", "Composition");
export const Examples: Story = cossCatalogStory("slider", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("slider");
