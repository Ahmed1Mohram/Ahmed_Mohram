import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

 

// GET - جلب محاضرات المادة
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subjectId = params.id

    const { data: lectures, error } = await supabaseAdmin
      .from('lectures')
      .select(`
        *,
        lecture_content(*)
      `)
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .order('order_index')

    if (error) {
      console.error('Error fetching lectures:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // تنسيق البيانات
    const formattedLectures = (lectures || []).map(lecture => ({
      ...lecture,
      content: lecture.lecture_content || []
    }))

    return NextResponse.json({
      success: true,
      lectures: formattedLectures
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - إضافة محاضرة جديدة
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subjectId = params.id
    const body = await req.json()
    
    const { 
      title, 
      description, 
      thumbnail_url, 
      duration_minutes,
      is_free,
      content = []
    } = body

    if (!title) {
      return NextResponse.json({ error: 'عنوان المحاضرة مطلوب' }, { status: 400 })
    }

    // الحصول على أعلى order_index
    const { data: lastLecture } = await supabaseAdmin
      .from('lectures')
      .select('order_index')
      .eq('subject_id', subjectId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const newOrderIndex = (lastLecture?.order_index || 0) + 1

    // إنشاء المحاضرة
    const { data: lecture, error: lectureError } = await supabaseAdmin
      .from('lectures')
      .insert({
        subject_id: subjectId,
        title,
        description,
        thumbnail_url,
        duration_minutes: duration_minutes || 0,
        order_index: newOrderIndex,
        is_active: true,
        is_free: is_free || false
      })
      .select()
      .single()

    if (lectureError) {
      console.error('Error creating lecture:', lectureError)
      return NextResponse.json({ error: lectureError.message }, { status: 500 })
    }

    // إضافة محتوى المحاضرة إن وجد
    if (content && content.length > 0 && lecture) {
      const contentData = content.map((item: any, index: number) => ({
        lecture_id: lecture.id,
        type: item.type,
        title: item.title,
        content_url: item.content_url,
        content_text: item.content_text,
        duration_minutes: item.duration_minutes,
        order_index: index + 1,
        is_downloadable: item.is_downloadable || false
      }))

      const { error: contentError } = await supabaseAdmin
        .from('lecture_content')
        .insert(contentData)

      if (contentError) {
        console.error('Error creating content:', contentError)
        // لا نفشل العملية كاملة إذا فشل إضافة المحتوى
      }
    }

    return NextResponse.json({
      success: true,
      lecture
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - تحديث محاضرة
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { lectureId, ...updateData } = body

    if (!lectureId) {
      return NextResponse.json({ error: 'معرف المحاضرة مطلوب' }, { status: 400 })
    }

    const { data: lecture, error } = await supabaseAdmin
      .from('lectures')
      .update(updateData)
      .eq('id', lectureId)
      .select()
      .single()

    if (error) {
      console.error('Error updating lecture:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      lecture
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - حذف محاضرة
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const lectureId = searchParams.get('lectureId')

    if (!lectureId) {
      return NextResponse.json({ error: 'معرف المحاضرة مطلوب' }, { status: 400 })
    }

    // حذف منطقي (تعطيل) بدلاً من الحذف الفعلي
    const { error } = await supabaseAdmin
      .from('lectures')
      .update({ is_active: false })
      .eq('id', lectureId)

    if (error) {
      console.error('Error deleting lecture:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
