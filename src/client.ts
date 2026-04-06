import { ShoppexApiError } from './errors.js';
import type { Coupon, Customer, Invoice, Order, Payment, Product, Webhook } from './models.js';
import type {
  CursorListResponse,
  MutationOptions,
  PageListResponse,
  QueryOptions,
  ShoppexApiErrorPayload,
  ShoppexClientOptions,
  ShoppexRequestOptions,
  SuccessResponse,
} from './types.js';

interface RawRequestOptions extends ShoppexRequestOptions {
  query?: QueryOptions['query'];
  path?: Record<string, string>;
  body?: Record<string, unknown>;
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function toHeaders(options?: ShoppexRequestOptions): Headers {
  const headers = new Headers(options?.headers);

  if (options?.idempotencyKey) {
    headers.set('Idempotency-Key', options.idempotencyKey);
  }

  return headers;
}

function withTimeout(signal: AbortSignal | undefined, timeoutMs: number | undefined): AbortSignal | undefined {
  if (!timeoutMs || timeoutMs <= 0) {
    return signal;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeout);
      controller.abort(signal.reason);
      return controller.signal;
    }

    signal.addEventListener('abort', () => {
      clearTimeout(timeout);
      controller.abort(signal.reason);
    }, { once: true });
  }

  controller.signal.addEventListener('abort', () => clearTimeout(timeout), { once: true });

  return controller.signal;
}

function extractErrorMessage(error: unknown, fallbackStatus: number): {
  message: string;
  code: string | null;
  docUrl: string | null;
  details: unknown;
  raw: unknown;
} {
  if (error && typeof error === 'object' && 'error' in error) {
    const nested = (error as { error?: ShoppexApiErrorPayload }).error;
    if (nested && typeof nested === 'object') {
      const message = typeof nested.message === 'string'
        ? nested.message
        : `Shoppex API request failed with status ${fallbackStatus}`;
      const code = typeof nested.code === 'string' ? nested.code : null;
      const docUrl = typeof nested.doc_url === 'string' ? nested.doc_url : null;
      return {
        message,
        code,
        docUrl,
        details: typeof nested.details === 'undefined' ? null : nested.details,
        raw: error,
      };
    }
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const message = typeof record.message === 'string'
      ? record.message
      : typeof record.error === 'string'
        ? record.error
        : `Shoppex API request failed with status ${fallbackStatus}`;
    const code = typeof record.code === 'string' ? record.code : null;
    const docUrl = typeof record.doc_url === 'string' ? record.doc_url : null;
    return { message, code, docUrl, details: error, raw: error };
  }

  return {
    message: `Shoppex API request failed with status ${fallbackStatus}`,
    code: null,
    docUrl: null,
    details: error,
    raw: error,
  };
}

function applyPathParams(path: string, params?: Record<string, string>): string {
  if (!params) {
    return path;
  }

  return Object.entries(params).reduce((resolved, [key, value]) => {
    return resolved.replace(`{${key}}`, encodeURIComponent(value));
  }, path);
}

function buildQueryString(query?: QueryOptions['query']): string {
  if (!query) {
    return '';
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === null || typeof value === 'undefined') {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : '';
}

class MeService {
  constructor(private readonly client: ShoppexClient) {}

  get<T = unknown>(options?: ShoppexRequestOptions) {
    return this.client.raw.GET<SuccessResponse<T>>('/dev/v1/me', options);
  }

  getCapabilities<T = unknown>(options?: ShoppexRequestOptions) {
    return this.client.raw.GET<SuccessResponse<T>>('/dev/v1/me/capabilities', options);
  }
}

class ProductsService {
  constructor(private readonly client: ShoppexClient) {}

  list<T = Product>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.raw.GET<CursorListResponse<T>>('/dev/v1/products/', { ...options, query });
  }

  listAll<T = Product>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.collectCursorPages<T>('/dev/v1/products/', query, options);
  }

  iterateAll<T = Product>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.iterateCursorItems<T>('/dev/v1/products/', query, options);
  }

  get<T = Product>(id: string, options?: ShoppexRequestOptions) {
    return this.client.raw.GET<SuccessResponse<T>>('/dev/v1/products/{id}', { ...options, path: { id } });
  }

  search<T = unknown>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.raw.GET<CursorListResponse<T>>('/dev/v1/products/search', { ...options, query });
  }

  create<T = Product>(body: Record<string, unknown>, options?: MutationOptions) {
    return this.client.raw.POST<SuccessResponse<T>>('/dev/v1/products/', { ...options, body });
  }

  update<T = Product>(id: string, body: Record<string, unknown>, options?: MutationOptions) {
    return this.client.raw.PATCH<SuccessResponse<T>>('/dev/v1/products/{id}', { ...options, path: { id }, body });
  }

  delete<T = unknown>(id: string, options?: MutationOptions) {
    return this.client.raw.DELETE<T>('/dev/v1/products/{id}', { ...options, path: { id } });
  }
}

