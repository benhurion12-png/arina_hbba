declare module "pdf-parse/lib/pdf-parse.js" {
  type PdfResult = { text: string; numpages: number; numrender: number; info: unknown; metadata: unknown; version: string };
  export default function pdf(dataBuffer: Buffer, options?: Record<string, unknown>): Promise<PdfResult>;
}
