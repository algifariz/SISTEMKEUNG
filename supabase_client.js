const supabaseUrl = 'https://mlaagecwordpjbsxeluf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sYWFnZWN3b3JkcGpic3hlbHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MzgyNDAsImV4cCI6MjA3NTMxNDI0MH0.Jg_tSfx3ivE8S0bhr81ExTRdtmWLdkXnO5zbYF1LPdQ';

// The global `supabase` object is defined by the CDN script.
// We create a client instance from it and re-assign the global `supabase` variable.
// This makes it easy to use `supabase.from(...)` in other scripts.
window.supabase = supabase.createClient(supabaseUrl, supabaseKey);