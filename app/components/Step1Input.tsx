"use client";

import { useState } from "react";
import { SessionMeta } from "@/app/types";

interface Props {
  onNext: (meta: Omit<SessionMeta, "id" | "createdAt">, log: string) => void;
}

export default function Step1Input({ onNext }: Props) {
  const [target, setTarget] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [participants, setParticipants] = useState(1);
  const [log, setLog] = useState("");
  const canSubmit = target.trim().length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div>
        <h2 className="section-title">テスト概要</h2>
        <p className="section-sub">テストの基本情報を入力してください</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
        <div style={{ gridColumn: "1 / 2" }}>
          <label className="field-label">テスト対象 <span style={{ color: "var(--secondary)" }}>*</span></label>
          <input type="text" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="例: 決済フロー、会員登録ページ" />
        </div>
        <div>
          <label className="field-label">実施日</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div style={{ maxWidth: "120px" }}>
        <label className="field-label">参加者数</label>
        <input type="number" min={1} max={50} value={participants} onChange={(e) => setParticipants(Number(e.target.value))} />
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "6px" }}>
          <label className="field-label" style={{ margin: 0 }}>発話ログ</label>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>任意</span>
        </div>
        <p className="field-hint" style={{ marginBottom: "10px" }}>
          1人分のユーザーテストの発話録をそのまま貼り付けてください（発話者ラベルあり推奨）。
          「分析開始」でブラウザ内のルールにより、意味のある発話の抜き出しと観察・解釈・インサイトの下書きを生成します（外部APIは使いません）。
        </p>
        <textarea
          value={log}
          onChange={(e) => setLog(e.target.value)}
          placeholder={`例:\n参加者A: このボタン、どこにあるのかわからない...\n（3秒間画面を見渡す）\n参加者A: あ、ここか。でも最初に気づかなかった。\nモデレーター: どうして気づかなかったと思いますか？\n参加者A: なんか他のものに目がいってしまって...`}
          rows={12}
          style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px" }}
        />
        <p className="field-hint">{log.length.toLocaleString()} 文字</p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => onNext({ target, date, participants, title: `${target} - ${date}` }, log)}
          disabled={!canSubmit}
          className="btn-primary"
          style={{ padding: "11px 28px" }}
        >
          分析開始
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
