
import { createClient } from '@supabase/supabase-js'

// ✅ AVEC VOS VRAIES VALEURS
const supabaseUrl = 'https://rixlblpzyoygpzbktdsz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeGxibHB6eW95Z3B6Ymt0ZHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTE0NTksImV4cCI6MjA3NzkyNzQ1OX0.zNHLbPjU55Db0CFi30SBJgVDI4vPvYzyo5vTZUwsXyk'

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)