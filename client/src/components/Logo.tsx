import React from "react";

export type LogoVariant = "auto" | "on-dark" | "on-light";

export type LogoProps = {
  alt?: string;
  className?: string;
  variant?: LogoVariant;
};

const VARIANT_CLASS: Record<LogoVariant, string> = {
  auto: "logo--auto",
  "on-dark": "logo--on-dark",
  "on-light": "logo--on-light",
};

export function Logo({
  alt = "QR Generator",
  className = "",
  variant = "auto",
}: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt={alt}
      className={`logo object-contain ${VARIANT_CLASS[variant]} ${className}`}
      draggable={false}
    />
  );
}