class OrdersService {
  constructor(private readonly client: ShoppexClient) {}

  list<T = Order>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.raw.GET<CursorListResponse<T>>('/dev/v1/orders', { ...options, query });
  }

  listAll<T = Order>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.collectCursorPages<T>('/dev/v1/orders', query, options);
  }

  iterateAll<T = Order>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.iterateCursorItems<T>('/dev/v1/orders', query, options);
  }

  get<T = Order>(id: string, options?: ShoppexRequestOptions) {
    return this.client.raw.GET<SuccessResponse<T>>('/dev/v1/orders/{id}', { ...options, path: { id } });
  }

  create<T = Order>(body: Record<string, unknown>, options?: MutationOptions) {
    return this.client.raw.POST<SuccessResponse<T>>('/dev/v1/orders', { ...options, body });
  }

  update<T = Order>(id: string, body: Record<string, unknown>, options?: MutationOptions) {
    return this.client.raw.PATCH<SuccessResponse<T>>('/dev/v1/orders/{id}', { ...options, path: { id }, body });
  }

  fulfill<T = Order>(id: string, body: Record<string, unknown>, options?: MutationOptions) {
    return this.client.raw.POST<SuccessResponse<T>>('/dev/v1/orders/{id}/fulfill', { ...options, path: { id }, body });
  }

  complete<T = Order>(id: string, body: Record<string, unknown> = {}, options?: MutationOptions) {
    return this.client.raw.POST<SuccessResponse<T>>('/dev/v1/orders/{id}/complete', { ...options, path: { id }, body });
  }

  refund<T = Order>(id: string, body: Record<string, unknown>, options?: MutationOptions) {
    return this.client.raw.POST<SuccessResponse<T>>('/dev/v1/orders/{id}/refund', { ...options, path: { id }, body });
  }
}

class CustomersService {
  constructor(private readonly client: ShoppexClient) {}

  list<T = Customer>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.raw.GET<CursorListResponse<T>>('/dev/v1/customers', { ...options, query });
  }

  listAll<T = Customer>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.collectCursorPages<T>('/dev/v1/customers', query, options);
  }

  iterateAll<T = Customer>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.iterateCursorItems<T>('/dev/v1/customers', query, options);
  }

  get<T = Customer>(id: string, options?: ShoppexRequestOptions) {
    return this.client.raw.GET<SuccessResponse<T>>('/dev/v1/customers/{id}', { ...options, path: { id } });
  }

  create<T = Customer>(body: Record<string, unknown>, options?: MutationOptions) {
    return this.client.raw.POST<SuccessResponse<T>>('/dev/v1/customers', { ...options, body });
  }

  update<T = Customer>(id: string, body: Record<string, unknown>, options?: MutationOptions) {
    return this.client.raw.PATCH<SuccessResponse<T>>('/dev/v1/customers/{id}', { ...options, path: { id }, body });
  }

  delete<T = unknown>(id: string, options?: MutationOptions) {
    return this.client.raw.DELETE<T>('/dev/v1/customers/{id}', { ...options, path: { id } });
  }
}

