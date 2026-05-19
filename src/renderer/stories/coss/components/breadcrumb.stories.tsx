import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Navigation/Breadcrumb",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("breadcrumb", "Default");
export const Variants: Story = cossCatalogStory("breadcrumb", "Variants");
export const States: Story = cossCatalogStory("breadcrumb", "States");
export const Composition: Story = cossCatalogStory("breadcrumb", "Composition");
export const Examples: Story = cossCatalogStory("breadcrumb", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("breadcrumb");
