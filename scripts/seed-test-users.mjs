// Cria participantes de teste pelo fluxo normal de cadastro (signUp) + livros.
// Uso: node --env-file=.env scripts/seed-test-users.mjs [quantidade] [--sem-livros=N]
// Todos usam email teste<N>@example.com e senha "teste123".
// Limpeza (SQL Editor):  delete from auth.users where email like 'teste%@example.com';
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env')

const count = Number(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 10)
const noBooksArg = process.argv.find((a) => a.startsWith('--sem-livros='))
const noBooks = noBooksArg ? Number(noBooksArg.split('=')[1]) : 1 // últimos N ficam sem livros

const nomes = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabi', 'Hugo', 'Iara', 'João', 'Karen', 'Lucas']
const livros = [
  ['Dom Casmurro', 'Machado de Assis'],
  ['O Hobbit', 'J.R.R. Tolkien'],
  ['1984', 'George Orwell'],
  ['Sapiens', 'Yuval Noah Harari'],
  ['Grande Sertão: Veredas', 'Guimarães Rosa'],
  ['A Hora da Estrela', 'Clarice Lispector'],
  ['Duna', 'Frank Herbert'],
  ['O Alquimista', 'Paulo Coelho'],
  ['Capitães da Areia', 'Jorge Amado'],
]

for (let i = 1; i <= count; i++) {
  const sb = createClient(url, key, { auth: { persistSession: false } })
  const email = `teste${i}@example.com`
  const name = `${nomes[(i - 1) % nomes.length]} Teste`
  const { data, error } = await sb.auth.signUp({
    email,
    password: 'teste123',
    options: { data: { name } },
  })
  if (error) {
    console.log(`✗ ${email}: ${error.message}`)
    continue
  }
  if (!data.session) {
    console.log(`✗ ${email}: sem sessão (desligue "Confirm email" no Supabase)`)
    continue
  }
  const comLivros = i <= count - noBooks
  let n = 0
  if (comLivros) {
    n = 1 + (i % 3) // 1 a 3 livros
    for (let k = 0; k < n; k++) {
      const [title, author] = livros[(i + k) % livros.length]
      const { error: e } = await sb.from('books').insert({
        user_id: data.user.id,
        title,
        author,
        link: k === 0 ? 'https://www.google.com/search?q=' + encodeURIComponent(title) : null,
      })
      if (e) console.log(`  livro falhou: ${e.message}`)
    }
  }
  console.log(`✓ ${email} (${name}) — ${n} livros`)
}
console.log('\nSenha de todos: teste123')
