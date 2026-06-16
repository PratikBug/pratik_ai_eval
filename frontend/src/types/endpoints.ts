export interface EndpointRoute {
  kind: string;
  method: string;
  path: string;
  handler: string;
  file: string;
  line: number;
  framework: string;
  environment: string;
  notes: string | null;
}

export interface EndpointMapData {
  root: string;
  scanned_at: string;
  source_url?: string | null;
  branch?: string | null;
  files_scanned: number;
  api_routes: EndpointRoute[];
  frontend_routes: EndpointRoute[];
  static_routes: EndpointRoute[];
}

export interface EndpointScanResponse {
  endpoints: EndpointMapData;
  apiReport: string;
  frontendReport: string;
  summary: Record<string, number>;
}

export const ENDPOINT_ROUTE_KINDS = ["api_routes", "frontend_routes", "static_routes"] as const;

export type EndpointRouteKind = (typeof ENDPOINT_ROUTE_KINDS)[number];

export const ENDPOINT_KIND_LABELS: Record<EndpointRouteKind, string> = {
  api_routes: "API / middleware",
  frontend_routes: "Frontend routes",
  static_routes: "Static routes",
};

export function summarizeEndpointScan(response: EndpointScanResponse): Record<EndpointRouteKind, number> {
  return {
    api_routes: response.endpoints.api_routes.length,
    frontend_routes: response.endpoints.frontend_routes.length,
    static_routes: response.endpoints.static_routes.length,
  };
}
