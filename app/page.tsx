import { redirect } from 'next/navigation'

export default function Home() {
  // Le middleware gère la redirection automatiquement
  // Cette page ne devrait jamais être affichée
  redirect('/login')
}