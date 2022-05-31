
import XLSX from "xlsx";
import { ResultEvent } from "../perf-stat.js";

export function exportAsSheetLegacy(src: [string, { time: number; events: ResultEvent[] }][]) {
  const eventsOrder = Array.prototype.concat.apply(
    ["name", "time"],
    src[0][1].events.map((event) => [
      event.event.eventName, event.event.eventName + "_stddev"]));
  const eventsData = src.map(([name, results]) => results.events.reduce(
    (prev, cur) => ({
      ... prev,
      [cur.event.eventName]: cur.value,
      [cur.event.eventName + "_stddev"]: cur.stddev}), {
      name: name,
      time: results.time,
  }));
  const columnNames = Array.prototype.concat.apply(
    ["Name", "Time"],
    src[0][1].events.map((event) => {
      const eventName = event.event.eventName.split(".").join("\n");
      return [ eventName, eventName + "\nStddev"];
    }));
  const sheet = XLSX.utils.json_to_sheet(eventsData, { header: eventsOrder });
  XLSX.utils.sheet_add_aoa(sheet, [columnNames], { origin: "A1" });
  sheet["!cols"] = eventsOrder.map((eventName) => ({ wch:
    eventsData.reduce((max, data) =>
      Math.max(max, (data as any)[eventName].toString().length), 0) }));
  sheet["!rows"] = [ { hpt: 36 } ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Data");
  XLSX.writeFile(workbook, "data.xlsx", { bookSST: true });
}
