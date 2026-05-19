import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/Textarea",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("textarea", "Default");
export const Variants: Story = cossCatalogStory("textarea", "Variants");
export const States: Story = cossCatalogStory("textarea", "States");
export const Composition: Story = cossCatalogStory("textarea", "Composition");
export const Examples: Story = cossCatalogStory("textarea", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("textarea");
