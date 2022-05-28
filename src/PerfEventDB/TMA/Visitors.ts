
import { assert } from "console";
import { unreachable } from "../../utils.js";
import { NodeVisitor, Derived, Operation, Constant, Placeholder, RawEvent, Operator } from "./ASTNode.js";

class ToStringFullVisitor implements NodeVisitor<string> {
  derived(node: Derived): string {
    return node.accept(this);
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
}

class EvaluationVisitor implements NodeVisitor<number> {
  constructor(private getEventValue: (eventName: string) => number) { }

  derived(node: Derived): number {
    return node.expression.accept(this);
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
}
