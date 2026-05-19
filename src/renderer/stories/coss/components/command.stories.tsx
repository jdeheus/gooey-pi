import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Navigation/Command",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("command", "Default");
export const Variants: Story = cossCatalogStory("command", "Variants");
export const States: Story = cossCatalogStory("command", "States");
export const Composition: Story = cossCatalogStory("command", "Composition");
export const Examples: Story = cossCatalogStory("command", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("command");
