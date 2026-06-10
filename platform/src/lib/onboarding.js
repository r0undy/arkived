import { contrastRatio } from './colors';

/**
 * Shared onboarding / activation logic (Frontend Roadmap F1).
 *
 * A single source of truth so the full-screen welcome wizard (F1.1) and the
 * persistent dashboard activation widget (F1.2) always agree on what counts as
 * "done". Completion is detected live from tenant branding + entity counts.
 */

export const DEFAULT_ACCENT = '#6366f1';

/**
 * The activation checklist. Order defines the "next best action" priority.
 * `optional` items don't block 100% core activation but still surface.
 */
export const ACTIVATION_STEPS = [
  {
    id: 'upload_logo',
    label: 'Upload your logo',
    hint: 'Pick a preset or upload your own mark.',
    href: '/dashboard/settings/branding'
  },
  {
    id: 'set_accent_color',
    label: 'Choose your accent color',
    hint: 'Used across your storefront — must pass AA contrast.',
    href: '/dashboard/settings/branding'
  },
  {
    id: 'add_first_equipment',
    label: 'Add your first item',
    hint: 'Your storefront needs at least one thing to rent.',
    href: '/dashboard/equipment'
  },
  {
    id: 'set_contact_details',
    label: 'Set contact details',
    hint: 'So customers can reach you.',
    href: '/dashboard/settings/branding'
  },
  {
    id: 'invite_team_member',
    label: 'Invite a team member',
    hint: 'Optional — bring your crew aboard.',
    href: '/dashboard/settings/team',
    optional: true
  },
  {
    id: 'share_storefront',
    label: 'Share your storefront link',
    hint: 'Copy your public URL and send it out.',
    href: '/dashboard/settings/branding',
    optional: true
  }
];

/**
 * Compute which activation steps are complete from live data.
 * @param {object} tenant - tenant branding/profile record
 * @param {object} counts - { equipmentCount, staffCount }
 * @returns {string[]} ids of completed steps
 */
export function computeCompletedSteps(tenant, { equipmentCount = 0, staffCount = 0 } = {}) {
  if (!tenant) return [];
  const done = [];

  if (tenant.logo_url) done.push('upload_logo');
  if (contrastRatio(tenant.accent_color, '#ffffff') >= 4.5) done.push('set_accent_color');
  if (equipmentCount > 0) done.push('add_first_equipment');
  if (tenant.contact_email || tenant.contact_phone) done.push('set_contact_details');
  if (staffCount > 1) done.push('invite_team_member');

  // "share_storefront" is acknowledged by the user, not auto-detected — it is
  // merged in from the persisted onboarding_completed_steps below.
  const persisted = Array.isArray(tenant.onboarding_completed_steps)
    ? tenant.onboarding_completed_steps
    : [];
  if (persisted.includes('share_storefront')) done.push('share_storefront');

  return Array.from(new Set(done));
}

/**
 * Activation summary used by both the widget and the wizard.
 */
export function activationSummary(tenant, counts) {
  const completed = computeCompletedSteps(tenant, counts);
  const completedSet = new Set(completed);
  const core = ACTIVATION_STEPS.filter((step) => !step.optional);
  const coreDone = core.filter((step) => completedSet.has(step.id)).length;
  const totalDone = ACTIVATION_STEPS.filter((step) => completedSet.has(step.id)).length;
  const nextStep = ACTIVATION_STEPS.find((step) => !completedSet.has(step.id)) || null;

  return {
    completed,
    completedSet,
    coreDone,
    coreTotal: core.length,
    totalDone,
    total: ACTIVATION_STEPS.length,
    percent: Math.round((coreDone / core.length) * 100),
    coreComplete: coreDone === core.length,
    nextStep
  };
}

/**
 * Whether a freshly-loaded tenant should be routed into the welcome wizard.
 * Brand-new = no equipment AND default/empty branding AND not previously skipped.
 */
export function shouldRouteToWelcome(tenant, { equipmentCount = 0 } = {}) {
  if (!tenant) return false;
  if (typeof window !== 'undefined' && localStorage.getItem('arkived_welcome_dismissed') === '1') {
    return false;
  }
  const hasLogo = Boolean(tenant.logo_url);
  const hasItems = equipmentCount > 0;
  const persisted = Array.isArray(tenant.onboarding_completed_steps)
    ? tenant.onboarding_completed_steps
    : [];
  const touched = persisted.length > 0;
  return !hasLogo && !hasItems && !touched;
}

export function dismissWelcome() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('arkived_welcome_dismissed', '1');
  }
}

/**
 * The step the welcome wizard persists on its final ("Go live") screen. Its
 * presence is the single source of truth for "onboarding finished" — it gates
 * dashboard access and publishes the public storefront.
 */
export const GO_LIVE_STEP = 'go_live';

/**
 * Whether the tenant has finished onboarding and may use the dashboard /
 * have a live storefront. Tenants that already have at least one item to rent
 * (e.g. seeded or pre-onboarding accounts) are treated as onboarded so they are
 * never locked out by the gate.
 * @param {object} tenant
 * @param {object} [counts] - { equipmentCount }
 */
export function isOnboarded(tenant, { equipmentCount = 0 } = {}) {
  if (!tenant) return false;
  const steps = Array.isArray(tenant.onboarding_completed_steps)
    ? tenant.onboarding_completed_steps
    : [];
  if (steps.includes(GO_LIVE_STEP)) return true;
  return equipmentCount > 0;
}
