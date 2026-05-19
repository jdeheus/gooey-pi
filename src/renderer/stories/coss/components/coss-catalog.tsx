import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BoldIcon,
  CalendarIcon,
  CheckIcon,
  CircleAlertIcon,
  FolderIcon,
  HomeIcon,
  InfoIcon,
  ItalicIcon,
  MailIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  UnderlineIcon,
  UserIcon,
} from "lucide-react";
import type * as React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@renderer/components/ui/accordion";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@renderer/components/ui/alert";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@renderer/components/ui/alert-dialog";
import {
  Autocomplete,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
} from "@renderer/components/ui/autocomplete";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@renderer/components/ui/avatar";
import { Badge } from "@renderer/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@renderer/components/ui/breadcrumb";
import { Button } from "@renderer/components/ui/button";
import { Calendar } from "@renderer/components/ui/calendar";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@renderer/components/ui/card";
import { Checkbox } from "@renderer/components/ui/checkbox";
import { CheckboxGroup } from "@renderer/components/ui/checkbox-group";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@renderer/components/ui/collapsible";
import {
  Combobox,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@renderer/components/ui/combobox";
import {
  Command,
  CommandCollection,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@renderer/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@renderer/components/ui/dialog";
import {
  Drawer,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@renderer/components/ui/drawer";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@renderer/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldItem,
  FieldLabel,
} from "@renderer/components/ui/field";
import {
  Fieldset,
  FieldsetLegend,
} from "@renderer/components/ui/fieldset";
import { Form } from "@renderer/components/ui/form";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@renderer/components/ui/frame";
import { Group, GroupSeparator, GroupText } from "@renderer/components/ui/group";
import { Input } from "@renderer/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@renderer/components/ui/input-group";
import { Kbd, KbdGroup } from "@renderer/components/ui/kbd";
import { Label } from "@renderer/components/ui/label";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuTrigger,
} from "@renderer/components/ui/menu";
import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@renderer/components/ui/meter";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@renderer/components/ui/number-field";
import {
  OTPField,
  OTPFieldInput,
  OTPFieldSeparator,
} from "@renderer/components/ui/otp-field";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@renderer/components/ui/pagination";
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@renderer/components/ui/popover";
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from "@renderer/components/ui/preview-card";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@renderer/components/ui/progress";
import { Radio, RadioGroup } from "@renderer/components/ui/radio-group";
import { ScrollArea } from "@renderer/components/ui/scroll-area";
import {
  Select,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select";
import { Separator } from "@renderer/components/ui/separator";
import {
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@renderer/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from "@renderer/components/ui/sidebar";
import { Skeleton } from "@renderer/components/ui/skeleton";
import { Slider, SliderValue } from "@renderer/components/ui/slider";
import { Spinner } from "@renderer/components/ui/spinner";
import { Switch } from "@renderer/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@renderer/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@renderer/components/ui/tabs";
import { Textarea } from "@renderer/components/ui/textarea";
import {
  ToastProvider,
  toastManager,
} from "@renderer/components/ui/toast";
import { Toggle } from "@renderer/components/ui/toggle";
import {
  ToggleGroup,
  ToggleGroupItem,
  ToggleGroupSeparator,
} from "@renderer/components/ui/toggle-group";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarInput,
  ToolbarSeparator,
} from "@renderer/components/ui/toolbar";
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip";

export type CossStoryKind =
  | "Default"
  | "Variants"
  | "States"
  | "Composition"
  | "Examples"
  | "FigmaReference";

export type CossComponentCategory =
  | "Actions"
  | "Compositions"
  | "Data Display"
  | "Disclosure"
  | "Feedback"
  | "Forms"
  | "Layout"
  | "Navigation"
  | "Overlays";

export type CossComponentCatalogEntry = {
  category: CossComponentCategory;
  displayName: string;
  figmaComponent: string;
  importPath: string;
  layout: "auto" | "fixed" | "overlay";
  localFiles: string[];
  props: string[];
  slug: string;
  title: string;
};

const componentEntries = [
  ["accordion", "Accordion", "Disclosure", ["open", "multiple", "trigger", "content"]],
  ["alert", "Alert", "Feedback", ["variant", "title", "description", "icon", "action"]],
  ["alert-dialog", "Alert Dialog", "Overlays", ["open", "title", "description", "action", "cancel"]],
  ["autocomplete", "Autocomplete", "Forms", ["size", "placeholder", "items", "disabled", "clearable"]],
  ["avatar", "Avatar", "Data Display", ["image", "fallback", "size", "status"]],
  ["badge", "Badge", "Data Display", ["variant", "size", "label", "icon"]],
  ["breadcrumb", "Breadcrumb", "Navigation", ["items", "separator", "currentPage"]],
  ["button", "Button", "Actions", ["variant", "size", "disabled", "loading", "label", "icon"]],
  ["calendar", "Calendar", "Forms", ["mode", "selected", "disabled", "captionLayout"]],
  ["card", "Card", "Layout", ["title", "description", "action", "content", "footer"]],
  ["checkbox", "Checkbox", "Forms", ["checked", "indeterminate", "disabled", "invalid"]],
  ["checkbox-group", "Checkbox Group", "Forms", ["value", "orientation", "disabled", "items"]],
  ["collapsible", "Collapsible", "Disclosure", ["open", "trigger", "content"]],
  ["combobox", "Combobox", "Forms", ["size", "value", "items", "multiple", "disabled"]],
  ["command", "Command", "Navigation", ["query", "items", "empty", "shortcut"]],
  ["date-picker", "Date Picker", "Compositions", ["date", "range", "triggerLabel", "open"]],
  ["dialog", "Dialog", "Overlays", ["open", "title", "description", "content", "footer"]],
  ["drawer", "Drawer", "Overlays", ["open", "side", "title", "description", "content"]],
  ["empty", "Empty", "Data Display", ["media", "title", "description", "action"]],
  ["field", "Field", "Forms", ["label", "description", "error", "required"]],
  ["fieldset", "Fieldset", "Forms", ["legend", "items", "disabled"]],
  ["form", "Form", "Forms", ["fields", "validation", "submit"]],
  ["frame", "Frame", "Layout", ["title", "description", "content", "footer"]],
  ["group", "Group", "Layout", ["orientation", "items", "separator"]],
  ["input", "Input", "Forms", ["size", "placeholder", "disabled", "invalid", "value"]],
  ["input-group", "Input Group", "Forms", ["size", "leading", "trailing", "control"]],
  ["kbd", "Kbd", "Data Display", ["keys", "size"]],
  ["label", "Label", "Forms", ["text", "htmlFor", "disabled"]],
  ["menu", "Menu", "Overlays", ["open", "items", "checked", "shortcut", "submenu"]],
  ["meter", "Meter", "Feedback", ["value", "min", "max", "label"]],
  ["number-field", "Number Field", "Forms", ["value", "min", "max", "step", "disabled"]],
  ["otp-field", "OTP Field", "Forms", ["value", "length", "disabled", "invalid"]],
  ["pagination", "Pagination", "Navigation", ["page", "pages", "previous", "next"]],
  ["popover", "Popover", "Overlays", ["open", "title", "description", "anchor"]],
  ["preview-card", "Preview Card", "Overlays", ["open", "trigger", "title", "description"]],
  ["progress", "Progress", "Feedback", ["value", "label"]],
  ["radio-group", "Radio Group", "Forms", ["value", "orientation", "disabled", "items"]],
  ["scroll-area", "Scroll Area", "Layout", ["height", "scrollbar", "fade"]],
  ["select", "Select", "Forms", ["size", "value", "items", "disabled", "placeholder"]],
  ["separator", "Separator", "Layout", ["orientation", "decorative"]],
  ["sheet", "Sheet", "Overlays", ["open", "side", "title", "content", "footer"]],
  ["sidebar", "Sidebar", "Navigation", ["open", "variant", "collapsible", "groups"]],
  ["skeleton", "Skeleton", "Feedback", ["shape", "size"]],
  ["slider", "Slider", "Forms", ["value", "min", "max", "orientation", "disabled"]],
  ["spinner", "Spinner", "Feedback", ["size"]],
  ["switch", "Switch", "Forms", ["checked", "disabled", "label"]],
  ["table", "Table", "Data Display", ["variant", "columns", "rows", "caption"]],
  ["tabs", "Tabs", "Navigation", ["value", "orientation", "variant", "items"]],
  ["textarea", "Textarea", "Forms", ["placeholder", "disabled", "invalid", "value"]],
  ["toast", "Toast", "Feedback", ["type", "title", "description", "action", "position"]],
  ["toggle", "Toggle", "Actions", ["pressed", "variant", "size", "disabled", "icon"]],
  ["toggle-group", "Toggle Group", "Actions", ["value", "type", "variant", "size", "items"]],
  ["toolbar", "Toolbar", "Actions", ["orientation", "items", "separator"]],
  ["tooltip", "Tooltip", "Overlays", ["open", "trigger", "content", "side"]],
] as const satisfies readonly [
  string,
  string,
  CossComponentCategory,
  readonly string[],
][];

function toTitle(entry: (typeof componentEntries)[number]): string {
  return `Coss Components/${entry[2]}/${entry[1]}`;
}

function layoutFor(category: CossComponentCategory): "auto" | "fixed" | "overlay" {
  if (category === "Overlays") {
    return "overlay";
  }

  if (category === "Compositions") {
    return "auto";
  }

  return "auto";
}

function localFilesFor(slug: string): string[] {
  if (slug === "date-picker") {
    return ["button.tsx", "calendar.tsx", "popover.tsx"];
  }

  return [`${slug}.tsx`];
}

export const cossComponentCatalog: CossComponentCatalogEntry[] =
  componentEntries.map((entry) => ({
    category: entry[2],
    displayName: entry[1],
    figmaComponent: entry[1],
    importPath:
      entry[0] === "date-picker"
        ? "@renderer/components/ui/calendar + @renderer/components/ui/popover + @renderer/components/ui/button"
        : `@renderer/components/ui/${entry[0]}`,
    layout: layoutFor(entry[2]),
    localFiles: localFilesFor(entry[0]),
    props: [...entry[3]],
    slug: entry[0],
    title: toTitle(entry),
  }));

const catalogBySlug = new Map(
  cossComponentCatalog.map((entry) => [entry.slug, entry]),
);

const selectableItems = ["Stable", "Beta", "Preview"];
const commandItems = ["Open Project", "Run Verification", "Create Branch"];

export function getCossCatalogEntry(slug: string): CossComponentCatalogEntry {
  const entry = catalogBySlug.get(slug);

  if (!entry) {
    throw new Error(`Unknown Coss catalog slug: ${slug}`);
  }

  return entry;
}

export function cossCatalogMeta(slug: string): Meta {
  const entry = getCossCatalogEntry(slug);

  return {
    title: entry.title,
    parameters: {
      designSystem: designSystemParameters(entry, false),
      layout: "centered",
    },
  };
}

export function cossCatalogStory(
  slug: string,
  story: Exclude<CossStoryKind, "FigmaReference">,
): StoryObj {
  const entry = getCossCatalogEntry(slug);

  return {
    parameters: {
      designSystem: {
        ...designSystemParameters(entry, false),
        story,
      },
    },
    render: () => <CossCatalogCanvas slug={slug} story={story} />,
  };
}

export function cossFigmaReferenceStory(slug: string): StoryObj {
  const entry = getCossCatalogEntry(slug);

  return {
    parameters: {
      designSystem: {
        ...designSystemParameters(entry, true),
        story: "FigmaReference",
      },
    },
    render: () => <CossCatalogCanvas slug={slug} story="FigmaReference" />,
  };
}

function designSystemParameters(
  entry: CossComponentCatalogEntry,
  figmaReference: boolean,
) {
  return {
    category: entry.category,
    figmaComponent: entry.figmaComponent,
    figmaReference,
    importPath: entry.importPath,
    layout: entry.layout,
    localFiles: entry.localFiles,
    props: entry.props,
    slug: entry.slug,
    source: "coss",
  };
}

function CossCatalogCanvas({
  slug,
  story,
}: {
  slug: string;
  story: CossStoryKind;
}): React.ReactElement {
  const entry = getCossCatalogEntry(slug);

  return (
    <main
      className="flex min-h-[20rem] w-[min(880px,calc(100vw-2rem))] flex-col gap-5 bg-background p-6 text-foreground"
      data-coss-category={entry.category}
      data-coss-slug={slug}
      data-story-kind={story}
    >
      <header className="flex flex-col gap-1">
        <div className="text-muted-foreground text-xs">{entry.category}</div>
        <h1 className="font-heading font-semibold text-xl">{entry.displayName}</h1>
      </header>
      {renderCatalogFixture(slug, story)}
    </main>
  );
}

function FixtureSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <section className={`flex flex-col gap-4 ${className ?? ""}`}>{children}</section>
  );
}

