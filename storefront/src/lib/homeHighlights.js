import { Search, CalendarCheck, Truck, ShieldCheck, Headset, ThumbsUp } from 'lucide-react';

/**
 * Shared storefront homepage highlights so the inline sections and the
 * first-visit welcome modal always tell the same story.
 */
export const HOW_IT_WORKS = [
  {
    icon: Search,
    title: 'Browse the catalog',
    body: 'Explore available equipment with photos, daily rates, and live availability.'
  },
  {
    icon: CalendarCheck,
    title: 'Request your dates',
    body: 'Pick your rental window and send a quick booking inquiry — no account needed.'
  },
  {
    icon: Truck,
    title: 'Confirm & pick up',
    body: 'We confirm availability, then you collect your gear and get to work.'
  }
];

export const REASONS = [
  {
    icon: ShieldCheck,
    title: 'Quality you can trust',
    body: 'Every item is inspected and maintained between rentals.'
  },
  {
    icon: Headset,
    title: 'Real, responsive support',
    body: 'Questions before you book? We reply fast and clearly.'
  },
  {
    icon: ThumbsUp,
    title: 'Simple, fair pricing',
    body: 'Transparent daily rates and deposits — no surprises.'
  }
];
