// src/config/theme.ts
// Central design system for Mission 17 — eGovPH Branding
// All screens MUST use these tokens instead of hardcoded values.

import { Platform } from 'react-native';

// ─── COLORS ────────────────────────────────────────────────────────────────────
export const colors = {
  // Primary palette (eGovPH Navy Blue)
  primary:        '#0038A8',
  primaryDark:    '#002580',
  primaryLight:   '#e8eef9',

  // Accent palette (eGovPH Gold)
  accent:         '#FCD116',
  accentDark:     '#E6BC00',

  // Semantic status colors
  statusPending:  { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
  statusProgress: { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  statusResolved: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  statusDismissed:{ bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },

  // Neutral palette
  background:     '#f0f4f8',
  surface:        '#ffffff',
  border:         '#e2e8f0',
  borderLight:    '#f1f5f9',

  // Text
  textPrimary:    '#0f172a',
  textSecondary:  '#475569',
  textMuted:      '#94a3b8',

  // Danger
  danger:         '#dc2626',
  dangerLight:    '#fee2e2',
};

// ─── TYPOGRAPHY ──────────────────────────────────────────────────────────────
export const typography = {
  h1:     { fontSize: 24, fontWeight: '800' as const, color: colors.textPrimary },
  h2:     { fontSize: 20, fontWeight: '700' as const, color: colors.textPrimary },
  h3:     { fontSize: 16, fontWeight: '700' as const, color: colors.textPrimary },
  body:   { fontSize: 15, fontWeight: '400' as const, color: colors.textSecondary, lineHeight: 22 },
  label:  { fontSize: 13, fontWeight: '600' as const, color: colors.textSecondary },
  caption:{ fontSize: 11, fontWeight: '500' as const, color: colors.textMuted },
};

// ─── SPACING ─────────────────────────────────────────────────────────────────
export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

// ─── BORDER RADIUS ───────────────────────────────────────────────────────────
export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
};

// ─── SHADOWS ─────────────────────────────────────────────────────────────────
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
};

// ─── REUSABLE COMPONENT STYLES ───────────────────────────────────────────────
export const sharedStyles = {
  // Standard screen header with Navy Blue background
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'android' ? 44 : spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.surface,
    flex: 1,
  },
  backBtn: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
    borderRadius: radius.full,
  },

  // Standard card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },

  // Primary CTA button
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: radius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  primaryBtnText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700' as const,
  },

  // Form input
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.textPrimary,
  },

  // Chip / tag (unselected)
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.surface,
  },

  // Status badge
  statusBadge: (status: string) => {
    const map: Record<string, { bg: string; text: string; border: string }> = {
      'Pending':     colors.statusPending,
      'In Progress': colors.statusProgress,
      'Resolved':    colors.statusResolved,
      'Dismissed':   colors.statusDismissed,
    };
    const s = map[status] ?? { bg: colors.borderLight, text: colors.textMuted, border: colors.border };
    return {
      backgroundColor: s.bg,
      borderWidth: 1,
      borderColor: s.border,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.full,
    };
  },
  statusText: (status: string) => {
    const map: Record<string, string> = {
      'Pending':     colors.statusPending.text,
      'In Progress': colors.statusProgress.text,
      'Resolved':    colors.statusResolved.text,
      'Dismissed':   colors.statusDismissed.text,
    };
    return { color: map[status] ?? colors.textMuted, fontSize: 12, fontWeight: '700' as const };
  },
};
