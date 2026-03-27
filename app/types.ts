export interface SessionMeta {
  id: string;
  title: string;
  target: string;
  date: string;
  participants: number;
  createdAt: string;
}

export interface Observation {
  id: string;
  raw: string;
  observation: string;
  interpretation: string;
  insight: string;
}

export interface IssueScore {
  impact: number;      // 影響度: 1-5
  frequency: number;   // 頻度: 1-5
  severity: number;    // 深刻度: 1-5
  effort: number;      // 工数（逆転）: 1-5
}

export type Priority = "High" | "Mid" | "Low";

export interface Issue {
  id: string;
  title: string;
  description: string;
  nielsenCategory: number; // 1-10
  scores: IssueScore;
  priority: Priority;
  shortTermAction: string;
  longTermAction: string;
  sourceObsIds: string[];
}

export interface Session {
  meta: SessionMeta;
  observations: Observation[];
  issues: Issue[];
}

export const NIELSEN_PRINCIPLES = [
  "システム状態の可視性",
  "実世界との一致",
  "ユーザーコントロールと自由度",
  "一貫性と標準",
  "エラー防止",
  "記憶より認識",
  "柔軟性と効率性",
  "美的で最小限のデザイン",
  "エラーの認識・診断・回復",
  "ヘルプとドキュメント",
];

export function calcPriority(scores: IssueScore): { total: number; priority: Priority } {
  const total = (scores.impact + scores.frequency + scores.severity + scores.effort) / 4;
  const priority: Priority = total >= 4.0 ? "High" : total >= 2.5 ? "Mid" : "Low";
  return { total, priority };
}
