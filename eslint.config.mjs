import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/routes.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "TemplateLiteral[expressions.length>=2]:has(TemplateElement[value.raw*='/projects/'])",
          message:
            "Hardcoded project detail URLs are not allowed. Use buildProjectUrl() or buildProjectAbsoluteUrl() from '@/lib/routes'.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
