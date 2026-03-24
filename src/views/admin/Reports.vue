<template>
  <div class="reports">
    <div class="page-header">
      <h1 class="page-title">Reports & Analytics</h1>
      <div class="header-actions">
        <button class="btn-secondary" @click="exportReport" :disabled="isExporting">
          <i class="fas" :class="isExporting ? 'fa-spinner fa-spin' : 'fa-download'"></i> 
          {{ isExporting ? 'Exporting...' : 'Export Report' }}
        </button>
        <button class="btn-secondary" @click="printReport">
          <i class="fas fa-print"></i> Print
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading reports...</p>
    </div>

    <div v-else>
      <!-- Date Range Selector -->
      <div class="date-range-card">
        <div class="date-selector">
          <label>Report Period</label>
          <div class="date-inputs">
            <input type="date" v-model="dateFrom" @change="loadReports">
            <span>to</span>
            <input type="date" v-model="dateTo" @change="loadReports">
          </div>
        </div>
        <div class="quick-filters">
          <button @click="setQuickFilter('today')" :class="{ active: quickFilter === 'today' }">Today</button>
          <button @click="setQuickFilter('yesterday')" :class="{ active: quickFilter === 'yesterday' }">Yesterday</button>
          <button @click="setQuickFilter('week')" :class="{ active: quickFilter === 'week' }">This Week</button>
          <button @click="setQuickFilter('month')" :class="{ active: quickFilter === 'month' }">This Month</button>
        </div>
      </div>

      <!-- Report Tabs -->
      <div class="report-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="{ active: activeTab === tab.id }"
        >
          <i :class="tab.icon"></i>
          {{ tab.name }}
        </button>
      </div>

      <!-- Daily Sales Report -->
      <div v-if="activeTab === 'daily'" class="report-content">
        <div class="summary-cards">
          <div class="summary-card">
            <div class="card-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="card-info">
              <h3>{{ formatCurrency(dailyReportData.total_revenue || 0) }}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon">
              <i class="fas fa-ticket-alt"></i>
            </div>
            <div class="card-info">
              <h3>{{ dailyReportData.total_coupons_used || 0 }}</h3>
              <p>Coupons Used</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon">
              <i class="fas fa-boxes"></i>
            </div>
            <div class="card-info">
              <h3>{{ dailyReportData.total_items_sold || 0 }}</h3>
              <p>Items Sold</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="card-icon">
              <i class="fas fa-shopping-cart"></i>
            </div>
            <div class="card-info">
              <h3>{{ dailyReportData.total_transactions || 0 }}</h3>
              <p>Transactions</p>
            </div>
          </div>
        </div>

        <div class="chart-container" v-if="dailyReportData.hourly_breakdown?.length">
          <h3>Hourly Sales Trend</h3>
          <canvas ref="hourlySalesChart"></canvas>
        </div>

        <div class="sales-table-container">
          <h3>Top Selling Items</h3>
          <div class="table-responsive">
            <table class="sales-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Quantity Sold</th>
                  <th>Revenue</th>
                  <th>% of Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in dailyReportData.top_items || []" :key="item.id">
                  <td data-label="Item">{{ item.name }}</td>
                  <td data-label="Category">
                    <span :class="['category-badge', item.category]">{{ item.category }}</span>
                  </td>
                  <td data-label="Quantity Sold">{{ item.quantity }}</td>
                  <td data-label="Revenue" class="revenue">{{ formatCurrency(item.revenue) }}</td>
                  <td data-label="% of Total">
                    <div class="percentage-bar">
                      <div class="percentage-fill" :style="{ width: item.percentage + '%' }"></div>
                      <span>{{ item.percentage }}%</span>
                    </div>
                  </td>
                </tr>
                <tr v-if="(!dailyReportData.top_items || dailyReportData.top_items.length === 0)">
                  <td colspan="5" class="empty-state">No data available for this period</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Fast Moving Items -->
      <div v-if="activeTab === 'fast-moving'" class="report-content">
        <div class="items-analysis">
          <div class="chart-container">
            <h3>Top Selling Items</h3>
            <canvas ref="fastMovingChart"></canvas>
          </div>
          <div class="items-table-container">
            <div class="table-responsive">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                    <th>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in fastMovingData" :key="item.id">
                    <td data-label="Item" class="item-name">
                      <div class="item-info">
                        <div class="item-icon" :style="{ background: item.color || '#EFCA71' }">
                          <i :class="item.icon || 'fas fa-cube'"></i>
                        </div>
                        <span>{{ item.name }}</span>
                      </div>
                    </td>
                    <td data-label="Category">
                      <span :class="['category-badge', item.category]">{{ item.category }}</span>
                    </td>
                    <td data-label="Units Sold">{{ item.quantity }}</td>
                    <td data-label="Revenue" class="revenue">{{ formatCurrency(item.revenue) }}</td>
                    <td data-label="% of Total">
                      <div class="percentage-bar">
                        <div class="percentage-fill" :style="{ width: item.percentage + '%' }"></div>
                        <span>{{ item.percentage }}%</span>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="fastMovingData.length === 0">
                    <td colspan="5" class="empty-state">No data available for this period</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Slow Moving Items -->
      <div v-if="activeTab === 'slow-moving'" class="report-content">
        <div class="items-analysis">
          <div class="warning-card" v-if="slowMovingData.length === 0">
            <i class="fas fa-check-circle"></i>
            <p>Great! No slow-moving items in this period.</p>
          </div>
          <div v-else class="items-table-container">
            <div class="table-responsive">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                    <th>Days Since Last Sale</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in slowMovingData" :key="item.id">
                    <td data-label="Item" class="item-name">
                      <div class="item-info">
                        <div class="item-icon" :style="{ background: item.color || '#EFCA71' }">
                          <i :class="item.icon || 'fas fa-cube'"></i>
                        </div>
                        <span>{{ item.name }}</span>
                      </div>
                    </td>
                    <td data-label="Category">
                      <span :class="['category-badge', item.category]">{{ item.category }}</span>
                    </td>
                    <td data-label="Units Sold">{{ item.quantity }}</td>
                    <td data-label="Revenue" class="revenue">{{ formatCurrency(item.revenue) }}</td>
                    <td data-label="Days Since Last Sale">
                      <span class="days-badge" :class="getDaysClass(item.days_since_last_sale)">
                        {{ item.days_since_last_sale }} days
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Coupon Usage Report -->
      <div v-if="activeTab === 'coupon-usage'" class="report-content">
        <div class="coupon-stats">
          <div class="stat-card large">
            <h3>Coupon Utilization Rate</h3>
            <div class="utilization-meter">
              <div class="meter-fill" :style="{ width: couponUsageData.utilization_rate + '%' }"></div>
              <span class="meter-label">{{ couponUsageData.utilization_rate }}%</span>
            </div>
          </div>
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-ticket-alt"></i>
              </div>
              <div class="stat-info">
                <h3>{{ couponUsageData.total_available || 0 }}</h3>
                <p>Total Coupons Available</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="stat-info">
                <h3>{{ couponUsageData.total_used || 0 }}</h3>
                <p>Coupons Used</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-hourglass-half"></i>
              </div>
              <div class="stat-info">
                <h3>{{ couponUsageData.total_remaining || 0 }}</h3>
                <p>Remaining</p>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-container">
          <h3>Coupon Usage by Item</h3>
          <canvas ref="couponUsageChart"></canvas>
        </div>

        <div class="items-table-container">
          <div class="table-responsive">
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Available</th>
                  <th>Used</th>
                  <th>Remaining</th>
                  <th>Utilization</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in couponUsageData.items || []" :key="item.id">
                  <td data-label="Item" class="item-name">
                    <div class="item-info">
                      <div class="item-icon" :style="{ background: item.color || '#EFCA71' }">
                        <i :class="item.icon || 'fas fa-cube'"></i>
                      </div>
                      <span>{{ item.name }}</span>
                    </div>
                  </td>
                  <td data-label="Category">
                    <span :class="['category-badge', item.category]">{{ item.category }}</span>
                  </td>
                  <td data-label="Available">{{ item.available }}</td>
                  <td data-label="Used">{{ item.used }}</td>
                  <td data-label="Remaining">{{ item.remaining }}</td>
                  <td data-label="Utilization">
                    <div class="percentage-bar">
                      <div class="percentage-fill" :style="{ width: item.utilization + '%' }"></div>
                      <span>{{ item.utilization }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Chart from 'chart.js/auto'

export default {
  name: 'AdminReports',
  setup() {
    const toast = useToast()
    const activeTab = ref('daily')
    const dateFrom = ref('')
    const dateTo = ref('')
    const quickFilter = ref('')
    const isLoading = ref(true)
    const isExporting = ref(false)
    
    // Chart refs
    const hourlySalesChart = ref(null)
    const fastMovingChart = ref(null)
    const couponUsageChart = ref(null)
    
    let hourlySalesChartInstance = null
    let fastMovingChartInstance = null
    let couponUsageChartInstance = null
    
    // Data stores
    const dailyReportData = ref({
      total_revenue: 0,
      total_coupons_used: 0,
      total_items_sold: 0,
      total_transactions: 0,
      top_items: [],
      hourly_breakdown: []
    })
    
    const fastMovingData = ref([])
    const slowMovingData = ref([])
    const couponUsageData = ref({
      total_available: 0,
      total_used: 0,
      total_remaining: 0,
      utilization_rate: 0,
      items: []
    })
    
    const tabs = [
      { id: 'daily', name: 'Daily Sales', icon: 'fas fa-calendar-day' },
      { id: 'fast-moving', name: 'Fast Moving Items', icon: 'fas fa-rocket' },
      { id: 'slow-moving', name: 'Slow Moving Items', icon: 'fas fa-turtle' },
      { id: 'coupon-usage', name: 'Coupon Usage', icon: 'fas fa-ticket-alt' }
    ]

    const getAuthHeaders = () => {
      const token = localStorage.getItem('authToken')
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(value || 0)
    }
    
    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
    
    const getDaysClass = (days) => {
      if (days > 14) return 'critical'
      if (days > 7) return 'warning'
      return 'normal'
    }
    
    const setQuickFilter = (filter) => {
      quickFilter.value = filter
      const today = new Date()
      const endDate = today.toISOString().split('T')[0]
      
      switch(filter) {
        case 'today':
          dateFrom.value = endDate
          dateTo.value = endDate
          break
        case 'yesterday':
          const yesterday = new Date(today)
          yesterday.setDate(today.getDate() - 1)
          dateFrom.value = yesterday.toISOString().split('T')[0]
          dateTo.value = dateFrom.value
          break
        case 'week':
          const weekStart = new Date(today)
          weekStart.setDate(today.getDate() - today.getDay())
          dateFrom.value = weekStart.toISOString().split('T')[0]
          dateTo.value = endDate
          break
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
          dateFrom.value = monthStart.toISOString().split('T')[0]
          dateTo.value = endDate
          break
      }
      loadReports()
    }
    
    const loadReports = async () => {
      isLoading.value = true
      try {
        const token = localStorage.getItem('authToken')
        
        // Load daily report
        const dailyResponse = await fetch(`/api/reports/daily?from_date=${dateFrom.value}&to_date=${dateTo.value}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (dailyResponse.ok) {
          dailyReportData.value = await dailyResponse.json()
        }
        
        // Load fast moving items
        const fastResponse = await fetch(`/api/reports/fast-moving?from_date=${dateFrom.value}&to_date=${dateTo.value}&limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (fastResponse.ok) {
          fastMovingData.value = await fastResponse.json()
        }
        
        // Load slow moving items
        const slowResponse = await fetch(`/api/reports/slow-moving?from_date=${dateFrom.value}&to_date=${dateTo.value}&threshold_days=7`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (slowResponse.ok) {
          slowMovingData.value = await slowResponse.json()
        }
        
        // Load coupon usage
        const couponResponse = await fetch(`/api/reports/coupon-usage?from_date=${dateFrom.value}&to_date=${dateTo.value}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (couponResponse.ok) {
          const data = await couponResponse.json()
          couponUsageData.value = {
            items: data,
            total_available: data.reduce((sum, i) => sum + i.available, 0),
            total_used: data.reduce((sum, i) => sum + i.used, 0),
            total_remaining: data.reduce((sum, i) => sum + i.remaining, 0),
            utilization_rate: Math.round((data.reduce((sum, i) => sum + i.used, 0) / data.reduce((sum, i) => sum + i.available, 0)) * 100) || 0
          }
        }
        
        initCharts()
      } catch (error) {
        console.error('Error loading reports:', error)
        toast.error('Failed to load reports. Using demo data.')
        loadDemoData()
      } finally {
        isLoading.value = false
      }
    }
    
    const loadDemoData = () => {
      dailyReportData.value = {
        total_revenue: 125000,
        total_coupons_used: 1250,
        total_items_sold: 1250,
        total_transactions: 450,
        top_items: [
          { id: 1, name: 'Beer', category: 'drink', quantity: 450, revenue: 27000, percentage: 28, icon: 'fas fa-beer', color: '#F4A261' },
          { id: 2, name: 'Wine', category: 'drink', quantity: 280, revenue: 42000, percentage: 34, icon: 'fas fa-wine-bottle', color: '#9C6B42' },
          { id: 3, name: 'Shiro', category: 'food', quantity: 320, revenue: 25600, percentage: 20, icon: 'fas fa-utensils', color: '#E9C46A' }
        ],
        hourly_breakdown: Array.from({ length: 12 }, (_, i) => ({
          hour: 10 + i,
          transactions: Math.floor(Math.random() * 50) + 20,
          revenue: Math.floor(Math.random() * 5000) + 2000
        }))
      }
      
      fastMovingData.value = [
        { id: 1, name: 'Beer', category: 'drink', quantity: 450, revenue: 27000, percentage: 28, icon: 'fas fa-beer', color: '#F4A261' },
        { id: 2, name: 'Shiro', category: 'food', quantity: 320, revenue: 25600, percentage: 26, icon: 'fas fa-utensils', color: '#E9C46A' },
        { id: 3, name: 'Wine', category: 'drink', quantity: 280, revenue: 42000, percentage: 34, icon: 'fas fa-wine-bottle', color: '#9C6B42' }
      ]
      
      slowMovingData.value = [
        { id: 5, name: 'Special Cocktail', category: 'drink', quantity: 15, revenue: 2250, days_since_last_sale: 12, icon: 'fas fa-cocktail', color: '#2A9D8F' },
        { id: 6, name: 'Vegan Platter', category: 'food', quantity: 8, revenue: 960, days_since_last_sale: 8, icon: 'fas fa-leaf', color: '#6B4E71' }
      ]
      
      couponUsageData.value = {
        items: [
          { id: 1, name: 'Beer', category: 'drink', available: 100, used: 85, remaining: 15, utilization: 85, icon: 'fas fa-beer', color: '#F4A261' },
          { id: 2, name: 'Wine', category: 'drink', available: 50, used: 40, remaining: 10, utilization: 80, icon: 'fas fa-wine-bottle', color: '#9C6B42' },
          { id: 3, name: 'Shiro', category: 'food', available: 80, used: 65, remaining: 15, utilization: 81, icon: 'fas fa-utensils', color: '#E9C46A' }
        ],
        total_available: 230,
        total_used: 190,
        total_remaining: 40,
        utilization_rate: 83
      }
    }
    
    const initCharts = () => {
      if (activeTab.value === 'daily' && dailyReportData.value.hourly_breakdown?.length) {
        if (hourlySalesChartInstance) hourlySalesChartInstance.destroy()
        const ctx = hourlySalesChart.value?.getContext('2d')
        if (ctx) {
          hourlySalesChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
              labels: dailyReportData.value.hourly_breakdown.map(h => `${h.hour}:00`),
              datasets: [{
                label: 'Revenue (ETB)',
                data: dailyReportData.value.hourly_breakdown.map(h => h.revenue),
                borderColor: '#EFCA71',
                backgroundColor: 'rgba(239, 202, 113, 0.1)',
                tension: 0.4,
                fill: true
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'top' } }
            }
          })
        }
      }
      
      if (activeTab.value === 'fast-moving' && fastMovingData.value.length) {
        if (fastMovingChartInstance) fastMovingChartInstance.destroy()
        const ctx = fastMovingChart.value?.getContext('2d')
        if (ctx) {
          fastMovingChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: fastMovingData.value.map(i => i.name),
              datasets: [{
                label: 'Units Sold',
                data: fastMovingData.value.map(i => i.quantity),
                backgroundColor: '#EFCA71',
                borderRadius: 8
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'top' } }
            }
          })
        }
      }
      
      if (activeTab.value === 'coupon-usage' && couponUsageData.value.items?.length) {
        if (couponUsageChartInstance) couponUsageChartInstance.destroy()
        const ctx = couponUsageChart.value?.getContext('2d')
        if (ctx) {
          couponUsageChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: couponUsageData.value.items.map(i => i.name),
              datasets: [{
                data: couponUsageData.value.items.map(i => i.used),
                backgroundColor: ['#EFCA71', '#F2E9C6', '#F4A261', '#E9C46A'],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom' } }
            }
          })
        }
      }
    }
    
    const exportReport = async () => {
      isExporting.value = true
      try {
        const reportData = {
          daily: dailyReportData.value,
          fast_moving: fastMovingData.value,
          slow_moving: slowMovingData.value,
          coupon_usage: couponUsageData.value,
          period: { from: dateFrom.value, to: dateTo.value }
        }
        
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report_${dateFrom.value}_to_${dateTo.value}.json`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Report exported successfully')
      } catch (error) {
        console.error('Export error:', error)
        toast.error('Failed to export report')
      } finally {
        isExporting.value = false
      }
    }
    
    const printReport = () => {
      window.print()
    }
    
    watch(activeTab, () => {
      setTimeout(initCharts, 100)
    })
    
    onMounted(() => {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - 6)
      dateFrom.value = startDate.toISOString().split('T')[0]
      dateTo.value = endDate.toISOString().split('T')[0]
      loadReports()
    })
    
    return {
      activeTab,
      tabs,
      dateFrom,
      dateTo,
      quickFilter,
      isLoading,
      isExporting,
      dailyReportData,
      fastMovingData,
      slowMovingData,
      couponUsageData,
      hourlySalesChart,
      fastMovingChart,
      couponUsageChart,
      formatCurrency,
      formatDate,
      getDaysClass,
      setQuickFilter,
      exportReport,
      printReport,
      loadReports
    }
  }
}
</script>

<style scoped>
/* Add loading styles */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: white;
  border-radius: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(239, 202, 113, 0.2);
  border-top-color: #EFCA71;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #8C8C90;
}

/* Keep all existing styles from your original CSS */
.reports {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #332F2E;
  margin: 0;
}

/* Add remaining styles from your original CSS here */
/* ... (keep all the existing styles) ... */

.reports {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #332F2E;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-secondary {
  background: #F5F5F5;
  border: 1px solid #E5E5E2;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #E5E5E2;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #E5E5E2;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  background: #F9F7EB;
  border-color: #EFCA71;
}

.date-range-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.date-selector label {
  display: block;
  margin-bottom: 8px;
  color: #6F6C6D;
  font-size: 14px;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-inputs input {
  padding: 8px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
}

.quick-filters {
  display: flex;
  gap: 8px;
}

.quick-filters button {
  padding: 8px 16px;
  border: 1px solid #E5E5E2;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-filters button.active {
  background: #EFCA71;
  border-color: #EFCA71;
  color: #332F2E;
}

.report-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.report-tabs button {
  padding: 10px 20px;
  border: none;
  background: #F5F5F5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.report-tabs button i {
  font-size: 16px;
}

.report-tabs button.active {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  color: #332F2E;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.summary-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.card-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #332F2E;
}

.card-info h3 {
  font-size: 24px;
  font-weight: 700;
  color: #332F2E;
  margin: 0;
}

.card-info p {
  color: #8C8C90;
  margin: 0;
  font-size: 14px;
}

.chart-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.chart-container h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #332F2E;
}

.chart-container canvas {
  max-height: 400px;
}

.sales-table-container,
.items-table-container {
  background: white;
  border-radius: 16px;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 32px;
}

.sales-table-container h3,
.category-breakdown h3,
.items-table-container h3 {
  padding: 20px 20px 0 20px;
  margin: 0;
  font-size: 18px;
  color: #332F2E;
}

.sales-table,
.items-table {
  width: 100%;
  border-collapse: collapse;
}

.sales-table th,
.items-table th {
  text-align: left;
  padding: 16px;
  background: #F9F7EB;
  color: #332F2E;
  font-weight: 600;
  border-bottom: 1px solid #E5E5E2;
}

.sales-table td,
.items-table td {
  padding: 16px;
  border-bottom: 1px solid #F0F0F0;
}

.revenue {
  font-weight: 600;
  color: #EFCA71;
}

.item-name {
  font-weight: 500;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.category-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.category-badge.drink {
  background: #E3F2FD;
  color: #1976D2;
}

.category-badge.food {
  background: #FFF3E0;
  color: #F57C00;
}

.percentage-bar {
  position: relative;
  width: 100px;
  height: 24px;
  background: #F5F5F5;
  border-radius: 12px;
  overflow: hidden;
}

.percentage-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #EFCA71;
  border-radius: 12px;
}

.percentage-bar span {
  position: relative;
  display: block;
  text-align: center;
  line-height: 24px;
  font-size: 12px;
  font-weight: 600;
  color: #332F2E;
}

.days-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.days-badge.normal {
  background: #E8F5E9;
  color: #4CAF50;
}

.days-badge.warning {
  background: #FFF3E0;
  color: #F57C00;
}

.days-badge.critical {
  background: #FFEBEE;
  color: #F44336;
}

.warning-card {
  background: #FFF3E0;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
}

.warning-card i {
  font-size: 48px;
  color: #4CAF50;
  margin-bottom: 16px;
}

.warning-card p {
  font-size: 18px;
  color: #332F2E;
  margin: 0;
}

.coupon-stats {
  margin-bottom: 32px;
}

.stat-card.large {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: center;
}

.stat-card.large h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #332F2E;
}

.utilization-meter {
  position: relative;
  height: 40px;
  background: #F5F5F5;
  border-radius: 20px;
  overflow: hidden;
}

.meter-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #EFCA71, #F2E9C6);
  border-radius: 20px;
  transition: width 0.5s ease;
}

