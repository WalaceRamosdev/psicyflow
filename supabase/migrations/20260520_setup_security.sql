-- ==========================================
-- SCRIPT DE SEGURANÇA E CONFORMIDADE (LGPD) - PSYCHFLOW
-- Execute este script no SQL Editor do seu console Supabase
-- ==========================================

-- 0. ADICIONAR CAMPO DE CHAVE PIX AO PERFIL (para pagamento real)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pix_key TEXT DEFAULT '';

-- 1. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS DE ACESSO PARA TABELA: profiles
-- ==========================================

-- Qualquer pessoa (incluindo portal do paciente) pode ver o perfil público dos psicólogos
CREATE POLICY "Perfis são visíveis publicamente" 
ON profiles FOR SELECT 
USING (true);

-- Apenas o próprio psicólogo autenticado pode atualizar seu perfil
CREATE POLICY "Psicólogos podem atualizar seu próprio perfil" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Apenas o próprio psicólogo autenticado pode inserir seu perfil no registro
CREATE POLICY "Psicólogos podem criar seu próprio perfil" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);


-- ==========================================
-- POLÍTICAS DE ACESSO PARA TABELA: patients
-- ==========================================

-- O psicólogo tem controle total sobre os dados dos seus pacientes
CREATE POLICY "Psicólogos têm controle total de seus pacientes" 
ON patients FOR ALL 
USING (auth.uid() = psychologist_id);

-- O portal do paciente (anon) pode cadastrar novos pacientes durante o agendamento
CREATE POLICY "Permitir cadastro público de pacientes pelo portal" 
ON patients FOR INSERT 
WITH CHECK (true);


-- ==========================================
-- POLÍTICAS DE ACESSO PARA TABELA: appointments
-- ==========================================

-- O psicólogo tem controle total sobre seus agendamentos
CREATE POLICY "Psicólogos têm controle total de suas consultas" 
ON appointments FOR ALL 
USING (auth.uid() = psychologist_id);

-- O portal do paciente (anon) pode agendar consultas
CREATE POLICY "Permitir criação pública de consultas pelo portal" 
ON appointments FOR INSERT 
WITH CHECK (true);


-- ==========================================
-- POLÍTICAS DE ACESSO PARA TABELA: clinical_records
-- ==========================================

-- Apenas o psicólogo autenticado pode visualizar ou alterar seus prontuários clínicos (LGPD)
CREATE POLICY "Acesso exclusivo do psicólogo aos prontuários" 
ON clinical_records FOR ALL 
USING (auth.uid() = psychologist_id);


-- ==========================================
-- POLÍTICAS DE ACESSO PARA TABELA: financial_transactions
-- ==========================================

-- Apenas o psicólogo autenticado pode acessar suas transações financeiras
CREATE POLICY "Acesso exclusivo do psicólogo às transações financeiras" 
ON financial_transactions FOR ALL 
USING (auth.uid() = psychologist_id);


-- ==========================================
-- POLÍTICAS DE ACESSO PARA TABELA: waitlist
-- ==========================================

-- Apenas o psicólogo autenticado pode gerenciar a lista de espera
CREATE POLICY "Acesso exclusivo do psicólogo à lista de espera" 
ON waitlist FOR ALL 
USING (auth.uid() = psychologist_id);


-- ==========================================
-- 2. CRIAÇÃO DA VIEW SEGURA DE AGENDAMENTO (occupied_slots)
-- ==========================================
-- Esta view serve para que o portal do paciente descubra se um horário está ocupado
-- sem nunca vazar nomes de pacientes ou dados clínicos de outras pessoas.

DROP VIEW IF EXISTS occupied_slots;

CREATE VIEW occupied_slots AS
SELECT 
  id,
  psychologist_id,
  date,
  time,
  status
FROM appointments
-- Expondo apenas consultas em estados que bloqueiam a agenda
WHERE status IN ('confirmed', 'pending', 'requested');

-- Conceder permissão de leitura pública à view (para o anon key do portal)
GRANT SELECT ON occupied_slots TO anon, authenticated;
