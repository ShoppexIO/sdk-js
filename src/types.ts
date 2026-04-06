export interface ShoppexClientOptions {
  apiKey?: string;
  accessToken?: string;
  baseUrl?: string;
  timeoutMs?: number;
  userAgent?: string;
  fetch?: typeof fetch;
}

export type { BaseResource, Coupon, Customer, Invoice, Order, Payment, Product, Webhook } from './models.js';

export interface ShoppexApiErrorPayload {
  code?: string;
  message?: string;
  doc_url?: string;
  details?: unknown;
}

export interface CursorPagination {
  next_cursor: string | null;
  has_more: boolean;
}

export interface PagePagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_more: boolean;
}

export interface CursorListResponse<T> {
  data: T[];
  pagination: CursorPagination;
}

export interface PageListResponse<T> {
  data: T[];
  pagination: PagePagination;
}

export interface SuccessResponse<T> {
  data: T;
}

export interface ShoppexRequestOptions {
  headers?: HeadersInit;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export interface QueryOptions extends ShoppexRequestOptions {
  query?: Record<string, string | number | boolean | null | undefined>;
}

export interface MutationOptions extends ShoppexRequestOptions {
  idempotencyKey?: string;
}

export type ShoppexResponse<T = unknown> = T;
