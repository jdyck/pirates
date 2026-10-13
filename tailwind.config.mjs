// Tailwind 3 keeps the generated utilities compatible with iPadOS 15 Safari.
export default {
  content: ["./app/**/*.{js,jsx}"],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        muted: "var(--muted)",
      },
      fontFamily: { display: "var(--display)" },
    },
  },
};
