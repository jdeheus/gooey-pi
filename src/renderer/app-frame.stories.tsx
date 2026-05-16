import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppFrame } from "@renderer/surfaces/app-frame";

const meta = {
  title: "Surfaces/App Frame",
  component: AppFrame,
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta<typeof AppFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    hasProjects: false,
    projectName: "No project selected",
    runtimeStatus: "ready",
    sessionStatus: "Idle"
  }
};

export const NoProjectsEmpty: Story = {
  args: {
    hasProjects: false,
    projectName: "No project selected",
    runtimeStatus: "ready",
    sessionStatus: "Idle"
  }
};

export const ProjectCreationEmptySurface: Story = {
  args: {
    hasProjects: false,
    projectName: "No project selected",
    runtimeStatus: "ready",
    sessionStatus: "Idle"
  }
};

export const WithProjectSelected: Story = {
  args: {
    hasProjects: true,
    projectName: "Gooey Pi",
    runtimeStatus: "running",
    sessionStatus: "Session active"
  }
};

export const WithProjectNavigation: Story = {
  args: {
    hasProjects: true,
    projectName: "Gooey Pi",
    runtimeStatus: "ready",
    sessionStatus: "Idle"
  }
};

export const SidebarNoResults: Story = {
  args: {
    hasProjects: true,
    initialNavQuery: "no matching navigation item",
    projectName: "No project selected",
    runtimeStatus: "ready",
    sessionStatus: "Idle"
  }
};
