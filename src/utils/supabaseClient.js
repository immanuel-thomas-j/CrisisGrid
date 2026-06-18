import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xrmdjubyctqhftvspcoh.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybWRqdWJ5Y3RxaGZ0dnNwY29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDU2NzcsImV4cCI6MjA5NzMyMTY3N30.pVE7IYwZ2lnz9SdJeWlpBt0zcLW6UkN0UEbBOUVzIpg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
