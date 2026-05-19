import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/Calendar",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("calendar", "Default");
export const Variants: Story = cossCatalogStory("calendar", "Variants");
export const States: Story = cossCatalogStory("calendar", "States");
export const Composition: Story = cossCatalogStory("calendar", "Composition");
export const Examples: Story = cossCatalogStory("calendar", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("calendar");
