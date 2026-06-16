export interface InventoryArtifact {
  name: string;
  kind: string;
  file: string;
  line?: number | null;
  language?: string | null;
  inferred?: boolean;
}

export interface InventoryData {
  root: string;
  scanned_at: string;
  source_url?: string | null;
  branch?: string | null;
  files_scanned: number;
  classes: InventoryArtifact[];
  interfaces: InventoryArtifact[];
  services: InventoryArtifact[];
  controllers: InventoryArtifact[];
  models: InventoryArtifact[];
  repositories: InventoryArtifact[];
  jobs: InventoryArtifact[];
  consumers: InventoryArtifact[];
  configs: InventoryArtifact[];
  utilities: InventoryArtifact[];
}

export interface InventoryScanResponse {
  inventory: InventoryData;
  report: string;
  summary: Record<string, number>;
}

export const INVENTORY_CATEGORIES = [
  "classes",
  "interfaces",
  "services",
  "controllers",
  "models",
  "repositories",
  "jobs",
  "consumers",
  "configs",
  "utilities",
] as const;

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  classes: "Classes",
  interfaces: "Interfaces",
  services: "Services",
  controllers: "Controllers",
  models: "Models",
  repositories: "Repositories",
  jobs: "Jobs",
  consumers: "Consumers",
  configs: "Configs",
  utilities: "Utilities",
};
