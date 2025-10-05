const supabaseUrl = 'https://ezomqixhbjtonqhfbpac.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6b21xaXhoYmp0b25xaGZicGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NDUwMDQsImV4cCI6MjA3NTIyMTAwNH0.WfLWVt3KIxyXgaqbj8x3_teFMvHPGhzgia8tQ2VVMs8';

// The global `supabase` object is defined by the CDN script.
// We create a client instance from it and re-assign the global `supabase` variable.
// This makes it easy to use `supabase.from(...)` in other scripts.
window.supabase = supabase.createClient(supabaseUrl, supabaseKey);