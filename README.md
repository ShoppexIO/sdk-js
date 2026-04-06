# @shoppexio/sdk

Official JavaScript/TypeScript SDK for the Shoppex Developer API.

This SDK wraps the Shoppex `/dev/v1/*` API with a typed client surface for backend integrations, internal tools, and OAuth app installs.

## Install

```bash
npm install @shoppexio/sdk
```

## Quick Start

```ts
import { ShoppexClient } from "@shoppexio/sdk";

const client = new ShoppexClient({
  apiKey: process.env.SHOPPEX_API_KEY!,
});

const me = await client.me.get();
const products = await client.products.list({ page: 1, limit: 20 });
```

## Auth

Use one of these:

- `apiKey` for your own server-to-server integrations
- `accessToken` for OAuth app installs

## Included Services

- `me`
- `products`
- `orders`
- `customers`
- `payments`
- `invoices`
- `coupons`
- `webhooks`

This covers the main commerce and ops flows out of the box:

- product reads and writes
- order creation, completion, fulfillment, and refunds
- customer reads and writes
- payment and invoice workflows
- coupon validation and management
- webhook management and delivery logs

## Docs

- Developer API docs: [docs.shoppex.io/api-reference/introduction](https://docs.shoppex.io/api-reference/introduction)
- SDK docs: [docs.shoppex.io/api-reference/sdks](https://docs.shoppex.io/api-reference/sdks)

## Source

Current source of truth lives in the private Shoppex monorepo.
This public repo is for package discovery and public SDK visibility.
