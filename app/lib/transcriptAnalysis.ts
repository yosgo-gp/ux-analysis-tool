/**
 * 外部APIなし：発話ログを行単位に分解し、ルールベースで「意味のある発話」を抽出し、
 * 前後文脈を付けたうえで観察・解釈・インサイトの下書きを生成する。
 * （LLMではないため、あくまでヒューリスティックな支援用）
 */

import type { Observation } from "@/app/types";

/** 話者がモデレーター側とみなすラベル（部分一致・小文字化前に正規化） */
const MODERATOR_SPEAKER_RE =
  /^(モデレーター|司会|ファシリテーター|インタビュアー|facilitator|moderator|m)\s*[:：]/i;

/** 参加者側とみなしやすいラベル */
const PARTICIPANT_SPEAKER_RE =
  /^(参加者|被験者|ユーザー|user|participant|p|被験者[a-z]?|[ABＡＢ])\s*[:：]/i;

/** 舞台指示のみの行（除外して前後文脈に回す） */
const STAGE_ONLY_RE = /^[（(].+[）)]\s*$/;

/** 意味のある発話とみなすキーワード（重み付き） */
const KEYWORD_RULES: Array<{ pattern: RegExp; weight: number }> = [
  { pattern: /わからない|分からない|不明/, weight: 2.5 },
  { pattern: /見つからない|見つけられない|どこにあ/, weight: 2.5 },
  { pattern: /どこ|どこに|どこで|どこを/, weight: 1.2 },
  { pattern: /迷う|迷って|迷った/, weight: 1.8 },
  { pattern: /困る|困って|困った|難しい|できない/, weight: 2 },
  { pattern: /エラー|おかしい|変だ|おかし/, weight: 1.8 },
  { pattern: /気づかない|気づけない|気付かない/, weight: 2 },
  { pattern: /押せない|押した|クリック|タップ/, weight: 1 },
  { pattern: /読めない|読みにく|文字が小さ/, weight: 1.5 },
  { pattern: /遅い|待つ|待った|ロード/, weight: 1.5 },
  { pattern: /不安|怖い|イライラ|ストレス|疲れ/, weight: 1.8 },
  { pattern: /うまくいかない|ダメ|詰まる|行き詰ま/, weight: 2 },
  { pattern: /何度も|何回も|繰り返し/, weight: 1.2 },
  { pattern: /忘れ|覚えられない|思い出せない/, weight: 1.5 },
  { pattern: /最初に|すぐ|直感的|直感/, weight: 0.8 },
  { pattern: /気になる|気にする|ちょっと/, weight: 0.6 },
];

const MAX_CARDS = 24;
const MIN_SCORE = 1.0;
const CONTEXT_RADIUS = 1;

export interface ParsedLine {
  index: number;
  text: string;
  speaker: string | null;
  body: string;
  isModerator: boolean;
  isStageOnly: boolean;
}

function normalizeSpeakerLabel(raw: string): string {
  return raw.replace(/\s+/g, "").toLowerCase();
}

/** 「話者: 本文」形式を分解。話者なしは body=全文 */
export function parseTranscriptLine(line: string): { speaker: string | null; body: string } {
  const m = line.match(/^([^:：\n]{1,32})[:：]\s*(.*)$/);
  if (!m) return { speaker: null, body: line.trim() };
  const speaker = m[1].trim();
  const body = m[2].trim();
  if (body.length === 0) return { speaker: null, body: line.trim() };
  return { speaker, body };
}

function scoreUtterance(body: string): number {
  let score = 0;
  for (const { pattern, weight } of KEYWORD_RULES) {
    if (pattern.test(body)) score += weight;
  }
  if (body.length >= 25) score += 0.4;
  if (body.length >= 60) score += 0.3;
  return score;
}

function classifyLine(line: string): ParsedLine {
  const trimmed = line.trim();
  const { speaker, body } = parseTranscriptLine(trimmed);
  const bodyForScore = body.length > 0 ? body : trimmed;

  let isModerator = false;
  if (speaker) {
    const sp = normalizeSpeakerLabel(speaker);
    if (MODERATOR_SPEAKER_RE.test(trimmed) || /モデレーター|司会|ファシリテーター|インタビュアー|facilitator|moderator/.test(sp)) {
      isModerator = true;
    }
  }

  const isStageOnly = STAGE_ONLY_RE.test(trimmed) && trimmed.length < 120;

  return {
    index: -1,
    text: trimmed,
    speaker,
    body: bodyForScore,
    isModerator,
    isStageOnly,
  };
}

function buildInterpretation(body: string): string {
  const b = body;
  if (/わからない|分からない|不明/.test(b)) {
    return "情報の見つけ方・説明の足りなさにより、理解が追いついていない可能性がある。";
  }
  if (/見つからない|見つけられない|どこ/.test(b)) {
    return "探索やラベリングの問題で、目的の要素に到達しづらい可能性がある。";
  }
  if (/遅い|待つ|ロード/.test(b)) {
    return "待機やフィードバックの不足により、不安や中断が生じている可能性がある。";
  }
  if (/エラー|おかしい|変/.test(b)) {
    return "システムの状態やエラー回復が十分に伝わっていない可能性がある。";
  }
  if (/押せない|クリック|タップ/.test(b)) {
    return "操作対象の発見性やクリック可能性に課題がある可能性がある。";
  }
  if (/読めない|読みにく|小さ/.test(b)) {
    return "情報の視認性や情報量の調整に課題がある可能性がある。";
  }
  if (/困る|難しい|できない|詰まる/.test(b)) {
    return "タスク達成の途中で障壁に直面している可能性がある。";
  }
  if (/気づかない|気づけない/.test(b)) {
    return "注意を引く設計や階層の問題で、重要情報が見落とされている可能性がある。";
  }
  return "発話内容から、操作や理解の過程で何らかのつまずきが示唆される。";
}

