export default defineNuxtConfig({
  ssr: false,
  modules: ['@pinia/nuxt', '@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api',
    },
  },
  compatibilityDate: '2026-04-02',
})
