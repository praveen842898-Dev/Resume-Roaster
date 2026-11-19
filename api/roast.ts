import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'path';
import multer from 'multer';
import mammoth from 'mammoth';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

export const maxDuration = 60;

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60,
};

type HeatLevel = 'mild' | 'medium' | 'crispy';

const HEAT_INSTRUCTIONS: Record<HeatLevel, string> = {
  mild:
    'Tone: Mild Simmer. Playful, warm, witty editorial teasing like a sharp friend over coffee. Gently poke fun at clichés and formatting quirks without being cruel, and keep the fixes super encouraging.',
  medium:
    'Tone: Medium Well. Classic comedy-central roast meets veteran tech/hiring editor. Sharp, incisive, laugh-out-loud funny, calling out fluff, vague metrics, and humblebrags directly, balanced with genuinely smart career advice.',
  crispy:
    'Tone: Extra Crispy. Brutally hilarious, no-mercy satirical critique in the style of a cynical senior recruiter on their fourth espresso. Tear apart corporate buzzwords, inflated titles, suspicious gaps, and empty bragging with razor-sharp wit—while keeping every joke strictly about the resume text/choices (never punch down on protected personal traits) and making the actual fixes legitimately gold-standard.',
};

const ALLOWED_IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

const ALLOWED_TEXT_EXT = new Set(['.txt', '.md', '.markdown', '.rtf', '.csv']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const roastResponseSchema = {
  type: Type.OBJECT,
  properties: {
    candidateName: {
      type: Type.STRING,
      description: 'The candidate name extracted from the resume, or "Anonymous Applicant" if absent.',
    },
    targetRole: {
      type: Type.STRING,
      description: 'Short inferred role/title based on the resume.',
    },
    archetype: {
      type: Type.STRING,
      description: 'A funny 3-5 word satirical archetype label for this resume (e.g. "The Synergy Alchemist").',
    },
    headline: {
      type: Type.STRING,
      description: 'A punchy satirical newspaper-style headline roasting this specific resume.',
    },
    subheadline: {
      type: Type.STRING,
      description: 'A witty one-sentence editorial subheadline summarizing the verdict.',
    },
    openingMonologue: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2 short, laugh-out-loud funny paragraphs roasting specific details actually in the resume.',
    },
    pullQuote: {
      type: Type.STRING,
      description: 'One unforgettable, razor-sharp comedic verdict sentence suitable for an editorial pull quote.',
    },
    lineByLineRoasts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          section: { type: Type.STRING, description: 'Resume section name (e.g. Summary, Experience, Skills).' },
          originalSnippet: { type: Type.STRING, description: 'Short quoted snippet from the resume.' },
          roast: { type: Type.STRING, description: 'Funny 1-sentence critique of that exact line.' },
          actualFix: { type: Type.STRING, description: 'Concise 1-sentence rewritten version or fix.' },
        },
        required: ['section', 'originalSnippet', 'roast', 'actualFix'],
      },
      description: '3 to 4 sharpest snippets pulled from the resume with their roast and real fix.',
    },
    buzzwordAudit: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phrase: { type: Type.STRING, description: 'Buzzword, cliché, or overused claim found in the resume.' },
          count: { type: Type.INTEGER, description: 'How many times it appears (minimum 1).' },
          verdict: { type: Type.STRING, description: 'Snarky 1-sentence commentary on why recruiters roll their eyes at it.' },
        },
        required: ['phrase', 'count', 'verdict'],
      },
      description: '3 to 4 buzzwords, clichés, or vague claims spotted in the resume.',
    },
    redFlags: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Short 3-5 word red flag title.' },
          detail: { type: Type.STRING, description: '1 crisp sentence explaining why a hiring manager pauses here, with dry humor.' },
        },
        required: ['title', 'detail'],
      },
      description: '3 hiring-manager red flags observed in this resume.',
    },
    salvagePlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stepTitle: { type: Type.STRING, description: 'Concise action headline.' },
          action: { type: Type.STRING, description: '1 crisp, practical edit the candidate should make today.' },
        },
        required: ['stepTitle', 'action'],
      },
      description: '3 concrete, practical steps to turn this resume from roast material into interview material.',
    },
  },
  required: [
    'candidateName',
    'targetRole',
    'archetype',
    'headline',
    'subheadline',
    'openingMonologue',
    'pullQuote',
    'lineByLineRoasts',
    'buzzwordAudit',
    'redFlags',
    'salvagePlan',
  ],
};

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function normalizeHeat(raw: unknown): HeatLevel {
  if (raw === 'mild' || raw === 'medium' || raw === 'crispy') {
    return raw;
  }
  return 'medium';
}

