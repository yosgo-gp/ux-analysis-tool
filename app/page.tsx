"use client";

import { useState, useCallback } from "react";
import { Session, SessionMeta, Observation, Issue } from "@/app/types";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [meta, setMeta] = useState<SessionMeta | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);

  const session: Session | null = meta
    ? { meta, observations, issues }
    : null;

  const handleStep1Next = useCallback(
    async (metaInput: Omit<SessionMeta, "id" | "createdAt">, log: string) => {
      const newMeta: SessionMeta = {
        ...metaInput,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setMeta(newMeta);
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "structure", log, target: metaInput.target }),
        });
        if (!res.ok) throw new Error("分析に失敗しました");
        const data = await res.json();
        setObservations(data.observations);
        setStep(2);
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleStep2Next = useCallback(async () => {
    if (!meta) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extract_issues", observations, target: meta.target }),
      });
      if (!res.ok) throw new Error("課題抽出に失敗しました");
      const data = await res.json();
      setIssues(data.issues);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [meta, observations]);

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
    setObservations([]);
    setIssues([]);
    setError(null);
  }, []);

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

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ローディングオーバーレイ */}
        {loading && (
          <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-600">
                {step === 1 ? "発話ログを構造化しています..." : "課題を抽出しています..."}
              </p>
            </div>
          </div>
        )}

        {/* ステップコンテンツ */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {step === 1 && <Step1Input onNext={handleStep1Next} />}
          {step === 2 && (
            <Step2Structure
              observations={observations}
              onChange={setObservations}
              onNext={handleStep2Next}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step3Issues
              issues={issues}
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
