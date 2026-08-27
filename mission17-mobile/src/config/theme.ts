// src/config/theme.ts
// Premium Civic & Fintech Design System for Barangay Bagong Pag-asa (BrgyLink)
// Clean, authoritative, accessible, and high-contrast.

import { Platform } from 'react-native';

// ─── COLORS ────────────────────────────────────────────────────────────────────
export const colors = {
  // Primary palette (Vibrant eGovPH / Barangay Royal Blue)
  primary:        '#0038A8',
  primaryDark:    '#002580',
  primaryLight:   '#EBF3FB',
  primaryAccent:  '#1D4ED8',

  // Accent palette
  accent:         '#2563EB',
  accentLight:    '#EFF6FF',

  // Semantic status colors (Subtle, elegant tinted pills)
  statusPending:  { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  statusProgress: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  statusResolved: { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  statusDismissed:{ bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },

  // Neutral palette
  background:     '#F8FAFC',
  surface:        '#FFFFFF',
  surfaceSubtle:  '#F1F5F9',
  border:         '#E2E8F0',
  borderLight:    '#F1F5F9',

  // Text
  textPrimary:    '#0F172A',
  textSecondary:  '#475569',
  textMuted:      '#94A3B8',

  // Danger
  danger:         '#DC2626',
  dangerLight:    '#FEE2E2',
};

// ─── TYPOGRAPHY ──────────────────────────────────────────────────────────────
export const typography = {
  h1:     { fontSize: 24, fontWeight: '800' as const, color: colors.textPrimary, letterSpacing: -0.5 },
  h2:     { fontSize: 19, fontWeight: '700' as const, color: colors.textPrimary, letterSpacing: -0.3 },
  h3:     { fontSize: 15.5, fontWeight: '700' as const, color: colors.textPrimary },
  body:   { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary, lineHeight: 21 },
  label:  { fontSize: 12.5, fontWeight: '700' as const, color: colors.textSecondary },
  caption:{ fontSize: 11.5, fontWeight: '500' as const, color: colors.textMuted },
};

// ─── SPACING ─────────────────────────────────────────────────────────────────
export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  20,
  xl:  28,
  xxl: 40,
};

// ─── BORDER RADIUS ───────────────────────────────────────────────────────────
export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 9999,
};

// ─── SHADOWS ─────────────────────────────────────────────────────────────────
export const shadow = {
  sm: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
};

// ─── REUSABLE COMPONENT STYLES ───────────────────────────────────────────────
export const sharedStyles = {
  // Standard screen header
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -0.2,
    flex: 1,
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
    borderRadius: radius.full,
  },

  // Standard card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },

  // Primary CTA button
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },

  // Form input
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14.5,
    color: colors.textPrimary,
    ...Platform.select({ web: { outlineStyle: 'none' as any } }),
  },

  // Chip / tag (unselected)
  chip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#F8FAFC',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800' as const,
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
      paddingHorizontal: 9,
      paddingVertical: 3.5,
      borderRadius: radius.sm,
    };
  },
  statusText: (status: string) => {
    const map: Record<string, string> = {
      'Pending':     colors.statusPending.text,
      'In Progress': colors.statusProgress.text,
      'Resolved':    colors.statusResolved.text,
      'Dismissed':   colors.statusDismissed.text,
    };
    return { color: map[status] ?? colors.textMuted, fontSize: 11.5, fontWeight: '700' as const };
  },
};

