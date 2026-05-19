import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Actions/Toggle Group",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("toggle-group", "Default");
export const Variants: Story = cossCatalogStory("toggle-group", "Variants");
export const States: Story = cossCatalogStory("toggle-group", "States");
export const Composition: Story = cossCatalogStory("toggle-group", "Composition");
export const Examples: Story = cossCatalogStory("toggle-group", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("toggle-group");
