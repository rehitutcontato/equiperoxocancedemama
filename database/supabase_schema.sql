-- ============================================================
-- PROJETO OUTUBRO ROSA: ROSA EM ALERTA (EQUIPE ROXA)
-- SCRIPT SQL OFICIAL PARA O SUPABASE (PostgreSQL)
-- Cole diretamente no "SQL Editor" do painel do seu Supabase
-- ============================================================

-- 1. EXTENSÃO UUID (Geralmente ativa por padrão no Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE RANKING ESCOLAR
DROP TABLE IF EXISTS ranking_escolar CASCADE;
CREATE TABLE ranking_escolar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ALUNO', 'PROFESSOR')),
    turma TEXT, -- Obrigatório para Alunos (Ex: '3º Ano A - Informática')
    pontos INTEGER NOT NULL DEFAULT 0,
    acertos INTEGER NOT NULL DEFAULT 0,
    total_perguntas INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para ordenação rápida do Pódio
CREATE INDEX idx_ranking_pontos ON ranking_escolar(pontos DESC, acertos DESC, created_at ASC);
CREATE INDEX idx_ranking_role ON ranking_escolar(role);

-- 3. TABELA DE COMUNIDADE / MURAL ESCOLAR
DROP TABLE IF EXISTS comunidade_posts CASCADE;
CREATE TABLE comunidade_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    autor_nome TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ALUNO', 'PROFESSOR')),
    turma TEXT,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    categoria TEXT DEFAULT 'CONSCIENTIZACAO' CHECK (categoria IN ('CONSCIENTIZACAO', 'APOIO', 'DUVIDA')),
    curtidas INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. POLÍTICAS DE ACESSO PÚBLICO (ROW LEVEL SECURITY - RLS)
-- Permite leitura e escrita públicas para o Hackathon (sem exigir autenticação complexa)
ALTER TABLE ranking_escolar ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidade_posts ENABLE ROW LEVEL SECURITY;

-- Políticas para ranking_escolar
CREATE POLICY "Permitir leitura publica do ranking" 
ON ranking_escolar FOR SELECT 
USING (true);

CREATE POLICY "Permitir insercao publica de pontuacao" 
ON ranking_escolar FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualizacao de pontuacao" 
ON ranking_escolar FOR UPDATE 
USING (true);

-- Políticas para comunidade_posts
CREATE POLICY "Permitir leitura publica de posts" 
ON comunidade_posts FOR SELECT 
USING (true);

CREATE POLICY "Permitir criacao publica de posts" 
ON comunidade_posts FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir curtidas em posts" 
ON comunidade_posts FOR UPDATE 
USING (true);

-- ============================================================
-- DADOS ZERADOS / RESETADOS: O banco começa limpo para a sua escola!
-- Caso deseje adicionar dados de teste no Supabase, execute o bloco abaixo opcionalmente:
-- ============================================================
/*
INSERT INTO ranking_escolar (nome, role, turma, pontos, acertos, total_perguntas) VALUES
('Exemplo Estudante', 'ALUNO', '3º Ano A', 250, 10, 10),
('Exemplo Professor', 'PROFESSOR', 'Docente - Biologia', 225, 9, 10);
*/
