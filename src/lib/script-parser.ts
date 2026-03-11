export async function extractTextFromTxtOrMd(file: File) {
  return await file.text();
}

export async function extractTextFromDocx(file: File) {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || "";
}

export async function extractTextFromPdf(file: File) {
  if (typeof window === "undefined") {
    throw new Error("PDF parsing is only available in the browser.");
  }

  const pdfjsLib = await import("pdfjs-dist");
  const arrayBuffer = await file.arrayBuffer();

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs";

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");

    fullText += pageText + "\n";
  }

  return fullText.trim();
}

export async function extractScriptTextFromFile(file: File, isZh: boolean) {
  const lowerName = file.name.toLowerCase();

  if (
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".text")
  ) {
    return await extractTextFromTxtOrMd(file);
  }

  if (lowerName.endsWith(".docx")) {
    return await extractTextFromDocx(file);
  }

  if (lowerName.endsWith(".pdf")) {
    return await extractTextFromPdf(file);
  }

  throw new Error(
    isZh
      ? "当前支持的剧本格式为：txt、md、text、docx、pdf"
      : "Supported script formats: txt, md, text, docx, pdf"
  );
}

export function getScriptStats(text: string) {
  const trimmed = text.trim();

  return {
    charCount: trimmed.length,
    lineCount: trimmed ? trimmed.split("\n").length : 0,
  };
}