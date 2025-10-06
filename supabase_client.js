// supabase_client.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Pastikan untuk menangani kasus di mana variabel tidak ditemukan
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;