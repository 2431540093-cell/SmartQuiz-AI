import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://127.0.0.1:5000',
      '/documents': 'http://127.0.0.1:5000',
      '/upload-pdf': 'http://127.0.0.1:5000',
      '/ask-document': 'http://127.0.0.1:5000',
      '/chat-history': 'http://127.0.0.1:5000',
      '/generate-quiz': 'http://127.0.0.1:5000',
      '/quiz-results': 'http://127.0.0.1:5000',
      '/profile': 'http://127.0.0.1:5000',
    }
  }
})
