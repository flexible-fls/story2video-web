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

  const title =
    getValue(["剧名", "标题"]) ||
    lines.find((line) => line.length >= 4 && line.length <= 30) ||
    "未命名项目";

  return {
    title,
    projectType: getValue(["项目类型"]),
    genre: getValue(["类型", "题材"]),
    spec: getValue(["规格"]),
    highlight: getValue(["题材亮点", "主题亮点", "卖点", "亮点"]),
    summary:
      getValue(["项目简介", "故事简介", "一句话简介", "梗概", "简介"]) || "",
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

  const titleTemplates = [
    "镜头1：人物出场",
    "镜头2：冲突建立",
    "镜头3：情绪升级",
    "镜头4：信息反转",
    "镜头5：矛盾爆发",
    "镜头6：悬念收尾",
  ];

  return lines.slice(0, 6).map((line, index) => {
    const shortText = line.length > 34 ? line.slice(0, 34) + "..." : line;

    return {
      shot: index + 1,
      title: titleTemplates[index] || `镜头${index + 1}`,
      desc: shortText,
    };
  });
}

function generateAiTitle(meta: {
  title: string;
  genre: string;
  summary: string;
  highlight: string;
}) {
  const base = meta.title?.trim() || "她以为一切已经结束";
  const genre = meta.genre?.trim();
  const highlight = meta.highlight?.trim();
  const summary = meta.summary?.trim();

  if (highlight) {
    return `《${base}》：${highlight.length > 18 ? highlight.slice(0, 18) + "…" : highlight}`;
  }

  if (summary) {
    return `《${base}》：${summary.length > 18 ? summary.slice(0, 18) + "…" : summary}`;
  }

  if (genre) {
    return `《${base}》：一场关于${genre}的高冲突故事`;
  }

  return `《${base}》：命运反转下的情感博弈`;
}

function generateHook(meta: {
  title: string;
  genre: string;
  summary: string;
  highlight: string;
}) {
  const source = meta.highlight || meta.summary || meta.genre || meta.title || "真相与情感失控";

  const shortText = source.length > 24 ? source.slice(0, 24) + "…" : source;

  return `高冲突开局，情绪快速拉满：${shortText}`;
}

function generateCoverCopy(meta: {
  title: string;
  genre: string;
  summary: string;
  highlight: string;
}) {
  const lines: string[] = [];

  if (meta.title) lines.push(`剧名卖点：${meta.title}`);
  if (meta.genre) lines.push(`题材标签：${meta.genre}`);
  if (meta.highlight) lines.push(`封面文案：${meta.highlight}`);
  else if (meta.summary) lines.push(`封面文案：${meta.summary.slice(0, 22)}${meta.summary.length > 22 ? "…" : ""}`);
  else lines.push("封面文案：高冲突、强反转、强情绪");

  return lines;
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
    const aiTitle = generateAiTitle(meta);
    const hook = generateHook(meta);
    const coverCopy = generateCoverCopy(meta);

    return Response.json({
      success: true,
      title: meta.title,
      aiTitle,
      projectType: meta.projectType,
      genre: meta.genre,
      spec: meta.spec,
      highlight: meta.highlight,
      summary:
        meta.summary || (script.length > 120 ? script.slice(0, 120) + "..." : script),
      hook,
      coverCopy,
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
