"use client";

import { useEffect, useMemo, useRef } from "react";
import type { QrDesignConfig } from "@/lib/qrStyling";
import { buildQrCodeStylingOptions } from "@/lib/qrStyling";

type Props = {
  value: string;
  size: number;
  design?: QrDesignConfig;
  className?: string;
};

export default function StyledQrCode({ value, size, design = {}, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const qrInstanceRef = useRef<any>(null);

  const options = useMemo(
    () =>
      buildQrCodeStylingOptions({
        data: value,
        size,
        format: "svg",
        design,
      }),
    [value, size, design]
  );

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!containerRef.current) return;

      const mod = await import("qr-code-styling");
      if (cancelled) return;

      const QRCodeStyling = mod.default;

      if (!qrInstanceRef.current) {
        qrInstanceRef.current = new QRCodeStyling(options);
        containerRef.current.innerHTML = "";
        qrInstanceRef.current.append(containerRef.current);
      } else {
        qrInstanceRef.current.update(options);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [options]);

  return <div ref={containerRef} className={className} />;
}
