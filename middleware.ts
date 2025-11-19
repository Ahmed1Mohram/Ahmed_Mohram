import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  
  // حماية مسارات /api/admin بالاعتماد على كوكي isAdmin فقط
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    const adminCookie = request.cookies.get('isAdmin');
    const isAdmin = adminCookie?.value === 'true';

    if (!isAdmin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    return res
  }

  // تجاوز التحقق لـ API routes وملفات الوسائط
  if (request.nextUrl.pathname.startsWith('/api/') || 
      request.nextUrl.pathname.startsWith('/audio/') ||
      request.nextUrl.pathname.endsWith('.mp3') ||
      request.nextUrl.pathname.endsWith('.wav') ||
      request.nextUrl.pathname.endsWith('.html')) {
    console.log('Bypass check for:', request.nextUrl.pathname);
    return res
  }
  
  // تشخيص لوج للتحقق
  console.log('Middleware checking path:', request.nextUrl.pathname);
  
  // التحقق من الأدمن من cookies
  const adminCookie = request.cookies.get('isAdmin');
  console.log('Admin cookie found:', adminCookie ? `${adminCookie.name}=${adminCookie.value}` : 'None');
  
  const isAdmin = adminCookie?.value === 'true';
  
  // دعم جلسة مخصصة عبر cookies (لعمليات تسجيل الدخول المباشر)
  const loggedInCookie = request.cookies.get('loggedIn');
  const isLoggedIn = loggedInCookie?.value === 'true';
  const userRoleCookie = request.cookies.get('role')?.value || null;
  const userStatusCookie = request.cookies.get('status')?.value || null;
  const subStatusCookie = request.cookies.get('subscription_status')?.value || null;
  
  // سجل قيم الكوكيز للمساعدة في التشخيص أثناء التطوير
  console.log('Cookie session snapshot:', {
    loggedIn: isLoggedIn,
    role: userRoleCookie,
    status: userStatusCookie,
    subscription_status: subStatusCookie
  });
  
  // اعتبر المستخدم مسجل دخولاً فقط إذا كانت قيمة loggedIn = true
  const hasCookieAuth = isLoggedIn;
  
  // السماح بالوصول لصفحة الأدمن إذا كان أدمن
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (isAdmin) {
      console.log('✅ Admin access granted via cookies');
      
      // إضافة أو تحديث cookie في الرد
      const response = NextResponse.next();
      response.cookies.set('isAdmin', 'true', { 
        path: '/',
        maxAge: 24 * 60 * 60,
        sameSite: 'lax'
      });
      
      return response;
    } else {
      console.log('❌ Admin access denied - redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // الصفحات العامة المسموح بها
  const publicPaths = ['/', '/login', '/register', '/waiting-approval']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname === path)

  // إذا لم يكن هناك admin cookies ولا يحاول الوصول لصفحة عامة أو admin
  if (!isAdmin && !isPublicPath && request.nextUrl.pathname.startsWith('/admin')) {
    console.log('Admin access denied - redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // جلب session من Supabase فقط إذا لم يكن أدمن
  let session = null;
  if (!isAdmin) {
    try {
      const supabase = createMiddlewareClient({ req: request, res })
      const sessionData = await supabase.auth.getSession()
      session = sessionData.data.session
    } catch (error) {
      console.error('Error getting session:', error);
    }
  }

  // إذا لم يكن هناك session ولا يحاول الوصول لصفحة عامة ولا يوجد admin access
  if (!session && !isPublicPath && !isAdmin && !hasCookieAuth) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // إذا كان المستخدم على صفحة /login وهو مسجل دخولاً بالفعل، أعد توجيهه
  if (request.nextUrl.pathname === '/login') {
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    // لا تعتمد على الكوكيز فقط هنا لتجنب إعادة توجيه خاطئة
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // fallback: إذا كان لدينا loggedIn عبر الكوكيز، وجّه حسب حالة الاشتراك
    if (hasCookieAuth) {
      const target = subStatusCookie === 'active' ? '/dashboard' : '/subscription'
      return NextResponse.redirect(new URL(target, request.url))
    }
  }

  // إذا لم يكن هناك session ولكن هناك دخول عبر cookies، طبق قواعد الحالة والاشتراك
  if (!session && hasCookieAuth && !isAdmin) {
    // إذا كان المستخدم في انتظار الموافقة
    if (userStatusCookie === 'pending') {
      if (request.nextUrl.pathname !== '/waiting-approval' && !isPublicPath) {
        return NextResponse.redirect(new URL('/waiting-approval', request.url))
      }
    }

    // منع الوصول لمنطقة الأدمن إذا لم يكن الدور أدمن
    if (request.nextUrl.pathname.startsWith('/admin') && userRoleCookie !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // التحقق من حالة الاشتراك: أي صفحة غير عامة وغير صفحة الباقات/الانتظار تحتاج اشتراك فعّال
    const isSubscriptionPage = request.nextUrl.pathname.startsWith('/subscription')
    const isWaitingPage = request.nextUrl.pathname.startsWith('/waiting-approval')
    const isAllowedWithoutSub = isPublicPath || isSubscriptionPage || isWaitingPage
    const isProtectedPath = !isAllowedWithoutSub

    if (isProtectedPath && subStatusCookie !== 'active') {
      console.log('Cookie subscription check failed - redirecting to subscription with warning');
      const url = new URL('/subscription', request.url)
      url.searchParams.set('warn', '1')
      return NextResponse.redirect(url)
    }
  }

  // إذا كان هناك session، تحقق من حالة المستخدم
  if (session && !isAdmin) {
    try {
      const supabase = createMiddlewareClient({ req: request, res })
      // Get user data including subscription status
      const { data: userData } = await supabase
        .from('users')
        .select('status, role, subscription_status')
        .eq('id', session.user.id)
        .single()
      
      console.log('User data:', userData);

      // إذا كان المستخدم في انتظار الموافقة
      if (userData?.status === 'pending') {
        if (request.nextUrl.pathname !== '/waiting-approval' && !isPublicPath) {
          return NextResponse.redirect(new URL('/waiting-approval', request.url))
        }
      }

      // إذا كان المستخدم مرفوض أو محظور
      if (userData?.status === 'rejected' || userData?.status === 'banned') {
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // منع الوصول للأدمن من غير المصرح لهم
      if (request.nextUrl.pathname.startsWith('/admin') && userData?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // التحقق من حالة الاشتراك: أي صفحة غير عامة وغير صفحة الباقات/الانتظار تحتاج اشتراك فعّال
      const isSubscriptionPage = request.nextUrl.pathname.startsWith('/subscription')
      const isWaitingPage = request.nextUrl.pathname.startsWith('/waiting-approval')
      const isAllowedWithoutSub = isPublicPath || isSubscriptionPage || isWaitingPage
      const isProtectedPath = !isAllowedWithoutSub

      if (isProtectedPath && userData?.subscription_status !== 'active') {
        console.log('Subscription check failed - redirecting to subscription with warning');
        const url = new URL('/subscription', request.url)
        url.searchParams.set('warn', '1')
        return NextResponse.redirect(url)
      }
    } catch (dbError) {
      console.error('Error checking user status:', dbError);
      // في حالة الخطأ، السماح بالمتابعة لتجنب تعطيل المستخدمين
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
