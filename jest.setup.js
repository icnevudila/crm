// Jest test setup dosyası
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key) => key,
  useLocale: () => 'tr',
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        companyId: 'test-company-id',
        role: 'ADMIN',
      },
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock SWR
jest.mock('swr', () => ({
  default: jest.fn(() => ({
    data: undefined,
    error: undefined,
    isLoading: false,
    mutate: jest.fn(),
  })),
  mutate: jest.fn(),
}))



