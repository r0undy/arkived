export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = (request.headers.get("host") || "").toLowerCase();
    const rootDomain = (env.ROOT_DOMAIN || "arkived.dev").toLowerCase();
    const platformOrigin = env.PLATFORM_ORIGIN;
    const storefrontOrigin = env.STOREFRONT_ORIGIN;
    const apiOrigin = env.API_ORIGIN || "";
    const apiHost = `api.${rootDomain}`;

    if (!platformOrigin || !storefrontOrigin) {
      return new Response("Missing PLATFORM_ORIGIN or STOREFRONT_ORIGIN", {
        status: 500,
      });
    }

    // Simple operational probe for edge routing health checks.
    if (url.pathname === "/_edge/health") {
      return new Response(
        JSON.stringify({
          ok: true,
          host,
          rootDomain,
          mode: "cloudflare-host-router",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const isApex = host === rootDomain || host === `www.${rootDomain}`;
    const isApiHost = host === apiHost;
    const isTenantSubdomain = host.endsWith(`.${rootDomain}`) && !isApex;
    const targetOrigin = isApiHost && apiOrigin
      ? apiOrigin
      : isApex
        ? platformOrigin
        : isTenantSubdomain
          ? storefrontOrigin
          : platformOrigin;

    const upstreamUrl = new URL(request.url);
    upstreamUrl.protocol = "https:";
    upstreamUrl.host = targetOrigin;

    const upstreamRequest = new Request(upstreamUrl.toString(), request);
    upstreamRequest.headers.set("x-forwarded-host", host);
    upstreamRequest.headers.set("x-arkived-routing-mode", "cloudflare-worker");

    return fetch(upstreamRequest);
  },
};
