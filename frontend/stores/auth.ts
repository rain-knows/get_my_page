import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '' as string,
    userId: '' as string,
  }),
  actions: {
    setAuth(token: string, userId: string) {
      this.token = token
      this.userId = userId
    },
    clearAuth() {
      this.token = ''
      this.userId = ''
    },
  },
  persist: false,
})
