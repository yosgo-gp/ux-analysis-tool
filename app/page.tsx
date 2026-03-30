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

function generateId() { return Math.random().toString(36).slice(2, 10); }

function saveSession(session: Session) {
  try {
    const sessions: Record<string, Session> = JSON.parse(localStorage.getItem("uxat_sessions") ?? "{}");
    sessions[session.meta.id] = session;
    localStorage.setItem("uxat_sessions", JSON.stringify(sessions));
  } catch {}
}

export default function HomePage() {
  const [step, setStep] = useState<Step>(1);
  const [meta, setMeta] = useState<SessionMeta | null>(null);
  const [sessionLog, setSessionLog] = useState("");
  const [observations, setObservations] = useState<Observation[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const session: Session | null = meta ? { meta, observations, issues } : null;

  const handleStep1Next = useCallback((metaInput: Omit<SessionMeta, "id" | "createdAt">, log: string) => {
    const newMeta: SessionMeta = { ...metaInput, id: generateId(), createdAt: new Date().toISOString() };
    setMeta(newMeta); setSessionLog(log);
    const nextObs: Observation[] = log.trim().length > 0
      ? generateObservationsFromTranscript(log, generateId)
      : [{ id: `obs-${generateId()}`, raw: "", observation: "", interpretation: "", insight: "" }];
    setObservations(nextObs); setIssues([]); setStep(2);
  }, []);

  const handleStep2Next = useCallback(() => {
    if (!meta) return;
    setIssues((prev) => {
      if (prev.length > 0) return prev;
      const s = { impact: 3, frequency: 3, severity: 3, effort: 3 };
      const { priority } = calcPriority(s);
      return [{ id: `issue-${generateId()}`, title: "", description: "", nielsenCategory: 1, scores: s, priority, shortTermAction: "", longTermAction: "", sourceObsIds: [] }];
    });
    setStep(3);
  }, [meta]);

  const handleStep3Next = useCallback(() => { if (session) saveSession(session); setStep(4); }, [session]);
  const handleStep4Next = useCallback(() => { if (session) saveSession(session); setStep(5); }, [session]);
  const handleNewSession = useCallback(() => { setStep(1); setMeta(null); setSessionLog(""); setObservations([]); setIssues([]); }, []);
  const handleRegen = useCallback(() => { if (!sessionLog.trim()) return; setObservations(generateObservationsFromTranscript(sessionLog, generateId)); }, [sessionLog]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      {/* Header — BG/500 blue-gray */}
      <header style={{ background: "var(--navy-mid)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 24px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Orange accent logo mark */}
            <div style={{ width: "30px", height: "30px", background: "var(--primary)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" fill="white"/>
                <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.6"/>
                <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" fill="white" opacity="0.6"/>
                <rect x="9" y="9" width="5.5" height="5.5" rx="1.5" fill="white"/>
              </svg>
            </div>
            <div>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "white", letterSpacing: "-0.02em" }}>UX分析ツール</span>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginLeft: "10px" }}>ユーザビリティテスト 一気通貫分析</span>
            </div>
          </div>
          {step > 1 && meta && (
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {meta.target}
            </span>
          )}
        </div>
      </header>

      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "36px 24px 80px" }}>
        {/* Stepper */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "32px", overflowX: "auto", paddingBottom: "4px" }}>
          {STEP_LABELS.map((label, i) => {
            const s = (i + 1) as Step;
            const active = step === s;
            const done = step > s;
            const cls = active ? "active" : done ? "done" : "future";
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEP_LABELS.length - 1 ? "1" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <div className={`stepper-dot ${cls}`}>
                    {done ? (
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path d="M1.5 5L4.5 8L10.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : s}
                  </div>
                  <span className={`stepper-label ${cls} hidden sm:inline`}>{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && <div className={`stepper-line ${done ? "done" : ""}`} style={{ margin: "0 8px" }} />}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "36px 40px" }}>
          {step === 1 && <Step1Input onNext={handleStep1Next} />}
          {step === 2 && <Step2Structure sessionLog={sessionLog} observations={observations} onChange={setObservations} onNext={handleStep2Next} onBack={() => setStep(1)} onRegenerateFromLog={sessionLog.trim() ? handleRegen : undefined} />}
          {step === 3 && <Step3Issues issues={issues} observations={observations} onChange={setIssues} onNext={handleStep3Next} onBack={() => setStep(2)} />}
          {step === 4 && <Step4Matrix issues={issues} onNext={handleStep4Next} onBack={() => setStep(3)} />}
          {step === 5 && session && <Step5Export session={session} onBack={() => setStep(4)} onNewSession={handleNewSession} />}
        </div>
      </main>
    </div>
  );
}
