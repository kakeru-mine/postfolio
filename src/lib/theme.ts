export type ThemeColors = {
  background: string;
  main: string;
  accent: string;
  sidebar: string;
};

export const DEFAULT_THEME: ThemeColors = {
  background: "#ffffff",
  main: "#2563eb",
  accent: "#ff6b6b",
  sidebar: "#172554",
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function normalizeTheme(theme: Partial<ThemeColors>): ThemeColors {
  return {
    background: normalizeColor(theme.background, DEFAULT_THEME.background),
    main: normalizeColor(theme.main, DEFAULT_THEME.main),
    accent: normalizeColor(theme.accent, DEFAULT_THEME.accent),
    sidebar: normalizeColor(theme.sidebar, DEFAULT_THEME.sidebar),
  };
}

export function getThemeCssVariables(theme: ThemeColors) {
  const normalized = normalizeTheme(theme);

  return {
    "--canvas": normalized.background,
    "--primary": normalized.main,
    "--primary-end": mixHex(normalized.main, "#7c3aed", 0.72),
    "--primary-dark": mixHex(normalized.main, "#000000", 0.2),
    "--accent-soft": mixHex(normalized.main, "#ffffff", 0.88),
    "--primary-soft": mixHex(normalized.main, "#ffffff", 0.9),
    "--primary-rgb": hexToRgb(normalized.main).join(" "),
    "--primary-foreground": getContrastColor(normalized.main),
    "--action": normalized.accent,
    "--action-end": mixHex(normalized.accent, "#f59e0b", 0.62),
    "--action-dark": mixHex(normalized.accent, "#000000", 0.16),
    "--action-foreground": getContrastColor(normalized.accent),
    "--sidebar": normalized.sidebar,
    "--sidebar-foreground": getContrastColor(normalized.sidebar),
  };
}

function normalizeColor(value: string | undefined, fallback: string) {
  return value && HEX_COLOR.test(value) ? value.toLowerCase() : fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.slice(1);
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function mixHex(color: string, target: string, weight: number) {
  const sourceRgb = hexToRgb(color);
  const targetRgb = hexToRgb(target);
  const mixed = sourceRgb.map((channel, index) =>
    Math.round(channel + (targetRgb[index] - channel) * weight),
  );

  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function getContrastColor(color: string) {
  const [red, green, blue] = hexToRgb(color).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

  return luminance > 0.28 ? "#0f172a" : "#ffffff";
}
