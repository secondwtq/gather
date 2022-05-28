
class BaseNode { }

class IdentifierNode extends BaseNode {
  constructor(public name: string) { super(); }
}

class ConstantNode extends BaseNode {
  constructor(public value: number) { super(); }
}

class OperationNode extends BaseNode {
  constructor(public operator: string, public operands: BaseNode[]) { super(); }
}

class EmptyNode extends BaseNode {
  constructor() { super(); }
}

export default {
  identifier([initial, chars]: [string, string[]]): string {
    return [initial].concat(chars).join('');
  },

  identifierWithAnnotation([identifier, annotations]: [string, string[]]): BaseNode {
    return new IdentifierNode(identifier);
  },

  constant([decimal]: [number]) {
    return new ConstantNode(decimal);
  },

  binaryExpression([lhs, , operator, , rhs]: [BaseNode, any, string, any, BaseNode]) {
    return new OperationNode(operator, [lhs, rhs]);
  },
}