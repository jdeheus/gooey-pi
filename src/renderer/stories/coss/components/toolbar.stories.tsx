import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Actions/Toolbar",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("toolbar", "Default");
export const Variants: Story = cossCatalogStory("toolbar", "Variants");
export const States: Story = cossCatalogStory("toolbar", "States");
export const Composition: Story = cossCatalogStory("toolbar", "Composition");
export const Examples: Story = cossCatalogStory("toolbar", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("toolbar");
