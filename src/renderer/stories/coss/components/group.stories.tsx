import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Layout/Group",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("group", "Default");
export const Variants: Story = cossCatalogStory("group", "Variants");
export const States: Story = cossCatalogStory("group", "States");
export const Composition: Story = cossCatalogStory("group", "Composition");
export const Examples: Story = cossCatalogStory("group", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("group");
