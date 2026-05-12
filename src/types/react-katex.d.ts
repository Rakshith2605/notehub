declare module 'react-katex' {
  import type { FC } from 'react';

  interface MathProps {
    math: string;
    errorColor?: string;
    renderError?: (error: Error) => JSX.Element;
    settings?: Record<string, unknown>;
  }

  export const InlineMath: FC<MathProps>;
  export const BlockMath: FC<MathProps>;
}
