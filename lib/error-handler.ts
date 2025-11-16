import { NextResponse } from 'next/server';

/**
 * أنواع رموز الأخطاء المختلفة في النظام
 */
export enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SERVER_ERROR = 'SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  FILE_ERROR = 'FILE_ERROR',
}

/**
 * وصف رموز الأخطاء بالعربية
 */
const errorMessages = {
  [ErrorCodes.VALIDATION_ERROR]: 'خطأ في التحقق من صحة البيانات',
  [ErrorCodes.NOT_FOUND]: 'العنصر المطلوب غير موجود',
  [ErrorCodes.UNAUTHORIZED]: 'غير مصرح لك بالوصول',
  [ErrorCodes.FORBIDDEN]: 'لا تملك صلاحية للقيام بهذا الإجراء',
  [ErrorCodes.SERVER_ERROR]: 'خطأ في الخادم',
  [ErrorCodes.DATABASE_ERROR]: 'خطأ في قاعدة البيانات',
  [ErrorCodes.AUTH_ERROR]: 'خطأ في المصادقة',
  [ErrorCodes.PAYMENT_ERROR]: 'خطأ في عملية الدفع',
  [ErrorCodes.FILE_ERROR]: 'خطأ في معالجة الملف',
};

/**
 * مخطط رموز الحالة HTTP المقابلة لأنواع الأخطاء
 */
const statusCodes = {
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.SERVER_ERROR]: 500,
  [ErrorCodes.DATABASE_ERROR]: 500,
  [ErrorCodes.AUTH_ERROR]: 401,
  [ErrorCodes.PAYMENT_ERROR]: 400,
  [ErrorCodes.FILE_ERROR]: 400,
};

interface ErrorResponseOptions {
  details?: any;
  customMessage?: string;
  logError?: boolean;
}

/**
 * دالة موحدة لمعالجة الأخطاء وإنشاء استجابة خطأ
 * @param code رمز الخطأ
 * @param options خيارات إضافية للخطأ
 * @returns استجابة NextResponse
 */
export function errorResponse(code: ErrorCodes, options: ErrorResponseOptions = {}) {
  const { details, customMessage, logError = true } = options;
  
  // تسجيل الخطأ في وحدة التحكم إذا كان مطلوباً
  if (logError) {
    console.error(`[ERROR] ${code}:`, customMessage || errorMessages[code], details || '');
  }
  
  // إنشاء كائن الاستجابة
  const responseBody = {
    success: false,
    error: code,
    message: customMessage || errorMessages[code],
    ...(details && { details }),
  };
  
  // إرجاع استجابة NextResponse مع رمز الحالة المناسب
  return NextResponse.json(responseBody, { 
    status: statusCodes[code] || 500 
  });
}

/**
 * دالة موحدة لإنشاء استجابة نجاح
 * @param data البيانات المراد إرجاعها
 * @param message رسالة النجاح الاختيارية
 * @returns استجابة NextResponse
 */
export function successResponse(data: any, message?: string) {
  return NextResponse.json({
    success: true,
    message: message || 'تمت العملية بنجاح',
    ...data
  });
}

/**
 * دالة مساعدة للتحقق من وجود المستخدم وإرجاع خطأ مناسب إذا لم يكن موجوداً
 * @param user كائن المستخدم
 * @param customMessage رسالة خطأ مخصصة اختيارية
 * @returns استجابة خطأ أو null
 */
export function validateUser(user: any, customMessage?: string) {
  if (!user || !user.id) {
    return errorResponse(ErrorCodes.UNAUTHORIZED, {
      customMessage: customMessage || 'يرجى تسجيل الدخول للمتابعة'
    });
  }
  return null;
}
