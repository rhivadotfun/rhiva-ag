export type Response<T> = {
  data: T;
};

export type ResponseWithMeta<T, M> = {
  meta: M;
} & Response<T>;

export type PaginatedMeta = {
  next?: string | null;
  previous?: string | null;
};
