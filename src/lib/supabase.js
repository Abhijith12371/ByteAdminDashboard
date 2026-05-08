import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yaoirsxicxewczcbldxt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhb2lyc3hpY3hld2N6Y2JsZHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNDE4MjcsImV4cCI6MjA5MzYxNzgyN30.pFBdTTKZaGNsE9vX3ul5W9n1BBoLFWcVAmMqUojBr3M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
