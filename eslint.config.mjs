import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // All flagged inline styles are dynamic (runtime colors, transforms, CSS
    // masks, font families from data) and cannot be moved to static CSS files.
    rules: {
      "react/no-inline-styles": "off",
      "react/forbid-dom-props": "off",
      "@next/next/no-css-inline-style": "off",
    },
  },
]);

export default eslintConfig;
