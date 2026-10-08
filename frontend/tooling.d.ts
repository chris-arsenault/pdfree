declare module "@ahara/standards/eslint-rules" {
  type Rule = import("eslint").Rule.RuleModule;
  export const maxJsxProps: Rule;
  export const noInlineStyles: Rule;
  export const noDirectFetch: Rule;
  export const noDirectStoreImport: Rule;
  export const noEscapeHatches: Rule;
  export const noManualAsyncState: Rule;
  export const noManualExpandState: Rule;
  export const noManualViewHeader: Rule;
  export const noNonVitestTesting: Rule;
  export const noRawUndefinedUnion: Rule;
  export const noJsFileExtension: Rule;
}
declare module "eslint-plugin-react-perf" {
  const plugin: import("eslint").ESLint.Plugin;
  export default plugin;
}
declare module "eslint-plugin-jsx-a11y" {
  const plugin: {
    rules: import("eslint").ESLint.Plugin["rules"];
    configs: { recommended: { rules: import("eslint").Linter.RulesRecord } };
  };
  export default plugin;
}
