import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Foundation/Design Tokens",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const semanticColors = [
  { name: "Background", className: "bg-background text-foreground" },
  { name: "Foreground", className: "bg-foreground text-background" },
  { name: "Card", className: "bg-card text-card-foreground" },
  { name: "Primary", className: "bg-primary text-primary-foreground" },
  { name: "Secondary", className: "bg-secondary text-secondary-foreground" },
  { name: "Accent", className: "bg-accent text-accent-foreground" },
  { name: "Muted", className: "bg-muted text-muted-foreground" },
  { name: "Destructive", className: "bg-destructive text-white" },
  { name: "Info", className: "bg-info text-white" },
  { name: "Success", className: "bg-success text-white" },
  { name: "Warning", className: "bg-warning text-white" },
  { name: "Border", className: "bg-border text-foreground" }
];

const radii = [
  { name: "sm", className: "rounded-sm", value: "0.375rem" },
  { name: "md", className: "rounded-md", value: "0.5rem" },
  { name: "lg", className: "rounded-lg", value: "0.625rem" },
  { name: "xl", className: "rounded-xl", value: "0.875rem" },
  { name: "2xl", className: "rounded-2xl", value: "1.125rem" },
  { name: "3xl", className: "rounded-3xl", value: "1.375rem" },
  { name: "4xl", className: "rounded-4xl", value: "1.625rem" }
];

const borders = [
  { name: "Default", className: "border" },
  { name: "Input", className: "border border-input" },
  { name: "Dashed", className: "border border-dashed" },
  { name: "Focus ring", className: "border ring-2 ring-ring ring-offset-1" }
];

const shadows = [
  { name: "None", className: "shadow-none" },
  { name: "Extra small", className: "shadow-xs" },
  { name: "Small", className: "shadow-sm" },
  { name: "Medium", className: "shadow-md" }
];

const spacing = [
  { name: "0.5", value: "0.125rem / 2px", squareClass: "size-0.5", barClass: "w-0.5" },
  { name: "1", value: "0.25rem / 4px", squareClass: "size-1", barClass: "w-1" },
  { name: "1.5", value: "0.375rem / 6px", squareClass: "size-1.5", barClass: "w-1.5" },
  { name: "2", value: "0.5rem / 8px", squareClass: "size-2", barClass: "w-2" },
  { name: "2.5", value: "0.625rem / 10px", squareClass: "size-2.5", barClass: "w-2.5" },
  { name: "3", value: "0.75rem / 12px", squareClass: "size-3", barClass: "w-3" },
  { name: "3.5", value: "0.875rem / 14px", squareClass: "size-3.5", barClass: "w-3.5" },
  { name: "4", value: "1rem / 16px", squareClass: "size-4", barClass: "w-4" },
  { name: "5", value: "1.25rem / 20px", squareClass: "size-5", barClass: "w-5" },
  { name: "6", value: "1.5rem / 24px", squareClass: "size-6", barClass: "w-6" },
  { name: "7", value: "1.75rem / 28px", squareClass: "size-7", barClass: "w-7" },
  { name: "8", value: "2rem / 32px", squareClass: "size-8", barClass: "w-8" },
  { name: "9", value: "2.25rem / 36px", squareClass: "size-9", barClass: "w-9" },
  { name: "10", value: "2.5rem / 40px", squareClass: "size-10", barClass: "w-10" },
  { name: "11", value: "2.75rem / 44px", squareClass: "size-11", barClass: "w-11" },
  { name: "12", value: "3rem / 48px", squareClass: "size-12", barClass: "w-12" },
  { name: "14", value: "3.5rem / 56px", squareClass: "size-14", barClass: "w-14" },
  { name: "16", value: "4rem / 64px", squareClass: "size-16", barClass: "w-16" },
  { name: "20", value: "5rem / 80px", squareClass: "size-20", barClass: "w-20" },
  { name: "24", value: "6rem / 96px", squareClass: "size-24", barClass: "w-24" }
];

function Section({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading font-semibold text-lg">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export const TokenSpecimens: Story = {
  render: () => (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-2">
          <h1 className="font-heading font-semibold text-2xl">Design tokens</h1>
          <p className="max-w-2xl text-muted-foreground text-sm">
            Explicit Storybook specimens for the Coss renderer token layer.
          </p>
        </header>

        <Section title="Typography">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <div className="text-muted-foreground text-sm">Heading font</div>
              <div className="font-heading font-semibold text-2xl">Inter heading</div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="text-muted-foreground text-sm">Sans font</div>
              <div className="font-sans text-base">Inter body text</div>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="text-muted-foreground text-sm">Mono font</div>
              <div className="font-mono text-sm">Geist Mono 012345</div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex flex-col gap-3">
              <div className="text-2xl">text-2xl</div>
              <div className="text-lg">text-lg</div>
              <div className="text-base">text-base</div>
              <div className="text-sm">text-sm</div>
              <div className="text-xs">text-xs</div>
            </div>
          </div>
        </Section>

        <Section title="Semantic colors">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {semanticColors.map((color) => (
              <div className="overflow-hidden rounded-xl border bg-card" key={color.name}>
                <div className={`${color.className} h-20 p-3 text-sm font-medium`}>
                  {color.name}
                </div>
                <div className="p-3 text-muted-foreground text-xs">{color.className}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Border radiuses">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {radii.map((radius) => (
              <div className="flex items-center gap-4 rounded-xl border bg-card p-4" key={radius.name}>
                <div className={`${radius.className} size-24 shrink-0 bg-primary shadow-sm`} />
                <div>
                  <div className="font-medium text-sm">radius {radius.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {radius.className} / {radius.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Borders">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {borders.map((border) => (
              <div className={`${border.className} rounded-xl bg-card p-4`} key={border.name}>
                <div className="font-medium text-sm">{border.name}</div>
                <div className="text-muted-foreground text-xs">{border.className}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Shadows and depth">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {shadows.map((shadow) => (
              <div className={`${shadow.className} rounded-xl border bg-card p-4`} key={shadow.name}>
                <div className="font-medium text-sm">{shadow.name}</div>
                <div className="text-muted-foreground text-xs">{shadow.className}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Spacing and layout">
          <div className="rounded-xl border bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {spacing.map((space) => (
                <div className="flex flex-col gap-3 rounded-lg border bg-background p-3" key={space.name}>
                  <div className="flex h-24 items-end gap-3 rounded-md bg-muted p-3">
                    <div className="flex size-16 items-center justify-center rounded-md bg-background">
                      <div className={`${space.squareClass} rounded-sm bg-primary`} />
                    </div>
                    <div className="flex h-16 items-end">
                      <div className={`${space.barClass} h-3 rounded-sm bg-primary/64`} />
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-sm">size-{space.name}</div>
                    <div className="text-muted-foreground text-xs">{space.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-2 rounded-xl border bg-card p-4 sm:grid-cols-3">
            <div className="rounded-lg bg-muted p-2 text-sm">gap-2 / p-2</div>
            <div className="rounded-lg bg-muted p-4 text-sm">gap-2 / p-4</div>
            <div className="rounded-lg bg-muted p-6 text-sm">gap-2 / p-6</div>
          </div>
        </Section>
      </div>
    </main>
  )
};
