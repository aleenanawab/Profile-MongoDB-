import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    "**/node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "Avtive-Profiles/**",
    "scripts/**",
    "scratch/**",
    ".agents/**",
    ".agent/**",
    ".gsd/**",
    ".gemini/**",
    "legacy/**",
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/set-state-in-effect": "warn"
    }
  },
  {
    files: ["tests/**"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react-compiler/react-compiler": "off",
      "react-hooks/globals": "off"
    }
  }
]);

export default eslintConfig;
