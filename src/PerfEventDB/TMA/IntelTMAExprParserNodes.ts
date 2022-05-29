export abstract class BaseNode { }

// TODO: This mirror of ASTNode definitions is not necessary
export class IdentifierNode extends BaseNode {
  constructor(public name: string, public annotations: string[]) { super(); }
}

export class ConstantNode extends BaseNode {
  constructor(public value: number) { super(); }
}

export class OperationNode extends BaseNode {
  constructor(public operator: string, public operands: BaseNode[]) { super(); }
}

export class EmptyNode extends BaseNode {
  constructor() { super(); }
}
