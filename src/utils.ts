
export interface SampledValue {
  mean: number;
  min: number;
  max: number;
  numSample: number;
  stddev?: number;
}

export interface SampledValueOrdered {
  rawValues: number[];
}

export function prettifyArgsArray(src: string[]) {
  // TODO: escape
  return src.map((str) => `"${str}"`).join(" ");
}

export function stringifyJSON(src: any, space?: number): string {
  return JSON.stringify(src, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, space);
}

export function *genPermutations(count: number): Generator<number[]> {
  const ret = [... Array(count).keys()];
  yield *heaps(0);

  function *heaps(index: number): Generator<number[]> {
    if (index == count)
      return yield Array.from(ret);

    for (let i = index; i < count; i++) {
      const t1 = ret[index]; ret[index] = ret[i]; ret[i] = t1;
      yield *heaps(index + 1);
      const t2 = ret[index]; ret[index] = ret[i]; ret[i] = t2;
    }
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => { setTimeout(r, ms) });
}

export async function infiniteLoop(): Promise<void> {
  while (true)
    await sleep(1000);
}

export function average(src: number[]): number {
  return src.reduce((x, y) => x + y) / src.length;
}

export async function asyncMapSequence<X, Y>(f: (src: X) => Promise<Y>, src: X[]): Promise<Y[]> {
  const ret: Y[] = [];
  for (const x of src)
    ret.push(await f(x));
  return ret;
}

export function *enumKeys<T extends object>(enumObj: T): Generator<keyof T> {
  for (const maybeKey in enumObj)
    if (Number.isNaN(+maybeKey))
      yield maybeKey as (keyof T);
}

export function *enumValues<T extends object>(enumObj: T): Generator<T[keyof T]> {
  for (const key of enumKeys(enumObj))
    yield enumObj[key];
}

export function unreachable(): any {
  throw new Error("Unreachable");
}
