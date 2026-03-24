import api from './api'

class CommonService {
  // ==================== User Profile ====================
  
  /**
   * Get user profile
   * @returns {Promise}
   */
  async getProfile() {
    try {
      const response = await api.get('/common/profile')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch profile' }
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - { name, email }
   * @returns {Promise}
   */
  async updateProfile(profileData) {
    try {
      const response = await api.put('/common/profile', profileData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to update profile' }
    }
  }

  // ==================== Items ====================
  
  /**
   * Get all items (public)
   * @returns {Promise}
   */
  async getItems() {
    try {
      const response = await api.get('/common/items')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch items' }
    }
  }

  // ==================== Daily Coupons ====================
  
  /**
   * Get daily coupons for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise}
   */
  async getDailyCoupons(date = null) {
    try {
      const params = date ? { date } : {}
      const response = await api.get('/common/daily-coupons', { params })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch daily coupons' }
    }
  }

  // ==================== Notifications ====================
  
  /**
   * Get notifications
   * @param {number} limit - Number of notifications to return
   * @returns {Promise}
   */
  async getNotifications(limit = 20) {
    try {
      const response = await api.get('/common/notifications', { params: { limit } })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch notifications' }
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise}
   */
  async markNotificationRead(notificationId) {
    try {
      const response = await api.put(`/common/notifications/${notificationId}/read`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to mark notification as read' }
    }
  }

  /**
   * Mark all notifications as read
   * @returns {Promise}
   */
  async markAllRead() {
    try {
      const response = await api.put('/common/notifications/read-all')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to mark all as read' }
    }
  }

  /**
   * Clear all notifications
   * @returns {Promise}
   */
  async clearNotifications() {
    try {
      const response = await api.delete('/common/notifications/clear')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to clear notifications' }
    }
  }

  // ==================== Activity Log ====================
  
  /**
   * Get user activity log
   * @param {number} limit - Number of activities to return
   * @returns {Promise}
   */
  async getActivity(limit = 10) {
    try {
      const response = await api.get('/common/activity', { params: { limit } })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch activity' }
    }
  }
}

export default new CommonService()