import api from './api'

class AdminService {
  // ==================== User Management ====================
  
  /**
   * Get all users
   * @returns {Promise}
   */
  async getUsers() {
    try {
      const response = await api.get('/admin/users')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch users' }
    }
  }

  /**
   * Create new user
   * @param {Object} userData - User data
   * @returns {Promise}
   */
  async createUser(userData) {
    try {
      const response = await api.post('/admin/users', userData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create user' }
    }
  }

  /**
   * Update user
   * @param {number} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise}
   */
  async updateUser(userId, userData) {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update user' }
    }
  }

  /**
   * Delete user
   * @param {number} userId - User ID
   * @returns {Promise}
   */
  async deleteUser(userId) {
    try {
      const response = await api.delete(`/admin/users/${userId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to delete user' }
    }
  }

  /**
   * Reset user password
   * @param {number} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise}
   */
  async resetUserPassword(userId, newPassword) {
    try {
      const response = await api.put(`/admin/users/${userId}/password`, null, {
        params: { new_password: newPassword }
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to reset password' }
    }
  }

  // ==================== Item Management ====================
  
  /**
   * Get all items
   * @returns {Promise}
   */
  async getItems() {
    try {
      const response = await api.get('/admin/items')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch items' }
    }
  }

  /**
   * Create new item
   * @param {Object} itemData - Item data
   * @returns {Promise}
   */
  async createItem(itemData) {
    try {
      const response = await api.post('/admin/items', itemData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create item' }
    }
  }

  /**
   * Update item
   * @param {number} itemId - Item ID
   * @param {Object} itemData - Updated item data
   * @returns {Promise}
   */
  async updateItem(itemId, itemData) {
    try {
      const response = await api.put(`/admin/items/${itemId}`, itemData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update item' }
    }
  }

  /**
   * Delete item
   * @param {number} itemId - Item ID
   * @returns {Promise}
   */
  async deleteItem(itemId) {
    try {
      const response = await api.delete(`/admin/items/${itemId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to delete item' }
    }
  }

  /**
   * Update item coupon quota
   * @param {number} itemId - Item ID
   * @param {number} defaultCoupon - New coupon quota
   * @returns {Promise}
   */
  async updateItemCoupon(itemId, defaultCoupon) {
    try {
      const response = await api.put(`/admin/items/${itemId}/coupon`, null, {
        params: { default_coupon: defaultCoupon }
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update coupon' }
    }
  }

  // ==================== Coupon Management ====================
  
  /**
   * Reset daily coupons
   * @returns {Promise}
   */
  async resetDailyCoupons() {
    try {
      const response = await api.post('/admin/coupons/reset')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to reset coupons' }
    }
  }

  /**
   * Get daily coupons for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise}
   */
  async getDailyCoupons(date = null) {
    try {
      const params = date ? { date } : {}
      const response = await api.get('/admin/daily-coupons', { params })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch daily coupons' }
    }
  }

  // ==================== Purchase Management ====================
  
  /**
   * Get all purchases
   * @returns {Promise}
   */
  async getPurchases() {
    try {
      const response = await api.get('/admin/purchases')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch purchases' }
    }
  }

  /**
   * Create new purchase
   * @param {Object} purchaseData - Purchase data
   * @returns {Promise}
   */
  async createPurchase(purchaseData) {
    try {
      const response = await api.post('/admin/purchases', purchaseData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create purchase' }
    }
  }

  // ==================== Barista Request Management ====================
  
  /**
   * Get all barista requests
   * @param {string} status - Filter by status (pending, approved, rejected)
   * @returns {Promise}
   */
  async getBaristaRequests(status = null) {
    try {
      const params = status ? { status } : {}
      const response = await api.get('/admin/barista-requests', { params })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch barista requests' }
    }
  }

  /**
   * Update barista request status
   * @param {number} requestId - Request ID
   * @param {Object} updateData - { status, admin_response }
   * @returns {Promise}
   */
  async updateBaristaRequest(requestId, updateData) {
    try {
      const response = await api.put(`/admin/barista-requests/${requestId}`, updateData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update request' }
    }
  }
}

export default new AdminService()