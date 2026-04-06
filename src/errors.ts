export interface ShoppexApiErrorDetails {
  status: number;
  statusText?: string | null;
  code?: string | null;
  docUrl?: string | null;
  requestId?: string | null;
  details?: unknown;
  raw?: unknown;
}

export class ShoppexApiError extends Error {
  readonly status: number;
  readonly statusText: string | null;
  readonly code: string | null;
  readonly docUrl: string | null;
  readonly requestId: string | null;
  readonly details: unknown;
  readonly raw: unknown;

  constructor(message: string, details: ShoppexApiErrorDetails) {
    super(message);
    this.name = 'ShoppexApiError';
    this.status = details.status;
    this.statusText = details.statusText ?? null;
    this.code = details.code ?? null;
    this.docUrl = details.docUrl ?? null;
    this.requestId = details.requestId ?? null;
    this.details = details.details ?? null;
    this.raw = details.raw ?? null;
  }
}
