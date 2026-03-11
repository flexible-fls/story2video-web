export type VideoTaskStatus =
  | "queued"
  | "processing"
  | "succeeded"
  | "failed"
  | "unknown";

export type CreateVideoTaskInput = {
  imageUrl: string;
  promptText: string;
  ratio?: string;
  duration?: number;
  model?: string;
};

export type CreateVideoTaskResult = {
  taskId: string;
  provider: "runway";
  providerTaskId: string;
  status: VideoTaskStatus;
  model: string;
  ratio: string;
  duration: number;
};

export type QueryVideoTaskResult = {
  provider: "runway";
  providerTaskId: string;
  status: VideoTaskStatus;
  videoUrl?: string;
  errorMessage?: string;
  raw?: unknown;
};

function getRunwayConfig() {
  const apiKey = process.env.RUNWAY_API_KEY;
  const version = process.env.RUNWAY_API_VERSION || "2024-11-06";
  const defaultModel = process.env.RUNWAY_VIDEO_MODEL || "gen4.5";
  const defaultRatio = process.env.RUNWAY_VIDEO_RATIO || "1280:720";
  const defaultDuration = Number(process.env.RUNWAY_VIDEO_DURATION || "5");

  if (!apiKey) {
    throw new Error("Missing RUNWAY_API_KEY");
  }

  return {
    apiKey,
    version,
    defaultModel,
    defaultRatio,
    defaultDuration,
  };
}

function normalizeRunwayStatus(status: string | undefined): VideoTaskStatus {
  const value = (status || "").toUpperCase();

  if (value === "PENDING" || value === "THROTTLED") return "queued";
  if (value === "RUNNING") return "processing";
  if (value === "SUCCEEDED") return "succeeded";
  if (value === "FAILED" || value === "CANCELLED") return "failed";

  return "unknown";
}

export async function createRunwayImageToVideoTask(
  input: CreateVideoTaskInput
): Promise<CreateVideoTaskResult> {
  const config = getRunwayConfig();

  const model = input.model || config.defaultModel;
  const ratio = input.ratio || config.defaultRatio;
  const duration = input.duration || config.defaultDuration;

  const response = await fetch("https://api.dev.runwayml.com/v1/image_to_video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "X-Runway-Version": config.version,
    },
    body: JSON.stringify({
      model,
      promptImage: input.imageUrl,
      promptText: input.promptText,
      ratio,
      duration,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        data?.message ||
        "Runway image_to_video request failed"
    );
  }

  const providerTaskId =
    typeof data?.id === "string" ? data.id : "";

  if (!providerTaskId) {
    throw new Error("Runway did not return a task id");
  }

  return {
    taskId: providerTaskId,
    provider: "runway",
    providerTaskId,
    status: "queued",
    model,
    ratio,
    duration,
  };
}

export async function queryRunwayTask(
  providerTaskId: string
): Promise<QueryVideoTaskResult> {
  const config = getRunwayConfig();

  const response = await fetch(
    `https://api.dev.runwayml.com/v1/tasks/${providerTaskId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "X-Runway-Version": config.version,
      },
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        data?.message ||
        "Runway task query failed"
    );
  }

  const status = normalizeRunwayStatus(data?.status);
  const output = Array.isArray(data?.output) ? data.output : [];
  const videoUrl =
    status === "succeeded" && typeof output?.[0] === "string"
      ? output[0]
      : undefined;

  return {
    provider: "runway",
    providerTaskId,
    status,
    videoUrl,
    errorMessage:
      status === "failed"
        ? data?.failure || data?.error || "Video generation failed"
        : undefined,
    raw: data,
  };
}