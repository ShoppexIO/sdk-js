import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { ShoppexClient } from '../client.js';

describe('ShoppexClient', () => {
  it('adds bearer auth and returns parsed data', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('https://api.shoppex.io/dev/v1/me');
      expect(init?.headers).toBeDefined();
      const headers = new Headers(init?.headers);
      expect(headers.get('authorization')).toBe('Bearer shx_test');

      return new Response(JSON.stringify({ data: { name: 'Demo shop' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const client = new ShoppexClient({
      apiKey: 'shx_test',
      fetch: fetchMock as unknown as typeof fetch,
    });

    const response = await client.me.get() as { data: { name: string } };
    expect(response.data.name).toBe('Demo shop');
  });

  it('throws a typed api error', async () => {
    const fetchMock = vi.fn(async () => new Response(
      JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid API key.',
          doc_url: 'https://docs.shoppex.io/api/errors#UNAUTHORIZED',
          details: [{ field: 'authorization', message: 'Missing bearer token' }],
        },
      }),
      {
        status: 401,
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'req_123',
        },
      },
    ));

    const client = new ShoppexClient({
      apiKey: 'bad',
      fetch: fetchMock as unknown as typeof fetch,
    });

    await expect(client.me.get()).rejects.toMatchObject({
      name: 'ShoppexApiError',
      status: 401,
      code: 'UNAUTHORIZED',
      docUrl: 'https://docs.shoppex.io/api/errors#UNAUTHORIZED',
      requestId: 'req_123',
    });
  });

  it('collects all cursor pages', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: [{ id: 'prod_1' }, { id: 'prod_2' }],
        pagination: { next_cursor: 'cursor_2', has_more: true },
      }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: [{ id: 'prod_3' }],
        pagination: { next_cursor: null, has_more: false },
      }), { status: 200, headers: { 'content-type': 'application/json' } }));

    const client = new ShoppexClient({
      apiKey: 'shx_test',
      fetch: fetchMock as unknown as typeof fetch,
    });

    const products = await client.products.listAll<{ id: string }>({ limit: 2 });

    expect(products.map((item) => item.id)).toEqual(['prod_1', 'prod_2', 'prod_3']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('exposes typed core resource defaults', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      data: [{ id: 'prod_1', name: 'Starter' }],
      pagination: { next_cursor: null, has_more: false },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    const client = new ShoppexClient({
      apiKey: 'shx_test',
      fetch: fetchMock as unknown as typeof fetch,
    });

    const response = await client.products.list({ limit: 1 });
    expect(response.data[0].name).toBe('Starter');
    expectTypeOf(response.data[0].name).toEqualTypeOf<string | undefined>();
  });

  it('exposes typed secondary resource defaults', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: [{ uniqid: 'pay_1', status: 'pending' }],
        pagination: { next_cursor: null, has_more: false },
      }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: { id: 'coupon_1', code: 'SPRING25' },
      }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: { id: 'wh_1', url: 'https://example.com/webhook' },
      }), { status: 200, headers: { 'content-type': 'application/json' } }));

    const client = new ShoppexClient({
      apiKey: 'shx_test',
      fetch: fetchMock as unknown as typeof fetch,
    });

    const payments = await client.payments.list({ limit: 1 });
    const coupon = await client.coupons.get('coupon_1');
    const webhook = await client.webhooks.get('wh_1');

    expect(payments.data[0].status).toBe('pending');
    expectTypeOf(payments.data[0].status).toEqualTypeOf<string | undefined>();
    expect(coupon.data.code).toBe('SPRING25');
    expect(webhook.data.url).toBe('https://example.com/webhook');
  });
});
