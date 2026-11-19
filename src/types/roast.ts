export type HeatLevel = 'mild' | 'medium' | 'crispy';

export interface LineRoast {
  section: string;
  originalSnippet: string;
  roast: string;
  actualFix: string;
}

export interface BuzzwordEntry {
  phrase: string;
  count: number;
  verdict: string;
}

export interface RedFlag {
  title: string;
  detail: string;
}

export interface SalvageStep {
  stepTitle: string;
  action: string;
}

export interface RoastResult {
  candidateName: string;
  targetRole: string;
  archetype: string;
  headline: string;
  subheadline: string;
  openingMonologue: string[];
  pullQuote: string;
  lineByLineRoasts: LineRoast[];
  buzzwordAudit: BuzzwordEntry[];
  redFlags: RedFlag[];
  salvagePlan: SalvageStep[];
  heatLevel: HeatLevel;
  sourceLabel: string;
}

export interface SampleResume {
  id: string;
  label: string;
  subtitle: string;
  fileName: string;
  content: string;
}
