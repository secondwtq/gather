
import nearley from "nearley";
import grammar from "./IntelTMAExprParserRules.js";
import { inspect } from "util";
import assert from "assert";

export default function parseExpression(src: string) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  console.log(src);
  parser.feed(src);
  const results = parser.finish();
  console.log(inspect(results, false, null, true));
  assert(results.length <= 1);
  return results.length == 1 ? results[0] : undefined;
}
