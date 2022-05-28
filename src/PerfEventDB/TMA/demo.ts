
import { fetchTMACSV } from "./IntelTMA.js";
import { preprocess } from "./ParserIntel.js";

(async () => {
  const csv = await fetchTMACSV();
  await preprocess(csv);
})();