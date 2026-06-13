export type LegalSection = {
  heading: string;
  items: (string | { sub: string; text: string })[];
};

export type LegalDoc = {
  title: string;
  eyebrow: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  contactNote: string;
};
