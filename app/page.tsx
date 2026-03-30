"use client";

import { useState, useCallback } from "react";
import { Session, SessionMeta, Observation, Issue, calcPriority } from "@/app/types";
import { generateObservationsFromTranscript } from "@/app/lib/transcriptAnalysis";
import Step1Input from "@/app/components/Step1Input";
import Step2Structure from "@/app/components/Step2Structure";
import Step3Issues from "@/app/components/Step3Issues";
import Step4Matrix from "@/app/components/Step4Matrix";
import Step5Export from "@/app/components/Step5Export";

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS = ["入力", "構造化確認", "課題・優先度", "マトリクス", "エクスポート"];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function saveSession(session: Session) {
  try {
    const sessions: Record<string, Session> = JSON.parse(localStorage.getItem("uxat_sessions") ?? "{}");
    sessions[session.meta.id] = session;
    localStorage.setItem("uxat_sessions", JSON.stringify(sessions));
  } catch {
    // localStorage unavailable
  }
}

export default function HomePage() {
  const [step, setStep] = useState<Step>(1);

  const [meta, setMeta] = useState<SessionMeta | null>(null);
  /** Step1で入力した発話ログ（新規観察カードの raw 初期値として使う） */
  const [sessionLog, setSessionLog] = useState("");
  const [observations, setObservations] = useState<Observation[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);

  const session: Session | null = meta
    ? { meta, observations, issues }
    : null;

  const handleStep1Next = useCallback(
    (metaInput: Omit<SessionMeta, "id" | "createdAt">, log: string) => {
      const newMeta: SessionMeta = {
        ...metaInput,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setMeta(newMeta);
      setSessionLog(log);
      // 発話ログがある場合はルールベースで観察カードを複数生成（APIなし）
      const nextObservations: Observation[] =
        log.trim().length > 0
          ? generateObservationsFromTranscript(log, generateId)
          : [
              {
                id: `obs-${generateId()}`,
                raw: "",
                observation: "",
                interpretation: "",
                insight: "",
              },
            ];

      setObservations(nextObservations);
      setIssues([]); // 後続ステップの状態をクリア
      setStep(2);
    },
    []
  );

  const handleStep2Next = useCallback(() => {
    if (!meta) return;

    // 初回のみ空の課題カードを1件。Step3で追加済みの場合や戻る→進むの再入場では上書きしない。
    setIssues((prev) => {
      if (prev.length > 0) return prev;
      const initialScores = { impact: 3, frequency: 3, severity: 3, effort: 3 };
      const { priority } = calcPriority(initialScores);
      return [
        {
          id: `issue-${generateId()}`,
          title: "",
          description: "",
          nielsenCategory: 1,
          scores: initialScores,
          priority,
          shortTermAction: "",
          longTermAction: "",
          sourceObsIds: [],
        },
      ];
    });
    setStep(3);
  }, [meta]);

  const handleStep3Next = useCallback(() => {
    if (session) saveSession(session);
    setStep(4);
  }, [session]);

  const handleStep4Next = useCallback(() => {
    if (session) saveSession(session);
    setStep(5);
  }, [session]);

  const handleNewSession = useCallback(() => {
    setStep(1);
    setMeta(null);
    setSessionLog("");
    setObservations([]);
    setIssues([]);
  }, []);

  const handleRegenerateObservationsFromLog = useCallback(() => {
    if (!sessionLog.trim()) return;
    setObservations(generateObservationsFromTranscript(sessionLog, generateId));
  }, [sessionLog]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">UX分析ツール</h1>
            <p className="text-xs text-gray-400">ユーザビリティテスト 一気通貫分析</p>
          </div>
          {step > 1 && meta && (
            <p className="text-xs text-gray-500 truncate max-w-xs">{meta.target} — {meta.date}</p>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* ステッパー */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto">
          {STEP_LABELS.map((label, i) => {
            const s = (i + 1) as Step;
            const active = step === s;
            const done = step > s;
            return (
              <div key={s} className="flex items-center gap-1 shrink-0">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                  active ? "bg-indigo-600 text-white" : done ? "bg-indigo-100 text-indigo-700" : "text-gray-400"
                }`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                    active ? "bg-white text-indigo-600" : done ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                    {done ? "✓" : s}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && <div className="w-4 h-px bg-gray-200" />}
              </div>
            );
          })}
        </div>

        {/* ステップコンテンツ */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {step === 1 && <Step1Input onNext={handleStep1Next} />}
          {step === 2 && (
            <Step2Structure
              sessionLog={sessionLog}
              observations={observations}
              onChange={setObservations}
              onNext={handleStep2Next}
              onBack={() => setStep(1)}
              onRegenerateFromLog={sessionLog.trim() ? handleRegenerateObservationsFromLog : undefined}
            />
          )}
          {step === 3 && (
            <Step3Issues
              issues={issues}
              observations={observations}
              onChange={setIssues}
              onNext={handleStep3Next}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <Step4Matrix
              issues={issues}
              onNext={handleStep4Next}
              onBack={() => setStep(3)}
            />
          )}
          {step === 5 && session && (
            <Step5Export
              session={session}
              onBack={() => setStep(4)}
              onNewSession={handleNewSession}
            />
          )}
        </div>
      </main>
    </div>
  );
}
