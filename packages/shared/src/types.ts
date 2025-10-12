export type NonNullable<T extends object | undefined> = {
  [key in keyof globalThis.NonNullable<T>]-?: globalThis.NonNullable<
    globalThis.NonNullable<T>[key]
  >;
};
