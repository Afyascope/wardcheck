import type { CmsGuideKind } from "@/types/cms";

export interface GuideKindMeta {
  kind: CmsGuideKind;
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
}

export const GUIDE_KINDS: GuideKindMeta[] = [
  {
    kind: "salary",
    label: "Salary Guides",
    title: "Salary Guides",
    description: "Realistic salary expectations for healthcare professions in Kenya.",
    ctaLabel: "Read guide",
  },
  {
    kind: "career",
    label: "Career Guides",
    title: "Career Guides",
    description: "Career advice to help you plan and grow as a healthcare professional.",
    ctaLabel: "Read guide",
  },
  {
    kind: "workplace",
    label: "Workplace Guides",
    title: "Workplace Guides",
    description: "Understand what makes a good healthcare workplace and how to evaluate employers.",
    ctaLabel: "Read guide",
  },
];

export function getGuideKindMeta(kind: string | undefined): GuideKindMeta | undefined {
  return GUIDE_KINDS.find((guide) => guide.kind === kind);
}
