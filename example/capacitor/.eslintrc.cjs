module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["react-hooks"],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error",
  },
};
