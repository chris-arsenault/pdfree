import ts from "typescript";

export type CopyViolation = { start: number; length: number; reason: string };
const copyProperties = new Set([
  "label",
  "title",
  "detail",
  "hint",
  "description",
  "message",
  "confirmLabel",
  "finding",
  "placeholder",
  "alt",
  "aria-label",
  "aria-description",
  "aria-valuetext",
  "progress",
  "error",
]);
const messageCalls = new Set([
  "notify",
  "progress",
  "setError",
  "setNotice",
  "setDone",
  "setStatus",
  "run",
]);
// These identify products, a standard paper size, a bundled font and keyboard keys.
const technicalText = new Set([
  "PDFree",
  "AHARA",
  "PDF",
  "A4",
  "Noto Sans",
  "Ctrl/⌘ Z",
  "Ctrl/⌘ Shift Z",
]);
const hasText = (value: string) => /\p{L}/u.test(value) && !technicalText.has(value.trim());

/** Syntax plus local symbol tracing; runtime document/user strings remain opaque. */
export function findHardcodedCopy(source: string, filename = "component.tsx"): CopyViolation[] {
  const guard = new CopyGuard(source, filename);
  guard.visit(guard.file);
  return [...guard.found.values()];
}
class CopyGuard {
  readonly file: ts.SourceFile;
  readonly checker: ts.TypeChecker;
  readonly found = new Map<number, CopyViolation>();
  constructor(source: string, filename: string) {
    this.file = ts.createSourceFile(
      filename,
      source,
      ts.ScriptTarget.Latest,
      true,
      filename.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
    const host = ts.createCompilerHost({ noResolve: true, noLib: true });
    host.getSourceFile = (name) => (name === filename ? this.file : undefined);
    this.checker = ts
      .createProgram([filename], { noResolve: true, noLib: true }, host)
      .getTypeChecker();
  }
  report(node: ts.Node, reason: string) {
    this.found.set(node.getStart(this.file), {
      start: node.getStart(this.file),
      length: node.getWidth(this.file),
      reason,
    });
  }
  visible(node: ts.Node, seen = new Set<ts.Node>()): void {
    if (seen.has(node)) return;
    seen.add(node);
    if (ts.isStringLiteralLike(node)) {
      if (hasText(node.text)) this.report(node, "Catalog this interface text.");
    } else if (ts.isTemplateExpression(node)) {
      if (hasText(node.head.text) || node.templateSpans.some((span) => hasText(span.literal.text)))
        this.report(node, "Use one complete catalog message with interpolation.");
      node.templateSpans.forEach((span) => this.visible(span.expression, seen));
    } else if (ts.isIdentifier(node)) this.traceLocal(node, seen);
    else this.composite(node, seen);
  }
  traceLocal(node: ts.Identifier, seen: Set<ts.Node>) {
    this.checker.getSymbolAtLocation(node)?.declarations?.forEach((declaration) => {
      if (ts.isVariableDeclaration(declaration) && declaration.initializer)
        this.visible(declaration.initializer, seen);
      if (ts.isParameter(declaration) && declaration.initializer)
        this.visible(declaration.initializer, seen);
    });
  }
  composite(node: ts.Node, seen: Set<ts.Node>) {
    if (ts.isConditionalExpression(node)) {
      this.visible(node.whenTrue, seen);
      this.visible(node.whenFalse, seen);
    } else if (ts.isBinaryExpression(node)) {
      this.visible(node.right, seen);
      if (node.operatorToken.kind === ts.SyntaxKind.PlusToken) this.visible(node.left, seen);
    } else if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node))
      this.visible(node.expression, seen);
  }
  markup(node: ts.Node) {
    if (ts.isJsxText(node) && hasText(node.text.trim()))
      this.report(node, "Catalog this visible JSX text.");
    if (ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent))
      this.visible(node.expression);
    if (ts.isJsxAttribute(node)) this.attribute(node);
  }
  attribute(node: ts.JsxAttribute) {
    if (!copyProperties.has(node.name.getText(this.file)) || !node.initializer) return;
    const value = node.initializer;
    this.visible(ts.isJsxExpression(value) ? (value.expression ?? value) : value);
  }
  boundary(node: ts.Node) {
    if (
      ts.isPropertyAssignment(node) &&
      copyProperties.has(node.name.getText(this.file).replace(/["']/g, ""))
    )
      this.visible(node.initializer);
    if (ts.isCallExpression(node)) this.call(node);
    if (ts.isNewExpression(node)) this.exception(node);
  }
  call(node: ts.CallExpression) {
    const name = ts.isPropertyAccessExpression(node.expression)
      ? node.expression.name.text
      : node.expression.getText(this.file);
    if (messageCalls.has(name) && node.arguments[0]) this.visible(node.arguments[0]);
    if (["tr", "text", "renderMessage"].includes(name) && moduleEvaluation(node))
      this.report(
        node,
        "Resolve translations during rendering or an action, not module initialization."
      );
  }
  exception(node: ts.NewExpression) {
    if (!["Error", "DOMException"].includes(node.expression.getText(this.file))) return;
    if (node.arguments?.[0]) this.visible(node.arguments[0]);
  }
  visit(node: ts.Node) {
    this.markup(node);
    this.boundary(node);
    ts.forEachChild(node, (child) => this.visit(child));
  }
}
function moduleEvaluation(node: ts.Node): boolean {
  let parent = node.parent;
  while (parent) {
    if (ts.isFunctionLike(parent)) return false;
    if (ts.isSourceFile(parent)) return true;
    parent = parent.parent;
  }
  return false;
}
