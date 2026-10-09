import type { HTMLAttributes } from "react";

export function Reveal({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-reveal="" {...props}>
      {children}
    </div>
  );
}
