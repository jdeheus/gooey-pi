import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle
} from "@renderer/components/ui/frame";
import { Separator } from "@renderer/components/ui/separator";

const meta = {
  title: "Foundation/Coss UI",
  parameters: {
    layout: "centered"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const TokensAndPrimitives: Story = {
  render: () => (
    <div className="w-[min(640px,calc(100vw-2rem))]">
      <Frame>
        <FramePanel>
          <FrameHeader className="px-0 pt-0">
            <FrameTitle>Coss UI foundation</FrameTitle>
            <FrameDescription>
              Renderer-owned Coss primitives using Tailwind v4 tokens.
            </FrameDescription>
          </FrameHeader>
          <Separator />
          <div className="flex flex-col gap-4 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <Button>Primary action</Button>
              <Button variant="outline">Secondary action</Button>
              <Button variant="ghost">Quiet action</Button>
              <Button loading>Working</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Default</Badge>
              <Badge variant="success">Ready</Badge>
              <Badge variant="warning">Review</Badge>
              <Badge variant="error">Blocked</Badge>
              <Badge variant="outline">Renderer only</Badge>
            </div>
          </div>
        </FramePanel>
      </Frame>
    </div>
  )
};
