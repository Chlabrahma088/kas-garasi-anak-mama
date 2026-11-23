import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aypoinzmnxcjnmpkwfvc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_mAY8TwWd_KGpojU1Ke7QLQ_aow5BQgl';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
