import api from './api'

class AuthService {
  /**
   * Login user
   * @param {Object} credentials - { username, password }
   * @returns {Promise}
   */
  async login(credentials) {
    try {
      // First, login to get token
      const loginResponse = await api.post('/auth/login', credentials)
      
      if (loginResponse.data.access_token) {
        const token = loginResponse.data.access_token
        localStorage.setItem('authToken', token)
        
        // Now fetch user data using the token
        const userData = await this.getCurrentUser()
        localStorage.setItem('userData', JSON.stringify(userData))
        
        return userData
      }
      
      throw new Error('No access token received')
    } catch (error) {
      console.error('Login error:', error)
      throw error.response?.data || { detail: 'Login failed' }
    }
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    localStorage.removeItem('rememberMe')
    localStorage.removeItem('savedUsername')
  }

  /**
   * Get current logged in user
   * @returns {Promise}
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me')
      return response.data
    } catch (error) {
      console.error('Get current user error:', error)
      throw error.response?.data || { detail: 'Failed to get user data' }
    }
  }

  /**
   * Change password
   * @param {Object} passwordData - { current_password, new_password }
   * @returns {Promise}
   */
  async changePassword(passwordData) {
    try {
      const response = await api.post('/auth/change-password', passwordData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to change password' }
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem('authToken')
  }

  /**
   * Get user data from localStorage
   * @returns {Object|null}
   */
  getUserData() {
    const userData = localStorage.getItem('userData')
    return userData ? JSON.parse(userData) : null
  }

  /**
   * Save username for remember me
   * @param {string} username
   */
  saveUsername(username) {
    localStorage.setItem('savedUsername', username)
  }

  /**
   * Get saved username
   * @returns {string|null}
   */
  getSavedUsername() {
    return localStorage.getItem('savedUsername')
  }
}

export default new AuthService()