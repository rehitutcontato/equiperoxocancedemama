-- ============================================================
-- PROJETO OUTUBRO ROSA: ROSA EM ALERTA
-- SEED OFICIAL COM DADOS DO INCA E PARTICIPANTES ESCOLARES
-- ============================================================

-- INSERÇÃO DE CONTEÚDOS EDUCATIVOS COM FONTES OFICIAIS
INSERT INTO conteudos_educativos (id, titulo, categoria, corpo, fonte_nome, fonte_url, ano_referencia, data_consulta, revisor, status) VALUES
('cont-01', 'Estimativa de Incidência de Câncer de Mama no Brasil', 'ESTATISTICA', 'No Brasil, o câncer de mama é o tipo de câncer mais frequente entre as mulheres (exceto pele não-melanoma). São estimados 78.610 casos novos por ano no triênio de 2026 a 2028, o que equivale a um risco estimado de 71,57 casos a cada 100 mil mulheres, representando cerca de 30% dos novos diagnósticos femininos.', 'INCA', 'https://www.gov.br/inca/pt-br/assuntos/cancer/numeros/estimativa/sintese-de-resultados-e-comentarios', 'Triênio 2026–2028', '2026-10-21', 'Dra. Silva - Mastologista', 'PUBLICADO'),
('cont-02', 'Mortalidade por Câncer de Mama Feminina no Brasil', 'ESTATISTICA', 'Em 2023, foram registrados 20.165 óbitos por câncer de mama feminina no país, correspondendo a um risco de 18,59 mortes por 100 mil mulheres. Em 2021, a taxa de mortalidade ajustada por idade foi de 11,71 óbitos por 100 mil mulheres.', 'INCA / SIM', 'https://www.gov.br/inca/pt-br/assuntos/cancer/numeros/estimativa/sintese-de-resultados-e-comentarios', '2023', '2026-10-21', 'Coordenação Epidemiológica', 'PUBLICADO'),
('cont-03', 'Prevenção Primária e Hábitos Protetores', 'PREVENCAO', 'A prevenção envolve reduzir fatores de risco modificáveis e manter hábitos protetores. O INCA estima que a prática regular de atividade física, a manutenção do peso corporal saudável e uma alimentação equilibrada podem ajudar a evitar cerca de 28% dos casos de câncer de mama. Amamentar pelo maior tempo possível e evitar álcool e tabaco também são fatores protetores cruciais.', 'INCA', 'https://www.gov.br/inca/pt-br/assuntos/gestor-e-profissional-de-saude/controle-do-cancer-de-mama/acoes/prevencao', '2026', '2026-10-21', 'Equipe Promoção da Saúde', 'PUBLICADO'),
('cont-04', 'Sinais de Alerta e Conhecimento do Corpo', 'SINAIS', 'Sinais suspeitos que necessitam avaliação médica incluem nódulo endurecido ou fixo, alterações na textura da pele como aspecto casca de laranja, retração ou saída espontânea de líquido sanguinolento do mamilo e nódulos nas axilas. A auto-observação serve para conhecer o corpo, mas não substitui exames clínicos periódicos.', 'INCA / OMS', 'https://www.gov.br/inca/pt-br/canais-de-atendimento/imprensa/releases/2025/inca-lanca-publicacao-com-panorama-do-cancer-de-mama-no-brasil', '2025', '2026-10-21', 'Comissão Técnica de Mastologia', 'PUBLICADO'),
('cont-05', 'Diretrizes de Rastreamento Mamográfico no SUS', 'RASTREAMENTO', 'Para mulheres assintomáticas (sem sinais ou sintomas), o Ministério da Saúde orienta rastreamento mamográfico no SUS para mulheres de 50 a 74 anos a cada dois anos. Mulheres de qualquer idade com alterações suspeitas devem buscar avaliação médica imediata para exames diagnósticos.', 'Ministério da Saúde', 'https://linhasdecuidado.saude.gov.br/portal/cancer-de-mama/', '2026', '2026-10-21', 'Departamento de Atenção Primária', 'PUBLICADO');

-- INSERÇÃO DO RANKING INICIAL ESCOLAR (ALUNOS E PROFESSORES)
INSERT INTO ranking_escolar (id, usuario_id, nome, role, turma, pontos_totais, partidas_jogadas, acertos_totais, taxa_precisao, posicao_ranking) VALUES
('rnk-01', 'usr-01', 'Beatriz Albuquerque', 'ALUNO', '3º Ano A - Informática', 250, 1, 10, 100.0, 1),
('rnk-02', 'usr-02', 'Profª Helena Guimarães', 'PROFESSOR', 'Docente - Biologia Geral', 240, 1, 10, 100.0, 2),
('rnk-03', 'usr-03', 'Camila Vasconcelos', 'ALUNO', '3º Ano B - Administração', 220, 1, 9, 90.0, 3),
('rnk-04', 'usr-04', 'Larissa Duarte', 'ALUNO', '2º Ano A - Química', 210, 1, 9, 90.0, 4),
('rnk-05', 'usr-05', 'Prof. Marcelo Siqueira', 'PROFESSOR', 'Docente - Química Orgânica', 200, 1, 9, 90.0, 5),
('rnk-06', 'usr-06', 'Lucas Fernandes', 'ALUNO', '3º Ano A - Informática', 190, 1, 8, 80.0, 6),
('rnk-07', 'usr-07', 'Gabriela Meireles', 'ALUNO', '1º Ano B - Ensino Médio', 180, 1, 8, 80.0, 7),
('rnk-08', 'usr-08', 'Mariana Castilho', 'ALUNO', '2º Ano B - Meio Ambiente', 170, 1, 7, 70.0, 8),
('rnk-09', 'usr-09', 'Profª Mariana Ramos', 'PROFESSOR', 'Docente - Educação Física', 160, 1, 7, 70.0, 9),
('rnk-10', 'usr-10', 'Yasmin Figueiredo', 'ALUNO', '1º Ano A - Ensino Médio', 150, 1, 6, 60.0, 10);

-- MURAL DA COMUNIDADE ESCOLAR
INSERT INTO comunidade_posts (id, usuario_id, autor_nome, role, turma, titulo, mensagem, categoria, curtidas) VALUES
('post-01', 'usr-01', 'Beatriz Albuquerque', 'ALUNO', '3º Ano A - Informática', 'A importância de compartilharmos com nossas mães e avós!', 'Pessoal, achei incrível os dados do INCA sobre o rastreamento aos 50 anos no SUS. Mostrei para a minha mãe e já agendamos o exame dela na UBS!', 'CONSCIENTIZACAO', 28),
('post-02', 'usr-02', 'Profª Helena Guimarães', 'PROFESSOR', 'Docente - Biologia Geral', 'Dica de Biologia: Por que 28% dos casos podem ser prevenidos?', 'Parabéns à equipe pelo projeto! Lembrem-se de que a atividade física reduz inflamações crônicas e regula os níveis de estrogênio, protegendo o tecido celular.', 'APOIO', 35),
('post-03', 'usr-04', 'Larissa Duarte', 'ALUNO', '2º Ano A - Química', 'Auto-observação vs Mamografia: Uma dúvida comum', 'Gostei muito da explicação no quiz de que o autoexame ajuda a conhecer o próprio corpo, mas NUNCA substitui a mamografia de rotina. Super esclarecedor!', 'DUVIDA', 19);
