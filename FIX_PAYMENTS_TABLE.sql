-- إضافة عمود receipt_url إلى جدول payments

-- التحقق من وجود جدول payments
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
        -- إضافة العمود إذا لم يكن موجوداً
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'receipt_url') THEN
            ALTER TABLE public.payments ADD COLUMN receipt_url TEXT;
            RAISE NOTICE 'تمت إضافة عمود receipt_url إلى جدول payments';
        ELSE
            RAISE NOTICE 'عمود receipt_url موجود بالفعل في جدول payments';
        END IF;
    ELSE
        -- إنشاء جدول payments إذا لم يكن موجوداً
        CREATE TABLE public.payments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES public.users(id),
            amount INTEGER NOT NULL,
            payment_method TEXT,
            receipt_url TEXT,
            status TEXT DEFAULT 'pending',
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'تم إنشاء جدول payments مع عمود receipt_url';
    END IF;
END$$;

-- إنشاء الفهارس اللازمة
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- نقل البيانات من جدول المستخدمين إذا كان هناك بيانات إيصال دفع
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns 
              WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'payment_proof_url') THEN
        UPDATE public.payments p
        SET receipt_url = u.payment_proof_url
        FROM public.users u
        WHERE p.user_id = u.id AND p.receipt_url IS NULL AND u.payment_proof_url IS NOT NULL;
        
        RAISE NOTICE 'تم نقل بيانات الإيصالات من جدول المستخدمين';
    END IF;
END$$;

-- إعادة تحميل مخطط قاعدة البيانات
SELECT pg_reload_conf();
