import { getSupabaseAdmin } from '@/lib/db/client';

const BUCKET = 'reports';

// Upload the generated PDF to the public `reports` bucket and return its URL.
export async function uploadPDF(
  scanId: string,
  pdfBuffer: Buffer,
): Promise<string> {
  const admin = getSupabaseAdmin();
  const path = `${scanId}.pdf`;

  const { error } = await admin.storage.from(BUCKET).upload(path, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw new Error(`uploadPDF failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}
