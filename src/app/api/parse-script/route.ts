const FIELD_LABELS = [
  "剧名",
  "项目类型",
  "类型",
  "规格",
  "题材亮点",
  "主题亮点",
  "项目简介",
  "故事简介",
  "一句话简介",
  "梗概",
  "简介",
  "标签",
  "卖点",
  "亮点",
  "人物小传",
  "角色介绍",
  "人物介绍",
];

function isMetaField(name: string) {
  return FIELD_LABELS.some((label) => name.includes(label));
}

function cleanLines(script: string) {
  return script
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractTitle(script: string) {
  const lines = cleanLines(script);

  for (const line of lines.slice(0, 10)) {
    const match = line.match(/^(剧名|标题)[：:]\s*(.+)$/);
    if (match) return match[2].trim();
  }

  const firstMeaningful = lines.find((line) => line.length >= 4 && line.length <= 30);
  return firstMeaningful || "未命名项目";
}

function extractMeta(script: string) {
  const lines = cleanLines(script);

  const getValue = (keys: string[]) => {
    for (const line of lines.slice(0, 20)) {
      for (const key of keys) {
        const match = line.match(new RegExp(`^${key}[：:]\\s*(.+)$`));
        if (match) return match[1].trim();
      }
    }
    return "";
  };

  return {
    title: getValue(["剧名", "标题"]) || extractTitle(script),
    projectType: getValue(["项目类型"]),
    genre: getValue(["类型", "题材"]),
    spec: getValue(["规格"]),
    highlight: getValue(["题材亮点", "主题亮点", "卖点", "亮点"]),
    summary:
      getValue(["项目简介", "故事简介", "一句话简介", "梗概", "简介"]) ||
      "",
  };
}

function extractCharacters(script: string): string[] {
  const lines = cleanLines(script);
  const names: string[] = [];

  for (const line of lines) {
    const match = line.match(/^([^：:\[\]【】（）()，,。.\s]{1,8})[：:]/);
    if (!match) continue;

    const candidate = match[1].trim();

    if (candidate.length < 1 || candidate.length > 6) continue;
    if (isMetaField(candidate)) continue;
    if (/第?\d+集/.test(candidate)) continue;
    if (/旁白|字幕|画外音|镜头|场景|时间|地点/.test(candidate)) continue;

    names.push(candidate);
  }

  return [...new Set(names)].slice(0, 8);
}

function extractDialogueLines(script: string) {
  const lines = cleanLines(script);
  return lines.filter((line) => {
    if (!/[：:]/.test(line)) return false;
    const speaker = line.split(/[：:]/)[0]?.trim() || "";
    if (!speaker) return false;
    if (isMetaField(speaker)) return false;
    if (/旁白|字幕|画外音|镜头|场景|时间|地点/.test(speaker)) return false;
    return true;
  });
}

function generateStoryboard(script: string) {
  const dialogueLines = extractDialogueLines(script);
  const lines = dialogueLines.length > 0 ? dialogueLines : cleanLines(script);

  return lines.slice(0, 6).map((line, index) => {
    const shortText = line.length > 34 ? line.slice(0, 34) + "..." : line;

    const titleTemplates = [
      "镜头1：人物出场",
      "镜头2：冲突建立",
      "镜头3：情绪升级",
      "镜头4：信息反转",
      "镜头5：矛盾爆发",
      "镜头6：悬念收尾",
    ];

    return {
      shot: index + 1,
      title: titleTemplates[index] || `镜头${index + 1}`,
      desc: shortText,
    };
  });
}

function generateHook(meta: {
  title: string;
  projectType: string;
  genre: string;
  highlight: string;
  summary: string;
}) {
  const base = meta.summary || meta.highlight || meta.genre || meta.title;
  if (!base) return "命运交错之下，真相与情感同时失控。";

  const shortBase = base.length > 28 ? base.slice(0, 28) + "..." : base;
  return `高冲突开局，情绪快速拉满：${shortBase}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const script = body?.script || "";

    if (!script.trim()) {
      return Response.json(
        { success: false, message: "No script provided" },
        { status: 400 }
      );
    }

    const meta = extractMeta(script);
    const characters = extractCharacters(script);
    const storyboard = generateStoryboard(script);
    const hook = generateHook(meta);

    return Response.json({
      success: true,
      title: meta.title,
      projectType: meta.projectType,
      genre: meta.genre,
      spec: meta.spec,
      highlight: meta.highlight,
      summary:
        meta.summary || (script.length > 120 ? script.slice(0, 120) + "..." : script),
      hook,
      characters,
      storyboard,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: "Parse failed" },
      { status: 500 }
    );
  }
}
