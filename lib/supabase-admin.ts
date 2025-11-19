import { createClient } from '@supabase/supabase-js'

// Admin client with service role key for bypassing RLS
export const supabaseAdmin = createClient(
  'https://tkvzxsuozjbmcmrxqpkt.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper function to create user bypassing RLS
export async function createUserDirectly(
  email: string,
  password: string,
  fullName: string,
  phoneNumber: string
) {
  try {
    // First try to create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        phone_number: phoneNumber
      }
    })

    if (authError) {
      console.error('Admin auth error:', authError)
      
      // If auth fails, create user directly in database
      const userId = crypto.randomUUID()
      const { data: userData, error: dbError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email,
          full_name: fullName,
          phone_number: phoneNumber,
          status: 'pending',
          role: 'student'
        })
        .select()
        .single()

      if (dbError) {
        throw dbError
      }

      return { user: userData, error: null }
    }

    // Create user in database
    if (authData.user) {
      const { data: userData, error: dbError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          full_name: fullName,
          phone_number: phoneNumber,
          status: 'pending',
          role: 'student'
        })
        .select()
        .single()

      if (dbError && !dbError.message.includes('duplicate')) {
        console.error('Database error:', dbError)
      }

      return { user: authData.user, error: null }
    }

    return { user: null, error: 'Failed to create user' }
  } catch (error: any) {
    console.error('Create user error:', error)
    return { user: null, error: error.message }
  }
}
