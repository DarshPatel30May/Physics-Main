/**
 * OPTIONAL AI reading of a question screenshot (text + labelled diagram values).
 *
 * The AI only TRANSCRIBES — it never calculates. Its output is shown to the student for
 * confirmation and then fed as text into the deterministic smart solver. Uses the
 * student's own Anthropic API key directly from the browser; nothing is sent anywhere
 * unless the student explicitly clicks the button.
 */
import type Anthropic from '@anthropic-ai/sdk';

export interface DiagramValue {
  label: string;
  value: string;
  unit: string;
  meaning: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface DiagramDirection {
  quantity: string;
  direction: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ImageReading {
  question_text: string;
  diagram_values: DiagramValue[];
  diagram_directions: DiagramDirection[];
  uncertainties: string[];
}

const CONF = { type: 'string', enum: ['high', 'medium', 'low'] };

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['question_text', 'diagram_values', 'diagram_directions', 'uncertainties'],
  properties: {
    question_text: { type: 'string', description: 'The question text transcribed exactly, with scientific notation written like 3.00 × 10^8 and units kept.' },
    diagram_values: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'value', 'unit', 'meaning', 'confidence'],
        properties: {
          label: { type: 'string', description: 'Symbol or label as printed on the diagram, e.g. "θ", "h", "B".' },
          value: { type: 'string', description: 'Number exactly as printed (keep trailing zeros).' },
          unit: { type: 'string' },
          meaning: { type: 'string', description: 'What the value measures, e.g. "height of cliff", "angle above horizontal".' },
          confidence: CONF,
        },
      },
    },
    diagram_directions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['quantity', 'direction', 'confidence'],
        properties: {
          quantity: { type: 'string', description: 'e.g. "magnetic field", "velocity of electron", "current".' },
          direction: { type: 'string', description: 'e.g. "into the page", "to the right", "upwards".' },
          confidence: CONF,
        },
      },
    },
    uncertainties: { type: 'array', items: { type: 'string' } },
  },
};

const PROMPT = `You are transcribing an NSW HSC Physics examination question from an image for a deterministic calculator.

Rules:
- Transcribe the question text exactly. Do NOT solve, calculate, simplify or answer anything.
- List every numerical value that appears ONLY in the diagram (labels on arrows, lengths, angles, field strengths, etc.) with its printed label, unit and what it measures. Do not repeat values that are already in the question text.
- List directions shown in the diagram (field into/out of the page, arrows for velocity/current/force).
- Never guess. If a label, value, exponent, sign or direction is unclear or not shown, do not invent it: give low confidence or leave it out, and describe the problem in "uncertainties".
- If there is no diagram, return empty lists.`;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(new Error('Could not read the image file.'));
    r.readAsDataURL(file);
  });
}

const MEDIA = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;
type Media = (typeof MEDIA)[number];

export async function readQuestionImage(file: File, apiKey: string): Promise<ImageReading> {
  const media = (MEDIA as readonly string[]).includes(file.type) ? (file.type as Media) : null;
  if (!media) throw new Error('Please use a PNG, JPEG, GIF or WebP image.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image is larger than 5 MB — crop or compress it first.');
  const data = await fileToBase64(file);
  const { default: AnthropicClient } = await import('@anthropic-ai/sdk');
  const client = new AnthropicClient({ apiKey, dangerouslyAllowBrowser: true });
  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await client.beta.messages.create({
      model: 'claude-opus-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: media, data } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });
  } catch (e) {
    if (e instanceof AnthropicClient.AuthenticationError) throw new Error('The API key was rejected. Check it and try again.');
    if (e instanceof AnthropicClient.RateLimitError) throw new Error('Rate limited by the API — wait a moment and try again.');
    if (e instanceof AnthropicClient.APIConnectionError) throw new Error('Could not reach the API (check your internet connection).');
    if (e instanceof AnthropicClient.APIError) throw new Error(`API error ${e.status ?? ''}: ${e.message}`);
    throw e;
  }
  if (response.stop_reason === 'refusal') throw new Error('The model declined to read this image.');
  if (response.stop_reason === 'max_tokens') throw new Error('The reading was cut off — try a smaller crop of the question.');
  const text = response.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  let parsed: ImageReading;
  try {
    parsed = JSON.parse(text) as ImageReading;
  } catch {
    throw new Error('The response could not be interpreted. Type the question instead.');
  }
  return parsed;
}

/** Turn confirmed diagram values into sentences the deterministic parser understands. */
export function diagramSentences(values: DiagramValue[], dirs: DiagramDirection[]): string {
  const lines = values.map((v) => `From the diagram, the ${v.meaning || v.label} is ${v.value} ${v.unit}`.trim() + '.');
  for (const d of dirs) lines.push(`The ${d.quantity} is directed ${d.direction}.`);
  return lines.join(' ');
}
