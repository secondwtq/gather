import assert from "assert";
import { enumValues } from "../../utils.js";
import { CoreID } from "../Intel/Common.js";
import { Kind, DerivedDef, Placeholder } from "./ASTNode.js";
import parseExpression from "./IntelTMAExprParser.js";
import { CollectAllEventsVisitor, ToStringFullVisitor } from "./Visitors.js";

type DerivedName = string;

interface MetaIndexData {
  kind: Kind;
  index: number;
  parentName?: DerivedName;
}

interface PreprocessedData {
  rowsForKind: Map<Kind, string[][]>
  orderedNodeNames: DerivedName[];
  metaIndex: Map<DerivedName, MetaIndexData>;
}

type CoreName = string;
type UnparsedExpression = string;

const CORE_ID_NAME_MAP: Map<CoreID, CoreName> = new Map([
  // [CoreID.SKL, "KBLR/CFL/CML"],
  // [CoreID.SKX, "SKX"],
  // [CoreID.CLX, "CLX"],
  // [CoreID.ICL, "ICL"],
  // [CoreID.ICX, "ICX"],
  // [CoreID.TGL, "TGL"],
  [CoreID.ADL_GLC, "ADL/RPL"],
  // [CoreID.SPR, "SPR"],
]);

export function preprocess(src: string[][]) {

  const nodesStartRow = 3,
    metricsRow = src.findIndex((row) => row[1] == "metrics"),
    auxiliaryRow = src.findIndex((row) => row[1] == "auxiliary");

  const nodes = src.slice(nodesStartRow, metricsRow),
    metrics = src.slice(metricsRow + 1, auxiliaryRow),
    auxiliaries = src.slice(auxiliaryRow + 1, -1);

  const orderedNodeNames: DerivedName[] = [];
  const metaIndex = new Map<DerivedName, MetaIndexData>();

  function populateIndex(kind: Kind, rows: string[][]) {
    let parents = new Map<number, DerivedName>();
    rows.forEach((row, idx) => {
      let nodeName = "";
      let level = 1;
      for (let column = 1; column <= 4; column++)
        if (row[column] != "") {
          nodeName = row[column];
          level = column;
          break;
        }

      orderedNodeNames.push(nodeName);
      const indexData: MetaIndexData = { kind: kind, index: idx };
      if (parents.has(level - 1))
        indexData.parentName = parents.get(level - 1);
      assert(level == 1 || indexData.parentName);
      parents.set(level, nodeName);
      metaIndex.set(nodeName, indexData);
    });
  }

  populateIndex(Kind.Node, nodes);
  populateIndex(Kind.Metric, metrics);
  populateIndex(Kind.Auxiliary, auxiliaries);

  const expressionIndex = new Map<CoreID, Map<DerivedName, UnparsedExpression>>();

  {
    const numColumn = src[0].length;
    const numCores = numColumn - 7 - 5;
    const coreNames = src[2].slice(5, 5 + numCores);
    const getIsServer = src[1].map((cell) => cell == "Server");
    function propagateAndExtractExpressions(rows: string[][]): UnparsedExpression[][] {
      return rows.map((row, index) => {
        let last = "";
        let lastNonServer = "";
        for (let i = 5 + numCores - 1; i >= 5; i--) {
          const isServer = getIsServer[i];
          if (row[i] != "") {
            last = row[i];
            if (!isServer)
              lastNonServer = row[i];
          } else {
            row[i] = isServer ? last : lastNonServer;
          }
        }
        return row.slice(5, 5 + numCores);
      });
    }

    const expressionMatrices = new Map([
      [Kind.Node, propagateAndExtractExpressions(nodes)],
      [Kind.Metric, propagateAndExtractExpressions(metrics)],
      [Kind.Auxiliary, propagateAndExtractExpressions(auxiliaries)],
    ]);

    function getExpressionIndexForCore(coreIdx: number) {
      assert(coreIdx >= 0);
      const ret = new Map<DerivedName, UnparsedExpression>();
      for (const name of orderedNodeNames) {
        const meta = metaIndex.get(name)!;
        ret.set(name, expressionMatrices.get(meta.kind)![meta.index][coreIdx]);
      }
      return ret;
    }

    for (const [coreID, coreName] of CORE_ID_NAME_MAP)
      expressionIndex.set(coreID, getExpressionIndexForCore(coreNames.indexOf(coreName)));

    console.log(expressionIndex);
  }

  function parseForCore(coreID: CoreID): Map<string, DerivedDef> {
    const derives = new Map<string, DerivedDef>();
    const unparsed = expressionIndex.get(coreID)!;

    for (const [name, _] of unparsed) {
      const meta = metaIndex.get(name)!;
      const parent = meta.parentName ? derives.get(meta.parentName) : undefined;
      derives.set(name, new DerivedDef(metaIndex.get(name)?.kind!, name, new Placeholder(), parent));
    }
    for (const [name, derived] of derives)
      derives.get(name)!.expression = parseExpression({ derives }, unparsed.get(name)!);
    const eventCollector = new CollectAllEventsVisitor();
    for (const [name, derived] of derives) {
      console.log(name, "=>", derived.toString());
      console.log(unparsed.get(name));
      console.log("Full: ", derived.accept(new ToStringFullVisitor()));
      derived.accept(eventCollector);
    }
    console.log(eventCollector.getResult());

    return derives;
  }

  for (const [coreID, _] of CORE_ID_NAME_MAP)
    parseForCore(coreID);
}
