import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import * as fal from '@fal-ai/serverless-client';

export interface IssueDraft {
  title: string;
  description: string;
  acceptanceCriteria?: string;
  dependencies?: string;
}

export interface EpicDraft {
  title: string;
  description: string;
}

export type AIBackend = 'openai' | 'gemini' | 'anthropic' | 'fal';

export async function generateIssue(prompt: string, backend: AIBackend = 'openai'): Promise<IssueDraft> {
  const systemPrompt =
    'You are a helpful assistant that writes GitLab issue titles and descriptions in Markdown. Respond ONLY with valid JSON with keys "title", "description", "acceptanceCriteria", and "dependencies".';
  return generateDraft<IssueDraft>({ backend, systemPrompt, userPrompt: prompt });
}

export async function generateEpic(prompt: string, backend: AIBackend = 'openai'): Promise<EpicDraft> {
  const systemPrompt =
    'You are a helpful assistant that writes GitLab epic titles and descriptions in Markdown. Respond ONLY with valid JSON with keys "title" and "description".';
  return generateDraft<EpicDraft>({ backend, systemPrompt, userPrompt: prompt });
}

export async function generateAssigneeSummary(
  assigneeName: string,
  issueTitles: string[],
  backend: AIBackend = 'openai',
  iterationState = 'current'
): Promise<string> {
  const tense =
    {
      opened: 'will be working',
      current: 'is working',
      closed: 'worked',
    }[iterationState] || 'worked';
  const systemPrompt = `You are a helpful assistant that creates concise work summaries. Based on the issue titles provided, create a brief 2-3 sentence summary of what this person ${tense} on. Focus on the main themes and accomplishments. Respond with plain text, no JSON.`;

  const userPrompt = `Assignee: ${assigneeName}\n\nIssue titles:\n${issueTitles.map((title) => `- ${title}`).join('\n')}`;

  const fullPrompt = buildPrompt(systemPrompt, userPrompt);
  return await callLLM(backend, fullPrompt, 0.3);
}

async function generateDraft<T>({
  backend,
  systemPrompt,
  userPrompt,
  temperature = 0.5,
}: {
  backend: AIBackend;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}): Promise<T> {
  const fullPrompt = buildPrompt(systemPrompt, userPrompt);
  const raw = await callLLM(backend, fullPrompt, temperature);
  const jsonString = extractJson(raw);
  return safeJsonParse(jsonString);
}

function buildPrompt(systemPrompt: string, userPrompt: string): string {
  return `${systemPrompt}\n\n${userPrompt}`;
}

async function callLLM(backend: AIBackend, prompt: string, temperature: number): Promise<string> {
  switch (backend) {
    case 'gemini':
      return callGemini(prompt);
    case 'anthropic':
      return callAnthropic(prompt, temperature);
    case 'fal':
      return callFal(prompt, temperature);
    case 'openai':
    default:
      return callOpenAI(prompt, temperature);
  }
}

function getStoredSettings(): any {
  try {
    const raw = localStorage.getItem('ease-gitlab-settings');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: any };
    return parsed.state ?? parsed;
  } catch {
    return null;
  }
}

async function callGemini(prompt: string): Promise<string> {
  const settings = getStoredSettings();

  const apiKey = settings?.geminiApiKey || (import.meta.env.VITE_GEMINI_API_KEY as string | undefined);
  const model = settings?.geminiModel || 'gemini-2.5-flash';

  if (!apiKey) throw new Error('Missing Gemini API key');

  const genAI = new GoogleGenAI({ apiKey });
  const result = await genAI.models.generateContent({
    model,
    contents: prompt,
  });
  return result.text ?? JSON.stringify(result);
}

async function callOpenAI(prompt: string, temperature: number): Promise<string> {
  const settings = getStoredSettings();

  const apiKey = settings?.openaiApiKey || (import.meta.env.VITE_OPENAI_API_KEY as string | undefined);
  const baseUrl = settings?.openaiBaseUrl || (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined);
  const model = settings?.openaiModel || (import.meta.env.VITE_OPENAI_MODEL_NAME as string | undefined);

  if (!apiKey) throw new Error('Missing OpenAI API key');

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: prompt.split('\n\n')[0] },
        { role: 'user', content: prompt.split('\n\n').slice(1).join('\n\n') },
      ],
      temperature,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function extractJson(text: string): string {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  return jsonMatch ? jsonMatch[1].trim() : text.trim();
}

async function callAnthropic(prompt: string, temperature: number): Promise<string> {
  const settings = getStoredSettings();

  const apiKey = settings?.anthropicApiKey || (import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined);
  const model = settings?.anthropicModel || 'claude-3-5-sonnet-20241022';

  if (!apiKey) throw new Error('Missing Anthropic API key');

  const anthropic = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true, // Required for browser usage
  });

  // Split system and user prompts
  const [systemPrompt, ...userParts] = prompt.split('\n\n');
  const userPrompt = userParts.join('\n\n');

  const msg = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    temperature,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  return msg.content[0]?.type === 'text' ? msg.content[0].text : '';
}

async function callFal(prompt: string, temperature: number): Promise<string> {
  const settings = getStoredSettings();

  const apiKey = settings?.falApiKey || (import.meta.env.VITE_FAL_API_KEY as string | undefined);
  const model = settings?.falModel || 'fal-ai/llama-3-1-8b-instruct';

  if (!apiKey) throw new Error('Missing fal.ai API key');

  fal.config({
    credentials: apiKey,
  });

  // Split system and user prompts
  const [systemPrompt, ...userParts] = prompt.split('\n\n');
  const userPrompt = userParts.join('\n\n');

  const result = await fal.subscribe(model, {
    input: {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: 1024,
    },
  });

  return (result as any).data?.choices?.[0]?.message?.content ?? '';
}

function safeJsonParse<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.warn('Failed to parse JSON from LLM. Returning fallback.', err);
    return {} as T;
  }
}
