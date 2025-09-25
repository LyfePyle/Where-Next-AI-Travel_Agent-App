import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

// Mock fetch globally
global.fetch = jest.fn()

// Polyfill Web APIs for Node environment (don't override if they exist)
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(url, options = {}) {
      Object.defineProperty(this, 'url', { value: url, writable: false })
      this.method = options.method || 'GET'
      this.headers = options.headers || {}
      this.body = options.body
    }
    async json() {
      return JSON.parse(this.body || '{}')
    }
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, options = {}) {
      this.body = body
      this.status = options.status || 200
      this.statusText = options.statusText || 'OK'
      this.headers = options.headers || {}
    }
    async json() {
      return JSON.parse(this.body || '{}')
    }
  }
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this.headers = init
    }
    get(name) {
      return this.headers[name]
    }
    set(name, value) {
      this.headers[name] = value
    }
  }
}

