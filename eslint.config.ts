import antfu from "@antfu/eslint-config";

export default antfu({
  type: "lib",
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  stylistic: {
    indent: 2,
    quotes: "double",
    semi: true,
  },
  ignores: [
    "node_modules/**",
  ],
  rules: {
    "no-console": "off",
    "ts/no-explicit-any": "warn",
  },
});
