import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  loading?: boolean;
}

type ButtonLinkProps = ButtonStyleProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href"> & {
    href: string;
  };

type ButtonElementProps = ButtonStyleProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };

export type ButtonProps = ButtonLinkProps | ButtonElementProps;

export function Button(props: ButtonProps) {
  const isLoading = props.loading;

  if ("href" in props && props.href !== undefined) {
    const {
      href,
      className,
      variant = "primary",
      size = "md",
      loading: _loading,
      onClick,
      ...linkProps
    } = props as ButtonLinkProps;
    return (
      <Link
        className={cn(
          "button",
          `button--${variant}`,
          `button--${size}`,
          isLoading && "button--loading pointer-events-none opacity-80",
          className,
        )}
        href={href}
        onClick={(e) => {
          if (isLoading) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
        {...linkProps}
      >
        {isLoading && <Loader2 className="button__spinner animate-spin" size={16} />}
        {props.children}
      </Link>
    );
  }

  const {
    className,
    variant = "primary",
    size = "md",
    type = "button",
    loading: _loading,
    disabled,
    ...buttonProps
  } = props as ButtonElementProps;

  return (
    <button
      className={cn(
        "button",
        `button--${variant}`,
        `button--${size}`,
        isLoading && "button--loading",
        className,
      )}
      disabled={disabled || isLoading}
      type={type}
      {...buttonProps}
    >
      {isLoading && <Loader2 className="button__spinner animate-spin" size={16} />}
      {props.children}
    </button>
  );
}
