import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  rules: {
    "vue/require-default-prop": "off",
    "vue/multi-word-component-names": "off",
    "vue/no-multiple-template-root": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["error", { allow: ["warn", "error"] }],
  },
});
