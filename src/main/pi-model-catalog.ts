import type {
  PiModelCatalog,
  PiModelOption,
  PiModelProvider,
  PiModelThinkingLevel
} from "@shared/pi";
import { getPiSdk } from "./pi-runtime";

interface RegistryModel {
  id: string;
  name?: string;
  provider: string;
  reasoning?: boolean;
  thinkingLevelMap?: Partial<Record<PiModelThinkingLevel, string | null>>;
}

const EXTENDED_THINKING_LEVELS: PiModelThinkingLevel[] = [
  "off",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh"
];

const DEFAULT_PROVIDER = "openai-codex";
const DEFAULT_MODEL = "gpt-5.5";
const DEFAULT_THINKING_LEVEL: PiModelThinkingLevel = "medium";

export async function getPiModelCatalog(): Promise<PiModelCatalog> {
  const sdk = await getPiSdk();
  const authStorage = sdk.AuthStorage.create();
  const modelRegistry = sdk.ModelRegistry.create(authStorage);
  const providers = new Map<string, PiModelProvider>();

  for (const model of modelRegistry.getAll() as RegistryModel[]) {
    const provider =
      providers.get(model.provider) ??
      createProvider(model.provider, modelRegistry.getProviderDisplayName(model.provider));

    provider.models.push({
      id: model.id,
      label: model.name ?? model.id,
      thinkingLevels: getSupportedThinkingLevels(model)
    });
    providers.set(provider.id, provider);
  }

  const sortedProviders = Array.from(providers.values())
    .map((provider) => ({
      ...provider,
      models: provider.models.sort((first, second) =>
        first.label.localeCompare(second.label)
      )
    }))
    .sort((first, second) => first.label.localeCompare(second.label));

  return {
    providers: sortedProviders,
    defaultModelValue: getDefaultModelValue(sortedProviders)
  };
}

function createProvider(id: string, label: string): PiModelProvider {
  return {
    id,
    label,
    models: []
  };
}

function getSupportedThinkingLevels(model: RegistryModel): PiModelThinkingLevel[] {
  if (!model.reasoning) {
    return ["off"];
  }

  return EXTENDED_THINKING_LEVELS.filter((level) => {
    const mapped = model.thinkingLevelMap?.[level];

    if (mapped === null) {
      return false;
    }

    if (level === "xhigh") {
      return mapped !== undefined;
    }

    return true;
  });
}

function getDefaultModelValue(providers: PiModelProvider[]): string | null {
  const defaultProvider = providers.find((provider) => provider.id === DEFAULT_PROVIDER);
  const defaultModel = defaultProvider?.models.find((model) => model.id === DEFAULT_MODEL);
  const defaultThinkingLevel = defaultModel?.thinkingLevels.includes(DEFAULT_THINKING_LEVEL)
    ? DEFAULT_THINKING_LEVEL
    : defaultModel?.thinkingLevels[0];

  if (defaultProvider && defaultModel && defaultThinkingLevel) {
    return formatModelValue(defaultProvider.id, defaultModel.id, defaultThinkingLevel);
  }

  const fallbackProvider = providers[0];
  const fallbackModel = fallbackProvider?.models[0];
  const fallbackThinkingLevel = fallbackModel?.thinkingLevels[0];

  if (!fallbackProvider || !fallbackModel || !fallbackThinkingLevel) {
    return null;
  }

  return formatModelValue(fallbackProvider.id, fallbackModel.id, fallbackThinkingLevel);
}

function formatModelValue(
  providerId: string,
  modelId: string,
  thinkingLevel: PiModelThinkingLevel
): string {
  return `${providerId}/${modelId}:${thinkingLevel}`;
}
