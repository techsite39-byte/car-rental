export interface TextSceneConfig {
  id: string;
  start: number;
  end: number;
  fadeIn: number;
  fadeOut: number;
  eyebrow?: string;
  headline: string;
  supporting: string;
  positionClass: string;
  ctaText?: string;
  ctaHref?: string;
}

export const SECTION2_TEXT_SCENES: TextSceneConfig[] = [
  {
    id: "scene-2",
    start: 0.25,
    end: 0.4,
    fadeIn: 0.03,
    fadeOut: 0.03,
    eyebrow: "02 — SCULPTURE",
    headline: "PRECISION IN EVERY LINE.",
    supporting: "Engineered to turn every arrival into an experience.",
    positionClass: "section2-text-scene--top-right",
  },
  {
    id: "scene-3",
    start: 0.48,
    end: 0.62,
    fadeIn: 0.03,
    fadeOut: 0.03,
    eyebrow: "03 — COCKPIT",
    headline: "POWER. WITHOUT COMPROMISE.",
    supporting: "Performance engineered for the road ahead.",
    positionClass: "section2-text-scene--top-left",
  },
  {
    id: "scene-4",
    start: 0.7,
    end: 0.79,
    fadeIn: 0.025,
    fadeOut: 0.025,
    eyebrow: "04 — CRAFTSMANSHIP",
    headline: "EVERY DETAIL, CONSIDERED.",
    supporting: "Crafted for the drive.",
    positionClass: "section2-text-scene--top-left",
  },
  {
    id: "scene-5",
    start: 0.8,
    end: 0.89,
    fadeIn: 0.025,
    fadeOut: 0.025,
    eyebrow: "05 — DYNAMICS",
    headline: "YOUR ROAD. YOUR MOMENT.",
    supporting: "Designed around the way you move.",
    positionClass: "section2-text-scene--top-left",
  },
];
