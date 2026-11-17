# 📚 Amigo Secreto de Livros

App mobile-first para um amigo secreto de livros. Cada participante se cadastra, sugere até 3 livros e, depois do sorteio, descobre quem tirou e o que essa pessoa gostaria de ganhar. O admin acompanha tudo e exporta uma planilha.

**Stack:** Vite + React + TypeScript · Supabase (Auth, Postgres, RLS) · GitHub Pages

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev            # http://localhost:5173/amigo-secreto/
```

## Supabase

1. Crie um projeto e rode `supabase/schema.sql` no SQL Editor.
2. Em Authentication → Providers → Email, desligue **Confirm email**.
3. Cadastre-se pelo app e promova sua conta a admin:
   ```sql
   update public.profiles set is_admin = true where email = 'SEU_EMAIL';
   ```
4. Em Authentication → URL Configuration, defina a **Site URL** com a URL do GitHub Pages.

## Deploy (GitHub Pages)

1. Em Settings → Secrets and variables → Actions, crie `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
2. Em Settings → Pages, escolha **Source: GitHub Actions**.
3. Todo push na `main` publica via `.github/workflows/deploy.yml`.

O `base` do Vite (`/amigo-secreto/`) precisa coincidir com o nome do repositório.

## Livro surpresa

Na aba **Livros**, o participante pode marcar "Quero um livro surpresa" (sozinho ou junto de livros sugeridos). Conta como cadastro completo e quem tirou a pessoa vê o aviso em "Meu amigo". Requer a coluna `profiles.surprise` e a função `set_surprise` do `schema.sql`.

## Esqueci a senha

Não há reset por email. O admin abre o Painel, toca em **Redefinir senha** no card da pessoa, copia a senha temporária e a envia em privado. A pessoa entra e define uma nova na aba **Conta**. Requer a função `admin_reset_password` do `schema.sql` no banco.

## Dados de teste

```bash
node --env-file=.env scripts/seed-test-users.mjs 10
```

Cria `teste1..N@example.com` (senha `teste123`). Para limpar:

```sql
delete from auth.users where email like 'teste%@example.com';
delete from public.draw where true;
update public.settings set draw_done = false where id = 1;
```

## Segurança

A anon key vai no bundle por design; quem protege os dados são as policies RLS do `schema.sql`. Nunca use a `service_role` key no front.
