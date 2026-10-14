import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    build: {
      rolldownOptions: {
        output: {
          // Bibliotecas em arquivos proprios: mudam raramente, entao o navegador
          // as reaproveita do cache entre um deploy e outro e so baixa de novo o
          // codigo do site, que e o que muda.
          codeSplitting: {
            groups: [
              // Analytics fica de fora: e carregado depois, sob demanda (firebase.ts).
              {
                name: 'firebase',
                test: /node_modules[\\/](@firebase|firebase)[\\/](?!analytics|installations)/,
              },
              { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            ],
          },
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        // As funcoes de api/ so existem na Vercel; o servidor do Vite nao as executa.
        // Sem este proxy, /api sempre daria 404 no localhost e o ranking nunca
        // atualizaria em desenvolvimento. Aponta para o site publicado, que usa o
        // mesmo projeto Firebase que o localhost ja acessa.
        '/api': {
          changeOrigin: true,
          secure: true,
          target: env.VITE_API_PROXY_TARGET || 'https://bolao-virid.vercel.app',
        },
      },
    },
  }
})
