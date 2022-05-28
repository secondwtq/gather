
import fs from "fs/promises";
import { URL } from "url";

export type Key = string;

export async function store(key: Key, value: any): Promise<void> {
  await fs.writeFile(new URL(key + ".json", import.meta.url), JSON.stringify(value, null, 2));
}

export async function load<T>(key: Key): Promise<T> {
  const content = await fs.readFile(new URL(key + ".json", import.meta.url), "utf-8");
  return JSON.parse(content);
}
