import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('status, subscription_status, subscription_end_date')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Fetch error:', error)
      return NextResponse.json(
        { error: 'فشل جلب حالة المستخدم' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      status: user?.status || 'pending',
      subscription_status: user?.subscription_status || 'inactive',
      subscription_end_date: user?.subscription_end_date
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
