import { createHash, randomBytes } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

const PAT_PREFIX = 'nhpat_';
const PAT_BYTES = 24;

interface PatRow {
  id: string;
  user_id: string;
  token_hash: string;
  prefix: string;
  name: string;
  created_at: number;
  last_used_at: number | null;
}

export function generatePat(): { token: string; hash: string; prefix: string } {
  const token = PAT_PREFIX + randomBytes(PAT_BYTES).toString('hex');
  const hash = createHash('sha256').update(token).digest('hex');
  const prefix = token.slice(0, 11);
  return { token, hash, prefix };
}

export async function verifyPat(
  client: SupabaseClient,
  rawToken: string,
): Promise<{ userId: string; patId: string } | null> {
  if (!rawToken || !rawToken.startsWith(PAT_PREFIX)) return null;

  const hash = createHash('sha256').update(rawToken).digest('hex');

  const { data, error } = await client
    .from('notehub_pats')
    .select('id, user_id')
    .eq('token_hash', hash)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as PatRow;

  await client
    .from('notehub_pats')
    .update({ last_used_at: Date.now() })
    .eq('id', row.id)
    .select('id')
    .maybeSingle();

  return { userId: row.user_id, patId: row.id };
}
