export type ScriptFormatType =
  | "dialogue"
  | "screenplay"
  | "novel"
  | "mixed"
  | "unknown";

export type PreprocessResult = {
  detectedFormat: ScriptFormatType;
  normalizedScript: string;
  extractedCharacters: string[];
  extractedSceneHints: string[];
  cleanedLines: string[];
};

function uniqueStrings(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function cleanLine(line: string) {
  return line
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\u3000/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function isLikelySceneLine(line: string) {
  return (
    /^场景[一二三四五六七八九十\d]/.test(line) ||
    /^scene\s+\d+/i.test(line) ||
    /^地点[:：]/.test(line) ||
    /^时间[:：]/.test(line) ||
    /^内景/.test(line) ||
    /^外景/.test(line) ||
    /^INT\./i.test(line) ||
    /^EXT\./i.test(line)
  );
}

function isLikelyDialogueLine(line: string) {
  return (
    /^[\u4e00-\u9fa5A-Za-z0-9_\-·]{1,12}[:：]/.test(line) ||
    /^\[[^\]]{1,12}\][:：]?/.test(line)
  );
}

function extractCharacterFromDialogue(line: string) {
  const match1 = line.match(/^([\u4e00-\u9fa5A-Za-z0-9_\-·]{1,12})[:：]/);
  if (match1) return match1[1].trim();

  const match2 = line.match(/^\[([^\]]{1,12})\][:：]?/);
  if (match2) return match2[1].trim();

  return "";
}

function normalizeDialogueLine(line: string) {
  const match1 = line.match(/^([\u4e00-\u9fa5A-Za-z0-9_\-·]{1,12})[:：](.+)$/);
  if (match1) {
    return `${match1[1].trim()}：${match1[2].trim()}`;
  }

  const match2 = line.match(/^\[([^\]]{1,12})\][:：]?(.*)$/);
  if (match2) {
    const role = match2[1].trim();
    const content = match2[2].trim();
    return content ? `${role}：${content}` : `${role}：`;
  }

  return line;
}

function detectScriptFormat(lines: string[]): ScriptFormatType {
  let dialogueCount = 0;
  let sceneCount = 0;
  let narrativeCount = 0;

  for (const line of lines) {
    if (!line) continue;

    if (isLikelyDialogueLine(line)) {
      dialogueCount += 1;
      continue;
    }

    if (isLikelySceneLine(line)) {
      sceneCount += 1;
      continue;
    }

    if (line.length >= 18) {
      narrativeCount += 1;
    }
  }

  if (dialogueCount >= 3 && sceneCount >= 1) return "screenplay";
  if (dialogueCount >= 4 && sceneCount === 0) return "dialogue";
  if (narrativeCount >= 4 && dialogueCount <= 2) return "novel";
  if (dialogueCount >= 2 && narrativeCount >= 2) return "mixed";
  return "unknown";
}

function normalizeByFormat(lines: string[], format: ScriptFormatType) {
  const result: string[] = [];
  const characters: string[] = [];
  const scenes: string[] = [];

  if (format === "dialogue" || format === "screenplay" || format === "mixed") {
    for (const rawLine of lines) {
      const line = cleanLine(rawLine);
      if (!line) continue;

      if (isLikelySceneLine(line)) {
        scenes.push(line);
        result.push(line);
        continue;
      }

      if (isLikelyDialogueLine(line)) {
        const role = extractCharacterFromDialogue(line);
        if (role) characters.push(role);
        result.push(normalizeDialogueLine(line));
        continue;
      }

      result.push(line);
    }
  } else if (format === "novel") {
    let autoSceneIndex = 1;
    result.push("场景一：故事开场");

    for (const rawLine of lines) {
      const line = cleanLine(rawLine);
      if (!line) continue;

      if (isLikelySceneLine(line)) {
        scenes.push(line);
        result.push(line);
        continue;
      }

      if (isLikelyDialogueLine(line)) {
        const role = extractCharacterFromDialogue(line);
        if (role) characters.push(role);
        result.push(normalizeDialogueLine(line));
        continue;
      }

      if (line.length > 40 && /[。！？.!?]/.test(line)) {
        result.push(line);

        if (/后来|突然|这时|与此同时|第二天|回忆|夜里|清晨|不久后/.test(line)) {
          autoSceneIndex += 1;
          const autoScene = `场景${autoSceneIndex}：剧情推进`;
          scenes.push(autoScene);
          result.push(autoScene);
        }
      } else {
        result.push(line);
      }
    }
  } else {
    for (const rawLine of lines) {
      const line = cleanLine(rawLine);
      if (!line) continue;

      if (isLikelyDialogueLine(line)) {
        const role = extractCharacterFromDialogue(line);
        if (role) characters.push(role);
        result.push(normalizeDialogueLine(line));
      } else {
        result.push(line);
      }
    }
  }

  return {
    normalizedScript: result.join("\n"),
    extractedCharacters: uniqueStrings(characters).slice(0, 20),
    extractedSceneHints: uniqueStrings(scenes).slice(0, 12),
    cleanedLines: result,
  };
}

export function preprocessScript(rawScript: string): PreprocessResult {
  const lines = rawScript
    .split("\n")
    .map(cleanLine)
    .filter(Boolean);

  const detectedFormat = detectScriptFormat(lines);

  const normalized = normalizeByFormat(lines, detectedFormat);

  return {
    detectedFormat,
    normalizedScript: normalized.normalizedScript,
    extractedCharacters: normalized.extractedCharacters,
    extractedSceneHints: normalized.extractedSceneHints,
    cleanedLines: normalized.cleanedLines,
  };
}