import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Overlays/Sheet",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("sheet", "Default");
export const Variants: Story = cossCatalogStory("sheet", "Variants");
export const States: Story = cossCatalogStory("sheet", "States");
export const Composition: Story = cossCatalogStory("sheet", "Composition");
export const Examples: Story = cossCatalogStory("sheet", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("sheet");
