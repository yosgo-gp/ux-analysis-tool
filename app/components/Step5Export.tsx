"use client";

import { Session, NIELSEN_PRINCIPLES, calcPriority } from "@/app/types";

interface Props {
  session: Session;
  onBack: () => void;
  onNewSession: () => void;
}

export default function Step5Export({ session, onBack, onNewSession }: Props) {
  const { meta, observations, issues } = session;

  const highIssues = issues.filter((i) => i.priority === "High");
  const midIssues = issues.filter((i) => i.priority === "Mid");
  const lowIssues = issues.filter((i) => i.priority === "Low");

  const downloadMarkdown = () => {
    const lines: string[] = [
      `# ユーザビリティテスト 分析レポート`,
      ``,
      `## テスト概要`,
      `- **対象:** ${meta.target}`,
      `- **実施日:** ${meta.date}`,
      `- **参加者数:** ${meta.participants}名`,
      ``,
      `---`,
      ``,
      `## 構造化ログ`,
      ``,
      `| # | 観察 | 解釈 | インサイト |`,
      `|---|------|------|-----------|`,
      ...observations.map((o) => `| ${o.id} | ${o.observation} | ${o.interpretation} | ${o.insight} |`),
      ``,
      `---`,
      ``,
      `## 課題一覧`,
      ``,
      `| ID | 課題 | ニールセン原則 | スコア | 優先度 |`,
      `|----|------|--------------|-------|-------|`,
      ...issues
        .sort((a, b) => calcPriority(b.scores).total - calcPriority(a.scores).total)
        .map((i) => `| ${i.id} | ${i.title} | N${i.nielsenCategory}: ${NIELSEN_PRINCIPLES[i.nielsenCategory - 1]} | ${calcPriority(i.scores).total.toFixed(1)} | ${i.priority} |`),
      ``,
      `---`,
      ``,
      `## 改善アクション`,
      ``,
      ...(highIssues.length > 0
        ? [
            `### 優先度: High`,
            ``,
            ...highIssues.flatMap((i) => [
              `#### ${i.title}`,
              ``,
              `**課題:** ${i.description}`,
              ``,
              `- **短期施策:** ${i.shortTermAction}`,
              `- **中長期施策:** ${i.longTermAction}`,
              ``,
            ]),
          ]
        : []),
      ...(midIssues.length > 0
        ? [
            `### 優先度: Mid`,
            ``,
            ...midIssues.flatMap((i) => [
              `#### ${i.title}`,
              ``,
              `**課題:** ${i.description}`,
              ``,
              `- **短期施策:** ${i.shortTermAction}`,
              `- **中長期施策:** ${i.longTermAction}`,
              ``,
            ]),
          ]
        : []),
      ...(lowIssues.length > 0
        ? [
            `### 優先度: Low`,
            ``,
            ...lowIssues.flatMap((i) => [
              `#### ${i.title}`,
              ``,
              `- **短期施策:** ${i.shortTermAction}`,
              `- **中長期施策:** ${i.longTermAction}`,
              ``,
            ]),
          ]
        : []),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ux-report-${meta.date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const rows = [
      ["ID", "課題", "ニールセン番号", "ニールセン原則", "影響度", "頻度", "深刻度", "工数(逆転)", "スコア", "優先度", "短期施策", "中長期施策"],
      ...issues
        .sort((a, b) => calcPriority(b.scores).total - calcPriority(a.scores).total)
        .map((i) => [
          i.id,
          i.title,
          i.nielsenCategory,
          NIELSEN_PRINCIPLES[i.nielsenCategory - 1],
          i.scores.impact,
          i.scores.frequency,
          i.scores.severity,
          i.scores.effort,
          calcPriority(i.scores).total.toFixed(1),
          i.priority,
          i.shortTermAction,
          i.longTermAction,
        ]),
    ];

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ux-issues-${meta.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const priorityBadge = (p: string) =>
    p === "High"
      ? "bg-red-100 text-red-700"
      : p === "Mid"
      ? "bg-amber-100 text-amber-700"
      : "bg-green-100 text-green-700";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">改善アクション & エクスポート</h2>
        <p className="text-sm text-gray-500">優先度順に改善アクションをまとめました。レポートをダウンロードできます。</p>
      </div>

      {/* エクスポートボタン */}
      <div className="flex gap-3">
        <button
          onClick={downloadMarkdown}
          className="flex items-center gap-2 border border-indigo-300 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
        >
          <span>⬇</span> Markdownで保存
        </button>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <span>⬇</span> CSVで保存
        </button>
      </div>

      {/* アクションリスト */}
      {(["High", "Mid", "Low"] as const).map((priority) => {
        const group = issues.filter((i) => i.priority === priority).sort((a, b) => calcPriority(b.scores).total - calcPriority(a.scores).total);
        if (group.length === 0) return null;
        return (
          <div key={priority}>
            <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2`}>
              <span className={`px-2 py-0.5 rounded-full text-xs ${priorityBadge(priority)}`}>{priority}</span>
              <span className="text-gray-600">{group.length}件</span>
            </h3>
            <div className="space-y-3">
              {group.map((issue) => (
                <div key={issue.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800 text-sm">{issue.title}</span>
                      <span className="text-xs text-gray-400">
                        N{issue.nielsenCategory}: {NIELSEN_PRINCIPLES[issue.nielsenCategory - 1]}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">スコア {calcPriority(issue.scores).total.toFixed(1)}</span>
                    </div>
                    <p className="text-sm text-gray-600">{issue.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-600 mb-1">短期施策</p>
                      <p className="text-sm text-green-800">{issue.shortTermAction}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-600 mb-1">中長期施策</p>
                      <p className="text-sm text-blue-800">{issue.longTermAction}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
          ← 戻る
        </button>
        <button
          onClick={onNewSession}
          className="bg-gray-800 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
        >
          新しいセッションを開始
        </button>
      </div>
    </div>
  );
}
