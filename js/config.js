// supabase credentials - needed to connect to the database
const SUPABASE_URL = 'https://pmayrgqhzprbulgunway.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYXlyZ3FoenByYnVsZ3Vud2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNDM4ODgsImV4cCI6MjA3NTkxOTg4OH0.HZgvZXiUoHTmrP06J1pZyW_kKfN1jq2PhsDRq87sog8';

// create the supabase client - this lets me interact with the database
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// keep track of the logged in user
let currentUser = null;