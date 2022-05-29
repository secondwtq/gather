
import { BaseNode, IdentifierNode, ConstantNode, OperationNode } from "./IntelTMAExprParserNodes.js";

export default {
  identifier([initial, chars]: [string, string[]]): string {
    return [initial].concat(chars).join('');
  },

  identifierWithAnnotation([identifier, annotations]: [string, string[]]): BaseNode {
    return new IdentifierNode(identifier, annotations);
  },

  constant([decimal]: [number]): BaseNode {
    return new ConstantNode(decimal);
  },

  binaryExpression([lhs, , operator, , rhs]: [BaseNode, any, string, any, BaseNode]): BaseNode {
    return new OperationNode(operator, [lhs, rhs]);
  },

  functionCallExpression([funcName, , args]: [string, any, [any, BaseNode][]]): BaseNode {
    return new OperationNode(funcName, args.map((arg) => arg[1]));
  },

  conditionalExpression([thenBranch, , , , cond, , , , elseBranch]: [BaseNode, any, any, any, BaseNode, any, any, any, BaseNode]): BaseNode {
    return new OperationNode("cond", [cond, thenBranch, elseBranch]);
  }
};
