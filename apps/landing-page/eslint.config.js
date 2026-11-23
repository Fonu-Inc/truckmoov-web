import truckmoov from "@truckmoov/app-core/eslint-config";

export default truckmoov(
  {},
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // The first two entries are antfu's TypeScript defaults; this rule
      // replaces the array, so they must be kept.
      "no-restricted-syntax": [
        "error",
        "TSEnumDeclaration[const=true]",
        "TSExportAssignment",
        {
          // React Compiler memoises `form.watch("x")` on `form`, which never
          // changes, so the value freezes at its first read (a picked State
          // left City disabled). `form.watch(callback)` is a subscription and
          // stays allowed.
          selector: "CallExpression[callee.property.name='watch'][arguments.0.type!='ArrowFunctionExpression'][arguments.0.type!='FunctionExpression']",
          message: "React Compiler memoises form.watch(); read form values in render with useWatch({ control, name }).",
        },
        {
          selector: "JSXExpressionContainer CallExpression[callee.property.name='getValues']",
          message: "React Compiler memoises form.getValues() in JSX; read form values in render with useWatch({ control, name }).",
        },
      ],
    },
  },
);
