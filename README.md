# 🌸 Rosa em Alerta — Informação, Cuidado e Prevenção

> **Projeto Desenvolvido para o Hackathon Escolar • Campanha Outubro Rosa**  
> *Foco: Nota Máxima — Design Editorial de Luxo, Rigor Científico do INCA, Quiz Interativo, Ranking Escolar com Banco de Dados e Agente de IA (Gemini).*

---

## 💎 Identidade Visual & Conceito
O projeto **Rosa em Alerta** foi concebido sob a estética de um **editorial de luxo feminino** (inspirado em publicações como *Vogue* e *Harper's Bazaar* mesclado à usabilidade de portais modernos de saúde pública).

- **Paleta de Cores:** Rosa Blush, Seda, Vinho Imperial Profundo (`#4A072B`), nuances de Ouro Champagne (`#D4AF37`) e contrastes acessíveis.
- **Tipografia Refinada:** *Playfair Display* (Serifa editorial clássica) aliada a *Plus Jakarta Sans* (Clareza e modernidade na leitura de dados) e *Caveat* (Assinatura manuscrita acolhedora).
- **100% Responsivo:** Design móvel sem qualquer falha ou quebra horizontal, com drawer touch, cartões colapsáveis e pódio responsivo para smartphones e computadores.

---

## 📊 Pesquisa e Dados Oficiais Integrados (INCA)
Todos os dados e conteúdos do portal são rigorosamente citados com ano de referência, órgão emissor e link da fonte original:

| Dado Epidemiológico | Valor Oficial | Período / Ano | Fonte Verificada |
| :--- | :--- | :--- | :--- |
| **Casos novos estimados por ano** | **78.610 casos** | Triênio 2026–2028 | [INCA — Estimativa Oficial](https://www.gov.br/inca/pt-br/assuntos/cancer/numeros/estimativa/sintese-de-resultados-e-comentarios) |
| **Risco estimado de incidência** | **71,57 por 100 mil mulheres** | Triênio 2026–2028 | [INCA — Estimativa](https://www.gov.br/inca/pt-br/assuntos/cancer/numeros/estimativa/sintese-de-resultados-e-comentarios) |
| **Participação entre os cânceres femininos** | **30,0% dos novos casos** | Triênio 2026–2028 | [INCA — Introdução](https://www.gov.br/inca/pt-br/assuntos/cancer/numeros/estimativa/introducao) |
| **Posição entre cânceres em mulheres** | **1º lugar mais incidente** | Triênio 2026–2028 | [INCA / RBC](https://rbc.inca.gov.br) |
| **Óbitos registrados no Brasil** | **20.165 mortes** | Ano 2023 | [INCA / SIM](https://www.gov.br/inca/pt-br/assuntos/cancer/numeros/estimativa/sintese-de-resultados-e-comentarios) |
| **Taxa ajustada de mortalidade** | **11,71 por 100 mil mulheres** | 2021 | [INCA / Relatório Técnico](https://www.inca.gov.br) |
| **Potencial de prevenção por hábitos** | **Cerca de 28% dos casos** | 2026 | [Informe Técnico INCA](https://ninho.inca.gov.br) |
| **Rastreamento populacional no SUS** | **Bienal (50 a 74 anos assintomáticas)** | Vigente | Ministério da Saúde / INCA |

---

## 🚀 Funcionalidades Principais

### 1. 📖 Página Institucional Editorial
- Banner Hero de Alto Padrão com estatísticas instantâneas e arte vetorial personalizada.
- Quatro eixos essenciais: **Prevenção**, **Sinais de Alerta**, **Cuidados &amp; SUS** e **Fontes Confiáveis**.
- Guia de estilo de vida com separação clara entre **fatores modificáveis** e **não modificáveis**, com linguagem empática que jamais culpa a paciente.
- Infográfico interativo dos **6 sinais de alerta** clínicos que exigem avaliação médica.
- Orientações transparentes sobre a mamografia no **Sistema Único de Saúde (SUS)**.

### 2. 🧠 Quiz Interativo com Validação no Servidor
- 10 perguntas científicas calibradas diretamente a partir das estatísticas e relatórios do INCA.
- Correção calculada exclusivamente no backend via endpoint `POST /api/quiz/validate` (impedindo manipulação de notas no navegador).
- Feedback sonoro sintético suave via **Web Audio API** (sem necessidade de arquivos MP3 pesados).
- Explicação científica e link para a fonte oficial exibidos logo após cada alternativa.
- Efeito de celebração com **Confetti em Canvas** e apuração final de acertos e percentual.

### 3. 🏆 Banco de Dados &amp; Ranking Escolar Completo
- Pódio dos Campeões (1º, 2º e 3º lugares) com medalhas, coroas e halos de destaque.
- Diferenciação precisa de perfis:
  - **Aluno(a):** Identificação destacada da **Sala / Turma** (Ex: *3º Ano A - Informática*, *2º Ano B*, etc.).
  - **Professor(a):** Identificação de docente e disciplina.
- Filtros em tempo real:
  - *Todos os Participantes*
  - *Apenas Alunos*
  - *Apenas Professores*
- Busca textual instantânea por nome ou turma.
- **Exportação de Relatório CSV** em 1 clique para a coordenação pedagógica da escola.
- Modelagem Relacional completa em `database/schema.sql` e seeds em `database/seed.sql`.

### 4. 🤖 Agente de IA "Dra. Rosa" (Google Gemini)
- Botão flutuante estilizado com animação pulsante.
- Conexão configurada para a API do **Gemini 1.5 Flash** usando a chave fornecida.
- **Motor Especializado de Contingência (Fallback Inteligente):** Garante respostas imediatas, acolhedoras e fundamentadas no INCA mesmo se a máquina estiver offline ou a cota do Gemini oscilar durante a avaliação dos jurados.
- Chips de perguntas frequentes para navegação rápida.
- Recurso de **Acessibilidade por Leitura de Voz** (Web SpeechSynthesis API).

### 5. 💬 Comunidade &amp; Mural Escolar de Apoio
- Fórum onde estudantes e professores compartilham relatos, dúvidas educativas e mensagens de solidariedade.
- Sistema de curtidas (`POST /api/community/:id/like`).
- Aviso permanente de responsabilidade médica lembrando que o site não substitui a consulta clínica.

---

## 📂 Arquitetura do Repositório

```
fastqiz/
├── database/
│   ├── schema.sql           # DDL Relacional completo (MySQL / MariaDB / SQLite)
│   ├── seed.sql             # Carga inicial com alunos, professores e conteúdos
│   └── database.js          # Motor transacional e persistência atômica
├── data/
│   ├── questions.json       # 10 questões oficiais do Quiz
│   ├── ranking.json         # Base persistente do Leaderboard Escolar
│   └── community.json       # Base de postagens do Mural de Apoio
├── public/
│   ├── index.html           # Interface editorial ultra moderna
│   ├── css/
│   │   ├── style.css        # Design system luxo, tipografia e responsividade
│   │   ├── quiz.css         # Estilos da gamificação e formulário de inscrição
│   │   ├── ranking.css      # Pódio, tabela de líderes e filtros escolares
│   │   └── chat.css         # Widget flutuante da Dra. Rosa IA
│   ├── js/
│   │   ├── main.js          # Contadores do INCA, navegação suave e menu mobile
│   │   ├── quiz.js          # Lógica do Quiz, Web Audio e Confetti Canvas
│   │   ├── ranking.js       # Pódio dinâmico, busca, filtros e exportador CSV
│   │   ├── community.js     # Mural de solidariedade e curtidas
│   │   └── chat.js          # Integração Gemini / Assistente Dra. Rosa
│   └── assets/
│       ├── logo.svg         # Logotipo vetorial do laço rosa
│       ├── hero-art.svg     # Ilustração editorial feminina de alta costura
│       └── mockup_reference.jpg
├── server.js                # API REST Node.js / Express
├── package.json             # Dependências e scripts
├── .env.example             # Configurações de ambiente
└── README.md                # Este documento de apresentação
```

---

## 👥 Equipe Desenvolvedora (Equipe Roxa)
* **Desenvolvedores:** Rafael Mendes, Caio Caetano, Gabriel Coleto e Pablo Pereira
* **UI / UX Designer:** Gustavo
* **Pesquisadora Científica:** Talitta
* **Observação de Participação:** Fabricio não contribuiu.

---

## ⚡ Como Executar o Projeto

### Pré-requisitos
- **Node.js** (v18+) instalado.

### Passo a passo Local
1. Clone este repositório ou navegue até a pasta:
   ```bash
   cd fastquiz
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor:
   ```bash
   npm start
   ```
4. Abra no seu navegador:
   ```
   http://localhost:3000
   ```

---

## ☁️ Deploy na Vercel com Banco de Dados no Supabase

### 1. Criar o Banco no Supabase (PostgreSQL)
1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. Abra o menu **SQL Editor** no painel do Supabase.
3. Copie todo o conteúdo do arquivo [`database/supabase_schema.sql`](database/supabase_schema.sql) e clique em **Run**.
4. Suas tabelas `ranking_escolar` e `comunidade_posts` serão criadas com RLS configurado e prontas para uso real!

### 2. Configurar Variáveis de Ambiente na Vercel
Nas configurações do seu projeto na Vercel (**Settings > Environment Variables**), adicione:
- `SUPABASE_URL`: `https://seu-projeto.supabase.co`
- `SUPABASE_ANON_KEY`: `sua-chave-anon-publica-do-supabase`
- `GEMINI_API_KEY`: `sua-chave-api-gemini-aqui`

O arquivo `vercel.json` já está configurado na raiz para servir a aplicação automaticamente na Vercel.

---

## 👩‍⚕️ Nota de Responsabilidade Médica
*O Rosa em Alerta é uma iniciativa estritamente pedagógica e de conscientização comunitária. As informações contidas nele são baseadas em diretrizes públicas oficiais do INCA e do Ministério da Saúde do Brasil e não substituem exames diagnósticos nem a avaliação médica presencial.*

**Desenvolvido com excelência para o Hackathon Escolar.**
