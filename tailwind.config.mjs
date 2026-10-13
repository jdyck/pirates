// Tailwind 3 keeps the generated utilities compatible with iPadOS 15 Safari.
export default {
  content: ["./app/**/*.{js,jsx}"],
  corePlugins: { preflight: false },
  theme: {
    screens: {
      sm: "641px",
      md: "769px",
      lg: "1101px",
      xl: "1401px",
      compact: { raw: "(max-width: 640px)" },
      stacked: { raw: "(max-width: 768px), (orientation: portrait) and (max-width: 1100px)" },
      sidebar: { raw: "(min-width: 769px) and (max-width: 1400px) and (orientation: landscape), (min-width: 1101px) and (max-width: 1400px)" },
      "dual-board": { raw: "(min-width: 1401px)" },
    },
    extend: {
      width: { 138: "34.5rem", 220: "55rem", 357: "89.25rem" },
      colors: {
        paper: "var(--paper)", muted: "var(--muted)", faint: "var(--faint)",
        aqua: "var(--aqua)", "aqua-bright": "var(--aqua-bright)",
        coral: "var(--coral)", "ocean-950": "var(--ocean-950)",
      },
      fontFamily: { sans: "var(--sans)", display: "var(--display)" },
    },
  },
};
