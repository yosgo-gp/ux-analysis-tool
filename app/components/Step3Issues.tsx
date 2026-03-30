"use client";

import { useState } from "react";
import { Issue, IssueScore, NIELSEN_PRINCIPLES, calcPriority } from "@/app/types";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

interface Props {
  issues: Issue[];
  onChange: (issues: Issue[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const SCORE_LABELS: Record<string, string[]> = {
  impact: ["", "ごく一部", "少数", "半数程度", "多数", "ほぼ全員"],
  frequency: ["", "稀に", "時々", "しばしば", "頻繁", "ほぼ毎回"],
  severity: ["", "軽微な不満", "操作が遅れる", "タスクが困難", "ほぼ完了不能", "完全に詰まる"],
  effort: ["", "大規模改修", "中規模改修", "小改修", "軽微な修正", "即日対応可"],
};

export default function Step3Issues({ issues, onChange, onNext, onBack }: Props) {
  const [expanded, setExpanded] = useState<string | null>(issues[0]?.id ?? null);

  const updateIssue = (issueId: string, patch: Partial<Issue>) => {
    onChange(issues.map((issue) => (issue.id === issueId ? { ...issue, ...patch } : issue)));
  };

  const updateScore = (issueId: string, key: keyof IssueScore, value: number) => {
    onChange(
      issues.map((issue) => {
        if (issue.id !== issueId) return issue;
        const newScores = { ...issue.scores, [key]: value };
        const { priority } = calcPriority(newScores);
        return { ...issue, scores: newScores, priority };
      })
    );
  };

  const addIssue = () => {
    const initialScores = { impact: 3, frequency: 3, severity: 3, effort: 3 };
    const { priority } = calcPriority(initialScores);
    const newIssue: Issue = {
      id: `issue-${generateId()}`,
      title: "",
      description: "",
      nielsenCategory: 1,
      scores: initialScores,
      priority,
      shortTermAction: "",
      longTermAction: "",
      sourceObsIds: [],
    };
    onChange([...issues, newIssue]);
    setExpanded(newIssue.id);
  };

  const removeIssue = (id: string) => {
    if (issues.length <= 1) return;
    const next = issues.filter((i) => i.id !== id);
    onChange(next);
    setExpanded((prev) => (prev === id ? next[0]?.id ?? null : prev));
  };

  const priorityColor = (p: string) =>
    p === "High" ? "bg-red-100 text-red-700" : p === "Mid" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">課題一覧・優先度スコア</h2>
        <p className="text-sm text-gray-500">
          課題の情報を手入力してください。スコアから優先度は自動計算されます。
        </p>
      </div>

      <div className="space-y-3">
        {issues.map((issue) => {
          const { total } = calcPriority(issue.scores);
          return (
            <div key={issue.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-stretch">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left min-w-0"
                  onClick={() => setExpanded(expanded === issue.id ? null : issue.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${priorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {issue.title.trim() === "" ? "（未入力）" : issue.title}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline">
                      N{issue.nielsenCategory}: {NIELSEN_PRINCIPLES[issue.nielsenCategory - 1]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className="text-sm font-mono text-gray-500">{total.toFixed(1)}</span>
                    <span className="text-gray-400">{expanded === issue.id ? "▲" : "▼"}</span>
                  </div>
                </button>
                {issues.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIssue(issue.id)}
                    className="px-3 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 border-l border-gray-100"
                    aria-label="この課題カードを削除"
                  >
                    削除
                  </button>
                )}
              </div>

              {expanded === issue.id && (
                <div className="border-t border-gray-100 p-4 space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">課題タイトル</label>
                      <input
                        type="text"
                        value={issue.title}
                        onChange={(e) => updateIssue(issue.id, { title: e.target.value })}
                        placeholder="例: ボタンが見つけにくい"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">課題の説明</label>
                      <textarea
                        value={issue.description}
                        onChange={(e) => updateIssue(issue.id, { description: e.target.value })}
                        placeholder="なぜ課題だと言えるか、どんな状況で起きるかを簡潔に"
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">ニールセン分類</label>
                      <select
                        value={issue.nielsenCategory}
                        onChange={(e) => updateIssue(issue.id, { nielsenCategory: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        {Array.from({ length: 10 }).map((_, idx) => {
                          const n = idx + 1;
                          return (
                            <option key={n} value={n}>
                              N{n}: {NIELSEN_PRINCIPLES[n - 1]}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(["impact", "frequency", "severity", "effort"] as const).map((key) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-500 mb-2">
                          {key === "impact" ? "影響度" : key === "frequency" ? "頻度" : key === "severity" ? "深刻度" : "工数（低=重い）"}
                        </label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((v) => (
                            <button
                              key={v}
                              onClick={() => updateScore(issue.id, key, v)}
                              className={`w-8 h-8 rounded text-xs font-semibold border transition-colors ${
                                issue.scores[key] === v
                                  ? "bg-indigo-600 text-white border-indigo-600"
                                  : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{SCORE_LABELS[key][issue.scores[key]]}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <div className="bg-green-50 border border-green-100 rounded p-3">
                      <p className="text-xs font-semibold text-green-600 mb-1">短期施策</p>
                      <textarea
                        value={issue.shortTermAction}
                        onChange={(e) => updateIssue(issue.id, { shortTermAction: e.target.value })}
                        placeholder="例: 表示位置/導線の改善"
                        rows={3}
                        className="w-full border border-green-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded p-3">
                      <p className="text-xs font-semibold text-blue-600 mb-1">中長期施策</p>
                      <textarea
                        value={issue.longTermAction}
                        onChange={(e) => updateIssue(issue.id, { longTermAction: e.target.value })}
                        placeholder="例: 情報設計/構造の見直し"
                        rows={3}
                        className="w-full border border-blue-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                      />
                    </div>
                  </div>

                  {issue.sourceObsIds.length > 0 && (
                    <p className="text-xs text-gray-400">根拠: {issue.sourceObsIds.join(", ")}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <button
          type="button"
          onClick={addIssue}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-700 hover:bg-indigo-50/50 transition-colors"
        >
          + 課題カードを追加
        </button>
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
          ← 戻る
        </button>
        <button
          type="button"
          onClick={onNext}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          優先度マトリクスへ →
        </button>
      </div>
    </div>
  );
}
