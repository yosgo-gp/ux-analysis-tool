"use client";

import { Session, NIELSEN_PRINCIPLES, calcPriority } from "@/app/types";

interface Props { session: Session; onBack: () => void; onNewSession: () => void; }

export default function Step5Export({ session, onBack, onNewSession }: Props) {
  const { meta, observations, issues } = session;

  const downloadMarkdown = () => {
    const sortedIssues = [...issues].sort((a, b) => calcPriority(b.scores).total - calcPriority(a.scores).total);
    const lines = [
      `# ユーザビリティテスト 分析レポート`,
      ``, `## テスト概要`,
      `- **対象:** ${meta.target}`,
      `- **実施日:** ${meta.date}`,
      `- **参加者数:** ${meta.participants}名`,
      ``, `---`, ``, `## 構造化ログ`, ``,
      `| # | 観察 | 解釈 | インサイト |`,
      `|---|------|------|-----------|`,
      ...observations.map((o) => `| ${o.id} | ${o.observation} | ${o.interpretation} | ${o.insight} |`),
      ``, `---`, ``, `## 課題一覧`, ``,
      `| ID | 課題 | ニールセン原則 | スコア | 優先度 |`,
      `|----|------|--------------|-------|-------|`,
      ...sortedIssues.map((i) => `| ${i.id} | ${i.title} | N${i.nielsenCategory}: ${NIELSEN_PRINCIPLES[i.nielsenCategory-1]} | ${calcPriority(i.scores).total.toFixed(1)} | ${i.priority} |`),
      ``, `---`, ``, `## 改善アクション`, ``,
      ...sortedIssues.flatMap((i) => [`### ${i.title} (${i.priority})`, ``, `**課題:** ${i.description}`, ``, `- **短期施策:** ${i.shortTermAction}`, `- **中長期施策:** ${i.longTermAction}`, ``]),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `ux-report-${meta.date}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const rows = [
      ["ID","課題","ニールセン番号","ニールセン原則","影響度","頻度","深刻度","工数","スコア","優先度","短期施策","中長期施策"],
      ...[...issues].sort((a,b) => calcPriority(b.scores).total - calcPriority(a.scores).total).map((i) => [
        i.id, i.title, i.nielsenCategory, NIELSEN_PRINCIPLES[i.nielsenCategory-1],
        i.scores.impact, i.scores.frequency, i.scores.severity, i.scores.effort,
        calcPriority(i.scores).total.toFixed(1), i.priority, i.shortTermAction, i.longTermAction,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `ux-issues-${meta.date}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div>
        <h2 className="section-title">改善アクション &amp; エクスポート</h2>
        <p className="section-sub">優先度順に改善アクションをまとめました。レポートをダウンロードできます。</p>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button onClick={downloadMarkdown} className="btn-secondary" style={{ fontSize: "13px" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v7M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 11h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
          </svg>
          Markdownで保存
        </button>
        <button onClick={downloadCSV} className="btn-secondary" style={{ fontSize: "13px" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v7M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 11h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
          </svg>
          CSVで保存
        </button>
      </div>

      {(["High", "Mid", "Low"] as const).map((priority) => {
        const group = [...issues].filter((i) => i.priority === priority).sort((a,b) => calcPriority(b.scores).total - calcPriority(a.scores).total);
        if (group.length === 0) return null;
        return (
          <div key={priority}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span className={`badge badge-${priority.toLowerCase()}`}>{priority}</span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{group.length}件</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {group.map((issue) => (
                <div key={issue.id} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                  <div style={{ padding: "14px 18px 12px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                      <div>
                        <p style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-primary)", margin: "0 0 3px" }}>{issue.title}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>N{issue.nielsenCategory}: {NIELSEN_PRINCIPLES[issue.nielsenCategory-1]}</p>
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>スコア {calcPriority(issue.scores).total.toFixed(1)}</span>
                    </div>
                    {issue.description && <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "8px 0 0" }}>{issue.description}</p>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
                    <div style={{ padding: "14px 18px", borderRight: "1px solid var(--border)" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>短期施策</p>
                      <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: 0, lineHeight: 1.55 }}>{issue.shortTermAction || "—"}</p>
                    </div>
                    <div style={{ padding: "14px 18px" }}>
                      <p style={{ fontSize: "11px", fontWeight: 600, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 6px" }}>中長期施策</p>
                      <p style={{ fontSize: "13px", color: "var(--text-primary)", margin: 0, lineHeight: 1.55 }}>{issue.longTermAction || "—"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="divider" style={{ margin: "4px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={onBack} className="btn-ghost">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 2L4 6.5 8.5 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
          戻る
        </button>
        <button onClick={onNewSession} className="btn-primary">新しいセッションを開始</button>
      </div>
    </div>
  );
}
