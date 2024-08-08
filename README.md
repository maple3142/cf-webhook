# cf-webhook

A [webhook.site](https://webhook.site/)-like service running on Cloudflare Workers or self-hosted using Bun.

## Deployment (using D1 as backing storage)

1. Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
2. `wrangler d1 create cf-webhook` to create a Durable Object named `cf-webhook`
3. Edit `wrangler.toml` and update `database_id` in `d1_databases` section to the id of the created Durable Object. (Also update `database_name` if you used a different name)
4. Comment out or remove `kv_namespaces` sections in `wrangler.toml`.
5. `wrangler d1 execute cf-webhook --file=./schema.sql`
6. `wrangler publish`
7. Visit the published URL and you should see the web interface.

## Deployment (using KV as backing storage)

1. Install [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
2. `wrangler2 kv:namespace create files` and `wrangler2 kv:namespace create requests` to create necessary KV namespaces
3. Edit `wrangler.toml` and update `namespace_id` in `kv_namespaces` section to the id of the created KV namespace. (Ensure the `id` matches the correct `binding`)
4. Comment out or remove `d1_databases` section in `wrangler.toml`.
5. Edit `BACKING_STORAGE` in `vars` section to `kv`.
6. `wrangler publish`
7. Visit the published URL and you should see the web interface.

## Deployment (with Bun)

1. `bun run ./src/bun-entry.ts`

## Deployment (with Docker)

1. `docker compose up -d`

## Development

### Setup env vars

Create `.dev.vars` file with the following content:

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
```

### Setup Local D1

```bash
wrangler2 d1 execute cf-webhook --local --file=./schema.sql
```

## Demo instance

* URL: https://cf-webhook.fly.dev/
* Logs: https://cf-webhook.fly.dev/logs
* Edit: https://cf-webhook.fly.dev/edit

Username: `admin`, Password: `admin`
