export type AppProps<
  T extends Record<string, string> | null,
  U extends Record<string, string> | null,
> = {
  params: Promise<T>;
  searchParams: Promise<U>;
};
