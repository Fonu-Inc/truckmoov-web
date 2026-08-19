import antfu from "@antfu/eslint-config";
import tanstackPluginQuery from "@tanstack/eslint-plugin-query";

/**
 * Shared ESLint config for the Vite + React apps in this monorepo.
 *
 * Usage — apps/<app>/eslint.config.js:
 *   import truckmoov from "@truckmoov/app-core/eslint-config";
 *   export default truckmoov();
 *
 * @param {Parameters<typeof antfu>[0]} [options] antfu options, merged over the defaults
 * @param {...import("eslint").Linter.Config} userConfigs extra flat configs
 */
export default function truckmoov(options = {}, ...userConfigs) {
  return antfu(
    {
      type: "app",
      react: true,
      // Pinned: antfu auto-detects VSCODE_PID/JETBRAINS_IDE and silently disables
      // rules, so lint in the IDE terminal disagreed with CI. Never guess.
      isInEditor: false,
      formatters: true,
      stylistic: {
        quotes: "double",
        indent: 2,
        semi: true,
      },
      ignores: ["**/dist/**"],
      ...options,
    },
    {
      // tanstack query integration
      plugins: { "@tanstack/query": tanstackPluginQuery },

      rules: {
        // tanstack query integration
        ...tanstackPluginQuery.configs.recommended.rules,

        "style/object-curly-newline": [
          "error",
          {
            multiline: true,
            minProperties: 2,
          },
        ],
        // "multiline-arguments", not minItems — a lone multiline argument (JSX,
        // an object) must be allowed to break, or this fights consistent-list-newline
        // and --fix never converges.
        "style/function-paren-newline": [
          "error",
          "multiline-arguments",
        ],
        "style/array-bracket-newline": [
          "error",
          {
            multiline: true,
            minItems: 2,
          },
        ],
        "style/array-element-newline": [
          "error",
          {
            multiline: true,
            minItems: 2,
          },
        ],
        "style/function-call-argument-newline": [
          "error",
          "always",
        ],
        "style/jsx-max-props-per-line": [
          "error",
          { maximum: 1 },
        ],
        "perfectionist/sort-imports": "error",
        "ts/consistent-type-definitions": [
          "error",
          "type",
        ],
        // Off because the style/*-newline rules above already decide list layout,
        // and the two disagree — leaving both on makes --fix oscillate forever.
        "antfu/consistent-list-newline": "off",
        // Off: fires on idiomatic nested JSX render ternaries and has no autofix
        // inside a JSX expression container, so --fix can never clear it.
        "style/multiline-ternary": "off",
        "no-console": "warn",
        "antfu/no-top-level-await": "off",
        "node/no-process-env": "error",
        "node/prefer-global/process": "off",
        "unicorn/filename-case": "off",
      },
    },
    {
      // A context module exports its provider component next to its consumer hook.
      // That costs Fast Refresh granularity on one file and is the React convention,
      // so the rule is off here rather than splitting every context in two.
      files: ["**/contexts/**"],
      rules: { "react-refresh/only-export-components": "off" },
    },
    ...userConfigs,
  );
}
