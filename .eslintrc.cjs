/* eslint-disable */
module.exports = {
  root: true,
  env: { browser: true, node: true, es2021: true },
  extends: [
    "eslint:recommended",
    "next",
    "next/core-web-vitals",
    "plugin:jsx-a11y/recommended",
    "plugin:import/recommended",
    "plugin:tailwindcss/recommended",
    "prettier"
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true }
  },
  plugins: ["import", "jsx-a11y", "simple-import-sort", "tailwindcss"],
  settings: {
    react: { version: "detect" },
    // читаємо alias "@/..." прямо з jsconfig.json
    "import/resolver": {
      node: { extensions: [".js", ".jsx"] },
      jsconfig: { config: "jsconfig.json" }
    },
    tailwindcss: {
      callees: ["cn", "clsx", "cva"],
      config: "tailwind.config.js"
    }
  },
  rules: {
    "simple-import-sort/imports": "warn",
    "simple-import-sort/exports": "warn",
    "import/newline-after-import": "warn",
    "import/no-duplicates": "warn",
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "react/react-in-jsx-scope": "off",
    "tailwindcss/no-custom-classname": "off"
  },
  overrides: [
    // 1) Клієнтські файли (менш специфічне правило — ставимо РАНІШЕ)
    { files: ["src/components/**/*.{js,jsx}", "src/app/**/*.{js,jsx}"], env: { browser: true, node: false } },
    // 2) API/сервер (більш специфічне — ставимо ПІЗНІШЕ, щоб перекрило перше)
    { files: ["src/app/api/**/*.{js,jsx}", "src/lib/**/*.{js,jsx}"], env: { node: true, browser: false } },
    // 3) prisma/міграції — поза лінтом
    { files: ["prisma/**/*"], rules: { "import/no-unresolved": "off" } }
  ],
  ignorePatterns: [".next/", "public/", "node_modules/", "prisma/migrations/", "node_modules/zod/"]
};
