import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Navigation/Tabs",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("tabs", "Default");
export const Variants: Story = cossCatalogStory("tabs", "Variants");
export const States: Story = cossCatalogStory("tabs", "States");
export const Composition: Story = cossCatalogStory("tabs", "Composition");
export const Examples: Story = cossCatalogStory("tabs", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("tabs");
