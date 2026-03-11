import { NextResponse } from "next/server";
import { queryRunwayTask } from "@/lib/video-provider";

type Params = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function GET(_: Request, context: Params) {
  try {
    const { taskId } = await context.params;

    if (!taskId) {
      return NextResponse.json(
        { error: "Missing taskId" },
        { status: 400 }
      );
    }

    const result = await queryRunwayTask(taskId);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          typeof error?.message === "string"
            ? error.message
            : "Failed to query video task",
      },
      { status: 500 }
    );
  }
}