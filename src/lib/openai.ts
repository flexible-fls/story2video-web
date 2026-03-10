import OpenAI from "openai";

export type AIProvider = "openai" | "deepseek";

function normalizeProvider(value?: string): AIProvider {
  return value === "openai" ? "openai" : "deepseek";
}

export function getAIProvider(): AIProvider {
  return normalizeProvider(process.env.AI_PROVIDER);
}

export function getAIClient() {
  const provider = getAIProvider();

  if (provider === "deepseek") {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY is missing");
    }

    return new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com",
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  return new OpenAI({
    apiKey,
  });
}

export function getAIModel() {
  const provider = getAIProvider();

  if (provider === "deepseek") {
    return process.env.AI_MODEL_DEEPSEEK || "deepseek-chat";
  }

  return process.env.AI_MODEL_OPENAI || "gpt-4o-mini";
}