const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";

type RequestBody = Record<string, unknown>;
type TranscribeResponse = { text: string };
type SuggestionsResponse = {
  suggestions: Array<{
    preview: string;
    fullPrompt: string;
  }>;
};
type ChatResponse = { response: string };

async function post<TResponse>(
  path: string,
  body: RequestBody,
  apiKey?: string,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

async function postForm<TResponse>(path: string, formData: FormData, apiKey?: string): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

export function transcribe(audioBlob: Blob, apiKey?: string) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "chunk.webm");
  return postForm<TranscribeResponse>("/api/transcribe/", formData, apiKey);
}

export function suggestions(payload: RequestBody, apiKey?: string) {
  return post<SuggestionsResponse>("/api/suggestions/", payload, apiKey);
}

export function chat(payload: RequestBody, apiKey?: string) {
  return post<ChatResponse>("/api/chat/", payload, apiKey);
}
