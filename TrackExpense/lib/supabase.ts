import { createClient } from "@supabase/supabase-js";

// Replace these with your Supabase project URL and anon key
// Found at: https://supabase.com/dashboard → your project → Settings → API
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