function isTransientDemandError(err: unknown): boolean {
  const raw = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    raw.includes('503') ||
    raw.includes('unavailable') ||
    raw.includes('high demand') ||
    raw.includes('overloaded') ||
    raw.includes('deadline_exceeded') ||
    raw.includes('timed out') ||
    raw.includes('timeout')
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateRoastWithFallback(
  ai: GoogleGenAI,
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>,
) {
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
  const systemInstruction =
    'You are the chief comedy editor and veteran executive recruiter at Roast me., a satirical career publication famous for mercilessly funny, hyper-specific resume roasts paired with genuinely elite career fixes. Keep every paragraph, roast, and fix razor-sharp and concise (1-2 sentences max per item).';

  const isPrimaryFlashLite = primaryModel === 'gemini-3.1-flash-lite';
  const attempts: Array<{ model: string; useThinking: boolean; timeoutMs: number; delayBeforeMs: number }> = [
    { model: primaryModel, useThinking: !isPrimaryFlashLite, timeoutMs: 14000, delayBeforeMs: 0 },
    isPrimaryFlashLite
      ? { model: 'gemini-4-hydrogen', useThinking: true, timeoutMs: 16000, delayBeforeMs: 250 }
      : { model: 'gemini-3.1-flash-lite', useThinking: false, timeoutMs: 16000, delayBeforeMs: 250 },
    { model: 'gemini-3.1-flash-lite', useThinking: false, timeoutMs: 16000, delayBeforeMs: 700 },
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    if (attempt.delayBeforeMs > 0) {
      await sleep(attempt.delayBeforeMs);
    }
    try {
      return await withTimeout(
        ai.models.generateContent({
          model: attempt.model,
          contents: { parts },
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: roastResponseSchema,
            ...(attempt.useThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
          },
        }),
        attempt.timeoutMs,
        attempt.model,
      );
    } catch (err) {
      lastError = err;
      if (!isTransientDemandError(err)) {
        throw err;
      }
    }
  }

  throw lastError;
}

function getFriendlyErrorMessage(err: unknown): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : String(err);
  const lower = rawMessage.toLowerCase();

  if (lower.includes('gemini_api_key is not configured')) {
    return {
      status: 503,
      message:
        'GEMINI_API_KEY is missing. Add GEMINI_API_KEY in your Vercel Environment Variables (or AI Studio Settings > Secrets) and redeploy.',
    };
  }
  if (lower.includes('api_key_invalid') || lower.includes('permission_denied') || lower.includes('403')) {
    return {
      status: 403,
      message: 'The configured GEMINI_API_KEY was rejected. Verify it in your environment variables and try again.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429')) {
    return {
      status: 429,
      message: 'Rate limit reached on the Gemini API. Please wait a moment and try roasting again.',
    };
  }
  if (isTransientDemandError(err)) {
    return {
      status: 503,
      message:
        'Google’s Gemini API is experiencing a temporary spike in demand right now. We retried automatically—please wait a few seconds and click Roast Me again.',
    };
  }

  // Extract readable message if the SDK wrapped a JSON error object
  try {
    const parsed = JSON.parse(rawMessage);
    if (parsed?.error?.message) {
      return {
        status: Number(parsed.error.code) || 500,
        message: String(parsed.error.message),
      };
    }
  } catch {
    // Raw message is plain text
  }

  return {
    status: 500,
    message: rawMessage || 'Failed to roast the resume. Please try again.',
  };
}

const app = express();

// Only parse JSON requests; never touch req.body on multipart/form-data so multer receives the raw stream
app.use((req: Request, res: Response, next: NextFunction) => {
  const contentType = (req.headers['content-type'] || '').toLowerCase();
  if (!contentType.includes('application/json') || req.readableEnded) {
    next();
    return;
  }
  express.json({ limit: '4mb' })(req, res, next);
});

