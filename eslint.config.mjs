import { type NextConfig } from "next";

// ESLint flat config for Next.js 15
const eslintConfig = [
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];

module.exports = eslintConfig;
