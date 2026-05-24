export type Marketplace = "US" | "UK" | "CA" | "AU";
export type ProjectStatus = "Draft" | "Generated";

export type Project = {
  id: string;
  productNameCn: string;
  productNameEn: string;
  category: string;
  marketplace: Marketplace;
  createdAt: string;
  updatedAt: string;
  status: ProjectStatus;
};

export type WizardStep = {
  id: string;
  title: string;
  description: string;
};

export type BilingualText = {
  english: string;
  chinese: string;
};

export type BulletPoint = BilingualText & {
  sellingPoint: string;
  painPoint: string;
};

export type FaqItem = {
  question: BilingualText;
  answer: BilingualText;
};

export type ImageSuggestion = {
  type: string;
  focus: string;
  guidance: string;
};
