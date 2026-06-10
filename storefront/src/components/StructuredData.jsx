/**
 * JSON-LD structured data (Frontend Roadmap F5.5) using React 19 native
 * metadata hoisting. Improves search appearance for the shop + equipment.
 */
export function ProductJsonLd({ tenant, item }) {
  if (!item) return null;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.name,
    description: item.description || `${item.name} available to rent from ${tenant?.name || 'our shop'}.`,
    category: item.category,
    ...(item.images?.[0]?.storage_url ? { image: item.images[0].storage_url } : {}),
    brand: { '@type': 'Brand', name: tenant?.name || 'Arkived' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PHP',
      price: Number(item.daily_rate || 0),
      availability:
        item.status === 'available'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: `${origin}/catalog/${item.id}`
    }
  };

  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}

export function LocalBusinessJsonLd({ tenant }) {
  if (!tenant) return null;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: tenant.name,
    url: origin,
    ...(tenant.logo_url ? { logo: tenant.logo_url, image: tenant.logo_url } : {}),
    ...(tenant.contact_email ? { email: tenant.contact_email } : {}),
    ...(tenant.contact_phone ? { telephone: tenant.contact_phone } : {}),
    ...(tenant.contact_address ? { address: tenant.contact_address } : {}),
    ...(tenant.tagline ? { description: tenant.tagline } : {})
  };

  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}
