
import { updateDB } from "./MapFile.js";
import { CoreID, getOrLoadEventSet } from "./Common.js";

(async () => {
  await updateDB();
  console.log(await getOrLoadEventSet(CoreID.SKL));
})();
