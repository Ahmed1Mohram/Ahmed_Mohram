import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

 

// GET - جلب جميع المواد
export async function GET(req: NextRequest) {
  try {
    const { data: subjects, error } = await supabaseAdmin
      .from('subjects')
      .select(`
        *,
        lectures:lectures(count)
      `)
      .eq('is_active', true)
      .order('order_index')

    if (error) {
      console.error('Error fetching subjects:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // حساب عدد المحاضرات لكل مادة
    const formattedSubjects = await Promise.all((subjects || []).map(async (subject) => {
      const { count } = await supabaseAdmin
        .from('lectures')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', subject.id)
      
      return {
        ...subject,
        lectures_count: count || 0
      }
    }))

    return NextResponse.json({
      success: true,
      subjects: formattedSubjects
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - إضافة مادة جديدة (للأدمن فقط)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, image_url, icon, color, is_premium } = body

    if (!title) {
      return NextResponse.json({ error: 'عنوان المادة مطلوب' }, { status: 400 })
    }

    // الحصول على أعلى order_index
    const { data: lastSubject } = await supabaseAdmin
      .from('subjects')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const newOrderIndex = (lastSubject?.order_index || 0) + 1

    const { data: subject, error } = await supabaseAdmin
      .from('subjects')
      .insert({
        title,
        description,
        image_url,
        icon: icon || 'BookOpen',
        color: color || 'from-gold to-yellow-600',
        is_premium: is_premium || false,
        order_index: newOrderIndex,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating subject:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      subject
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - تحديث مادة
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف المادة مطلوب' }, { status: 400 })
    }

    const { data: subject, error } = await supabaseAdmin
      .from('subjects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating subject:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      subject
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - حذف مادة
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'معرف المادة مطلوب' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('subjects')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deleting subject:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
