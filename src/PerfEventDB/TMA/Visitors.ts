
import { assert } from "console";
import { unreachable } from "../../utils.js";
import { NodeVisitor, DerivedDef, DerivedUse, Operation, Constant, Placeholder, RawEvent, Operator, Empty } from "./ASTNode.js";

export class ToStringFullVisitor implements NodeVisitor<string> {
  derivedDef(node: DerivedDef): string {
    return node.expression.accept(this);
  }

  derivedUse(node: DerivedUse): string {
    return node.def.accept(this);
  }

  operation(node: Operation): string {
    return `(${node.operator} ${node.operands.map((operand) => operand.accept(this)).join(" ")})`;
  }

  rawEvent(node: RawEvent): string {
    return node.toString();
  }

  constant(node: Constant): string {
    return node.toString();
  }

  placeholder(node: Placeholder): string {
    return node.toString();
  }

  empty(node: Placeholder): string {
    return node.toString();
  }
}

class EvaluationVisitor implements NodeVisitor<number> {
  constructor(private getEventValue: (eventName: string) => number) { }

  derivedDef(node: DerivedDef): number {
    return node.expression.accept(this);
  }

  derivedUse(node: DerivedUse): number {
    return node.def.accept(this);
  }

  operation(node: Operation): number {
    switch (node.operator) {
      case Operator.Addition:
        return node.operands[0].accept(this) + node.operands[1].accept(this);
      case Operator.Subtraction:
        return node.operands[0].accept(this) - node.operands[1].accept(this);
      case Operator.Multiplication:
        return node.operands[0].accept(this) * node.operands[1].accept(this);
      case Operator.Division:
        return node.operands[0].accept(this) / node.operands[1].accept(this);
      case Operator.LessThan:
        return +(node.operands[0].accept(this) < node.operands[1].accept(this));
      case Operator.GreaterThan:
        return +(node.operands[0].accept(this) > node.operands[1].accept(this));
      case Operator.Equal:
        return +(node.operands[0].accept(this) == node.operands[1].accept(this));
      case Operator.Maximum:
        return Math.max.apply(null,
          node.operands.map((operand) => operand.accept(this)));
      case Operator.Minimum:
        return Math.min.apply(null,
          node.operands.map((operand) => operand.accept(this)));
      case Operator.Conditional:
        return NaN;
      case Operator.CheckCPU:
        return NaN;
    }
  }

  rawEvent(node: RawEvent): number {
    return this.getEventValue(node.eventName);
  }

  constant(node: Constant): number {
    return node.value;
  }

  placeholder(node: Placeholder): number {
    return unreachable();
  }

  empty(node: Empty): number {
    return unreachable();
  }
}

export class CollectAllEventsVisitor implements NodeVisitor<void> {

  result: Set<string>;

  constructor() {
    this.result = new Set();
  }

  getResult(): Set<string> {
    return this.result;
  }

  derivedDef(node: DerivedDef): void {
    return node.expression.accept(this);
  }

  derivedUse(node: DerivedUse): void {
    return node.def.accept(this);
  }

  rawEvent(node: RawEvent): void {
    this.result.add(node.eventName + node.annotations.map((annotation) =>
      ":" + annotation).join(""));
  }

  operation(node: Operation): void {
    return node.operands.forEach((operand) => operand.accept(this));
  }

  constant(node: Constant): void {
    return;
  }

  placeholder(node: Placeholder): void {
    return;
  }

  empty(node: Empty): void {
    return;
  }
}
