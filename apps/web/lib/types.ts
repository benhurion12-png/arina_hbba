export type User = {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "ADMIN";
  status?: "ACTIVE" | "BLOCKED";
  createdAt?: string;
};

export type RiskLevel = "PLANNED" | "URGENT" | "EMERGENCY";

export type ExpertResult = {
  riskLevel: RiskLevel;
  urgency: string;
  specialist: string;
  summary: string;
  insights: string[];
  possibleFactors: string[];
  actions: string[];
  avoid: string[];
  selectedZoneLabels: string[];
  redFlagLabels: string[];
  dataQuality: "Базовая" | "Достаточная" | "Подробная";
  disclaimer: string;
};

export type Analysis = {
  id: string;
  zones: string[];
  symptoms: string;
  redFlags: string[];
  specialist: string;
  urgency: string;
  riskLevel: RiskLevel;
  result: ExpertResult;
  createdAt: string;
};
