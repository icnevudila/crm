'use client'

import React from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function Footer() {
  const locale = useLocale()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 py-6 px-4 mt-auto">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Sol: Copyright */}
          <div className="text-sm text-gray-600">
            © {currentYear} <span className="font-semibold text-indigo-600">CRM Enterprise</span>. Tüm hakları saklıdır.
          </div>

          {/* Sağ: Footer Links */}
          <div className="flex items-center gap-6">
            <Link
              href={`/${locale}/about`}
              className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Hakkımızda
            </Link>
            <Link
              href={`/${locale}/terms`}
              className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Kullanım Şartları
            </Link>
            <Link
              href={`/${locale}/privacy`}
              className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Gizlilik Politikası
            </Link>
            <Link
              href={`/${locale}/help`}
              className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Yardım
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}






















