
import { transform } from "cjstoesm";
import { writeFile } from "fs/promises";

// Seems cjstoesm is built with assumptions with very, very simplistic use cases -
//   Basically, converting all your stuff from CommonJS to ESM
//   There is no choice to convert only ONE file
// So here is a hack:
const result = await transform({
  input: ["build/PerfEventDB/TMA/IntelTMAExprParserRules.common.js"],
  outDir: "build",
  write: false
});

for (const { fileName, text } of result.files) {
  if (fileName.endsWith("IntelTMAExprParserRules.common.js")) {
    console.log("Parser compiled");
    writeFile("build/PerfEventDB/TMA/IntelTMAExprParserRules.js",
      text.replace("window.grammar = grammar;", "")
      .replace("(function () {", "")
      .replace("})();", ""));
  }
}
