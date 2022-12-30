//prettier-ignore
export const styleTypes = {
    lines: (color: string = 'blue', opacity: number = 100) =>`bg-${color}/${opacity} border-${color}-4 border-1 lines-gradient to-${color}-4/50`,
    outline: (color: string = 'blue', opacity: number = 100) =>`bg-${color}/${opacity} border-${color}-4 border-1 color-${color}-6`,
  };
