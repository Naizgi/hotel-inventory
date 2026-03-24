// store/auth.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import AuthService from '../services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('authToken') || null)
  const user = ref(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || null)
  const userName = computed(() => user.value?.name || user.value?.username || 'User')
  const userId = computed(() => user.value?.id || null)

  const initializeAuth = async () => {
    if (token.value && !user.value) {
      try {
        loading.value = true
        const userData = await AuthService.getCurrentUser()
        user.value = userData
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        logout()
      } finally {
        loading.value = false
      }
    } else if (localStorage.getItem('userData')) {
      try {
        user.value = JSON.parse(localStorage.getItem('userData'))
      } catch (error) {
        console.error('Failed to parse user data:', error)
        logout()
      }
    }
  }

  const setAuth = (accessToken, userData) => {
    token.value = accessToken
    user.value = userData
    localStorage.setItem('authToken', accessToken)
    localStorage.setItem('userData', JSON.stringify(userData))
  }

  const logout = () => {
    token.value = null
    user.value = null
    AuthService.logout()
  }

  const updateUser = (userData) => {
    user.value = { ...user.value, ...userData }
    localStorage.setItem('userData', JSON.stringify(user.value))
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    userRole,
    userName,
    userId,
    initializeAuth,
    setAuth,
    logout,
    updateUser
  }
})