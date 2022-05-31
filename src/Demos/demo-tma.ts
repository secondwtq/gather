
import { fetchTMACSV } from "../PerfEventDB/TMA/IntelTMA.js";
import { preprocess } from "../PerfEventDB/TMA/ParserIntel.js";

(async () => {
  const csv = await fetchTMACSV();
  await preprocess(csv);
})();