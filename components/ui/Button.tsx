import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

type ButtonLinkProps = ButtonStyleProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href"> & {
    href: string;
  };

type ButtonElementProps = ButtonStyleProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };

export type ButtonProps = ButtonLinkProps | ButtonElementProps;

export function Button(props: ButtonProps) {
  if ("href" in props && props.href !== undefined) {
    const {
      href,
      className,
      variant = "primary",
      size = "md",
      ...linkProps
    } = props as ButtonLinkProps;
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
  } = props as ButtonElementProps;

  return (
    <button
      className={cn("button", `button--${variant}`, `button--${size}`, className)}
      type={type}
      {...buttonProps}
    />
  );
}
