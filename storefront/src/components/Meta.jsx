/**
 * Centralized storefront SEO/social metadata using React 19 native document
 * metadata hoisting (no helmet). Renders title, description, canonical,
 * Open Graph + Twitter cards. Per-tenant favicon/theme-color are injected
 * separately in useTenant.
 */
export default function Meta({ tenant, title, description, path = '', image = '' }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = `${origin}${path}`;
  const ogImage = image || tenant?.og_image_url || tenant?.banner_image_url || tenant?.logo_url || '';
  const siteName = tenant?.name || 'Arkived';

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}

      <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
    </>
  );
}
