import type { Observation, Issue, IssueScore, Priority } from "@/app/types";
import { calcPriority, NIELSEN_PRINCIPLES } from "@/app/types";

export interface IssueCandidateMeta {
  candidateNielsenCategories: number[];
  shortTermTemplates: string[];
  longTermTemplates: string[];
  seedInsight: string;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

type IssueTypeKey =
  | "visibility"
  | "mapping"
  | "control"
  | "consistency"
  | "error_prevention"
  | "recognition"
  | "flexibility"
  | "aesthetics"
  | "recovery"
  | "help";

function uniqueSorted(nums: number[]) {
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

function inferTypeFromInsight(seed: string): { type: IssueTypeKey; weight: number } {
  const s = seed;

  const rules: Array<{ type: IssueTypeKey; weight: number; re: RegExp }> = [
    { type: "help", weight: 2.4, re: /ヘルプ|ガイド|説明|ドキュメント|FAQ|マニュアル|問い合わせ/ },
    { type: "recovery", weight: 2.6, re: /復帰|リカバリ|再試行|戻る|エラー.*(意味|次の一手|手順)/ },
    { type: "error_prevention", weight: 2.5, re: /エラー|誤操作|入力ミス|防止|警告|トラブル/ },
    { type: "recognition", weight: 2.2, re: /思い出せ|覚え|記憶|再表示|履歴|前回/ },
    { type: "flexibility", weight: 2.1, re: /効率|ショートカット|手間|柔軟|早く/ },
    { type: "control", weight: 2.0, re: /選べない|自由度|コントロール|思い通り|戻せない|変更できない/ },
    { type: "consistency", weight: 2.1, re: /一貫|統一|ルール|標準|仕様|迷う.*(規則|パターン)/ },
    { type: "aesthetics", weight: 1.9, re: /ノイズ|過多|わかりにくい.*(見た目|情報量)|美的|最小限/ },
    { type: "visibility", weight: 2.4, re: /見つけ|探す|どこ|気づかない|見落と|重要情報/ },
    { type: "mapping", weight: 2.3, re: /わからない|理解|意味|説明不足|次に.*(何を|どこ|どう)/ },
  ];

  let best: { type: IssueTypeKey; weight: number } = { type: "mapping", weight: 0 };
  for (const r of rules) {
    if (r.re.test(s)) best = best.weight >= r.weight ? best : { type: r.type, weight: r.weight };
  }
  return best;
}

function buildTemplatePayload(type: IssueTypeKey) {
  // 代表的な候補カテゴリ（最大3-4）
  const byType: Record<
    IssueTypeKey,
    {
      candidateNielsenCategories: number[];
      shortTermTemplates: string[];
      longTermTemplates: string[];
      initialScores: IssueScore;
      titleFromInsight: (insight: string) => string;
      descriptionFromInsight: (insight: string) => string;
    }
  > = {
    visibility: {
      candidateNielsenCategories: [1, 2, 6],
      shortTermTemplates: [
        "重要情報（主要操作/ボタン/導線）を目立つ位置に配置し、ラベルを追加する",
        "「どこを見るべきか」を視覚的にガイド（ハイライト/矢印/強調）する",
        "初期状態で最初に行うべき操作を明確化する",
      ],
      longTermTemplates: [
        "情報設計（画面構造・ラベル設計）を見直し、探索コストを削減する",
        "ナビゲーションと導線の設計ルールを策定し、一貫した導線にする",
        "ユーザーの探索パターンに合わせて状態/優先度を再設計する",
      ],
      initialScores: { impact: 4, frequency: 3, severity: 3, effort: 4 },
      titleFromInsight: (insight) => {
        if (/どこ/.test(insight)) return "目的の要素が見つけにくい";
        if (/気づかない|見落と/.test(insight)) return "重要情報が見落とされやすい";
        return "主要情報が視覚的に見つけにくい";
      },
      descriptionFromInsight: (insight) =>
        `インサイト: ${insight}\n\n課題仮説: ユーザーが必要な情報や操作を発見できず、次の判断に時間がかかっている可能性があります。`,
    },
    mapping: {
      candidateNielsenCategories: [2, 10, 6],
      shortTermTemplates: [
        "専門用語/表現の意味を補足し、ユーザーの理解を揃える（短い説明・ツールチップ）",
        "次の手が分かるように手順をステップ表示する",
        "誤解しやすい項目に対して例や言い換えを追加する",
      ],
      longTermTemplates: [
        "情報の意味付け（用語体系・ラベリング）を再設計し、理解のズレを減らす",
        "ユーザーマインドモデルに沿った説明設計（文脈/タイミング）を導入する",
        "ナビゲーションと説明の整合性を全体で見直す",
      ],
      initialScores: { impact: 4, frequency: 3, severity: 3, effort: 4 },
      titleFromInsight: (insight) => {
        if (/わからない|理解/.test(insight)) return "次の手が理解しづらい";
        return "情報の意味付けがユーザーとズレている";
      },
      descriptionFromInsight: (insight) =>
        `インサイト: ${insight}\n\n課題仮説: ユーザーが状況に対して「何をすべきか/どう解釈すべきか」を即座に結びつけられていない可能性があります。`,
    },
    control: {
      candidateNielsenCategories: [3, 7],
      shortTermTemplates: [
        "ユーザーが選べる範囲を増やし、変更手段（戻る/再選択）を明確にする",
        "重要操作の取り消し/やり直しを分かりやすく提供する",
        "入力中の状態を保持し、迷いを減らす",
      ],
      longTermTemplates: [
        "ユーザー制御の設計を見直し、自由度と安全性を両立する",
        "操作の代替ルート（ショートパス）を整理し、効率を高める",
        "ユーザーの意図に沿う状態遷移へ全体設計を改善する",
      ],
      initialScores: { impact: 3, frequency: 3, severity: 4, effort: 3 },
      titleFromInsight: (insight) => {
        if (/選べない|自由度/.test(insight)) return "ユーザーが思い通りに制御しづらい";
        return "ユーザーの選択肢が不足している";
      },
      descriptionFromInsight: (insight) =>
        `インサイト: ${insight}\n\n課題仮説: ユーザーが意図した操作に到達できず、代替手段探しややり直しが発生している可能性があります。`,
    },
    consistency: {
      candidateNielsenCategories: [4],
      shortTermTemplates: [
        "文言・導線・UIパターンを統一し、迷いを減らす",
        "同じ機能は同じ振る舞いにし、例外を減らす",
        "画面間のルールを整理して提示する",
      ],
      longTermTemplates: [
        "デザイン/UXの標準ルール（文言・パターン・状態）を整備する",
        "複数画面の整合性を横断で点検し、仕様を統一する",
        "ユーザーフィードバックに基づきルールを継続改善する",
      ],
      initialScores: { impact: 3, frequency: 3, severity: 3, effort: 3 },
      titleFromInsight: () => "振る舞いが一貫せず、ユーザーが迷う",
      descriptionFromInsight: (insight) =>
        `インサイト: ${insight}\n\n課題仮説: 画面や文脈によって振る舞いや表現が変わり、ユーザーの予測可能性が下がっている可能性があります。`,
    },
    error_prevention: {
      candidateNielsenCategories: [5, 9],
      shortTermTemplates: [
        "入力の事前チェック（必須/形式/範囲）と具体的なエラーメッセージを追加する",
        "誤操作しやすい箇所に警告やガード（無効化/確認）を入れる",
        "候補選択・オート補完で入力負荷とミスを減らす",
      ],
      longTermTemplates: [
        "エラー予防のための検証設計とガードレールを全体に適用する",
        "エラー時のユーザージャーニーを分析し、再発防止の仕組みを導入する",
        "入力モデル（形式/段階/状態）を見直して、ミスが起きにくい体験に再設計する",
      ],
      initialScores: { impact: 4, frequency: 3, severity: 4, effort: 3 },
      titleFromInsight: (insight) => {
        if (/入力ミス|誤操作/.test(insight)) return "誤操作が起きやすく、失敗が増える";
        return "エラーを未然に防げていない";
      },
      descriptionFromInsight: (insight) =>
        `インサイト: ${insight}\n\n課題仮説: ユーザーが誤って操作しても、事前に止められない/気づけないため、エラーややり直しが発生している可能性があります。`,
    },
    recognition: {
      candidateNielsenCategories: [6, 10],
      shortTermTemplates: [
        "必要情報を画面上に見える形で保持し、思い出す負担を減らす",
        "前回の選択/状態を復元し、再入力の手間を減らす",
        "入力済み情報の要約を表示して確認しやすくする",
      ],
      longTermTemplates: [
        "記憶依存を減らす情報設計へ改善する（要約/ラベル/履歴）",
        "状態保持と復元の設計を統一し、体験の一貫性を高める",
        "ガイドや説明のタイミングをユーザーの認知負荷に合わせて最適化する",
      ],
      initialScores: { impact: 3, frequency: 3, severity: 3, effort: 4 },
      titleFromInsight: (insight) => {
        if (/覚え|思い出/.test(insight)) return "必要情報を思い出しづらい";
        return "認識すべき情報が見えていない";
      },
      descriptionFromInsight: (insight) =>
        `インサイト: ${insight}\n\n課題仮説: ユーザーが必要な情報を再認識できず、入力や判断が遅れている可能性があります。`,
    },
    flexibility: {
      candidateNielsenCategories: [7, 3],
      shortTermTemplates: [
        "よくある操作の近道（ショートパス）を用意し、効率を上げる",
        "目的に応じた導線（フィルタ/並び替え）を提供する",
        "繰り返し作業の省力化（テンプレ/履歴）を導入する",
      ],
      longTermTemplates: [
        "ユーザーのタスクパターンに合わせて柔軟な導線へ再設計する",
        "効率化のための情報構造と操作モデルを見直す",
        "学習コストを下げるための段階的な支援を導入する",
      ],
      initialScores: { impact: 3, frequency: 4, severity: 3, effort: 3 },
      titleFromInsight: (insight) => {
        if (/効率|ショートカット/.test(insight)) return "手間が多く、効率が悪い";
        return "操作が冗長で時間がかかる";
      },
      descriptionFromInsight: (insight) =>
        `インサイト: ${insight}\n\n課題仮説: ユーザーが同じ目的に到達するまでの操作回数/手順が多く、ストレスや時間コストが増えている可能性があります。`,
    },
    aesthetics: {
      candidateNielsenCategories: [8],
      shortTermTemplates: [
        "情報量を整理し、重要要素を視覚的に優先度付けする",
        "ノイズになる要素を減らし、必要な導線だけを強調する",
        "余白/階層/コントラストを見直して読みやすくする",
      ],
      longTermTemplates: [
        "ビジュアル階層と情報設計を再構築し、最小限で伝わる体験にする",
        "画面全体のデザイン方針（見やすさ/整合性）を見直す",
        "ユーザーが迷うポイントを基に情報の配置と粒度を最適化する",
      ],
      initialScores: { impact: 3, frequency: 3, severity: 3, effort: 2 },
      titleFromInsight: (insight) => {
        if (/ノイズ|情報量/.test(insight)) return "情報量が多く、重要点が埋もれる";
        return "見た目/階層の工夫不足で理解が遅れる";
      },
      descriptionFromInsight: (insight) =>
        `インサイト: ${insight}\n\n課題仮説: 重要度の高い情報が視覚的に埋もれ、認知負荷が増えている可能性があります。`,
    },
    recovery: {
      candidateNielsenCategories: [9, 5],
      shortTermTemplates: [
        "エラーが起きた理由を具体化し、次に何をすべきかを明示する",
        "リカバリ手順（再試行/戻る/修正点）を選択肢として提示する",
        "エラー発生時の入力内容を保持し、やり直し負担を減らす",
      ],
      longTermTemplates: [
        "エラー時のユーザージャーニーを設計し、復帰の導線を統一する",
        "原因別の対処テンプレを整備し、回復可能性を高める",
        "テスト/計測によりエラー率と復帰時間を継続改善する",
      ],
      initialScores: { impact: 4, frequency: 3, severity: 4, effort: 3 },
      titleFromInsight: (insight) => {
        if (/次の一手/.test(insight)) return "エラー後の次の手が分かりにくい";
        return "失敗した後に立て直しづらい";
      },
      descriptionFromInsight: (insight) =>
        `インサイト: ${insight}\n\n課題仮説: エラーが起きたことは分かっても、意味や対処が分かりにくいため、ユーザーが停滞している可能性があります。`,
    },
    help: {
      candidateNielsenCategories: [10],
      shortTermTemplates: [
        "重要操作/迷いやすい箇所に短いヘルプ（例・手順）を追加する",
        "FAQ/ガイドへの導線を状況に応じて提示する",
        "入力の例を表示して理解を揃える",
      ],
      longTermTemplates: [
        "ヘルプとドキュメントの設計を見直し、ユーザーの文脈に沿って提供する",
        "オンボーディング/段階的支援（必要な時に必要なだけ）を導入する",
        "情報設計と連携してガイドの粒度・タイミングを最適化する",
      ],
      initialScores: { impact: 3, frequency: 2, severity: 3, effort: 5 },
      titleFromInsight: (insight) => {
        if (/説明/.test(insight)) return "説明が不足していて迷う";
        return "必要なガイドが見つからない";
      },
      descriptionFromInsight: (insight) =>
        `インサイト: ${insight}\n\n課題仮説: ユーザーが必要な情報に到達できず、判断や操作が止まっている可能性があります。`,
    },
  };

  return byType[type];
}

function pickPrimaryCategory(candidates: number[]) {
  // 見た目の優先度：小さい番号を最優先にする（ルールベース）
  return candidates.length > 0 ? candidates[0] : 1;
}

function clampToObservations(source: string[], max = 4) {
  if (source.length <= max) return source;
  return source.slice(0, max);
}

export function generateIssueCandidatesFromInsights(
  observations: Observation[],
  newId: () => string = generateId
): { issues: Issue[]; metaByIssueId: Record<string, IssueCandidateMeta> } {
  const metaByIssueId: Record<string, IssueCandidateMeta> = {};

  // insight が空のものは除外
  const withInsights = observations.filter((o) => o.insight.trim().length > 0);
  const groups = new Map<
    IssueTypeKey,
    {
      type: IssueTypeKey;
      weightSum: number;
      best: { insight: string; obsId: string; obsRaw: string };
      sourceObsIds: string[];
    }
  >();

  for (const o of withInsights) {
    const { type, weight } = inferTypeFromInsight(o.insight);
    if (!groups.has(type)) {
      groups.set(type, {
        type,
        weightSum: weight,
        best: { insight: o.insight, obsId: o.id, obsRaw: o.raw },
        sourceObsIds: [o.id],
      });
    } else {
      const g = groups.get(type)!;
      g.weightSum += weight;
      g.sourceObsIds.push(o.id);
      // best 更新：重みが高い/insight がより長い側を採用
      if (o.insight.length > g.best.insight.length) {
        g.best = { insight: o.insight, obsId: o.id, obsRaw: o.raw };
      }
    }
  }

  const sortedTypes = Array.from(groups.values()).sort((a, b) => b.weightSum - a.weightSum);
  const typesToPick = sortedTypes.slice(0, 5); // 最大5件

  if (typesToPick.length === 0) {
    const fallback: Issue = {
      id: `issue-${newId()}`,
      title: "インサイトから課題候補を生成できませんでした",
      description: "インサイト（観察からの本質的ニーズ/痛み）が十分に入力されていない可能性があります。まず Step2 でインサイトを埋めてください。",
      nielsenCategory: 1,
      scores: { impact: 3, frequency: 3, severity: 3, effort: 3 },
      priority: calcPriority({ impact: 3, frequency: 3, severity: 3, effort: 3 }).priority,
      shortTermAction: "インサイトを見直し、キーワード（どこ/わからない/エラー/気づかない等）を含めて入力する",
      longTermAction: "観察（事実）とインサイトの対応関係を明確にし、再度課題候補を生成する",
      sourceObsIds: [],
    };
    return { issues: [fallback], metaByIssueId: {} };
  }

  const issues: Issue[] = [];
  for (const t of typesToPick) {
    const payload = buildTemplatePayload(t.type);
    const candidateCats = uniqueSorted(payload.candidateNielsenCategories);
    const primary = pickPrimaryCategory(candidateCats);

    const relatedObsIds = clampToObservations(Array.from(new Set(t.sourceObsIds)), 4);
    const seedInsight = t.best.insight;

    const scores = payload.initialScores;
    const { priority } = calcPriority(scores);

    const issue: Issue = {
      id: `issue-${newId()}`,
      title: payload.titleFromInsight(seedInsight),
      description: `${payload.descriptionFromInsight(seedInsight)}\n\n（ニールセン根拠候補）N${primary}: ${NIELSEN_PRINCIPLES[primary - 1]}`,
      nielsenCategory: primary,
      scores,
      priority,
      shortTermAction: payload.shortTermTemplates[0] ?? "",
      longTermAction: payload.longTermTemplates[0] ?? "",
      sourceObsIds: relatedObsIds,
    };

    issues.push(issue);
    metaByIssueId[issue.id] = {
      candidateNielsenCategories: candidateCats,
      shortTermTemplates: payload.shortTermTemplates,
      longTermTemplates: payload.longTermTemplates,
      seedInsight,
    };
  }

  return { issues, metaByIssueId };
}

