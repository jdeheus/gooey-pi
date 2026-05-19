import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/Combobox",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("combobox", "Default");
export const Variants: Story = cossCatalogStory("combobox", "Variants");
export const States: Story = cossCatalogStory("combobox", "States");
export const Composition: Story = cossCatalogStory("combobox", "Composition");
export const Examples: Story = cossCatalogStory("combobox", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("combobox");
