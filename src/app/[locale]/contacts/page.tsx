import { Metadata } from 'next'
import ContactList from '@/components/contacts/ContactList'

export const metadata: Metadata = {
  title: 'Contacts | CRM',
  description: 'Müşteri firma yetkilileri ve iletişim kişileri yönetimi',
}

export default function ContactsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <ContactList />
    </div>
  )
}



