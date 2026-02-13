import type { Options } from "qr-code-styling";

type DotsType = NonNullable<Options["dotsOptions"]>["type"];
type CornerSquareType = NonNullable<Options["cornersSquareOptions"]>["type"];
type CornerDotType = NonNullable<Options["cornersDotOptions"]>["type"];

export type QrStylePreset =
  | "square"
  | "dots"
  | "rounded"
  | "classy"
  | "classy-rounded"
  | "extra-rounded"
  | "dots-soft"
  | "dots-bold"
  | "square-soft"
  | "classy-soft"
  | "classy-rounded-soft"
  | "circular"
  | "fluid"
  | "fusion"
  | "leafy"
  | "pixel";

export const QR_STYLE_PRESETS: Array<{
  key: QrStylePreset;
  label: string;
  dotsType: DotsType;
  cornersSquareType: CornerSquareType | "dot"; // 'dot' is valid but sometimes missing from strict types
  cornersDotType: CornerDotType;
}> = [
  {
    key: "square",
    label: "Classic (Squares)",
    dotsType: "square",
    cornersSquareType: "square",
    cornersDotType: "square",
  },
  {
    key: "square-soft",
    label: "Soft Classic",
    dotsType: "square",
    cornersSquareType: "extra-rounded",
    cornersDotType: "dot",
  },
  
  {
    key: "dots",
    label: "Modern (Dots)",
    dotsType: "dots",
    cornersSquareType: "square",
    cornersDotType: "dot",
  },
  {
    key: "dots-soft",
    label: "Modern Soft",
    dotsType: "dots",
    cornersSquareType: "extra-rounded",
    cornersDotType: "dot",
  },
  {
    key: "dots-bold",
    label: "Modern Bold",
    dotsType: "dots",
    cornersSquareType: "square",
    cornersDotType: "square",
  },

  {
    key: "rounded",
    label: "Rounded",
    dotsType: "rounded",
    cornersSquareType: "extra-rounded",
    cornersDotType: "dot",
  },
  {
    key: "extra-rounded",
    label: "Extra Rounded",
    dotsType: "extra-rounded",
    cornersSquareType: "extra-rounded",
    cornersDotType: "dot",
  },

  {
    key: "classy",
    label: "Classy",
    dotsType: "classy",
    cornersSquareType: "square",
    cornersDotType: "square",
  },
  {
    key: "classy-soft",
    label: "Classy Soft",
    dotsType: "classy",
    cornersSquareType: "extra-rounded",
    cornersDotType: "dot",
  },
  {
    key: "classy-rounded",
    label: "Classy Rounded",
    dotsType: "classy-rounded",
    cornersSquareType: "square",
    cornersDotType: "dot",
  },
  {
    key: "classy-rounded-soft",
    label: "Classy Rounded Soft",
    dotsType: "classy-rounded",
    cornersSquareType: "extra-rounded",
    cornersDotType: "dot",
  },

  {
    key: "circular",
    label: "Circular (Bubble)",
    dotsType: "dots",
    cornersSquareType: "dot",
    cornersDotType: "dot",
  },
  {
    key: "fluid",
    label: "Fluid",
    dotsType: "extra-rounded",
    cornersSquareType: "dot",
    cornersDotType: "dot",
  },
  {
    key: "fusion",
    label: "Fusion (Tech)",
    dotsType: "classy-rounded",
    cornersSquareType: "extra-rounded",
    cornersDotType: "square", // Square inner with rounded outer looks very "tech"
  },
  {
    key: "leafy",
    label: "Organic (Leafy)",
    dotsType: "classy-rounded",
    cornersSquareType: "dot",
    cornersDotType: "dot",
  },
  {
    key: "pixel",
    label: "Heavy Pixel",
    dotsType: "square",
    cornersSquareType: "dot", 
    cornersDotType: "square", // Square inner, Circle outer, Square dots
  },
];

export type QrDesignConfig = {
  fgColor?: string;
  bgColor?: string;
  logo?: string;
  logoSize?: number; // percentage 0-100
  style?: QrStylePreset;
};

export function parseDesignConfig(raw: unknown): QrDesignConfig {
  if (!raw) return {};

  if (typeof raw === "string") {
    try {
      return parseDesignConfig(JSON.parse(raw));
    } catch {
      return {};
    }
  }

  if (typeof raw !== "object") return {};

  const obj = raw as Record<string, unknown>;
  return {
    fgColor: typeof obj.fgColor === "string" ? obj.fgColor : undefined,
    bgColor: typeof obj.bgColor === "string" ? obj.bgColor : undefined,
    logo: typeof obj.logo === "string" ? obj.logo : undefined,
    logoSize: typeof obj.logoSize === "number" ? obj.logoSize : undefined,
    style: isQrStylePreset(obj.style) ? obj.style : undefined,
  };
}

function isQrStylePreset(value: unknown): value is QrStylePreset {
  return QR_STYLE_PRESETS.some((preset) => preset.key === value);
}

export function buildQrCodeStylingOptions(params: {
  data: string;
  size: number;
  format: "svg" | "canvas";
  design: QrDesignConfig;
}) {
  const fgColor = params.design.fgColor || "#000000";
  const bgColor = params.design.bgColor || "#ffffff";
  const logo = params.design.logo || undefined;
  const logoSizeFraction = clamp01(((params.design.logoSize ?? 0) || 0) / 100);

  const preset: QrStylePreset = params.design.style || "square";

  const presetDef =
    QR_STYLE_PRESETS.find((p) => p.key === preset) ||
    QR_STYLE_PRESETS.find((p) => p.key === "square")!;

  return {
    width: params.size,
    height: params.size,
    type: params.format,
    data: params.data,
    image: logo,
    margin: 10,
    qrOptions: {
      errorCorrectionLevel: "H",
    },
    dotsOptions: {
      color: fgColor,
      type: presetDef.dotsType,
    },
    cornersSquareOptions: {
      type: presetDef.cornersSquareType,
      color: fgColor,
    },
    cornersDotOptions: {
      type: presetDef.cornersDotType,
      color: fgColor,
    },
    backgroundOptions: {
      color: bgColor,
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 2,
      imageSize: logoSizeFraction || undefined,
    },
  } as any;
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}