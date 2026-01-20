-- Legal Documents Table for TacticIQ
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

-- Tablo oluşturma
CREATE TABLE IF NOT EXISTS public.legal_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id TEXT NOT NULL,  -- 'terms', 'privacy', 'cookies', 'kvkk', 'consent', 'sales', 'copyright'
    language TEXT NOT NULL DEFAULT 'tr',  -- 'tr', 'en', 'de', 'fr', 'es', 'it', 'ar', 'zh'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: aynı belge türü ve dil kombinasyonu tekrar edemez
ALTER TABLE public.legal_documents 
ADD CONSTRAINT unique_document_language UNIQUE (document_id, language);

-- RLS (Row Level Security) politikaları
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (public read)
CREATE POLICY "Legal documents are publicly readable" 
ON public.legal_documents 
FOR SELECT 
TO public 
USING (true);

-- Sadece authenticated kullanıcılar yazabilir (admin için)
CREATE POLICY "Admin can insert legal documents" 
ON public.legal_documents 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Admin can update legal documents" 
ON public.legal_documents 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Admin can delete legal documents" 
ON public.legal_documents 
FOR DELETE 
TO authenticated 
USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_legal_documents_updated_at
    BEFORE UPDATE ON public.legal_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_legal_documents_document_id ON public.legal_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_language ON public.legal_documents(language);
CREATE INDEX IF NOT EXISTS idx_legal_documents_enabled ON public.legal_documents(enabled);

-- Örnek veri (opsiyonel - gerekirse ekleyin)
-- INSERT INTO public.legal_documents (document_id, language, title, content, enabled) VALUES
-- ('terms', 'tr', 'Kullanım Koşulları', 'Kullanım koşulları içeriği...', true),
-- ('privacy', 'tr', 'Gizlilik Politikası', 'Gizlilik politikası içeriği...', true);

COMMENT ON TABLE public.legal_documents IS 'TacticIQ yasal belgeleri - Web ve Mobil uygulama için';
COMMENT ON COLUMN public.legal_documents.document_id IS 'Belge türü: terms, privacy, cookies, kvkk, consent, sales, copyright';
COMMENT ON COLUMN public.legal_documents.language IS 'Dil kodu: tr, en, de, fr, es, it, ar, zh';
