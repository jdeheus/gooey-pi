import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Navigation/Pagination",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("pagination", "Default");
export const Variants: Story = cossCatalogStory("pagination", "Variants");
export const States: Story = cossCatalogStory("pagination", "States");
export const Composition: Story = cossCatalogStory("pagination", "Composition");
export const Examples: Story = cossCatalogStory("pagination", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("pagination");
