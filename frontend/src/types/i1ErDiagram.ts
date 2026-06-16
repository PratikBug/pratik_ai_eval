export const I1_ENTITY_STATS = {
  sqlTables: 0,
  ormEntities: 0,
  logicalEntities: 1,
  foreignKeys: 0,
} as const;

export interface I1EntityField {
  name: string;
  type: string;
  nullable: boolean;
  notes: string;
  source: string;
}

export const I1_TRANSACTION_FIELDS: I1EntityField[] = [
  {
    name: "id",
    type: "int",
    nullable: false,
    notes: "PK, auto-increment",
    source: "store.py:19, store.ts:13",
  },
  {
    name: "amount",
    type: "decimal",
    nullable: false,
    notes: "Must be > 0, 2 decimal places",
    source: "schemas.py:8, schemas.ts:4-12",
  },
  {
    name: "type",
    type: "credit | debit",
    nullable: false,
    notes: "Enum-like literal",
    source: "schemas.py:9, schemas.ts:13",
  },
  {
    name: "description",
    type: "string",
    nullable: true,
    notes: "Max 200 chars when present",
    source: "schemas.py:10, schemas.ts:14",
  },
];

export const I1_ARTIFACT_PATHS = {
  entities: "tasks/i1-er-diagram-from-repo/artifacts/entities.md",
  diagram: "tasks/i1-er-diagram-from-repo/artifacts/er-diagram.mmd",
} as const;

export const I1_ER_DIAGRAM_VIEWS = [
  { id: "rendered", label: "Rendered diagram" },
  { id: "source", label: "Mermaid source" },
  { id: "inventory", label: "Full entity inventory" },
] as const;

export type I1ErDiagramView = (typeof I1_ER_DIAGRAM_VIEWS)[number]["id"];

export function stripMermaidComments(source: string): string {
  return source
    .split("\n")
    .filter((line) => !line.trim().startsWith("%%"))
    .join("\n")
    .trim();
}

export function buildMermaidLiveUrl(diagramSource: string): string {
  const payload = JSON.stringify({
    code: diagramSource,
    mermaid: { theme: "default" },
  });
  const encoded = btoa(unescape(encodeURIComponent(payload)));
  return `https://mermaid.live/edit#base64:${encoded}`;
}
