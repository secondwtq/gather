
export enum Kind {
  Node,
  Metric,
  Auxiliary,
}

export interface NodeVisitor<TRet> {
  derivedDef(node: DerivedDef): TRet;
  derivedUse(node: DerivedUse): TRet;
  operation(node: Operation): TRet;
  rawEvent(node: RawEvent): TRet;
  constant(node: Constant): TRet;
  placeholder(node: Placeholder): TRet;
  empty(node: Empty): TRet;
}

export abstract class Base {
  annotation?: string;
  constructor() { }

  abstract toString(): string;
  _toStringNoExpandDerived(): string {
    return this.toString();
  }

  abstract accept<TRet>(visitor: NodeVisitor<TRet>): TRet;
}

export class DerivedDef extends Base {
  constructor(public kind: Kind, public name: string, public expression: Base, public parent?: DerivedDef) {
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
    return visitor.derivedDef(this);
  }
}

export class DerivedUse extends Base {
  constructor(public def: DerivedDef) { super(); }
  toString(): string { return this.def.name; }
  accept<TRet>(visitor: NodeVisitor<TRet>): TRet {
    return visitor.derivedUse(this);
  }
}

export enum Operator {
  Addition = "+",
  Subtraction = "-",
  Multiplication = "*",
  Division = "/",
  LessThan = "<",
  GreaterThan = ">",
  Equal = "==",
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
  constructor(public eventName: string, public annotations: string[]) {
    super();
  }

  toString(): string {
    return "~" + this.eventName + this.annotations.map((annotation) =>
      ":" + annotation).join("");
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

export class Empty extends Base {
  constructor() { super(); }
  toString(): string { return "#NA"; }
  accept<TRet>(visitor: NodeVisitor<TRet>): TRet { return visitor.empty(this); }
}

export class Placeholder extends Base {
  toString(): string { return "<placeholder>"; }
  accept<TRet>(visitor: NodeVisitor<TRet>): TRet { return visitor.placeholder(this); }
}
