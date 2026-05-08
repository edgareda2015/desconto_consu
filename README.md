# Portal de Descontos Acadêmicos — UNINASSAU Olinda

Sistema ERP SaaS para gestão de fluxos de descontos acadêmicos.

## 🚀 Tecnologias

- **Frontend**: React + Vite + TypeScript
- **Auth**: Clerk (ClerkProvider)
- **Database**: Supabase (PostgreSQL + RLS)
- **Design**: Vanilla CSS (baseado no projeto_real.html)

## ⚙️ Configuração

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o arquivo `.env` com as seguintes variáveis:
   ```env
   VITE_SUPABASE_URL=https://jnujinqtjcuebzrqknqf.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
   VITE_CLERK_PUBLISHABLE_KEY=sua_chave_clerk_aqui
   ```
4. Configure os metadados do usuário no Clerk Dashboard:
   - Adicione `role` (`admin`, `diretor`, `coordenador` ou `comercial`) em `publicMetadata`.

## 🛠️ Fluxo de Trabalho

1. **Comercial**: Cria a solicitação (Status: `Aguardando análise`).
2. **Diretor**: Baixa os blocos (PDF/Excel), revisa e confirma o retorno (Status: `Liberado para coordenação`).
3. **Coordenador**: Abre chamado (Status: `Chamado aberto`) e defere/indefere o pedido.
4. **Comercial (Ajuste)**: Caso seja indeferido, o comercial pode clicar em "Ajustar" para voltar o pedido para a fila de análise.

## 📦 Estrutura do Banco

- `cursos`: Catálogo de cursos.
- `solicitacoes`: Registro central dos pedidos e status.
- `blocos`: Gestão de lotes de análise semanal do diretor.
- `storage/comprovantes`: Armazenamento de termos e deferimentos.

## 🏃 Executando

```bash
npm run dev
```
