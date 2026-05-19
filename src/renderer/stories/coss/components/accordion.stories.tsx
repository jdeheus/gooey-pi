import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Disclosure/Accordion",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("accordion", "Default");
export const Variants: Story = cossCatalogStory("accordion", "Variants");
export const States: Story = cossCatalogStory("accordion", "States");
export const Composition: Story = cossCatalogStory("accordion", "Composition");
export const Examples: Story = cossCatalogStory("accordion", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("accordion");
