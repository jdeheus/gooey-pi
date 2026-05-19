import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/Fieldset",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("fieldset", "Default");
export const Variants: Story = cossCatalogStory("fieldset", "Variants");
export const States: Story = cossCatalogStory("fieldset", "States");
export const Composition: Story = cossCatalogStory("fieldset", "Composition");
export const Examples: Story = cossCatalogStory("fieldset", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("fieldset");
