"use client";

import { Issue, calcPriority, NIELSEN_PRINCIPLES } from "@/app/types";

interface Props {
  issues: Issue[];
  onNext: () => void;
  onBack: () => void;
}

export default function Step4Matrix({ issues, onNext, onBack }: Props) {
  // 縦軸: スコア合計（impact+frequency+severity）÷ 3、横軸: 工数（逆転=実装コスト→5-effort）
  const plotData = issues.map((issue) => {
    const { total } = calcPriority(issue.scores);
    const effortCost = 6 - issue.scores.effort; // 高いほど工数大
    return { issue, total, effortCost };
  });

  const priorityColor = (p: string) =>
    p === "High" ? "#ef4444" : p === "Mid" ? "#f59e0b" : "#22c55e";

  // SVGキャンバスサイズ
  const W = 480;
  const H = 360;
  const PAD = 48;
  const plotW = W - PAD * 2;
  const plotH = H - PAD * 2;

  // スコアを座標に変換（スコア1〜5 → キャンバス座標）
  const toX = (effortCost: number) => PAD + ((effortCost - 1) / 4) * plotW;
  const toY = (total: number) => PAD + plotH - ((total - 1) / 4) * plotH;

  const grouped: Record<string, Issue[]> = { High: [], Mid: [], Low: [] };
  issues.forEach((i) => grouped[i.priority].push(i));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">優先度マトリクス</h2>
        <p className="text-sm text-gray-500">縦軸: 総合スコア（高いほど重要）、横軸: 対応コスト（右ほど工数大）</p>
      </div>

      {/* SVGマトリクス */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xl mx-auto">
          {/* 背景ゾーン */}
          <rect x={PAD} y={PAD} width={plotW / 2} height={plotH / 2} fill="#fef2f2" opacity="0.5" />
          <rect x={PAD + plotW / 2} y={PAD} width={plotW / 2} height={plotH / 2} fill="#fffbeb" opacity="0.5" />
          <rect x={PAD} y={PAD + plotH / 2} width={plotW / 2} height={plotH / 2} fill="#f0fdf4" opacity="0.5" />
          <rect x={PAD + plotW / 2} y={PAD + plotH / 2} width={plotW / 2} height={plotH / 2} fill="#f9fafb" opacity="0.5" />

          {/* ゾーンラベル */}
          <text x={PAD + 8} y={PAD + 16} fontSize="10" fill="#ef4444" fontWeight="600">Quick Win</text>
          <text x={PAD + plotW / 2 + 8} y={PAD + 16} fontSize="10" fill="#f59e0b" fontWeight="600">計画的対応</text>
          <text x={PAD + 8} y={PAD + plotH - 6} fontSize="10" fill="#22c55e" fontWeight="600">後回し可</text>
          <text x={PAD + plotW / 2 + 8} y={PAD + plotH - 6} fontSize="10" fill="#9ca3af" fontWeight="600">再検討</text>

          {/* 軸 */}
          <line x1={PAD} y1={PAD} x2={PAD} y2={PAD + plotH} stroke="#e5e7eb" strokeWidth="1.5" />
          <line x1={PAD} y1={PAD + plotH} x2={PAD + plotW} y2={PAD + plotH} stroke="#e5e7eb" strokeWidth="1.5" />
          {/* 中心線 */}
          <line x1={PAD + plotW / 2} y1={PAD} x2={PAD + plotW / 2} y2={PAD + plotH} stroke="#e5e7eb" strokeDasharray="4,4" />
          <line x1={PAD} y1={PAD + plotH / 2} x2={PAD + plotW} y2={PAD + plotH / 2} stroke="#e5e7eb" strokeDasharray="4,4" />

          {/* 軸ラベル */}
          <text x={PAD - 8} y={PAD + 4} fontSize="9" fill="#9ca3af" textAnchor="middle">5</text>
          <text x={PAD - 8} y={PAD + plotH + 4} fontSize="9" fill="#9ca3af" textAnchor="middle">1</text>
          <text x={PAD} y={PAD + plotH + 18} fontSize="9" fill="#9ca3af">低</text>
          <text x={PAD + plotW} y={PAD + plotH + 18} fontSize="9" fill="#9ca3af" textAnchor="end">高</text>
          <text x={PAD + plotW / 2} y={PAD + plotH + 30} fontSize="9" fill="#6b7280" textAnchor="middle">対応コスト →</text>

          {/* データポイント */}
          {plotData.map(({ issue, total, effortCost }) => {
            const cx = toX(effortCost);
            const cy = toY(total);
            return (
              <g key={issue.id}>
                <circle cx={cx} cy={cy} r="14" fill={priorityColor(issue.priority)} opacity="0.15" />
                <circle cx={cx} cy={cy} r="7" fill={priorityColor(issue.priority)} />
                <title>{issue.title} ({issue.priority}: {total.toFixed(1)})</title>
              </g>
            );
          })}
        </svg>

        {/* 凡例 */}
        <div className="flex items-center gap-4 justify-center pb-3 text-xs text-gray-500">
          {[["High", "#ef4444"], ["Mid", "#f59e0b"], ["Low", "#22c55e"]].map(([label, color]) => (
            <div key={label} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* 優先度別リスト */}
      {(["High", "Mid", "Low"] as const).map((p) =>
        grouped[p].length > 0 ? (
          <div key={p}>
            <h3 className={`text-sm font-semibold mb-2 ${p === "High" ? "text-red-600" : p === "Mid" ? "text-amber-600" : "text-green-600"}`}>
              {p} ({grouped[p].length}件)
            </h3>
            <div className="space-y-1">
              {grouped[p].map((issue) => (
                <div key={issue.id} className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 rounded px-3 py-2">
                  <span className="font-medium">{issue.title}</span>
                  <span className="text-xs text-gray-400">N{issue.nielsenCategory}: {NIELSEN_PRINCIPLES[issue.nielsenCategory - 1]}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
          ← 戻る
        </button>
        <button
          onClick={onNext}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          改善アクション & エクスポート →
        </button>
      </div>
    </div>
  );
}