class PaymentsService {
  constructor(private readonly client: ShoppexClient) {}

  list<T = Payment>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.raw.GET<CursorListResponse<T>>('/dev/v1/payments', { ...options, query });
  }

  listAll<T = Payment>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.collectCursorPages<T>('/dev/v1/payments', query, options);
  }

  iterateAll<T = Payment>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.iterateCursorItems<T>('/dev/v1/payments', query, options);
  }

  get<T = Payment>(uniqid: string, options?: ShoppexRequestOptions) {
    return this.client.raw.GET<SuccessResponse<T>>('/dev/v1/payments/{uniqid}', { ...options, path: { uniqid } });
  }

  create<T = Payment>(body: Record<string, unknown>, options?: MutationOptions) {
    return this.client.raw.POST<SuccessResponse<T>>('/dev/v1/payments', { ...options, body });
  }

  complete<T = Payment>(uniqid: string, body: Record<string, unknown> = {}, options?: MutationOptions) {
    return this.client.raw.POST<SuccessResponse<T>>('/dev/v1/payments/{uniqid}/complete', { ...options, path: { uniqid }, body });
  }
}

class InvoicesService {
  constructor(private readonly client: ShoppexClient) {}

  list<T = Invoice>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.raw.GET<CursorListResponse<T>>('/dev/v1/invoices', { ...options, query });
  }

  listAll<T = Invoice>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.collectCursorPages<T>('/dev/v1/invoices', query, options);
  }

  iterateAll<T = Invoice>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.iterateCursorItems<T>('/dev/v1/invoices', query, options);
  }

  get<T = Invoice>(uniqid: string, options?: ShoppexRequestOptions) {
    return this.client.raw.GET<SuccessResponse<T>>('/dev/v1/invoices/{uniqid}', { ...options, path: { uniqid } });
  }

  complete<T = Invoice>(uniqid: string, body: Record<string, unknown> = {}, options?: MutationOptions) {
    return this.client.raw.POST<SuccessResponse<T>>('/dev/v1/invoices/{uniqid}/complete', { ...options, path: { uniqid }, body });
  }
}

class CouponsService {
  constructor(private readonly client: ShoppexClient) {}

  list<T = Coupon>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.raw.GET<CursorListResponse<T>>('/dev/v1/coupons/', { ...options, query });
  }

  listAll<T = Coupon>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.collectCursorPages<T>('/dev/v1/coupons/', query, options);
  }

  iterateAll<T = Coupon>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.iterateCursorItems<T>('/dev/v1/coupons/', query, options);
  }

  get<T = Coupon>(id: string, options?: ShoppexRequestOptions) {
    return this.client.raw.GET<SuccessResponse<T>>('/dev/v1/coupons/{id}', { ...options, path: { id } });
  }

  getByCode<T = Coupon>(code: string, options?: ShoppexRequestOptions) {
    return this.client.raw.GET<SuccessResponse<T>>('/dev/v1/coupons/code/{code}', { ...options, path: { code } });
  }

  create<T = Coupon>(body: Record<string, unknown>, options?: MutationOptions) {
    return this.client.raw.POST<SuccessResponse<T>>('/dev/v1/coupons/', { ...options, body });
  }

  update<T = Coupon>(id: string, body: Record<string, unknown>, options?: MutationOptions) {
    return this.client.raw.PATCH<SuccessResponse<T>>('/dev/v1/coupons/{id}', { ...options, path: { id }, body });
  }

  delete<T = unknown>(id: string, options?: MutationOptions) {
    return this.client.raw.DELETE<T>('/dev/v1/coupons/{id}', { ...options, path: { id } });
  }
}

class WebhooksService {
  constructor(private readonly client: ShoppexClient) {}

