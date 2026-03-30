import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { Observation, Issue, IssueScore, calcPriority } from "@/app/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function generate(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
  return result.response.text();
}

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

  const prompt = `あなたはUXリサーチの専門家です。ユーザビリティテストの発話ログを分析し、以下の型で構造化してください。

出力は必ずJSON配列のみを返してください。マークダウンのコードブロック（\`\`\`json など）は含めないでください。

各要素の構造:
{
  "id": "obs-1",
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
- テスト対象: ${target}

以下の発話ログを構造化してください:

${log}`;

  const text = await generate(prompt);

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

  const prompt = `あなたはUXリサーチの専門家です。インサイトから課題を抽出し、ニールセン10原則に分類して優先度スコアを提案してください。

出力は必ずJSON配列のみを返してください。マークダウンのコードブロック（\`\`\`json など）は含めないでください。

各要素の構造:
{
  "id": "issue-1",
  "title": "課題タイトル（20字以内）",
  "description": "課題の詳細説明",
  "nielsenCategory": 1〜10の整数,
  "scores": {
    "impact": 1〜5,
    "frequency": 1〜5,
    "severity": 1〜5,
    "effort": 1〜5
  },
  "shortTermAction": "短期施策（すぐできる改善案）",
  "longTermAction": "中長期施策（根本的な改善案）",
  "sourceObsIds": ["obs-1", "obs-2"]
}

スコアの意味:
- impact: 影響度（1=ごく一部のユーザー、5=ほぼ全ユーザーに影響）
- frequency: 頻度（1=稀に発生、5=ほぼ毎回発生）
- severity: 深刻度（1=軽微な不満、5=タスク完了不能）
- effort: 工数の逆転スコア（1=大規模改修が必要、5=即日対応できる）

ニールセン10原則:
1=システム状態の可視性, 2=実世界との一致, 3=ユーザーコントロールと自由度,
4=一貫性と標準, 5=エラー防止, 6=記憶より認識, 7=柔軟性と効率性,
8=美的で最小限のデザイン, 9=エラーの認識・診断・回復, 10=ヘルプとドキュメント

テスト対象: ${target}

以下のインサイトから課題を抽出してください:

${obsText}`;

  const text = await generate(prompt);

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
