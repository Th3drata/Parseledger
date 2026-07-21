import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import type { ExtractedStatement, ExtractedTransaction } from './types';
import { parseMoneyToMinor } from './money';

const execFileAsync = promisify(execFile);

export interface ExtractionInput {
  /** Absolute path to a PDF or image (png/jpg/webp) statement. */
  filePath: string;
}

export interface ExtractionProvider {
  extract(input: ExtractionInput): Promise<ExtractedStatement>;
}

/**
 * Structured-output schema the vision model must fill. All money values are
 * RAW STRINGS exactly as printed on the statement — they are mapped to integer
 * minor units through parseMoneyToMinor(), never parsed by the model.
 */
export const EXTRACTION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'bankName', 'accountHolder', 'accountNumber', 'currency',
    'periodStart', 'periodEnd', 'openingBalance', 'closingBalance',
    'declaredTransactionCount', 'transactions',
  ],
  properties: {
    bankName: { type: 'string' },
    accountHolder: { type: ['string', 'null'] },
    accountNumber: { type: ['string', 'null'] },
    currency: { type: 'string', description: 'ISO 4217 code, e.g. GBP, EUR' },
    periodStart: { type: ['string', 'null'], description: 'ISO date yyyy-mm-dd' },
    periodEnd: { type: ['string', 'null'], description: 'ISO date yyyy-mm-dd' },
    openingBalance: { type: ['string', 'null'], description: 'Raw opening balance as printed, e.g. "1,234.56"; null ONLY if the statement truly prints no opening balance' },
    closingBalance: { type: ['string', 'null'], description: 'Raw closing balance as printed; null ONLY if truly absent' },
    declaredTransactionCount: { type: ['integer', 'null'], description: 'Number of transactions the statement itself declares (e.g. "24 transactions"), or null if not printed' },
    transactions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['date', 'description', 'amount', 'direction', 'balance', 'confidence'],
        properties: {
          date: { type: 'string', description: 'ISO date yyyy-mm-dd' },
          description: { type: 'string' },
          amount: { type: 'string', description: 'Raw unsigned amount as printed, e.g. "45.00"' },
          direction: { type: 'string', enum: ['credit', 'debit'] },
          balance: { type: ['string', 'null'], description: 'Raw running balance as printed on this row, or null if the statement has no balance column' },
          confidence: { type: 'number', minimum: 0, maximum: 1, description: 'Your certainty that date, amount and direction were read correctly from the source (1 = perfectly legible)' },
        },
      },
    },
  },
} as const;

interface RawExtraction {
  bankName: string;
  accountHolder: string | null;
  accountNumber: string | null;
  currency: string;
  periodStart: string | null;
  periodEnd: string | null;
  openingBalance: string | null;
  closingBalance: string | null;
  declaredTransactionCount: number | null;
  transactions: Array<{
    date: string;
    description: string;
    amount: string;
    direction: 'credit' | 'debit';
    balance: string | null;
    confidence: number;
  }>;
}

const PROMPT = `Extract every transaction from this bank statement, in statement order, across ALL pages.
Copy money values EXACTLY as printed (keep separators, do not reformat, do not compute).
Amounts are unsigned; use "direction" for credit vs debit. If a row shows a running balance, copy it; otherwise balance is null.
Opening balance = balance BEFORE the first listed transaction (often labelled "balance brought forward" / "start balance").
Closing balance = balance AFTER the last transaction. If the statement genuinely prints neither, use null — NEVER invent a balance.
UK/IE statements print dates as DD/MM or "DD MMM" — resolve to ISO yyyy-mm-dd, carrying the statement year across month boundaries.
If the statement declares its own transaction count, report it in declaredTransactionCount.
For each row, report confidence (0-1): 1 for crisp print, lower when the source is blurred, creased or ambiguous. Do not invent or omit rows.`;

const IMAGE_TYPES: Record<string, 'image/png' | 'image/jpeg' | 'image/webp'> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

/** True when the PDF has a usable native text layer (cheap text path); false → vision. */
async function pdfHasTextLayer(filePath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('pdftotext', ['-layout', filePath, '-']);
    // ponytail: crude threshold; a scanned PDF yields ~no text, a native one yields plenty
    return stdout.replace(/\s/g, '').length > 300 ? stdout : null;
  } catch {
    return null; // pdftotext missing or failed → fall back to vision
  }
}

export class AnthropicExtractionProvider implements ExtractionProvider {
  private client: Anthropic;
  constructor(private model: string = 'claude-opus-4-8', client?: Anthropic) {
    this.client = client ?? new Anthropic();
  }

  async extract(input: ExtractionInput): Promise<ExtractedStatement> {
    const ext = extname(input.filePath).toLowerCase();
    let content: Anthropic.ContentBlockParam[];

    const imageType = IMAGE_TYPES[ext];
    if (imageType) {
      const data = await readFile(input.filePath);
      content = [
        { type: 'image', source: { type: 'base64', media_type: imageType, data: data.toString('base64') } },
        { type: 'text', text: PROMPT },
      ];
    } else if (ext === '.pdf') {
      // Router: native text path first (cheap), vision only for scanned/image-only PDFs.
      const text = await pdfHasTextLayer(input.filePath);
      if (text !== null) {
        content = [{ type: 'text', text: `${PROMPT}\n\n--- STATEMENT TEXT (pdftotext -layout) ---\n${text}` }];
      } else {
        const data = await readFile(input.filePath);
        content = [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: data.toString('base64') } },
          { type: 'text', text: PROMPT },
        ];
      }
    } else {
      throw new Error(`unsupported file type: ${ext}`);
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 32000,
      tools: [{
        name: 'record_statement',
        description: 'Record the extracted bank statement data.',
        input_schema: EXTRACTION_JSON_SCHEMA as unknown as Anthropic.Tool.InputSchema,
      }],
      tool_choice: { type: 'tool', name: 'record_statement' },
      messages: [{ role: 'user', content }],
    });

    const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (!toolUse) throw new Error('model returned no structured output');
    return mapRawExtraction(toolUse.input as RawExtraction);
  }
}

/** Map the model's raw-string output into the integer-minor-unit domain types. */
export function mapRawExtraction(raw: RawExtraction): ExtractedStatement {
  const transactions: ExtractedTransaction[] = raw.transactions.map((t) => {
    const abs = Math.abs(parseMoneyToMinor(t.amount));
    return {
      date: t.date,
      description: t.description,
      amountMinor: t.direction === 'debit' ? -abs : abs,
      balanceMinor: t.balance === null ? null : parseMoneyToMinor(t.balance),
      confidence: Math.max(0, Math.min(1, t.confidence)),
    };
  });
  const balancesMissing = raw.openingBalance === null && raw.closingBalance === null;
  return {
    bankName: raw.bankName,
    accountHolder: raw.accountHolder,
    accountNumber: raw.accountNumber,
    currency: raw.currency.toUpperCase(),
    periodStart: raw.periodStart,
    periodEnd: raw.periodEnd,
    openingBalanceMinor: raw.openingBalance === null ? 0 : parseMoneyToMinor(raw.openingBalance),
    closingBalanceMinor: raw.closingBalance === null ? 0 : parseMoneyToMinor(raw.closingBalance),
    balancesMissing: balancesMissing || undefined,
    declaredTransactionCount: raw.declaredTransactionCount,
    transactions,
  };
}
