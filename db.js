import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

console.log("Check - URL:", supabaseUrl ? "Found" : "MISSING");
console.log("Check - Key:", supabaseKey ? "Found" : "MISSING");

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase