import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CONFIG_PATH = join(homedir(), ".kortexrc");

interface KortexConfig {
  apiUrl: string;
  persona: string;
  projectId?: string;
}

const DEFAULT_CONFIG: KortexConfig = {
  apiUrl: "http://localhost:3000",
  persona: "prime",
};

export function getConfig(): KortexConfig {
  if (!existsSync(CONFIG_PATH)) {
    return DEFAULT_CONFIG;
  }
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function setConfig(key: string, value: string) {
  const config = getConfig();
  (config as any)[key] = value;
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function getApiUrl(): string {
  return getConfig().apiUrl;
}

export function getPersona(): string {
  return getConfig().persona;
}
