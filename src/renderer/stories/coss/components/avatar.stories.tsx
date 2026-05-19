import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Data Display/Avatar",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("avatar", "Default");
export const Variants: Story = cossCatalogStory("avatar", "Variants");
export const States: Story = cossCatalogStory("avatar", "States");
export const Composition: Story = cossCatalogStory("avatar", "Composition");
export const Examples: Story = cossCatalogStory("avatar", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("avatar");
