import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "article" | "section";
}

export function GlassCard({
  as: Component = "div",
  className,
  ...props
}: GlassCardProps) {
  return <Component className={cn("glass-card", className)} {...props} />;
}
