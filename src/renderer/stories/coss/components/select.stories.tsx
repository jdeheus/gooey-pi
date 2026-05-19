import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/Select",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("select", "Default");
export const Variants: Story = cossCatalogStory("select", "Variants");
export const States: Story = cossCatalogStory("select", "States");
export const Composition: Story = cossCatalogStory("select", "Composition");
export const Examples: Story = cossCatalogStory("select", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("select");
