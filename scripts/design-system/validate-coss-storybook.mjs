import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const componentDir = path.join(repoRoot, "src/renderer/components/ui");
const storyDir = path.join(repoRoot, "src/renderer/stories/coss/components");

const components = [
  ["accordion", "Coss Components/Disclosure/Accordion", ["accordion.tsx"]],
  ["alert", "Coss Components/Feedback/Alert", ["alert.tsx"]],
  ["alert-dialog", "Coss Components/Overlays/Alert Dialog", ["alert-dialog.tsx"]],
  ["autocomplete", "Coss Components/Forms/Autocomplete", ["autocomplete.tsx"]],
  ["avatar", "Coss Components/Data Display/Avatar", ["avatar.tsx"]],
  ["badge", "Coss Components/Data Display/Badge", ["badge.tsx"]],
  ["breadcrumb", "Coss Components/Navigation/Breadcrumb", ["breadcrumb.tsx"]],
  ["button", "Coss Components/Actions/Button", ["button.tsx"]],
  ["calendar", "Coss Components/Forms/Calendar", ["calendar.tsx"]],
  ["card", "Coss Components/Layout/Card", ["card.tsx"]],
  ["checkbox", "Coss Components/Forms/Checkbox", ["checkbox.tsx"]],
  ["checkbox-group", "Coss Components/Forms/Checkbox Group", ["checkbox-group.tsx"]],
  ["collapsible", "Coss Components/Disclosure/Collapsible", ["collapsible.tsx"]],
  ["combobox", "Coss Components/Forms/Combobox", ["combobox.tsx"]],
  ["command", "Coss Components/Navigation/Command", ["command.tsx"]],
  ["date-picker", "Coss Components/Compositions/Date Picker", ["button.tsx", "calendar.tsx", "popover.tsx"]],
  ["dialog", "Coss Components/Overlays/Dialog", ["dialog.tsx"]],
  ["drawer", "Coss Components/Overlays/Drawer", ["drawer.tsx"]],
  ["empty", "Coss Components/Data Display/Empty", ["empty.tsx"]],
  ["field", "Coss Components/Forms/Field", ["field.tsx"]],
  ["fieldset", "Coss Components/Forms/Fieldset", ["fieldset.tsx"]],
  ["form", "Coss Components/Forms/Form", ["form.tsx"]],
  ["frame", "Coss Components/Layout/Frame", ["frame.tsx"]],
  ["group", "Coss Components/Layout/Group", ["group.tsx"]],
  ["input", "Coss Components/Forms/Input", ["input.tsx"]],
  ["input-group", "Coss Components/Forms/Input Group", ["input-group.tsx"]],
  ["kbd", "Coss Components/Data Display/Kbd", ["kbd.tsx"]],
  ["label", "Coss Components/Forms/Label", ["label.tsx"]],
  ["menu", "Coss Components/Overlays/Menu", ["menu.tsx"]],
  ["meter", "Coss Components/Feedback/Meter", ["meter.tsx"]],
  ["number-field", "Coss Components/Forms/Number Field", ["number-field.tsx"]],
  ["otp-field", "Coss Components/Forms/OTP Field", ["otp-field.tsx"]],
  ["pagination", "Coss Components/Navigation/Pagination", ["pagination.tsx"]],
  ["popover", "Coss Components/Overlays/Popover", ["popover.tsx"]],
  ["preview-card", "Coss Components/Overlays/Preview Card", ["preview-card.tsx"]],
  ["progress", "Coss Components/Feedback/Progress", ["progress.tsx"]],
  ["radio-group", "Coss Components/Forms/Radio Group", ["radio-group.tsx"]],
  ["scroll-area", "Coss Components/Layout/Scroll Area", ["scroll-area.tsx"]],
  ["select", "Coss Components/Forms/Select", ["select.tsx"]],
  ["separator", "Coss Components/Layout/Separator", ["separator.tsx"]],
  ["sheet", "Coss Components/Overlays/Sheet", ["sheet.tsx"]],
  ["sidebar", "Coss Components/Navigation/Sidebar", ["sidebar.tsx"]],
  ["skeleton", "Coss Components/Feedback/Skeleton", ["skeleton.tsx"]],
  ["slider", "Coss Components/Forms/Slider", ["slider.tsx"]],
  ["spinner", "Coss Components/Feedback/Spinner", ["spinner.tsx"]],
  ["switch", "Coss Components/Forms/Switch", ["switch.tsx"]],
  ["table", "Coss Components/Data Display/Table", ["table.tsx"]],
  ["tabs", "Coss Components/Navigation/Tabs", ["tabs.tsx"]],
  ["textarea", "Coss Components/Forms/Textarea", ["textarea.tsx"]],
  ["toast", "Coss Components/Feedback/Toast", ["toast.tsx"]],
  ["toggle", "Coss Components/Actions/Toggle", ["toggle.tsx"]],
  ["toggle-group", "Coss Components/Actions/Toggle Group", ["toggle-group.tsx"]],
  ["toolbar", "Coss Components/Actions/Toolbar", ["toolbar.tsx"]],
  ["tooltip", "Coss Components/Overlays/Tooltip", ["tooltip.tsx"]],
];

const requiredStories = [
  "Default",
  "Variants",
  "States",
  "Composition",
  "Examples",
  "FigmaReference",
];

const errors = [];

for (const [slug, title, localFiles] of components) {
  const storyPath = path.join(storyDir, `${slug}.stories.tsx`);

  if (!fs.existsSync(storyPath)) {
    errors.push(`Missing canonical story file for ${slug}: ${storyPath}`);
    continue;
  }

  const storySource = fs.readFileSync(storyPath, "utf8");

  for (const storyName of requiredStories) {
    const matches = storySource.match(
      new RegExp(`export const ${storyName}: Story`, "g"),
    ) ?? [];
    if (matches.length !== 1) {
      errors.push(
        `${slug} must export exactly one ${storyName} story, found ${matches.length}`,
      );
    }
  }

  const figmaReferenceCall = `cossFigmaReferenceStory("${slug}")`;
  const figmaMatches = storySource.split(figmaReferenceCall).length - 1;
  if (figmaMatches !== 1) {
    errors.push(
      `${slug} must use exactly one ${figmaReferenceCall}, found ${figmaMatches}`,
    );
  }

  const titleLiteral = `title: "${title}"`;
  if (!storySource.includes(titleLiteral)) {
    errors.push(`${slug} story is missing canonical ${titleLiteral}`);
  }

  for (const localFile of localFiles) {
    const localPath = path.join(componentDir, localFile);
    if (!fs.existsSync(localPath)) {
      errors.push(`${slug} maps to missing local component dependency: ${localPath}`);
    }
  }
}

const helperPath = path.join(storyDir, "coss-catalog.tsx");
if (!fs.existsSync(helperPath)) {
  errors.push(`Missing shared Coss catalog helper: ${helperPath}`);
} else {
  const helperSource = fs.readFileSync(helperPath, "utf8");
  for (const [slug] of components) {
    if (!helperSource.includes(`["${slug}",`)) {
      errors.push(`${slug} is missing from coss-catalog componentEntries`);
    }
  }
  if (!helperSource.includes("figmaReference,")) {
    errors.push("coss-catalog helper does not expose designSystem.figmaReference");
  }
}

if (errors.length > 0) {
  console.error("Coss Storybook catalog validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Coss Storybook catalog validation passed for ${components.length} entries.`);
