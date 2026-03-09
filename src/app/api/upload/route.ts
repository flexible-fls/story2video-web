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

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    let text = "";

    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(uint8);
    } catch {
      try {
        text = new TextDecoder("gb18030").decode(uint8);
      } catch {
        text = new TextDecoder("utf-8").decode(uint8);
      }
    }

    return Response.json({
      success: true,
      fileName: file.name,
      script: text,
      preview: text.slice(0, 300),
      taskId: "task_demo_001",
    });
  } catch (error) {
    return Response.json(
      { success: false, message: "Upload failed" },
      { status: 500 }
    );
  }
}
