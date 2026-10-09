import Link from "next/link";
import type { ComponentProps, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

type ButtonLinkProps = ButtonStyleProps &
  Omit<ComponentProps<typeof Link>, "className" | "href"> & { href: string };

type ButtonElementProps = ButtonStyleProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };

export type ButtonProps = ButtonLinkProps | ButtonElementProps;

export function Button(props: ButtonProps) {
  if ("href" in props && typeof props.href === "string") {
    const {
      href,
      className,
      variant = "primary",
      size = "md",
      ...linkProps
    } = props;
    return (
      <Link
        className={cn("button", `button--${variant}`, `button--${size}`, className)}
        href={href}
        {...linkProps}
      />
    );
  }

  const {
    className,
    variant = "primary",
    size = "md",
    type = "button",
    ...buttonProps
  } = props;

  return (
    <button
      className={cn("button", `button--${variant}`, `button--${size}`, className)}
      type={type}
      {...buttonProps}
    />
  );
}
