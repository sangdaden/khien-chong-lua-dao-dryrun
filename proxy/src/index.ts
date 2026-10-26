// Proxy nhỏ chạy trên Cloudflare Worker.
// App trên điện thoại gọi vào đây; API key chỉ nằm ở đây (Worker secret), không bao giờ nằm trong app.
import Anthropic from "@anthropic-ai/sdk";
import { CHECK_SCHEMA, CHECK_SYSTEM, PRACTICE_SCHEMA, PRACTICE_SYSTEM } from "./prompts";

export interface Env {
  ANTHROPIC_API_KEY: string;
  APP_TOKEN: string;
  MODEL: string;
}

const MAX_IMAGE_BASE64 = 5_000_000; // ~3.7 MB ảnh, đủ cho ảnh chụp màn hình đã thu nhỏ

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-App-Token",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

async function askClaude(
  env: Env,
  system: string,
  schema: Record<string, unknown>,
  content: Anthropic.Beta.BetaContentBlockParam[],
): Promise<unknown> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const response = await client.beta.messages.create({
    model: env.MODEL,
    max_tokens: 2048,
    system,
    messages: [{ role: "user", content }],
    output_config: { effort: "low", format: { type: "json_schema", schema } },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });
  if (response.stop_reason === "refusal") throw new Error("model_refused");
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("empty_response");
  return JSON.parse(text.text);
}

async function handleCheck(req: Request, env: Env): Promise<Response> {
  const body = (await req.json()) as { imageBase64?: string; mediaType?: string };
  const data = body.imageBase64;
  if (!data || typeof data !== "string") return json({ error: "missing_image" }, 400);
  if (data.length > MAX_IMAGE_BASE64) return json({ error: "image_too_large" }, 413);
  const mediaType = body.mediaType === "image/png" ? "image/png" : "image/jpeg";

  const result = await askClaude(env, CHECK_SYSTEM, CHECK_SCHEMA, [
    { type: "image", source: { type: "base64", media_type: mediaType, data } },
    { type: "text", text: "Ông bà vừa nhận được tin này. Đây có phải lừa đảo không?" },
  ]);
  return json(result);
}

async function handlePractice(req: Request, env: Env): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { weakSpots?: string[]; recent?: string[] };
  const weakSpots = (body.weakSpots ?? []).slice(0, 5).join(", ") || "chưa có";
  const recent = (body.recent ?? []).slice(0, 5).join(", ") || "chưa có";
  const result = await askClaude(env, PRACTICE_SYSTEM, PRACTICE_SCHEMA, [
    {
      type: "text",
      text: `weakSpots (kiểu người dùng hay bị qua mặt): ${weakSpots}\nCác kiểu vừa ra gần đây, tránh lặp lại: ${recent}\nHãy tạo một tin nhắn mới.`,
    },
  ]);
  return json(result);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    // Mã đơn giản để người lạ không dùng ké proxy. Không phải bảo mật thật: ai mở app ra vẫn đọc được.
    if (req.headers.get("X-App-Token") !== env.APP_TOKEN) return json({ error: "unauthorized" }, 401);

    const path = new URL(req.url).pathname;
    try {
      if (path === "/check") return await handleCheck(req, env);
      if (path === "/practice") return await handlePractice(req, env);
      return json({ error: "not_found" }, 404);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "unknown";
      return json({ error: "ai_failed", detail: message }, 502);
    }
  },
};