function buildInsight(body: string): string {
  const b = body;
  if (/わからない|分からない|見つからない|どこ/.test(b)) {
    return "ユーザーは次に何をすべきか・どこを見るべきかを素早く把握したいが、現状の導線や説明ではそれが十分に叶っていない可能性がある。";
  }
  if (/遅い|待つ|ロード/.test(b)) {
    return "ユーザーは処理の見える化と待ち時間の許容できる説明を求めているが、不安や中断の体験が障壁になっている可能性がある。";
  }
  if (/エラー/.test(b)) {
    return "ユーザーは失敗しても立て直せる安心感を求めているが、エラーの意味や次の一手が伝わりにくい可能性がある。";
  }
  if (/気づかない|気づけない/.test(b)) {
    return "ユーザーは重要な操作や情報に自然に気づける体験を求めているが、視覚的優先度や配置の問題でそれが妨げられている可能性がある。";
  }
  return "ユーザーはスムーズに目的を達成したいという根本欲求に対し、現状の体験に摩擦が生じている可能性がある。";
}

function buildObservationFact(parsed: ParsedLine, contextLines: string[]): string {
  const core = parsed.body.slice(0, 200);
  const speakerHint = parsed.speaker ? `${parsed.speaker}の発話として` : "発話として";
  const ctx = contextLines.filter(Boolean).join(" ");
  if (ctx.length > 0) {
    return `${speakerHint}「${core}」が記録されている。前後の文脈: ${ctx.slice(0, 280)}${ctx.length > 280 ? "…" : ""}`;
  }
  return `${speakerHint}「${core}」が記録されている。`;
}

function contextSnippet(lines: string[], center: number, radius: number): string[] {
  const out: string[] = [];
  for (let j = center - radius; j <= center + radius; j++) {
    if (j < 0 || j >= lines.length) continue;
    if (j === center) continue;
    const t = lines[j].trim();
    if (t.length === 0) continue;
    out.push(t);
  }
  return out;
}

/**
 * 発話ログ全文から Observation を生成する。
 */
export function generateObservationsFromTranscript(fullLog: string, newId: () => string): Observation[] {
  const rawLines = fullLog.replace(/\r\n/g, "\n").split("\n");
  const lines = rawLines.map((l) => l.trimEnd());

  type Candidate = { index: number; score: number; parsed: ParsedLine };
  const candidates: Candidate[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;

    const parsed = classifyLine(line);
    parsed.index = i;

    if (parsed.isStageOnly) continue;
    if (parsed.isModerator) continue;

    const body = parsed.body;
    if (body.length < 4) continue;

    let score = scoreUtterance(body);
    if (parsed.speaker && PARTICIPANT_SPEAKER_RE.test(line)) {
      score += 0.5;
    }
    if (!parsed.speaker && score < MIN_SCORE) {
      score = scoreUtterance(line);
    }

    if (score < MIN_SCORE) continue;

    candidates.push({ index: i, score, parsed });
  }

  candidates.sort((a, b) => b.score - a.score);

  const used = new Set<number>();
  const picked: Candidate[] = [];
  for (const c of candidates) {
    if (picked.length >= MAX_CARDS) break;
    if (used.has(c.index)) continue;
    let tooClose = false;
    for (const u of used) {
      if (Math.abs(u - c.index) <= 1) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;
    used.add(c.index);
    picked.push(c);
  }

  picked.sort((a, b) => a.index - b.index);

  if (picked.length === 0) {
    return [
      {
        id: `obs-${newId()}`,
        raw: fullLog.trim(),
        observation: "（自動抽出の対象となる発話が十分に検出できなかった。ログ全体を手で区切るか、キーワードを含む発話を追記してください。）",
        interpretation: "抽出ルールに合致する発話が少ない、またはモデレーター発話のみが多い可能性がある。",
        insight: "ユーザー発話の密度を高めるか、ラベル（参加者:）を付けると抽出精度が上がりやすい。",
      },
    ];
  }

  return picked.map(({ index, parsed }) => {
    const from = Math.max(0, index - CONTEXT_RADIUS);
    const to = Math.min(lines.length - 1, index + CONTEXT_RADIUS);
    const rawBlock = lines.slice(from, to + 1).join("\n").trim();
    const ctx = contextSnippet(lines, index, CONTEXT_RADIUS);

    return {
      id: `obs-${newId()}`,
      raw: rawBlock,
      observation: buildObservationFact(parsed, ctx),
      interpretation: buildInterpretation(parsed.body),
      insight: buildInsight(parsed.body),
    };
  });
}