  list<T = Webhook>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.raw.GET<CursorListResponse<T>>('/dev/v1/webhooks', { ...options, query });
  }

  listAll<T = Webhook>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.collectCursorPages<T>('/dev/v1/webhooks', query, options);
  }

  iterateAll<T = Webhook>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.iterateCursorItems<T>('/dev/v1/webhooks', query, options);
  }

  get<T = Webhook>(id: string, options?: ShoppexRequestOptions) {
    return this.client.raw.GET<SuccessResponse<T>>('/dev/v1/webhooks/{id}', { ...options, path: { id } });
  }

  create<T = Webhook>(body: Record<string, unknown>, options?: MutationOptions) {
    return this.client.raw.POST<SuccessResponse<T>>('/dev/v1/webhooks', { ...options, body });
  }

  update<T = Webhook>(id: string, body: Record<string, unknown>, options?: MutationOptions) {
    return this.client.raw.PATCH<SuccessResponse<T>>('/dev/v1/webhooks/{id}', { ...options, path: { id }, body });
  }

  delete<T = unknown>(id: string, options?: MutationOptions) {
    return this.client.raw.DELETE<T>('/dev/v1/webhooks/{id}', { ...options, path: { id } });
  }

  listEvents<T = unknown>(options?: ShoppexRequestOptions) {
    return this.client.raw.GET<SuccessResponse<T>>('/dev/v1/webhooks/events', options);
  }

  listLogs<T = unknown>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.raw.GET<PageListResponse<T>>('/dev/v1/webhooks/logs', { ...options, query });
  }

  listAllLogs<T = unknown>(query?: QueryOptions['query'], options?: ShoppexRequestOptions) {
    return this.client.collectPageItems<T>('/dev/v1/webhooks/logs', query, options);
  }

  test<T = Webhook>(id: string, body: Record<string, unknown> = {}, options?: MutationOptions) {
    return this.client.raw.POST<SuccessResponse<T>>('/dev/v1/webhooks/{id}/test', { ...options, path: { id }, body });
  }

  rotateSecret<T = Webhook>(id: string, body: Record<string, unknown> = {}, options?: MutationOptions) {
    return this.client.raw.POST<SuccessResponse<T>>('/dev/v1/webhooks/{id}/rotate-secret', { ...options, path: { id }, body });
  }

  retryLog<T = unknown>(id: string, body: Record<string, unknown> = {}, options?: MutationOptions) {
    return this.client.raw.POST<SuccessResponse<T>>('/dev/v1/webhooks/logs/{id}/retry', { ...options, path: { id }, body });
  }
}

export class ShoppexClient {
  readonly baseUrl: string;
  readonly timeoutMs: number | undefined;
  readonly raw: {
    GET: <T = unknown>(path: string, options?: RawRequestOptions) => Promise<T>;
    POST: <T = unknown>(path: string, options?: RawRequestOptions) => Promise<T>;
    PATCH: <T = unknown>(path: string, options?: RawRequestOptions) => Promise<T>;
    PUT: <T = unknown>(path: string, options?: RawRequestOptions) => Promise<T>;
    DELETE: <T = unknown>(path: string, options?: RawRequestOptions) => Promise<T>;
  };
  readonly me: MeService;
  readonly products: ProductsService;
  readonly orders: OrdersService;
  readonly customers: CustomersService;
  readonly payments: PaymentsService;
  readonly invoices: InvoicesService;
  readonly coupons: CouponsService;
  readonly webhooks: WebhooksService;

  constructor(options: ShoppexClientOptions) {
    const token = options.apiKey ?? options.accessToken;

    if (!token) {
      throw new Error('ShoppexClient requires either apiKey or accessToken.');
    }

    this.baseUrl = trimTrailingSlash(options.baseUrl ?? 'https://api.shoppex.io');
    this.timeoutMs = options.timeoutMs;
    const fetchImpl = options.fetch ?? fetch;

    this.raw = {
      GET: (path, requestOptions) => this.request('GET', path, requestOptions, fetchImpl, token, options.userAgent),
      POST: (path, requestOptions) => this.request('POST', path, requestOptions, fetchImpl, token, options.userAgent),
      PATCH: (path, requestOptions) => this.request('PATCH', path, requestOptions, fetchImpl, token, options.userAgent),
      PUT: (path, requestOptions) => this.request('PUT', path, requestOptions, fetchImpl, token, options.userAgent),
      DELETE: (path, requestOptions) => this.request('DELETE', path, requestOptions, fetchImpl, token, options.userAgent),
    };

    this.me = new MeService(this);
    this.products = new ProductsService(this);
    this.orders = new OrdersService(this);
    this.customers = new CustomersService(this);
    this.payments = new PaymentsService(this);
    this.invoices = new InvoicesService(this);
    this.coupons = new CouponsService(this);
    this.webhooks = new WebhooksService(this);
  }