function renderCatalogFixture(
  slug: string,
  story: CossStoryKind,
): React.ReactElement {
  switch (slug) {
    case "accordion":
      return (
        <Accordion defaultValue={["usage"]}>
          <AccordionItem value="usage">
            <AccordionTrigger>Usage guidance</AccordionTrigger>
            <AccordionPanel>
              Use one accordion item for compact progressive disclosure.
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem value="details">
            <AccordionTrigger>Implementation detail</AccordionTrigger>
            <AccordionPanel>Panels preserve text, dividers, and indicator state.</AccordionPanel>
          </AccordionItem>
        </Accordion>
      );
    case "alert":
      return (
        <FixtureSurface>
          <Alert variant="info">
            <InfoIcon aria-hidden="true" />
            <AlertTitle>Runtime connected</AlertTitle>
            <AlertDescription>Renderer state is ready for design review.</AlertDescription>
            <AlertAction>
              <Button size="sm" variant="ghost">View</Button>
            </AlertAction>
          </Alert>
          <Alert variant="warning">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>Verification pending</AlertTitle>
            <AlertDescription>Some generated stories still need review.</AlertDescription>
          </Alert>
        </FixtureSurface>
      );
    case "alert-dialog":
      return (
        <AlertDialog open={story === "FigmaReference" || story === "States"}>
          <AlertDialogTrigger render={<Button variant="destructive-outline" />}>
            Delete component
          </AlertDialogTrigger>
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete component?</AlertDialogTitle>
              <AlertDialogDescription>
                This confirmation preserves title, description, and footer actions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="ghost" />}>Cancel</AlertDialogClose>
              <Button variant="destructive">Delete</Button>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialog>
      );
    case "autocomplete":
      return (
        <Autocomplete items={selectableItems}>
          <AutocompleteInput placeholder="Search status" showClear showTrigger />
          <AutocompletePopup>
            <AutocompleteList>
              {(item: string) => <AutocompleteItem key={item} value={item}>{item}</AutocompleteItem>}
            </AutocompleteList>
          </AutocompletePopup>
        </Autocomplete>
      );
    case "avatar":
      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage alt="Gooey Pi" src="/missing-avatar.png" />
            <AvatarFallback>GP</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback><UserIcon aria-hidden="true" /></AvatarFallback>
          </Avatar>
        </div>
      );
    case "badge":
      return (
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Ready</Badge>
          <Badge variant="warning">Review</Badge>
          <Badge variant="error">Blocked</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      );
    case "breadcrumb":
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="#"><HomeIcon aria-hidden="true" /> Home</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href="#">Design system</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Coss catalog</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
    case "button":
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading>Loading</Button>
          <Button size="icon" variant="outline" aria-label="Settings"><SettingsIcon aria-hidden="true" /></Button>
        </div>
      );
    case "calendar":
      return <Calendar mode="single" selected={new Date(2026, 4, 19)} />;
    case "card":
      return (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Catalog card</CardTitle>
            <CardDescription>Card anatomy with header, action, content, and footer.</CardDescription>
            <CardAction><Button size="sm" variant="outline">Open</Button></CardAction>
          </CardHeader>
          <CardPanel>Cards are the default structured content surface.</CardPanel>
          <CardFooter><Badge variant="outline">Figma ready</Badge></CardFooter>
        </Card>
      );
    case "checkbox":
      return (
        <FieldItem>
          <Checkbox defaultChecked />
          <FieldLabel>Include generated examples</FieldLabel>
        </FieldItem>
      );
    case "checkbox-group":
      return (
        <CheckboxGroup className="flex flex-col gap-3">
          <FieldItem><Checkbox defaultChecked value="tokens" /><FieldLabel>Tokens</FieldLabel></FieldItem>
          <FieldItem><Checkbox value="components" /><FieldLabel>Components</FieldLabel></FieldItem>
          <FieldItem><Checkbox disabled value="legacy" /><FieldLabel>Legacy disabled</FieldLabel></FieldItem>
        </CheckboxGroup>
      );
    case "collapsible":
      return (
        <Collapsible defaultOpen>
          <CollapsibleTrigger render={<Button variant="outline" />}>Show details</CollapsibleTrigger>
          <CollapsiblePanel>
            <div className="rounded-lg border bg-card p-3 text-sm">Collapsible content keeps a single panel relationship.</div>
          </CollapsiblePanel>
        </Collapsible>
      );
    case "combobox":
      return (
        <Combobox items={selectableItems}>
          <ComboboxInput placeholder="Choose status" />
          <ComboboxPopup>
            <ComboboxList>
              {(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
            </ComboboxList>
          </ComboboxPopup>
        </Combobox>
      );
    case "command":
      return (
        <Command items={commandItems}>
          <CommandInput placeholder="Search commands" />
          <CommandList>
            <CommandEmpty>No command found.</CommandEmpty>
            <CommandGroup>
              <CommandGroupLabel>Commands</CommandGroupLabel>
              <CommandCollection>
                {(item: string) => (
                  <CommandItem key={item} value={item}>
                    {item}
                    <CommandShortcut>Enter</CommandShortcut>
                  </CommandItem>
                )}
              </CommandCollection>
            </CommandGroup>
          </CommandList>
        </Command>
      );
    case "date-picker":
      return (
        <Popover open={story === "FigmaReference" || story === "States"}>
          <PopoverTrigger render={<Button className="w-64 justify-start" variant="outline" />}>
            <CalendarIcon aria-hidden="true" />
            May 19, 2026
          </PopoverTrigger>
          <PopoverPopup align="start" className="w-auto p-0">
            <Calendar mode="single" selected={new Date(2026, 4, 19)} />
          </PopoverPopup>
        </Popover>
      );
    case "dialog":
      return (
        <Dialog open={story === "FigmaReference" || story === "States"}>
          <DialogTrigger render={<Button variant="outline" />}>Open dialog</DialogTrigger>
          <DialogPopup>
            <DialogHeader>
              <DialogTitle>Dialog title</DialogTitle>
              <DialogDescription>Dialogs use structured title, description, panel, and footer regions.</DialogDescription>
            </DialogHeader>
            <DialogPanel>Dialog body content is scroll-ready.</DialogPanel>
            <DialogFooter>
              <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
              <Button>Save</Button>
            </DialogFooter>
          </DialogPopup>
        </Dialog>
      );
    case "drawer":
      return (
        <Drawer open={story === "FigmaReference" || story === "States"}>
          <DrawerTrigger render={<Button variant="outline" />}>Open drawer</DrawerTrigger>
          <DrawerPopup>
            <DrawerHeader>
              <DrawerTitle>Drawer title</DrawerTitle>
              <DrawerDescription>Drawers keep mobile-first panel anatomy.</DrawerDescription>
            </DrawerHeader>
            <DrawerPanel>Drawer panel content.</DrawerPanel>
            <DrawerFooter><Button>Continue</Button></DrawerFooter>
          </DrawerPopup>
        </Drawer>
      );
    case "empty":
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><FolderIcon aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>No project selected</EmptyTitle>
            <EmptyDescription>Select a project before starting a run.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent><Button><PlusIcon aria-hidden="true" /> Select project</Button></EmptyContent>
        </Empty>
      );
    case "field":
      return (
        <Field className="w-80">
          <FieldLabel>Project name</FieldLabel>
          <Input placeholder="Gooey Pi" />
          <FieldDescription>Visible helper copy for form review.</FieldDescription>
          {story === "States" && <FieldError>Project name is required.</FieldError>}
        </Field>
      );
    case "fieldset":
      return (
        <Fieldset className="flex flex-col gap-3 rounded-xl border p-4">
          <FieldsetLegend>Runtime options</FieldsetLegend>
          <FieldItem><Checkbox defaultChecked /><FieldLabel>Run verification</FieldLabel></FieldItem>
          <FieldItem><Checkbox /><FieldLabel>Prepare draft PR</FieldLabel></FieldItem>
        </Fieldset>
      );
    case "form":
      return (
        <Form className="flex w-80 flex-col gap-4">
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input placeholder="jon@example.com" type="email" />
          </Field>
          <Button type="submit">Submit</Button>
        </Form>
      );
    case "frame":
      return (
        <Frame className="max-w-md">
          <FrameHeader>
            <FrameTitle>Renderer frame</FrameTitle>
            <FrameDescription>Frame sections are stable design-system surfaces.</FrameDescription>
          </FrameHeader>
          <FramePanel>Frame panel content.</FramePanel>
          <FrameFooter>Footer metadata</FrameFooter>
        </Frame>
      );
    case "group":
      return (
        <Group>
          <Button variant="outline">Copy</Button>
          <GroupSeparator />
          <GroupText>Branch ready</GroupText>
          <GroupSeparator />
          <Button variant="outline">Open</Button>
        </Group>
      );
    case "input":
      return <Input className="w-80" placeholder="Enter project path" />;
    case "input-group":
      return (
        <InputGroup className="w-96">
          <InputGroupAddon><SearchIcon aria-hidden="true" /></InputGroupAddon>
          <InputGroupInput placeholder="Search components" />
          <InputGroupText>⌘K</InputGroupText>
        </InputGroup>
      );
    case "kbd":
      return (
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      );
    case "label":
      return (
        <div className="flex items-center gap-3">
          <Switch id="catalog-label" />
          <Label htmlFor="catalog-label">Enable sync</Label>
        </div>
      );
    case "menu":
      return (
        <Menu open={story === "FigmaReference" || story === "States"}>
          <MenuTrigger render={<Button variant="outline" />}>Open menu</MenuTrigger>
          <MenuPopup>
            <MenuGroup>
              <MenuGroupLabel>Actions</MenuGroupLabel>
              <MenuItem>Open<MenuShortcut>⌘O</MenuShortcut></MenuItem>
              <MenuCheckboxItem checked>Include tokens</MenuCheckboxItem>
              <MenuSeparator />
              <MenuRadioGroup value="figma">
                <MenuRadioItem value="figma">Figma</MenuRadioItem>
                <MenuRadioItem value="storybook">Storybook</MenuRadioItem>
              </MenuRadioGroup>
            </MenuGroup>
          </MenuPopup>
        </Menu>
      );
    case "meter":
      return (
        <Meter className="w-80" value={72}>
          <div className="flex items-center justify-between">
            <MeterLabel>Coverage</MeterLabel>
            <MeterValue />
          </div>
          <MeterTrack><MeterIndicator /></MeterTrack>
        </Meter>
      );
    case "number-field":
      return (
        <NumberField defaultValue={4} min={0} max={12}>
          <NumberFieldGroup className="w-44">
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldGroup>
        </NumberField>
      );
    case "otp-field":
      return (
        <OTPField defaultValue="123456" length={6}>
          <OTPFieldInput />
          <OTPFieldInput />
          <OTPFieldInput />
          <OTPFieldSeparator />
          <OTPFieldInput />
          <OTPFieldInput />
          <OTPFieldInput />
        </OTPField>
      );
    case "pagination":
      return (
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
            <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
            <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
            <PaginationItem><PaginationEllipsis /></PaginationItem>
            <PaginationItem><PaginationNext href="#" /></PaginationItem>
          </PaginationContent>
        </Pagination>
      );
    case "popover":
      return (
        <Popover open={story === "FigmaReference" || story === "States"}>
          <PopoverTrigger render={<Button variant="outline" />}>Open popover</PopoverTrigger>
          <PopoverPopup className="w-72 p-4">
            <PopoverTitle>Popover title</PopoverTitle>
            <PopoverDescription>Anchored non-modal content with title and description.</PopoverDescription>
          </PopoverPopup>
        </Popover>
      );
    case "preview-card":
      return (
        <PreviewCard open={story === "FigmaReference" || story === "States"}>
          <PreviewCardTrigger render={<Button variant="outline" />}>Preview project</PreviewCardTrigger>
          <PreviewCardPopup>
            <div className="flex flex-col gap-2">
              <div className="font-medium">Gooey Pi</div>
              <p className="text-muted-foreground text-sm">Project preview content.</p>
            </div>
          </PreviewCardPopup>
        </PreviewCard>
      );
    case "progress":
      return (
        <Progress className="w-80" value={64}>
          <div className="flex items-center justify-between">
            <ProgressLabel>Sync progress</ProgressLabel>
            <ProgressValue />
          </div>
          <ProgressTrack><ProgressIndicator /></ProgressTrack>
        </Progress>
      );
    case "radio-group":
      return (
        <RadioGroup defaultValue="auto">
          <FieldItem><Radio value="auto" /><FieldLabel>Auto layout</FieldLabel></FieldItem>
          <FieldItem><Radio value="fixed" /><FieldLabel>Fixed layout</FieldLabel></FieldItem>
        </RadioGroup>
      );
    case "scroll-area":
      return (
        <ScrollArea className="h-44 w-80 rounded-lg border" scrollFade scrollbarGutter>
          <div className="flex flex-col gap-2 p-3">
            {Array.from({ length: 10 }, (_, index) => (
              <div className="rounded-md bg-muted px-3 py-2 text-sm" key={index}>Scrollable row {index + 1}</div>
            ))}
          </div>
        </ScrollArea>
      );
    case "select":
      return (
        <Select defaultValue="stable">
          <SelectTrigger className="w-64"><SelectValue placeholder="Select status" /></SelectTrigger>
          <SelectPopup>
            <SelectGroup>
              <SelectGroupLabel>Status</SelectGroupLabel>
              <SelectItem value="stable">Stable</SelectItem>
              <SelectItem value="beta">Beta</SelectItem>
              <SelectItem value="preview">Preview</SelectItem>
            </SelectGroup>
          </SelectPopup>
        </Select>
      );
    case "separator":
      return (
        <div className="flex w-80 flex-col gap-3">
          <div>Section one</div>
          <Separator />
          <div>Section two</div>
        </div>
      );
    case "sheet":
      return (
        <Sheet open={story === "FigmaReference" || story === "States"}>
          <SheetTrigger render={<Button variant="outline" />}>Open sheet</SheetTrigger>
          <SheetPopup>
            <SheetHeader>
              <SheetTitle>Sheet title</SheetTitle>
              <SheetDescription>Side-panel overlay content.</SheetDescription>
            </SheetHeader>
            <SheetPanel>Sheet panel body.</SheetPanel>
            <SheetFooter><Button>Save</Button></SheetFooter>
          </SheetPopup>
        </Sheet>
      );
    case "sidebar":
      return (
        <SidebarProvider className="min-h-80 rounded-xl border" defaultOpen>
          <Sidebar collapsible="none">
            <SidebarHeader><Button variant="ghost">Gooey Pi</Button></SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Projects</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem><SidebarMenuButton isActive>Design System</SidebarMenuButton></SidebarMenuItem>
                    <SidebarMenuItem><SidebarMenuButton>Runtime</SidebarMenuButton></SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarSeparator />
            <SidebarFooter>Ready</SidebarFooter>
          </Sidebar>
          <SidebarInset className="p-4">Inset content</SidebarInset>
        </SidebarProvider>
      );
    case "skeleton":
      return (
        <div className="flex w-80 flex-col gap-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      );
    case "slider":
      return (
        <Slider className="w-80" defaultValue={40}>
          <SliderValue />
        </Slider>
      );
    case "spinner":
      return <Spinner className="size-6" />;
    case "switch":
      return (
        <FieldItem>
          <Switch defaultChecked />
          <FieldLabel>Enable automatic sync</FieldLabel>
        </FieldItem>
      );
    case "table":
      return (
        <Table className="w-[32rem]" variant={story === "Variants" ? "card" : "default"}>
          <TableCaption>Component sync jobs</TableCaption>
          <TableHeader>
            <TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Owner</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            <TableRow><TableCell>Button</TableCell><TableCell>Ready</TableCell><TableCell>Design System</TableCell></TableRow>
            <TableRow><TableCell>Dialog</TableCell><TableCell>Review</TableCell><TableCell>Renderer</TableCell></TableRow>
          </TableBody>
        </Table>
      );
    case "tabs":
      return (
        <Tabs defaultValue="props">
          <TabsList variant={story === "Variants" ? "underline" : "default"}>
            <TabsTab value="props">Props</TabsTab>
            <TabsTab value="layout">Layout</TabsTab>
            <TabsTab value="tokens">Tokens</TabsTab>
          </TabsList>
          <TabsPanel value="props">Component property mapping.</TabsPanel>
          <TabsPanel value="layout">Auto-layout notes.</TabsPanel>
          <TabsPanel value="tokens">Variable bindings.</TabsPanel>
        </Tabs>
      );
    case "textarea":
      return <Textarea className="w-96" defaultValue="Generated design-system notes." />;
    case "toast":
      return (
        <ToastProvider>
          <Button
            onClick={() => {
              toastManager.add({
                description: "Toast anatomy is generated from the provider.",
                title: "Component synced",
                type: "success",
              });
            }}
          >
            Show toast
          </Button>
        </ToastProvider>
      );
    case "toggle":
      return (
        <div className="flex gap-2">
          <Toggle defaultPressed><BoldIcon aria-hidden="true" /> Bold</Toggle>
          <Toggle variant="outline"><ItalicIcon aria-hidden="true" /> Italic</Toggle>
        </div>
      );
    case "toggle-group":
      return (
        <ToggleGroup defaultValue={["bold"]} multiple>
          <ToggleGroupItem aria-label="Bold" value="bold"><BoldIcon aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupSeparator />
          <ToggleGroupItem aria-label="Italic" value="italic"><ItalicIcon aria-hidden="true" /></ToggleGroupItem>
          <ToggleGroupItem aria-label="Underline" value="underline"><UnderlineIcon aria-hidden="true" /></ToggleGroupItem>
        </ToggleGroup>
      );
    case "toolbar":
      return (
        <Toolbar>
          <ToolbarGroup>
            <ToolbarButton><BoldIcon aria-hidden="true" /></ToolbarButton>
            <ToolbarButton><ItalicIcon aria-hidden="true" /></ToolbarButton>
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarInput placeholder="Search" />
        </Toolbar>
      );
    case "tooltip":
      return (
        <TooltipProvider>
          <Tooltip open={story === "FigmaReference" || story === "States"}>
            <TooltipTrigger render={<Button variant="outline" />}>
              Hover target
            </TooltipTrigger>
            <TooltipPopup>Tooltip content</TooltipPopup>
          </Tooltip>
        </TooltipProvider>
      );
    default:
      return (
        <Card className="max-w-md">
          <CardPanel>{getCossCatalogEntry(slug).displayName}</CardPanel>
        </Card>
      );
  }
}
