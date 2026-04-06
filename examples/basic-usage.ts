import { ShoppexApiError, ShoppexClient } from "@shoppexio/sdk";

const client = new ShoppexClient({
  apiKey: process.env.SHOPPEX_API_KEY ?? "shx_your_api_key",
});

async function main() {
  const me = await client.me.get();
  console.log("Connected store:", me.data?.store_name);

  const products = await client.products.list({ limit: 20 });
  for (const product of products.data ?? []) {
    console.log(product.uniqid ?? product.id, product.name);
  }

  try {
    const completed = await client.orders.complete(
      "ord_123",
      { notify_customer: true },
      { idempotencyKey: "complete-ord-123" },
    );

    console.log("Order status:", completed.data?.status);
  } catch (error) {
    if (error instanceof ShoppexApiError) {
      console.error(error.status, error.code, error.docUrl);
      return;
    }

    throw error;
  }
}

void main();
