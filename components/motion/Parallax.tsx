import type { HTMLAttributes } from "react";

export function Parallax({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-parallax="" {...props}>
      {children}
    </div>
  );
}
