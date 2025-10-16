export const mapFilter = <T, R>(
  collection: readonly T[],
  mapFn: (item: T, index: number) => R | null | undefined,
): R[] => {
  const results = [];
  for (const [index, item] of collection.entries()) {
    const result = mapFn(item, index);
    if (result) results.push(result);
  }

  return results;
};

export const flatMapFilter = <T, R>(
  collection: readonly T[],
  mapFn: (item: T, index: number) => R[] | null | undefined,
): R[] => {
  const results = [];
  for (const [index, item] of collection.entries()) {
    const result = mapFn(item, index);
    if (result) results.push(...result.flat());
  }

  return results as R[];
};

export const promiseMapFilter = async <T, R>(
  collection: readonly T[],
  mapFn: (item: T, index: number) => Promise<R | null | undefined>,
): Promise<R[]> => {
  const results = [];
  for (const [index, item] of collection.entries()) {
    const result = await mapFn(item, index);
    if (result) results.push(result);
  }

  return Promise.all(results);
};

export const collectionToMap = <T, K>(
  collection: readonly T[],
  getKey: (item: T, index: number) => K | null | undefined,
) => {
  const result = new Map<K, T>();
  for (const [index, item] of collection.entries()) {
    const id = getKey(item, index);
    if (id) result.set(id, item);
  }

  return result;
};
