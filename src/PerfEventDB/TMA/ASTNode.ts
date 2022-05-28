
export enum Kind {
  Node,
  Metric,
  Auxiliary,
}

export interface NodeVisitor<TRet> {
  derived(node: Derived): TRet;
  operation(node: Operation): TRet;
  rawEvent(node: RawEvent): TRet;
  constant(node: Constant): TRet;
  placeholder(node: Placeholder): TRet;
}

abstract class Base {
  annotation?: string;
  constructor() { }

  abstract toString(): string;
  _toStringNoExpandDerived(): string {
    return this.toString();
  }

  abstract accept<TRet>(visitor: NodeVisitor<TRet>): TRet;
}

export class Derived extends Base {
  constructor(public kind: Kind, public name: string, public expression: Base, public parent?: Derived) {
    super();
  }

  getLevel(): number | null {
    if (this.kind != Kind.Node)
      return null;
    if (!this.parent)
      return 1;
    return this.getLevel()! + 1;
  }

  toString(): string {
    return this.expression.toString();
  }

  _toStringNoExpandDerived(): string {
    return this.name;
  }

  accept<TRet>(visitor: NodeVisitor<TRet>): TRet {
    return visitor.derived(this);
  }
}

export enum Operator {
  Addition = "+",
  Subtraction = "-",
  Multiplication = "*",
  Division = "/",
  Maximum = "max",
  Minimum = "min",
  Conditional = "cond",
  CheckCPU = "isCPU",
}

export class Operation extends Base {
  constructor(public operator: Operator, public operands: Base[]) {
    super();
    this.operator = operator;
    this.operands = operands;
  }

  toString(): string {
    return `(${this.operator} ${this.operands.map((operand) => operand._toStringNoExpandDerived()).join(" ")})`;
  }

  accept<TRet>(visitor: NodeVisitor<TRet>): TRet {
    return visitor.operation(this);
  }
}

export class RawEvent extends Base {
  constructor(public eventName: string) {
    super();
  }

  toString(): string {
    return this.eventName;
  }

  accept<TRet>(visitor: NodeVisitor<TRet>): TRet {
    return visitor.rawEvent(this);
  }
}

export class Constant extends Base {
  constructor(public value: number) {
    super();
    this.value = value;
  }

  toString(): string {
    return this.value.toString();
  }

  accept<TRet>(visitor: NodeVisitor<TRet>): TRet {
    return visitor.constant(this);
  }
}

export class Placeholder extends Base {
  toString(): string {
    return "<placeholder>";
  }

  accept<TRet>(visitor: NodeVisitor<TRet>): TRet {
    return visitor.placeholder(this);
  }
}