app.post(['/api/roast', '/'], upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const heat = normalizeHeat(req.body?.heat);
    const file = req.file;
    const pastedText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const pastedLabel =
      typeof req.body?.fileName === 'string' && req.body.fileName.trim()
        ? req.body.fileName.trim()
        : 'Pasted Resume';

    if (!file && !pastedText) {
      res.status(400).json({ error: 'Please upload a resume file or paste your resume text first.' });
      return;
    }

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    let sourceLabel = pastedLabel;

    if (file) {
      sourceLabel = file.originalname || 'Uploaded Resume';
      const ext = path.extname(sourceLabel).toLowerCase();
      const mime = (file.mimetype || '').toLowerCase();

      if (ext === '.doc' || mime === 'application/msword') {
        res.status(400).json({
          error: 'Legacy .doc files are not supported. Please export as PDF, DOCX, or TXT and upload again.',
        });
        return;
      }

      if (ext === '.pdf' || mime === 'application/pdf') {
        parts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: file.buffer.toString('base64'),
          },
        });
      } else if (ALLOWED_IMAGE_MIME.has(mime) || ['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        const resolvedMime =
          mime && ALLOWED_IMAGE_MIME.has(mime)
            ? mime === 'image/jpg'
              ? 'image/jpeg'
              : mime
            : ext === '.png'
              ? 'image/png'
              : ext === '.webp'
                ? 'image/webp'
                : 'image/jpeg';

        parts.push({
          inlineData: {
            mimeType: resolvedMime,
            data: file.buffer.toString('base64'),
          },
        });
      } else if (
        ext === '.docx' ||
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const extracted = await mammoth.extractRawText({ buffer: file.buffer });
        const docText = extracted.value.trim();
        if (!docText) {
          res.status(400).json({
            error:
              'That DOCX file appears to have no readable text (it may only contain embedded images). Try exporting it as a PDF.',
          });
          return;
        }
        parts.push({ text: `RESUME CONTENT (${sourceLabel}):\n\n${docText}` });
      } else if (ALLOWED_TEXT_EXT.has(ext) || mime.startsWith('text/')) {
        const decoded = file.buffer.toString('utf-8').trim();
        if (!decoded) {
          res.status(400).json({ error: 'The uploaded text file is empty.' });
          return;
        }
        parts.push({ text: `RESUME CONTENT (${sourceLabel}):\n\n${decoded}` });
      } else {
        res.status(400).json({
          error: `Unsupported file format (${ext || mime || 'unknown'}). Upload a PDF, DOCX, TXT, MD, or PNG/JPG screenshot.`,
        });
        return;
      }
    } else {
      if (pastedText.length < 40) {
        res.status(400).json({
          error: 'That looks a bit too short to be a resume. Paste at least a few lines of experience or skills.',
        });
        return;
      }
      parts.push({ text: `RESUME CONTENT (${sourceLabel}):\n\n${pastedText}` });
    }

    const promptInstruction = [
      'Analyze the attached resume thoroughly and deliver a genuinely hilarious, razor-sharp comedy roast.',
      HEAT_INSTRUCTIONS[heat],
      'Rules:',
      '1. Reference SPECIFIC companies, job titles, bullet points, formatting quirks, hobbies, skill bars, GPAs, or buzzwords actually found in this resume. Never write generic jokes that could apply to anyone.',
      '2. If the uploaded file does NOT appear to be a resume or CV (for instance, a recipe or random meme), roast them specifically for uploading the wrong document to a resume roaster, while still filling all JSON fields cleanly.',
      '3. Keep humor aimed strictly at resume writing, corporate jargon, layout choices, and humblebrags—never attack protected personal characteristics.',
      '4. Make sure every "actualFix" and "salvagePlan" step is genuinely smart, concrete, recruiter-tested career advice.',
    ].join('\n');

    parts.push({ text: promptInstruction });

    const ai = getGenAIClient();
    const response = await generateRoastWithFallback(ai, parts);

    const rawJson = (response.text ?? '').trim();
    if (!rawJson) {
      throw new Error('Model returned an empty response. Please try again.');
    }

    const parsed = JSON.parse(rawJson);
    res.json({
      ...parsed,
      heatLevel: heat,
      sourceLabel,
    });
  } catch (err) {
    const { status, message } = getFriendlyErrorMessage(err);
    res.status(status).json({ error: message });
  }
});

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File exceeds the upload size limit. Please upload a smaller resume.' });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
});

export default app;
