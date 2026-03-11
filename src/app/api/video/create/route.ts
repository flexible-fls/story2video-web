import { NextResponse } from "next/server";
import { createRunwayImageToVideoTask } from "@/lib/video-provider";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const imageUrl =
      typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
    const promptText =
      typeof body?.promptText === "string" ? body.promptText.trim() : "";
    const ratio =
      typeof body?.ratio === "string" ? body.ratio.trim() : undefined;
    const duration =
      typeof body?.duration === "number" && Number.isFinite(body.duration)
        ? body.duration
        : undefined;
    const model =
      typeof body?.model === "string" ? body.model.trim() : undefined;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing imageUrl" },
        { status: 400 }
      );
    }

    if (!promptText) {
      return NextResponse.json(
        { error: "Missing promptText" },
        { status: 400 }
      );
    }

    const task = await createRunwayImageToVideoTask({
      imageUrl,
      promptText,
      ratio,
      duration,
      model,
    });

    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          typeof error?.message === "string"
            ? error.message
            : "Failed to create video task",
      },
      { status: 500 }
    );
  }
}