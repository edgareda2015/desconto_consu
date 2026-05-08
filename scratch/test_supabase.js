import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('Testing connection to:', supabaseUrl)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    // Try to fetch a single row from 'motivos_indeferimento' which is usually public or seeded
    const { data, error } = await supabase
      .from('motivos_indeferimento')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Connection error or permission denied:', error.message)
      // Even if permission is denied, it means we reached the server
      if (error.code === 'PGRST301' || error.message.includes('JWT')) {
         console.log('Reachability test: The Supabase server IS reachable, but RLS is blocking the query (expected if no user is logged in).')
      }
    } else {
      console.log('Success! Connected to Supabase and fetched data:', data)
    }

    // Try a simple health check if available or just a meta query
    const { data: profiles, error: profileError } = await supabase.from('usuarios_perfis').select('*').limit(5)
    if (profileError) {
        console.log('Note: Querying "usuarios_perfis" failed:', profileError.message)
    } else {
        console.log('Successfully reached "usuarios_perfis". Data:', profiles)
    }

  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

testConnection()
