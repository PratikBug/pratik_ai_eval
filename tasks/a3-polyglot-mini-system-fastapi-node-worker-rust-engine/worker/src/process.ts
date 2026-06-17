export interface ProcessRequest {
  transaction_id: string;
  amount: number;
  merchant_id: string;
}

export interface EngineScoreResponse {
  score: number;
  reasons: string[];
}

export interface ProcessResponse {
  transaction_id: string;
  score: number;
  reasons: string[];
}

export const DEFAULT_ENGINE_URL = "http://127.0.0.1:8782/score";
export const DEFAULT_WORKER_PORT = 8781;

export async function callEngine(
  payload: ProcessRequest,
  engineUrl = process.env.ENGINE_URL ?? DEFAULT_ENGINE_URL,
  fetchImpl: typeof fetch = fetch,
): Promise<EngineScoreResponse> {
  const response = await fetchImpl(engineUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Engine returned ${response.status}`);
  }

  return (await response.json()) as EngineScoreResponse;
}

export async function processTransaction(
  payload: ProcessRequest,
  engineUrl?: string,
  fetchImpl?: typeof fetch,
): Promise<ProcessResponse> {
  const engine = await callEngine(payload, engineUrl, fetchImpl);
  return {
    transaction_id: payload.transaction_id,
    score: engine.score,
    reasons: engine.reasons,
  };
}
