export type NonNullable<T extends object | undefined | null> = {
  [key in keyof globalThis.NonNullable<T>]-?: globalThis.NonNullable<
    globalThis.NonNullable<T>[key]
  >;
};