  private async request<T>(
    method: string,
    path: string,
    options: RawRequestOptions | undefined,
    fetchImpl: typeof fetch,
    token: string,
    userAgent?: string,
  ): Promise<T> {
    const resolvedPath = applyPathParams(path, options?.path);
    const url = `${this.baseUrl}${resolvedPath}${buildQueryString(options?.query)}`;
    const headers = toHeaders(options);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');

    if (userAgent) {
      headers.set('User-Agent', userAgent);
    }

    const signal = withTimeout(options?.signal, this.timeoutMs);
    const response = await fetchImpl(url, {
      method,
      headers,
      signal,
      ...(options?.body ? { body: JSON.stringify(options.body), headers: (() => {
        headers.set('Content-Type', 'application/json');
        return headers;
      })() } : {}),
    });

    let payload: unknown = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const extracted = extractErrorMessage(payload, response.status);
      throw new ShoppexApiError(extracted.message, {
        status: response.status,
        statusText: response.statusText,
        code: extracted.code,
        docUrl: extracted.docUrl,
        requestId: response.headers.get('x-request-id'),
        details: extracted.details,
        raw: extracted.raw,
      });
    }

    return payload as T;
  }

  get(path: string, options?: QueryOptions) {
    return this.raw.GET(path, options);
  }

  post(path: string, body?: Record<string, unknown>, options?: MutationOptions) {
    return this.raw.POST(path, { ...options, body });
  }

  patch(path: string, body?: Record<string, unknown>, options?: MutationOptions) {
    return this.raw.PATCH(path, { ...options, body });
  }

  put(path: string, body?: Record<string, unknown>, options?: MutationOptions) {
    return this.raw.PUT(path, { ...options, body });
  }

  delete(path: string, options?: MutationOptions) {
    return this.raw.DELETE(path, options);
  }

  async collectCursorPages<T = unknown>(
    path: string,
    query?: QueryOptions['query'],
    options?: ShoppexRequestOptions,
  ): Promise<T[]> {
    const items: T[] = [];

    for await (const item of this.iterateCursorItems<T>(path, query, options)) {
      items.push(item);
    }

    return items;
  }

  async *iterateCursorItems<T = unknown>(
    path: string,
    query?: QueryOptions['query'],
    options?: ShoppexRequestOptions,
  ): AsyncGenerator<T> {
    let cursor: string | null | undefined = typeof query?.cursor === 'string' ? query.cursor : null;

    do {
      const response: CursorListResponse<T> = await this.raw.GET<CursorListResponse<T>>(path, {
        ...options,
        query: {
          ...(query ?? {}),
          ...(cursor ? { cursor } : {}),
        },
      });

      for (const item of response.data) {
        yield item;
      }

      cursor = response.pagination.has_more ? response.pagination.next_cursor : null;
    } while (cursor);
  }

  async collectPageItems<T = unknown>(
    path: string,
    query?: QueryOptions['query'],
    options?: ShoppexRequestOptions,
  ): Promise<T[]> {
    const items: T[] = [];
    let page = typeof query?.page === 'number' ? query.page : Number(query?.page ?? 1);

    while (true) {
      const response: PageListResponse<T> = await this.raw.GET<PageListResponse<T>>(path, {
        ...options,
        query: {
          ...(query ?? {}),
          page,
        },
      });

      items.push(...response.data);

      if (!response.pagination.has_more) {
        break;
      }

      page += 1;
    }

    return items;
  }
}
