import { redirect } from 'next/navigation'

export default function HomePage() {
  // Landing page'e yönlendir (locale olmadan)
  redirect('/landing')
}
