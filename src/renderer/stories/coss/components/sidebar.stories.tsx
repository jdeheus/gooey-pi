import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Navigation/Sidebar",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("sidebar", "Default");
export const Variants: Story = cossCatalogStory("sidebar", "Variants");
export const States: Story = cossCatalogStory("sidebar", "States");
export const Composition: Story = cossCatalogStory("sidebar", "Composition");
export const Examples: Story = cossCatalogStory("sidebar", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("sidebar");
