const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".txt", ".md", ".text"];

function hasAllowedExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!hasAllowedExtension(file.name)) {
      return Response.json(
        {
          success: false,
          message: "Unsupported file type. Use txt, md, or text files.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        {
          success: false,
          message: "File is too large. Maximum size is 10MB.",
        },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    let text = "";

    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(uint8);
    } catch {
      text = new TextDecoder("utf-8").decode(uint8);
    }

    return Response.json({
      success: true,
      fileName: file.name,
      script: text,
      preview: text.slice(0, 300),
    });
  } catch {
    return Response.json(
      { success: false, message: "Upload failed" },
      { status: 500 }
    );
  }
}