import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

 

export async function GET(req: NextRequest) {
  try {
    const { data: payments, error } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        users!payments_user_id_fkey(full_name, email, phone_number)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        payments: []
      }, { status: 200 }) // Return 200 with empty array
    }

    return NextResponse.json({
      success: true,
      payments: payments || []
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      payments: []
    }, { status: 200 }) // Return 200 with empty array
  }
}
