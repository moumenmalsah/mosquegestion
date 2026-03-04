import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://uellvizfrfrtnqalvjyo.supabase.co';
// La clé ANON est nécessaire pour les opérations client (lecture/écriture selon les règles RLS)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbGx2aXpmcmZydG5xYWx2anlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTU0NTgsImV4cCI6MjA4NjU5MTQ1OH0.ZWB5xrMQ6jMsbwhGn9xLeozYAWcCXpUbsHLZgdkMcSs';

export const supabase = createClient(supabaseUrl, supabaseKey);