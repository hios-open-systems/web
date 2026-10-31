// Local-only replacement for the SDK used by scripts/orquestador-hios.ts.
// https://lmstudio.ai/docs/developer/openai-compat/chat-completions
export async function requestLocalCompletion(prompt: string, request: typeof fetch = fetch): Promise<string> {
  const response = await request('http://127.0.0.1:1234/v1/chat/completions', {
    method: 'POST',
    redirect: 'error',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'nemotron-3-nano', messages: [{ role: 'user', content: prompt }], stream: false }),
  });
  if (!response.ok) throw new Error(`LM Studio: HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (data && typeof data === 'object' && 'choices' in data && Array.isArray(data.choices)) {
    const first: unknown = data.choices[0];
    if (first && typeof first === 'object' && 'message' in first) {
      const message = first.message;
      if (message && typeof message === 'object' && 'content' in message && typeof message.content === 'string' && message.content.trim()) {
        return message.content;
      }
    }
  }
  throw new Error('LM Studio returned no generated text; the output file was not changed.');
}
