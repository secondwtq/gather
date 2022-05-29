
import nearley from "nearley";
import grammar from "./IntelTMAExprParserRules.js";
import assert from "assert";
import { BaseNode, ConstantNode, EmptyNode, IdentifierNode, OperationNode } from "./IntelTMAExprParserNodes.js";
import { Base, Constant, DerivedDef, DerivedUse, Empty, Operation, Operator, RawEvent } from "./ASTNode.js";
import { unreachable } from "../../utils.js";
import { ToStringFullVisitor } from "./Visitors.js";

function parseExpressionToParserAST(src: string): BaseNode {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed(src);
  const results = parser.finish();
  assert(results.length <= 1);
  return results.length == 1 ? results[0] : new EmptyNode();
}

interface ParseContext {
  derives: Map<string, DerivedDef>;
}

function getOperator(operator: string): Operator {
  switch (operator) {
    case "+": return Operator.Addition;
    case "-": return Operator.Subtraction;
    case "*": return Operator.Multiplication;
    case "/": return Operator.Division;
    case "<": return Operator.LessThan;
    case ">": return Operator.GreaterThan;
    case "==": return Operator.Equal;
    case "max": return Operator.Maximum;
    case "min": return Operator.Minimum;
    case "cond": return Operator.Conditional;
    default: return unreachable();
  }
}

function transformOperationNode(context: ParseContext, node: OperationNode): Operation {
  return new Operation(getOperator(node.operator),
    node.operands.map((operand) => transformParserAST(context, operand)));
}

function transformIdentifierNode(context: ParseContext, node: IdentifierNode): Base {
  if (node.name == "#NA") {
    assert(node.annotations.length == 0);
    return new Empty();
  }
  if (context.derives.has(node.name)) {
    assert(node.annotations.length == 0);
    return new DerivedUse(context.derives.get(node.name)!);
  }

  return new RawEvent(node.name, node.annotations);
}

function transformParserAST(context: ParseContext, node: BaseNode): Base {
  if (node instanceof IdentifierNode) {
    return transformIdentifierNode(context, node);
  } else if (node instanceof ConstantNode) {
    return new Constant(node.value);
  } else if (node instanceof OperationNode) {
    return transformOperationNode(context, node);
  } else if (node instanceof EmptyNode) {
    return new Empty();
  }
  return unreachable();
}

export default function parseExpression(context: ParseContext, src: string): Base {
  const parserAST = parseExpressionToParserAST(src);
  const ast = transformParserAST(context, parserAST);
  return ast;
}
