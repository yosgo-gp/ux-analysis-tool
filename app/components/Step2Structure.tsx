"use client";

import { useEffect, useRef, useState } from "react";
import { Observation } from "@/app/types";

function generateId() { return Math.random().toString(36).slice(2, 10); }

interface Props {
  sessionLog: string;
  observations: Observation[];
  onChange: (observations: Observation[]) => void;
  onNext: () => void;
  onBack: () => void;
  onRegenerateFromLog?: () => void;
}

const CELLS: { field: "observation" | "interpretation" | "insight"; label: string; color: string; bg: string; border: string }[] = [
  { field: "observation",   label: "観察",      color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  { field: "interpretation",label: "解釈",      color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  { field: "insight",       label: "インサイト", color: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe" },
];

export default function Step2Structure({ sessionLog, observations, onChange, onNext, onBack, onRegenerateFromLog }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Observation>>({});
  const didAutoOpen = useRef(false);

  useEffect(() => {
    if (didAutoOpen.current || observations.length !== 1) return;
    const first = observations[0];
    if (!first.observation && !first.interpretation && !first.insight) {
      didAutoOpen.current = true;
      setEditing(first.id); setDraft({ ...first });
    }
  }, [observations]);

  const startEdit = (obs: Observation) => { setEditing(obs.id); setDraft({ ...obs }); };
  const saveEdit = () => {
    if (!editing) return;
    onChange(observations.map((o) => o.id === editing ? { ...o, ...draft } : o));
    setEditing(null);
  };
  const addObservation = () => {
    const n: Observation = { id: `obs-${generateId()}`, raw: sessionLog, observation: "", interpretation: "", insight: "" };
    onChange([...observations, n]); setEditing(n.id); setDraft({ ...n });
  };
  const removeObservation = (id: string) => {
    if (observations.length <= 1) return;
    onChange(observations.filter((o) => o.id !== id));
    if (editing === id) { setEditing(null); setDraft({}); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div>
        <h2 className="section-title">観察・解釈・インサイト入力</h2>
        <p className="section-sub">観察（事実）・解釈（仮説）・インサイト（本質的ニーズ / 痛み）を確認・修正してください。</p>
      </div>

      {onRegenerateFromLog && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button type="button" onClick={onRegenerateFromLog} className="btn-secondary" style={{ fontSize: "13px", padding: "8px 16px" }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 6.5A4.5 4.5 0 1 1 6.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M2 9.5V6.5H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            ログから観察カードを再生成
          </button>
          <span className="field-hint" style={{ margin: 0 }}>外部APIは使いません</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {observations.map((obs, idx) => (
          <div key={obs.id} style={{ border: `1.5px solid ${editing === obs.id ? "var(--primary)" : "var(--border)"}`, borderRadius: "var(--radius-md)", overflow: "hidden", transition: "border-color 0.15s" }}>
            {editing === obs.id ? (
              <div style={{ padding: "20px", background: "var(--primary-light)", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label className="field-label">元の発話</label>
                  <textarea value={draft.raw ?? ""} onChange={(e) => setDraft({ ...draft, raw: e.target.value })} rows={2} style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {CELLS.map(({ field, label }) => (
                    <div key={field}>
                      <label className="field-label">{label}</label>
                      <textarea value={(draft[field] as string) ?? ""} onChange={(e) => setDraft({ ...draft, [field]: e.target.value })} rows={3} />
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {observations.length > 1
                    ? <button type="button" onClick={() => removeObservation(obs.id)} style={{ fontSize: "13px", color: "var(--secondary)", background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}>このカードを削除</button>
                    : <div />}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setEditing(null)} className="btn-ghost">キャンセル</button>
                    <button onClick={saveEdit} className="btn-primary" style={{ padding: "8px 18px", fontSize: "13px" }}>保存</button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                      <span style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", color: "var(--text-muted)", background: "var(--bg-muted)", padding: "2px 8px", borderRadius: "4px" }}>
                        #{idx + 1}
                      </span>
                      {obs.raw && (
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "'DM Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "360px" }}>
                          {obs.raw}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                      {CELLS.map(({ field, label, color, bg, border }) => (
                        <div key={field} className="obs-cell" style={{ background: bg, border: `1px solid ${border}` }}>
                          <p className="obs-cell-label" style={{ color }}>{label}</p>
                          <p style={{ fontSize: "12px", color: "var(--text-primary)", lineHeight: 1.55, margin: 0 }}>
                            {obs[field] || <span style={{ color: "var(--text-muted)" }}>未入力</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
                    <button type="button" onClick={() => startEdit(obs)} className="btn-ghost" style={{ fontSize: "12px", padding: "5px 10px" }}>編集</button>
                    {observations.length > 1 && (
                      <button type="button" onClick={() => removeObservation(obs.id)} style={{ fontSize: "12px", color: "var(--secondary)", background: "none", border: "none", cursor: "pointer", padding: "5px 10px", borderRadius: "var(--radius-sm)" }}>削除</button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addObservation}
        style={{ width: "100%", border: "1.5px dashed var(--border-strong)", borderRadius: "var(--radius-md)", padding: "14px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", background: "none", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = "var(--primary)"; b.style.color = "var(--primary-dark)"; b.style.background = "var(--primary-light)"; }}
        onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = "var(--border-strong)"; b.style.color = "var(--text-secondary)"; b.style.background = "none"; }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        </svg>
        観察カードを追加
      </button>

      <div className="divider" style={{ margin: "4px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={onBack} className="btn-ghost">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8.5 2L4 6.5 8.5 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
          戻る
        </button>
        <button type="button" onClick={onNext} className="btn-primary">
          課題入力へ
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}
