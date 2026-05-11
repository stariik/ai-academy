// ============================================================
// Document Parser - Extract text from PDF and DOCX files
// ============================================================

import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<{ text: string; pageCount?: number; wordCount: number }> {
  if (mimeType === 'application/pdf') {
    return extractFromPdf(buffer);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return extractFromDocx(buffer);
  }

  if (mimeType === 'text/markdown') {
    return extractFromMarkdown(buffer);
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

async function extractFromMarkdown(buffer: Buffer): Promise<{
  text: string;
  wordCount: number;
}> {
  const text = buffer.toString('utf-8').trim();
  return {
    text,
    wordCount: text.split(/\s+/).filter(Boolean).length,
  };
}

async function extractFromPdf(buffer: Buffer): Promise<{
  text: string;
  pageCount: number;
  wordCount: number;
}> {
  const pdf = new PDFParse({ data: new Uint8Array(buffer) });
  const info = await pdf.getInfo();
  const textResult = await pdf.getText();
  await pdf.destroy();

  const text = textResult.text.trim();
  return {
    text,
    pageCount: info.total,
    wordCount: text.split(/\s+/).filter(Boolean).length,
  };
}

async function extractFromDocx(buffer: Buffer): Promise<{
  text: string;
  wordCount: number;
}> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.trim();
  return {
    text,
    wordCount: text.split(/\s+/).filter(Boolean).length,
  };
}
