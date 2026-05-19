import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Overlays/Drawer",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("drawer", "Default");
export const Variants: Story = cossCatalogStory("drawer", "Variants");
export const States: Story = cossCatalogStory("drawer", "States");
export const Composition: Story = cossCatalogStory("drawer", "Composition");
export const Examples: Story = cossCatalogStory("drawer", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("drawer");
