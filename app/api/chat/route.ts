import { getMedicalRedirectMessage, isMedicalQuery } from "@/lib/chatGuard";
import { jsonError, parseJsonRequest, rateLimitedResponse } from "@/lib/apiError";
import { isGeminiConfigured } from "@/lib/env";
import { streamChatReply } from "@/lib/gemini";
import { checkRateLimit, getClientIdentifier } from "@/lib/rateLimit";
import { ChatRequestSchema } from "@/lib/schemas";

const RATE_LIMIT_PER_WINDOW = 15;
const RATE_LIMIT_WINDOW_SECONDS = 60;

function textStreamResponse(source: "gemini" | "fallback" | "guard", body: ReadableStream<Uint8Array>) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Saans-Source": source,
      "Cache-Control": "no-store",
    },
  });
}

function singleChunkStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

const FALLBACK_REPLY: Record<string, string> = {
  en: "Offline mode: I can't reach the AI assistant right now, so here's quick rule-based guidance -- check today's AQI band on your dashboard for mask and outdoor-time advice, run a HEPA purifier indoors if you have one, and avoid outdoor exertion if the AQI is Unhealthy or worse.",
  hi: "ऑफ़लाइन मोड: अभी AI सहायक उपलब्ध नहीं है, इसलिए यह सामान्य सुझाव है -- आज के AQI स्तर के अनुसार मास्क और बाहर जाने का समय डैशबोर्ड पर देखें, घर के अंदर HEPA प्यूरीफायर चलाएँ, और AQI 'Unhealthy' या उससे ज़्यादा होने पर बाहर मेहनत वाला काम न करें।",
  gu: "ઑફલાઇન મોડ: અત્યારે AI સહાયક ઉપલબ્ધ નથી, તેથી આ સામાન્ય સૂચન છે -- આજના AQI સ્તર મુજબ માસ્ક અને બહાર જવાનો સમય ડેશબોર્ડ પર જુઓ, ઘરની અંદર HEPA પ્યુરિફાયર ચલાવો, અને AQI 'Unhealthy' કે તેથી વધુ હોય ત્યારે બહાર મહેનતનું કામ ટાળો.",
};

/**
 * POST /api/chat (Ask Saans)
 * Streams a plain-text reply grounded in the client-supplied AQI context.
 * Medical questions are intercepted deterministically before Gemini is
 * ever called (lib/chatGuard.ts). If Gemini is unavailable, streams a
 * short rule-based fallback instead of failing silently.
 */
export async function POST(request: Request) {
  const identifier = getClientIdentifier(request.headers);
  const rateLimit = await checkRateLimit(identifier, "chat", RATE_LIMIT_PER_WINDOW, RATE_LIMIT_WINDOW_SECONDS);
  if (!rateLimit.allowed) {
    return rateLimitedResponse(RATE_LIMIT_WINDOW_SECONDS);
  }

  const parsed = await parseJsonRequest(request, ChatRequestSchema);
  if (!parsed.ok) return parsed.response;

  const { messages, language, aqi } = parsed.data;
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

  if (lastUserMessage && isMedicalQuery(lastUserMessage.content)) {
    return textStreamResponse("guard", singleChunkStream(getMedicalRedirectMessage(language)));
  }

  // Checked synchronously up front (rather than relying on streamChatReply
  // to throw) so the X-Saans-Source header always accurately reflects
  // whether this is a real Gemini response -- never silently pretend AI is
  // on. A failure *mid-stream*, after Gemini already started responding, is
  // still handled below by appending a short fallback note to the stream.
  if (!isGeminiConfigured()) {
    return textStreamResponse("fallback", singleChunkStream(FALLBACK_REPLY[language] ?? FALLBACK_REPLY.en));
  }

  const generator = streamChatReply(
    messages.map((m) => ({ role: m.role, content: m.content })),
    { usAqi: aqi.usAqi, pm25: aqi.pm25, locationName: aqi.locationName, language }
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        console.error("[api/chat] stream failed mid-flight", error);
        controller.enqueue(encoder.encode(`\n\n${FALLBACK_REPLY[language] ?? FALLBACK_REPLY.en}`));
      } finally {
        controller.close();
      }
    },
  });

  return textStreamResponse("gemini", stream);
}

export function GET() {
  return jsonError("Use POST for Ask Saans.", 405);
}
