import { createClient } from '@supabase/supabase-js';

// SUBSTITUA PELOS SEUS DADOS DO SUPABASE (DAQUELE PASSO 1)
const supabaseUrl = 'https://jrvbqmvuqwayrtklokvp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpydmJxbXZ1cXdheXJ0a2xva3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzOTgxODYsImV4cCI6MjA4Mzk3NDE4Nn0.t98DIFAVgZkR8uP73WD8ekpJegmWvW2CecjTU9KIUhs';

export const supabase = createClient(supabaseUrl, supabaseKey);
