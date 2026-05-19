import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/Switch",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("switch", "Default");
export const Variants: Story = cossCatalogStory("switch", "Variants");
export const States: Story = cossCatalogStory("switch", "States");
export const Composition: Story = cossCatalogStory("switch", "Composition");
export const Examples: Story = cossCatalogStory("switch", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("switch");
