import api from './api'

class CashierService {
  // ==================== Sales Management ====================
  
  /**
   * Create new sale
   * @param {Object} saleData - Sale data with items
   * @returns {Promise}
   */
  async createSale(saleData) {
    try {
      const response = await api.post('/cashier/sales', saleData)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to process sale' }
    }
  }

  /**
   * Get all sales
   * @param {string} fromDate - Start date (YYYY-MM-DD)
   * @param {string} toDate - End date (YYYY-MM-DD)
   * @returns {Promise}
   */
  async getSales(fromDate = null, toDate = null) {
    try {
      const params = {}
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate
      const response = await api.get('/cashier/sales', { params })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch sales' }
    }
  }

  /**
   * Get single sale by ID
   * @param {number} saleId - Sale ID
   * @returns {Promise}
   */
  async getSale(saleId) {
    try {
      const response = await api.get(`/cashier/sales/${saleId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch sale' }
    }
  }

  // ==================== Daily Coupons ====================
  
  /**
   * Get today's daily coupons
   * @returns {Promise}
   */
  async getTodayCoupons() {
    try {
      const response = await api.get('/cashier/daily-coupons')
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch daily coupons' }
    }
  }

  // ==================== End of Day ====================
  
  /**
   * Process end of day
   * @param {Array} remainingCoupons - List of remaining coupons per item
   * @param {string} notes - End of day notes
   * @returns {Promise}
   */
  async endOfDay(remainingCoupons, notes = null) {
    try {
      const response = await api.post('/cashier/end-of-day', {
        remaining_coupons: remainingCoupons,
        notes
      })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to process end of day' }
    }
  }
}

export default new CashierService()