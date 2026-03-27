"use client";

import { useState } from "react";
import { Observation } from "@/app/types";

interface Props {
  observations: Observation[];
  onChange: (observations: Observation[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Structure({ observations, onChange, onNext, onBack }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Observation>>({});

  const startEdit = (obs: Observation) => {
    setEditing(obs.id);
    setDraft({ ...obs });
  };

  const saveEdit = () => {
    if (!editing) return;
    onChange(observations.map((o) => (o.id === editing ? { ...o, ...draft } : o)));
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">構造化ログ確認</h2>
        <p className="text-sm text-gray-500">
          AIが発話ログを「観察 / 解釈 / インサイト」に構造化しました。内容を確認し、必要に応じて修正してください。
        </p>
      </div>

      <div className="space-y-3">
        {observations.map((obs) => (
          <div key={obs.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {editing === obs.id ? (
              <div className="p-4 space-y-3 bg-indigo-50">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">元の発話</label>
                  <textarea
                    value={draft.raw ?? ""}
                    onChange={(e) => setDraft({ ...draft, raw: e.target.value })}
                    rows={2}
                    className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm font-mono"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(["observation", "interpretation", "insight"] as const).map((field) => (
                    <div key={field}>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {field === "observation" ? "観察" : field === "interpretation" ? "解釈" : "インサイト"}
                      </label>
                      <textarea
                        value={(draft[field] as string) ?? ""}
                        onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
                        rows={3}
                        className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditing(null)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1">
                    キャンセル
                  </button>
                  <button onClick={saveEdit} className="text-sm bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-mono mb-2">{obs.id}</p>
                    <p className="text-sm text-gray-600 font-mono bg-gray-50 rounded px-2 py-1 mb-3 line-clamp-2">
                      {obs.raw}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Cell label="観察" color="blue" text={obs.observation} />
                      <Cell label="解釈" color="amber" text={obs.interpretation} />
                      <Cell label="インサイト" color="purple" text={obs.insight} />
                    </div>
                  </div>
                  <button
                    onClick={() => startEdit(obs)}
                    className="text-xs text-gray-400 hover:text-indigo-600 whitespace-nowrap"
                  >
                    編集
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
          ← 戻る
        </button>
        <button
          onClick={onNext}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          課題を抽出 →
        </button>
      </div>
    </div>
  );
}

function Cell({ label, color, text }: { label: string; color: "blue" | "amber" | "purple"; text: string }) {
  const colors = {
    blue: "bg-blue-50 text-blue-800 border-blue-100",
    amber: "bg-amber-50 text-amber-800 border-amber-100",
    purple: "bg-purple-50 text-purple-800 border-purple-100",
  };
  const labelColors = {
    blue: "text-blue-500",
    amber: "text-amber-500",
    purple: "text-purple-500",
  };
  return (
    <div className={`border rounded p-2 ${colors[color]}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${labelColors[color]}`}>{label}</p>
      <p className="text-xs leading-relaxed">{text}</p>
    </div>
  );
}
