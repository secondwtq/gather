
import { getOrLoadEventSet, updateDB } from "./MapFile.js";
import { CoreID } from "./Common.js";

(async () => {
  await updateDB();
  console.log(await getOrLoadEventSet(CoreID.SKL));
})();
