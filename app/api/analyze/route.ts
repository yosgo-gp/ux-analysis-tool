import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { Observation, Issue, IssueScore, calcPriority } from "@/app/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// STEP1: 発話ログを観察/解釈/インサイトに構造化
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, ...payload } = body;

  try {
    if (action === "structure") {
      return await handleStructure(payload);
    } else if (action === "extract_issues") {
      return await handleExtractIssues(payload);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "API error" }, { status: 500 });
  }
}

async function handleStructure(payload: { log: string; target: string }) {
  const { log, target } = payload;

  const stream = await client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 8000,
    system: `あなたはUXリサーチの専門家です。ユーザビリティテストの発話ログを分析し、以下の型で構造化してください。

出力は必ずJSON配列で返してください。他のテキストは含めないでください。

各要素の構造:
{
  "id": "obs-1", // obs-1, obs-2, ... の連番
  "raw": "元の発話テキスト（1〜3文程度のまとまり）",
  "observation": "観察（何が起きたか・事実のみ）",
  "interpretation": "解釈（なぜ起きたか・仮説）",
  "insight": "インサイト（ユーザーの本質的なニーズや痛み）"
}

ルール:
- 発話を意味のあるまとまりで区切る（タスクや話題の切れ目）
- 観察は主観を含めない
- 解釈は「〜の可能性がある」「〜と推測される」の形
- インサイトは「ユーザーは〜を求めている」「〜が障壁になっている」の形
- テスト対象: ${target}`,
    messages: [{ role: "user", content: `以下の発話ログを構造化してください:\n\n${log}` }],
  });

  const message = await stream.finalMessage();
  const text = message.content.find((b) => b.type === "text")?.text ?? "[]";

  let observations: Observation[];
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    observations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    observations = [];
  }

  return NextResponse.json({ observations });
}

async function handleExtractIssues(payload: { observations: Observation[]; target: string }) {
  const { observations, target } = payload;

  const obsText = observations
    .map((o) => `[${o.id}] 観察: ${o.observation} / 解釈: ${o.interpretation} / インサイト: ${o.insight}`)
    .join("\n");

  const stream = await client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 8000,
    system: `あなたはUXリサーチの専門家です。インサイトから課題を抽出し、ニールセン10原則に分類して優先度スコアを提案してください。

出力は必ずJSON配列で返してください。他のテキストは含めないでください。

各要素の構造:
{
  "id": "issue-1",
  "title": "課題タイトル（20字以内）",
  "description": "課題の詳細説明",
  "nielsenCategory": 1〜10の整数,
  "scores": {
    "impact": 1〜5, // 影響度（どのくらいのユーザーに影響するか）
    "frequency": 1〜5, // 頻度（どれくらい発生するか）
    "severity": 1〜5, // 深刻度（タスク完了への影響）
    "effort": 1〜5  // 工数の逆転スコア（すぐ対応できる=5、大規模改修=1）
  },
  "shortTermAction": "短期施策（すぐできる改善案）",
  "longTermAction": "中長期施策（根本的な改善案）",
  "sourceObsIds": ["obs-1", "obs-2"] // 根拠となった観察のID
}

ニールセン10原則:
1=システム状態の可視性, 2=実世界との一致, 3=ユーザーコントロールと自由度,
4=一貫性と標準, 5=エラー防止, 6=記憶より認識, 7=柔軟性と効率性,
8=美的で最小限のデザイン, 9=エラーの認識・診断・回復, 10=ヘルプとドキュメント

テスト対象: ${target}`,
    messages: [{ role: "user", content: `以下のインサイトから課題を抽出してください:\n\n${obsText}` }],
  });

  const message = await stream.finalMessage();
  const text = message.content.find((b) => b.type === "text")?.text ?? "[]";

  let rawIssues: Omit<Issue, "priority">[];
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    rawIssues = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch {
    rawIssues = [];
  }

  const issues: Issue[] = rawIssues.map((issue) => {
    const scores = issue.scores as IssueScore;
    const { priority } = calcPriority(scores);
    return { ...issue, priority };
  });

  return NextResponse.json({ issues });
}
