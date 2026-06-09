# Arkived Cloudflare Host Router

This Worker routes by hostname:

- `arkived.dev` and `www.arkived.dev` -> platform origin
- `*.arkived.dev` -> storefront origin

## Deploy

1. Install Wrangler (if needed):
   - `npm i -g wrangler`
2. Authenticate:
   - `wrangler login`
3. Review `wrangler.toml` variables:
   - `ROOT_DOMAIN`
   - `PLATFORM_ORIGIN`
   - `STOREFRONT_ORIGIN`
   - `API_ORIGIN`
4. Deploy:
   - `wrangler deploy`

## DNS and Route binding

In Cloudflare DNS:

1. `CNAME` `@` -> `<platform>.azurestaticapps.net` (Proxied)
2. `CNAME` `www` -> `<platform>.azurestaticapps.net` (Proxied)
3. `CNAME` `*` -> `<platform>.azurestaticapps.net` (Proxied)
4. `CNAME` `api` -> `<api>.azurewebsites.net` (DNS only or Proxied per your API preference)

Then attach custom domains/routes to the Worker for:

- `arkived.dev/*`
- `www.arkived.dev/*`
- `*.arkived.dev/*`

Dashboard path (2026 UI):
1. `Workers & Pages` -> select `arkived-host-router`
2. `Settings` -> `Domains & Routes`
3. `Add` -> `Route`

## Quick checks

- `https://arkived.dev/_edge/health`
- `https://foo.arkived.dev/_edge/health`

Both should return JSON with `"ok": true`.
