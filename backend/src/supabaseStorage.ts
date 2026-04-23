import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export async function uploadPdfToSupabase(
  buffer: Buffer,
  options: { contentType?: string; originalName?: string }
): Promise<string> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase is not configured');

  const bucket = process.env.SUPABASE_PDF_BUCKET || 'pdfs';
  const ext = path.extname(options.originalName || '') || '.pdf';
  const objectPath = `${uuidv4()}${ext}`;

  const { data, error } = await supabase.storage.from(bucket).upload(objectPath, buffer, {
    contentType: options.contentType || 'application/pdf',
    upsert: false,
  });

  if (error) throw error;

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return pub.publicUrl;
}
