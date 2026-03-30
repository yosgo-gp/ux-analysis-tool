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

  // Step1ではメタ情報入力後に Step2 へ進める（ログは任意）。
  const canSubmit = target.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">テスト概要</h2>
        <p className="text-sm text-gray-500">テストの基本情報を入力してください</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            テスト対象 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="例: 決済フロー、会員登録ページ"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">実施日</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      <div className="w-32">
        <label className="block text-sm font-medium text-gray-700 mb-1">参加者数</label>
        <input
          type="number"
          min={1}
          max={50}
          value={participants}
          onChange={(e) => setParticipants(Number(e.target.value))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          発話ログ <span className="text-xs font-normal text-gray-400">(任意)</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">
          1人分のユーザーテストの発話録をそのまま貼り付けてください（発話者ラベルあり推奨）。「分析開始」でブラウザ内のルールにより、
          意味のある発話の抜き出しと観察・解釈・インサイトの下書きを生成します（外部APIは使いません）。
        </p>
        <textarea
          value={log}
          onChange={(e) => setLog(e.target.value)}
          placeholder={`例:\n参加者A: このボタン、どこにあるのかわからない...\n（3秒間画面を見渡す）\n参加者A: あ、ここか。でも最初に気づかなかった。\nモデレーター: どうして気づかなかったと思いますか？\n参加者A: なんか他のものに目がいってしまって...`}
          rows={12}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{log.length} 文字</p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => onNext({ target, date, participants, title: `${target} - ${date}` }, log)}
          disabled={!canSubmit}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          分析開始 →
        </button>
      </div>
    </div>
  );
}
