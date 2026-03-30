"use client";

import { Issue, calcPriority, NIELSEN_PRINCIPLES } from "@/app/types";

interface Props { issues: Issue[]; onNext: () => void; onBack: () => void; }

export default function Step4Matrix({ issues, onNext, onBack }: Props) {
  const plotData = issues.map((issue) => {
    const { total } = calcPriority(issue.scores);
    return { issue, total, effortCost: 6 - issue.scores.effort };
  });

  const priorityColor = (p: string) => p === "High" ? "#dc2626" : p === "Mid" ? "#d97706" : "#16a34a";

  const W = 480, H = 360, PAD = 52;
  const plotW = W - PAD * 2, plotH = H - PAD * 2;
  const toX = (v: number) => PAD + ((v - 1) / 4) * plotW;
  const toY = (v: number) => PAD + plotH - ((v - 1) / 4) * plotH;

  const grouped: Record<string, Issue[]> = { High: [], Mid: [], Low: [] };
  issues.forEach((i) => grouped[i.priority].push(i));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div>
        <h2 className="section-title">優先度マトリクス</h2>
        <p className="section-sub">縦軸: 総合スコア（高いほど重要）、横軸: 対応コスト（右ほど工数大）</p>
      </div>

      <div style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden", background: "var(--bg-surface)" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: "560px", display: "block", margin: "0 auto" }}>
          <rect x={PAD} y={PAD} width={plotW/2} height={plotH/2} fill="#fef2f2" opacity="0.6"/>
          <rect x={PAD+plotW/2} y={PAD} width={plotW/2} height={plotH/2} fill="#fff7ed" opacity="0.6"/>
          <rect x={PAD} y={PAD+plotH/2} width={plotW/2} height={plotH/2} fill="#f0fdf4" opacity="0.6"/>
          <rect x={PAD+plotW/2} y={PAD+plotH/2} width={plotW/2} height={plotH/2} fill="#f9fafb" opacity="0.6"/>

          <text x={PAD+10} y={PAD+18} fontSize="10" fill="#dc2626" fontWeight="600" fontFamily="'DM Sans',sans-serif">Quick Win</text>
          <text x={PAD+plotW/2+10} y={PAD+18} fontSize="10" fill="#d97706" fontWeight="600" fontFamily="'DM Sans',sans-serif">計画的対応</text>
          <text x={PAD+10} y={PAD+plotH-8} fontSize="10" fill="#16a34a" fontWeight="600" fontFamily="'DM Sans',sans-serif">後回し可</text>
          <text x={PAD+plotW/2+10} y={PAD+plotH-8} fontSize="10" fill="#9ca3af" fontWeight="600" fontFamily="'DM Sans',sans-serif">再検討</text>

          <line x1={PAD} y1={PAD} x2={PAD} y2={PAD+plotH} stroke="#E0E0DE" strokeWidth="1.5"/>
          <line x1={PAD} y1={PAD+plotH} x2={PAD+plotW} y2={PAD+plotH} stroke="#E0E0DE" strokeWidth="1.5"/>
          <line x1={PAD+plotW/2} y1={PAD} x2={PAD+plotW/2} y2={PAD+plotH} stroke="#C8C8C6" strokeDasharray="5,5" strokeWidth="1"/>
          <line x1={PAD} y1={PAD+plotH/2} x2={PAD+plotW} y2={PAD+plotH/2} stroke="#C8C8C6" strokeDasharray="5,5" strokeWidth="1"/>

          <text x={PAD-10} y={PAD+5} fontSize="9" fill="#9A9C9C" textAnchor="middle" fontFamily="'DM Sans',sans-serif">5</text>
          <text x={PAD-10} y={PAD+plotH+5} fontSize="9" fill="#9A9C9C" textAnchor="middle" fontFamily="'DM Sans',sans-serif">1</text>
          <text x={PAD+4} y={PAD+plotH+20} fontSize="9" fill="#9A9C9C" fontFamily="'DM Sans',sans-serif">低</text>
          <text x={PAD+plotW-4} y={PAD+plotH+20} fontSize="9" fill="#9A9C9C" textAnchor="end" fontFamily="'DM Sans',sans-serif">高</text>
          <text x={PAD+plotW/2} y={PAD+plotH+34} fontSize="9" fill="#575959" textAnchor="middle" fontFamily="'DM Sans',sans-serif">対応コスト →</text>

          {plotData.map(({ issue, total, effortCost }) => {
            const cx = toX(effortCost), cy = toY(total);
            const c = priorityColor(issue.priority);
            return (
              <g key={issue.id}>
                <circle cx={cx} cy={cy} r="16" fill={c} opacity="0.12"/>
                <circle cx={cx} cy={cy} r="8" fill={c}/>
                <title>{issue.title} ({issue.priority}: {total.toFixed(1)})</title>
              </g>
            );
          })}
        </svg>

        <div style={{ display: "flex", justifyContent: "center", gap: "20px", padding: "12px 0 14px", borderTop: "1px solid var(--border)" }}>
          {[["High", "#dc2626"], ["Mid", "#d97706"], ["Low", "#16a34a"]].map(([label, color]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, display: "inline-block" }}/>
              {label}
            </div>
          ))}
        </div>
      </div>

      {(["High", "Mid", "Low"] as const).map((p) =>
        grouped[p].length > 0 ? (
          <div key={p}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <span className={`badge badge-${p.toLowerCase()}`}>{p}</span>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{grouped[p].length}件</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {grouped[p].map((issue) => (
                <div key={issue.id} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", background: "var(--bg-muted)", borderRadius: "var(--radius-sm)", padding: "10px 14px" }}>
                  <span style={{ fontWeight: 500 }}>{issue.title}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto", whiteSpace: "nowrap" }}>
                    N{issue.nielsenCategory}: {NIELSEN_PRINCIPLES[issue.nielsenCategory - 1]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null
      )}

      <div className="divider" style={{ margin: "4px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={onBack} className="btn-ghost">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 2L4 6.5 8.5 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
          戻る
        </button>
        <button onClick={onNext} className="btn-primary">
          改善アクション &amp; エクスポート
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}
