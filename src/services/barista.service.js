import api from './api'

class BaristaService {
  // ==================== Coupon Distribution ====================
  
  /**
   * Distribute coupons to waiters
   * @param {Object} distributionData - { item_id, quantity, assigned_to, notes }
   * @returns {Promise}
   */
  async distributeCoupons(distributionData) {
    try {
      const response = await api.post('/barista/distribute', distributionData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to distribute coupons' }
    }
  }

  /**
   * Get all distributions
   * @param {string} fromDate - Start date (YYYY-MM-DD)
   * @param {string} toDate - End date (YYYY-MM-DD)
   * @returns {Promise}
   */
  async getDistributions(fromDate = null, toDate = null) {
    try {
      const params = {}
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate
      const response = await api.get('/barista/distributions', { params })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch distributions' }
    }
  }

  // ==================== Stock Requests ====================
  
  /**
   * Create stock request
   * @param {Object} requestData - { item_id, requested_quantity, priority, reason, notes }
   * @returns {Promise}
   */
  async createStockRequest(requestData) {
    try {
      const response = await api.post('/barista/stock-requests', requestData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to create stock request' }
    }
  }

  /**
   * Get all stock requests
   * @param {string} status - Filter by status (pending, approved, rejected)
   * @returns {Promise}
   */
  async getStockRequests(status = null) {
    try {
      const params = status ? { status } : {}
      const response = await api.get('/barista/stock-requests', { params })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch stock requests' }
    }
  }

  /**
   * Get single stock request
   * @param {number} requestId - Request ID
   * @returns {Promise}
   */
  async getStockRequest(requestId) {
    try {
      const response = await api.get(`/barista/stock-requests/${requestId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch stock request' }
    }
  }

  /**
   * Cancel stock request
   * @param {number} requestId - Request ID
   * @returns {Promise}
   */
  async cancelStockRequest(requestId) {
    try {
      const response = await api.delete(`/barista/stock-requests/${requestId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to cancel stock request' }
    }
  }

  // ==================== Inventory ====================
  
  /**
   * Get current inventory (daily coupons)
   * @returns {Promise}
   */
  async getInventory() {
    try {
      const response = await api.get('/barista/inventory')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch inventory' }
    }
  }
}

export default new BaristaService()