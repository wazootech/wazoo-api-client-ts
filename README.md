# @wazoo/api

Minimal TypeScript SDK for the Wazoo Platform API.

```ts
import { createClient } from "@wazoo/api";

const wazoo = createClient({
  org: "acme",
  token: process.env.WAZOO_API_TOKEN!,
});

const worlds = await wazoo.worlds.list();
const world = await wazoo.worlds.create({
  worldId: "my-world",
  world: { displayName: "My World" },
});
const authToken = await wazoo.worlds.createToken("my-world");
```

## Configuration

```ts
createClient({
  org: "acme",
  token: "wazoo_platform_api_token",
  baseUrl: "https://api.wazoo.dev/v1/", // optional
});
```

`token` can be a string or an async function:

```ts
const wazoo = createClient({
  org: "acme",
  token: async () => getFreshToken(),
});
```

## Resources

- `organizations`: list, get, update, delete
- `worlds`: list, get, create, delete, undelete, sync, createToken, rotateTokens, usage
- `apiTokens`: list, create, revoke, validate Platform API tokens
- `usage`: get organization usage
- `billing`: get Stripe-shaped billing summary, invoices, portal session

Platform API tokens (`apiTokens`) authenticate management API calls. World auth tokens (`worlds.createToken`, `worlds.rotateTokens`) are scoped to data-plane access for a specific World.

## Development

```sh
npm install
npm run typecheck
npm run build
npm test
```
