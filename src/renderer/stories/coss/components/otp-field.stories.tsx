import type { Meta, StoryObj } from "@storybook/react-vite";
import { cossCatalogStory, cossFigmaReferenceStory } from "./coss-catalog";

const meta: Meta = {
  title: "Coss Components/Forms/OTP Field",
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = cossCatalogStory("otp-field", "Default");
export const Variants: Story = cossCatalogStory("otp-field", "Variants");
export const States: Story = cossCatalogStory("otp-field", "States");
export const Composition: Story = cossCatalogStory("otp-field", "Composition");
export const Examples: Story = cossCatalogStory("otp-field", "Examples");
export const FigmaReference: Story = cossFigmaReferenceStory("otp-field");
