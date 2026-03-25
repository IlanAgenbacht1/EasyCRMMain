// =============================================================================
// Configurable Lists — Hardcoded (Spec Section 6)
// =============================================================================

export const FUNNEL_STAGES = [
  "Lead",
  "Qualified",
  "Discovery",
  "Proposal",
  "Demo",
  "Negotiation",
  "Closed",
] as const;

export const STATUSES = [
  "Open",
  "Won",
  "Lost",
  "On Hold",
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];
export type Status = (typeof STATUSES)[number];

/**
 * Validate that a value is a valid funnel stage.
 */
export function isValidFunnelStage(value: string): value is FunnelStage {
  return (FUNNEL_STAGES as readonly string[]).includes(value);
}

/**
 * Validate that a value is a valid status.
 */
export function isValidStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}
