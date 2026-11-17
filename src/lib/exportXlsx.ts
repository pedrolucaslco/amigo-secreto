import * as XLSX from 'xlsx'
import type { Book, Profile } from './supabase'

export function exportXlsx(people: Profile[], books: Book[], draw: { giver_id: string; receiver_id: string }[]) {
  const name = (id: string) => people.find((p) => p.id === id)?.name ?? id

  const participantes = people.map((p) => {
    const mine = books.filter((b) => b.user_id === p.id)
    return {
      Nome: p.name,
      Email: p.email,
      'Qtd. livros': mine.length,
      'Livro surpresa': p.surprise ? 'Sim' : 'Não',
      Status: mine.length === 0 && !p.surprise ? 'FALTA CADASTRAR' : 'OK',
    }
  })

  const livros = books.map((b) => ({
    Pessoa: name(b.user_id),
    Livro: b.title,
    Autor: b.author,
    Link: b.link ?? '',
  }))

  const sorteio = draw.map((d) => ({
    Quem: name(d.giver_id),
    'Tirou': name(d.receiver_id),
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(participantes), 'Participantes')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(livros), 'Livros')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sorteio), 'Sorteio')
  XLSX.writeFile(wb, 'amigo-secreto.xlsx')
}
