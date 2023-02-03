export function cx(...args: any[]) {
  const className = args.flat().filter(Boolean).join(' ').trim().replaceAll(/\s+/g, ' ');
  if (!className) {
    return;
  }
  return className;
}

type MaybeFunction<T> = T | ((...args: any[]) => any);

type MaybeFunctionValue<T extends MaybeFunction<any>> = T extends (...args: any[]) => any ? ReturnType<T> : T;

type ParametersType<T extends MaybeFunction<any>> = Parameters<T extends (...args: any[]) => any ? T : never>;

export const access = <T extends MaybeFunction<any>>(value: T, ...args: ParametersType<T>): MaybeFunctionValue<T> => {
  if (typeof value === 'function') {
    return value(...args);
  }

  return value as MaybeFunctionValue<T>;
};
