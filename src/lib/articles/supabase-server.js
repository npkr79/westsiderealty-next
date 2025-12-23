const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with service role key for server-side operations
const supabaseUrl = 'https://imqlfztriragzypplbqa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltcWxmenRyaXJhZ3p5cHBsYnFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njg1NTQxMCwiZXhwIjoyMDYyNDMxNDEwfQ.YKK-usj8GIwOY6sZD203lY1FauidsZX6o_pH4xs_gTg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = { supabase };