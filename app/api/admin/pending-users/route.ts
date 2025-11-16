import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const search = (url.searchParams.get('search') || '').trim()
    const limitParam = parseInt(url.searchParams.get('limit') || '20', 10)
    const pageParam = parseInt(url.searchParams.get('page') || '1', 10)

    const limit = isNaN(limitParam) || limitParam <= 0 ? 20 : Math.min(limitParam, 100)
    const page = isNaN(pageParam) || pageParam <= 0 ? 1 : pageParam
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('users')
      .select(
        'id, full_name, email, phone_number, status, subscription_status, created_at, payment_proof_url, package_name, amount',
        { count: 'exact' }
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) {
      const like = `%${search}%`
      query = query.or(
        `full_name.ilike.${like},email.ilike.${like},phone_number.ilike.${like}`
      )
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      users: data || [],
      count: count || 0,
      page,
      limit
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 })
  }
}

