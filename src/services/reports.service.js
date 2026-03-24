import api from './api'

class ReportsService {
  // ==================== Daily Sales Report ====================
  
  /**
   * Get daily sales report
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise}
   */
  async getDailyReport(date = null) {
    try {
      const params = date ? { date } : {}
      const response = await api.get('/reports/daily', { params })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch daily report' }
    }
  }

  // ==================== Fast Moving Items ====================
  
  /**
   * Get fast moving items report
   * @param {string} fromDate - Start date (YYYY-MM-DD)
   * @param {string} toDate - End date (YYYY-MM-DD)
   * @param {number} limit - Number of items to return
   * @returns {Promise}
   */
  async getFastMovingItems(fromDate = null, toDate = null, limit = 10) {
    try {
      const params = { limit }
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate
      const response = await api.get('/reports/fast-moving', { params })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch fast moving items' }
    }
  }

  // ==================== Slow Moving Items ====================
  
  /**
   * Get slow moving items report
   * @param {string} fromDate - Start date (YYYY-MM-DD)
   * @param {string} toDate - End date (YYYY-MM-DD)
   * @param {number} thresholdDays - Days threshold for slow moving
   * @returns {Promise}
   */
  async getSlowMovingItems(fromDate = null, toDate = null, thresholdDays = 7) {
    try {
      const params = { threshold_days: thresholdDays }
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate
      const response = await api.get('/reports/slow-moving', { params })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch slow moving items' }
    }
  }

  // ==================== Coupon Usage Report ====================
  
  /**
   * Get coupon usage report
   * @param {string} fromDate - Start date (YYYY-MM-DD)
   * @param {string} toDate - End date (YYYY-MM-DD)
   * @returns {Promise}
   */
  async getCouponUsage(fromDate = null, toDate = null) {
    try {
      const params = {}
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate
      const response = await api.get('/reports/coupon-usage', { params })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch coupon usage' }
    }
  }

  // ==================== Revenue Summary ====================
  
  /**
   * Get revenue summary report
   * @param {string} fromDate - Start date (YYYY-MM-DD)
   * @param {string} toDate - End date (YYYY-MM-DD)
   * @returns {Promise}
   */
  async getRevenueSummary(fromDate = null, toDate = null) {
    try {
      const params = {}
      if (fromDate) params.from_date = fromDate
      if (toDate) params.to_date = toDate
      const response = await api.get('/reports/revenue-summary', { params })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch revenue summary' }
    }
  }

  // ==================== Hourly Breakdown ====================
  
  /**
   * Get hourly breakdown for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise}
   */
  async getHourlyBreakdown(date = null) {
    try {
      const params = date ? { date } : {}
      const response = await api.get('/reports/hourly', { params })
      return response.data
    } catch (error) {
      throw error.response?.data || { detail: 'Failed to fetch hourly breakdown' }
    }
  }
}

export default new ReportsService()