
@{%
const Postprocessors = require("./IntelTMAExprParserPostprocessors.js");
%}

@builtin "number.ne"
@builtin "postprocessors.ne"

untrimmed_expression -> _ expression _
  {% data => data[1] %}
expression -> (
    conditional_expression
  | non_conditional_expression)
  {% data => data[0][0] %}

conditional_expression ->
    expression _ "if" _ expression _ "else" _ non_conditional_expression
  {% data => Postprocessors.conditionalExpression(data) %}
non_conditional_expression -> (
    binary_expression_additive
  | binary_expression_multiplicative)
  {% data => data[0][0] %}
binary_operator_additive ->
    ("+" | "-" | ">" | "<" | "==")
  {% data => data[0][0] %}
binary_expression_additive ->
    non_conditional_expression _ binary_operator_additive _ binary_expression_multiplicative
  {% data => Postprocessors.binaryExpression(data) %}
binary_operator_multiplicative ->
    ("*" | "/")
  {% data => data[0][0] %}
binary_expression_multiplicative ->
    binary_expression_multiplicative _ binary_operator_multiplicative _ non_binary_expression
  {% data => Postprocessors.binaryExpression(data) %}
  | non_binary_expression
  {% data => data[0] %}
non_binary_expression -> (
    identifier_with_annotation
  | constant
  | paren
  | function_call_expression)
  {% data => data[0][0] %}

identifier ->
    [a-zA-Z._#] [a-zA-Z0-9._#]:*
  {% data => Postprocessors.identifier(data) %}
annotation ->
    ":" identifier
  {% data => data[1] %}
identifier_with_annotation ->
    identifier annotation:*
  {% data => Postprocessors.identifierWithAnnotation(data) %}

constant ->
    decimal
  {% data => Postprocessors.constant(data) %}
paren ->
    "(" _ expression _ ")"
  {% data => data[2] %}
function_call_expression -> identifier "(" delimited[_ expression _ , ","] ")"
  {% data => Postprocessors.functionCallExpression(data) %}
_ -> " ":* {% data => null %}