.meter-label {
  position: relative;
  display: block;
  text-align: center;
  line-height: 40px;
  font-weight: 700;
  color: #332F2E;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.category-breakdown {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.category-list {
  margin-top: 20px;
}

.category-item {
  margin-bottom: 20px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.category-name {
  font-weight: 600;
  color: #332F2E;
}

.category-revenue {
  font-weight: 600;
  color: #EFCA71;
}

.progress-bar {
  height: 8px;
  background: #F5F5F5;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.category-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #8C8C90;
}

@media (max-width: 768px) {
  .reports {
    padding: 16px;
  }
  
  .date-range-card {
    flex-direction: column;
    align-items: stretch;
  }
  
  .quick-filters {
    flex-wrap: wrap;
  }
  
  .report-tabs {
    overflow-x: auto;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .stat-grid {
    grid-template-columns: 1fr;
  }


  /* Responsive Table */
.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .search-filter {
    flex-direction: column;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: calc(100% - 32px);
    margin: 16px;
  }
}
@media (max-width: 768px) {
  .items-table,
  .users-table,
  .purchases-table,
  .setup-table,
  .sales-table {
    border: 0;
  }
  
  .items-table thead,
  .users-table thead,
  .purchases-table thead,
  .setup-table thead,
  .sales-table thead {
    display: none;
  }
  
  .items-table tr,
  .users-table tr,
  .purchases-table tr,
  .setup-table tr,
  .sales-table tr {
    display: block;
    margin-bottom: 16px;
    border: 1px solid #E5E5E2;
    border-radius: 12px;
    padding: 12px;
  }
  
  .items-table td,
  .users-table td,
  .purchases-table td,
  .setup-table td,
  .sales-table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #F0F0F0;
  }
  
  .items-table td:before,
  .users-table td:before,
  .purchases-table td:before,
  .setup-table td:before,
  .sales-table td:before {
    content: attr(data-label);
    font-weight: 600;
    color: #332F2E;
  }
}
}
</style>