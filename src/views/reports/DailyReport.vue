<template>
  <div class="daily-report">
    <div class="page-header">
      <h1 class="page-title">Daily Sales Report</h1>
      <div class="header-actions">
        <button class="btn-secondary" @click="exportReport" :disabled="isExporting">
          <i class="fas" :class="isExporting ? 'fa-spinner fa-spin' : 'fa-download'"></i>
          {{ isExporting ? 'Exporting...' : 'Export' }}
        </button>
        <button class="btn-secondary" @click="printReport">
          <i class="fas fa-print"></i> Print
        </button>
      </div>
    </div>

    <!-- Date Selector -->
    <div class="date-selector-card">
      <div class="date-inputs">
        <label>Select Date</label>
        <input type="date" v-model="selectedDate" @change="fetchReport">
      </div>
      <div class="quick-buttons">
        <button @click="setDate('today')" :class="{ active: quickDate === 'today' }">Today</button>
        <button @click="setDate('yesterday')" :class="{ active: quickDate === 'yesterday' }">Yesterday</button>
        <button @click="setDate('week')" :class="{ active: quickDate === 'week' }">This Week</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading report...</p>
    </div>

    <!-- Report Content -->
    <div v-else class="report-content">
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="card-info">
            <h3>{{ formatCurrency(reportData.total_revenue || 0) }}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-ticket-alt"></i>
          </div>
          <div class="card-info">
            <h3>{{ reportData.total_coupons_used || 0 }}</h3>
            <p>Coupons Used</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <div class="card-info">
            <h3>{{ reportData.total_transactions || 0 }}</h3>
            <p>Transactions</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-chart-bar"></i>
          </div>
          <div class="card-info">
            <h3>{{ formatCurrency(reportData.average_transaction || 0) }}</h3>
            <p>Average Transaction</p>
          </div>
        </div>
      </div>

      <!-- Revenue Chart -->
      <div class="chart-card" v-if="reportData.hourly_breakdown?.length">
        <h3>Revenue by Hour</h3>
        <canvas ref="hourlyChart"></canvas>
      </div>

      <!-- Top Selling Items -->
      <div class="top-items-card" v-if="reportData.top_items?.length">
        <h3>Top Selling Items</h3>
        <div class="items-list">
          <div v-for="item in reportData.top_items" :key="item.id" class="item-row">
            <div class="item-info">
              <div class="item-icon" :style="{ background: item.color || '#EFCA71' }">
                <i :class="item.icon || 'fas fa-cube'"></i>
              </div>
              <div class="item-details">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-stats">{{ item.quantity }} sold</div>
              </div>
            </div>
            <div class="item-revenue">{{ formatCurrency(item.revenue) }}</div>
            <div class="item-percentage">{{ item.percentage }}%</div>
          </div>
        </div>
      </div>

      <!-- Transaction Details Table -->
      <div class="transactions-card" v-if="reportData.transactions?.length">
        <h3>Transaction Details</h3>
        <div class="table-responsive">
          <table class="transactions-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Items</th>
                <th>Coupons</th>
                <th>Amount</th>
                <th>Payment</th></tr>
               </thead>
            <tbody>
              <tr v-for="transaction in reportData.transactions" :key="transaction.id">
                <td data-label="Time">{{ formatTime(transaction.created_at || transaction.time) }}</td>
                <td data-label="Items">
                  <div class="items-badge">
                    <span v-for="item in transaction.items?.slice(0, 2)" :key="item.name">
                      {{ item.quantity }}x {{ item.name }}
                    </span>
                    <span v-if="transaction.items?.length > 2" class="more">
                      +{{ transaction.items.length - 2 }}
                    </span>
                  </div>
                </td>
                <td data-label="Coupons">{{ transaction.coupons_used || transaction.coupons || 0 }}</td>
                <td data-label="Amount" class="amount">{{ formatCurrency(transaction.total_amount || transaction.amount) }}</td>
                <td data-label="Payment">
                  <span :class="['payment-badge', (transaction.payment_method || transaction.payment)?.toLowerCase()]">
                    {{ transaction.payment_method || transaction.payment }}
                  </span>
                </td>
              </tr>
              <tr v-if="!reportData.transactions?.length">
                <td colspan="5" class="empty-state">No transactions found for this date</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- End of Day Summary -->
      <div class="end-of-day-card">
        <h3>End of Day Summary</h3>
        <div class="summary-grid small">
          <div class="summary-item">
            <label>Opening Coupons:</label>
            <span>{{ reportData.opening_coupons || 0 }}</span>
          </div>
          <div class="summary-item">
            <label>Coupons Used:</label>
            <span class="used">{{ reportData.total_coupons_used || 0 }}</span>
          </div>
          <div class="summary-item">
            <label>Remaining Coupons:</label>
            <span class="remaining">{{ (reportData.opening_coupons || 0) - (reportData.total_coupons_used || 0) }}</span>
          </div>
          <div class="summary-item">
            <label>Utilization Rate:</label>
            <span>{{ utilizationRate }}%</span>
          </div>
        </div>
        <div class="notes-section">
          <label>Notes</label>
          <textarea v-model="endOfDayNotes" placeholder="Add notes about today's performance..."></textarea>
          <button class="btn-primary" @click="saveNotes" :disabled="isSavingNotes">
            {{ isSavingNotes ? 'Saving...' : 'Save Notes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useToast } from 'vue-toastification'
import Chart from 'chart.js/auto'

export default {
  name: 'DailyReport',
  setup() {
    const toast = useToast()
    const isLoading = ref(false)
    const isExporting = ref(false)
    const isSavingNotes = ref(false)
    const selectedDate = ref(new Date().toISOString().split('T')[0])
    const quickDate = ref('today')
    const endOfDayNotes = ref('')
    const hourlyChart = ref(null)
    
    let hourlyChartInstance = null
    let refreshInterval = null
    
    const reportData = ref({
      total_revenue: 0,
      total_coupons_used: 0,
      total_transactions: 0,
      average_transaction: 0,
      opening_coupons: 0,
      hourly_breakdown: [],
      top_items: [],
      transactions: []
    })

    const getAuthHeaders = () => {
      const token = localStorage.getItem('authToken')
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }

    const utilizationRate = computed(() => {
      if (reportData.value.opening_coupons === 0) return 0
      return Math.round((reportData.value.total_coupons_used / reportData.value.opening_coupons) * 100)
    })

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(value || 0)
    }

    const formatTime = (time) => {
      if (!time) return '-'
      try {
        const date = new Date(time)
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (e) {
        return time
      }
    }

    const setDate = (date) => {
      quickDate.value = date
      const today = new Date()
      if (date === 'today') {
        selectedDate.value = today.toISOString().split('T')[0]
        fetchReport()
      } else if (date === 'yesterday') {
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)
        selectedDate.value = yesterday.toISOString().split('T')[0]
        fetchReport()
      } else if (date === 'week') {
        fetchWeeklyReport()
      }
    }

    const fetchReport = async () => {
      isLoading.value = true
      try {
        const token = localStorage.getItem('authToken')
        
        if (!token) {
          toast.error('Please login again')
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
          return
        }
        
        const response = await fetch(`/api/reports/daily?date=${selectedDate.value}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.status === 401 || response.status === 403) {
          toast.error('Session expired. Please login again.')
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
          return
        }

        if (response.ok) {
          const data = await response.json()
          console.log('Report data received:', data)
          reportData.value = data
          
          // Load saved notes if any
          loadNotes()
          
          // Initialize chart
          setTimeout(() => initHourlyChart(), 100)
        } else {
          console.error('Failed to fetch report:', response.status)
          toast.error('Failed to load report. Using demo data.')
          loadDemoData()
        }
      } catch (error) {
        console.error('Error fetching report:', error)
        toast.error('Failed to load report. Using demo data.')
        loadDemoData()
      } finally {
        isLoading.value = false
      }
    }

    const fetchWeeklyReport = async () => {
      isLoading.value = true
      try {
        const token = localStorage.getItem('authToken')
        const endDate = new Date().toISOString().split('T')[0]
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 6)
        
        const response = await fetch(`/api/reports/daily?from_date=${startDate.toISOString().split('T')[0]}&to_date=${endDate}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          reportData.value = data
          setTimeout(() => initHourlyChart(), 100)
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        console.error('Error fetching weekly report:', error)
        toast.error('Failed to load weekly report')
        loadDemoData()
      } finally {
        isLoading.value = false
      }
    }

    const loadDemoData = () => {
      reportData.value = {
        total_revenue: 8750,
        total_coupons_used: 142,
        total_transactions: 58,
        average_transaction: 150.86,
        opening_coupons: 585,
        hourly_breakdown: [
          { hour: 10, revenue: 450 },
          { hour: 11, revenue: 720 },
          { hour: 12, revenue: 1200 },
          { hour: 13, revenue: 1650 },
          { hour: 14, revenue: 1440 },
          { hour: 15, revenue: 1260 },
          { hour: 16, revenue: 1140 },
          { hour: 17, revenue: 1050 },
          { hour: 18, revenue: 1200 },
          { hour: 19, revenue: 960 },
          { hour: 20, revenue: 840 }
        ],
        top_items: [
          { id: 1, name: 'Beer', quantity: 85, revenue: 5100, percentage: 32, icon: 'fas fa-beer', color: '#F4A261' },
          { id: 2, name: 'Wine', quantity: 32, revenue: 4800, percentage: 30, icon: 'fas fa-wine-bottle', color: '#9C6B42' },
          { id: 3, name: 'Shiro', quantity: 41, revenue: 3280, percentage: 21, icon: 'fas fa-utensils', color: '#E9C46A' },
          { id: 4, name: 'Tibs', quantity: 25, revenue: 3000, percentage: 17, icon: 'fas fa-utensil-spoon', color: '#E76F51' }
        ],
        transactions: [
          { id: 1, created_at: new Date().toISOString(), items: [{ name: 'Beer', quantity: 2 }, { name: 'Shiro', quantity: 1 }], coupons_used: 3, total_amount: 200, payment_method: 'Cash' },
          { id: 2, created_at: new Date().toISOString(), items: [{ name: 'Wine', quantity: 1 }], coupons_used: 1, total_amount: 150, payment_method: 'TeleBirr' },
          { id: 3, created_at: new Date().toISOString(), items: [{ name: 'Beer', quantity: 3 }], coupons_used: 3, total_amount: 180, payment_method: 'Cash' },
          { id: 4, created_at: new Date().toISOString(), items: [{ name: 'Shiro', quantity: 2 }, { name: 'Tibs', quantity: 1 }], coupons_used: 3, total_amount: 280, payment_method: 'CBE Birr' }
        ]
      }
      setTimeout(() => initHourlyChart(), 100)
    }

    const loadNotes = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(`/api/reports/daily/notes?date=${selectedDate.value}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          endOfDayNotes.value = data.notes || ''
        }
      } catch (error) {
        console.error('Error loading notes:', error)
      }
    }

    const initHourlyChart = () => {
      if (hourlyChartInstance) hourlyChartInstance.destroy()
      
      const ctx = hourlyChart.value?.getContext('2d')
      if (!ctx || !reportData.value.hourly_breakdown?.length) return
      
      hourlyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: reportData.value.hourly_breakdown.map(h => `${h.hour}:00`),
          datasets: [
            {
              label: 'Revenue (ETB)',
              data: reportData.value.hourly_breakdown.map(h => h.revenue),
              borderColor: '#EFCA71',
              backgroundColor: 'rgba(239, 202, 113, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top'
            },
            tooltip: {
              callbacks: {
                label: (context) => `Revenue: ${formatCurrency(context.raw)}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Revenue (ETB)'
              },
              ticks: {
                callback: (value) => formatCurrency(value)
              }
            }
          }
        }
      })
    }

    const exportReport = async () => {
      isExporting.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(`/api/reports/daily/export?date=${selectedDate.value}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `daily_report_${selectedDate.value}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Report exported successfully')
      } catch (error) {
        console.error('Error exporting report:', error)
        toast.error('Failed to export report')
      } finally {
        isExporting.value = false
      }
    }

    const printReport = () => {
      window.print()
    }

    const saveNotes = async () => {
      if (!endOfDayNotes.value) {
        toast.warning('Please enter notes before saving')
        return
      }
      
      isSavingNotes.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/reports/daily/notes', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            date: selectedDate.value,
            notes: endOfDayNotes.value
          })
        })
        
        if (response.ok) {
          toast.success('Notes saved successfully')
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        console.error('Error saving notes:', error)
        toast.error('Failed to save notes')
      } finally {
        isSavingNotes.value = false
      }
    }

    const refreshData = () => {
      fetchReport()
    }

    onMounted(() => {
      fetchReport()
      // Refresh every 30 seconds
      refreshInterval = setInterval(refreshData, 30000)
    })

    onUnmounted(() => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
      if (hourlyChartInstance) {
        hourlyChartInstance.destroy()
      }
    })

    return {
      isLoading,
      isExporting,
      isSavingNotes,
      selectedDate,
      quickDate,
      endOfDayNotes,
      hourlyChart,
      reportData,
      utilizationRate,
      formatCurrency,
      formatTime,
      setDate,
      fetchReport,
      exportReport,
      printReport,
      saveNotes
    }
  }
}
</script>

<style scoped>
/* Keep all your existing styles - they remain the same */
.daily-report {
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

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-secondary {
  background: #F5F5F5;
  border: 1px solid #E5E5E2;
  padding: 10px 20px;
  border-radius: 8px;
  color: #6F6C6D;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary:hover:not(:disabled) {
  background: #E5E5E2;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.date-selector-card {
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

.date-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-inputs label {
  font-size: 12px;
  color: #8C8C90;
}

.date-inputs input {
  padding: 8px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
}

.quick-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-buttons button {
  padding: 8px 16px;
  border: 1px solid #E5E5E2;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-buttons button.active {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border-color: #EFCA71;
}

.loading-state {
  text-align: center;
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
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
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

.chart-card,
.top-items-card,
.transactions-card,
.end-of-day-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.chart-card h3,
.top-items-card h3,
.transactions-card h3,
.end-of-day-card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #332F2E;
}

.chart-card canvas {
  height: 300px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #F9F7EB;
  border-radius: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 150px;
}

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.item-details {
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: #332F2E;
}

.item-stats {
  font-size: 12px;
  color: #8C8C90;
}

.item-revenue {
  font-weight: 600;
  color: #EFCA71;
  min-width: 100px;
  text-align: right;
}

.item-percentage {
  color: #8C8C90;
  font-size: 14px;
  min-width: 60px;
  text-align: right;
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.transactions-table th {
  text-align: left;
  padding: 12px;
  background: #F9F7EB;
  font-weight: 600;
  color: #332F2E;
  border-bottom: 1px solid #E5E5E2;
}

.transactions-table td {
  padding: 12px;
  border-bottom: 1px solid #F0F0F0;
}

.items-badge {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.items-badge span {
  background: #F5F5F5;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.more {
  background: #EFCA71;
  color: #332F2E;
}

.amount {
  font-weight: 600;
  color: #EFCA71;
}

.payment-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.payment-badge.cash {
  background: #E8F5E9;
  color: #4CAF50;
}

.payment-badge.telebirr {
  background: #E3F2FD;
  color: #1976D2;
}

.payment-badge.cbe-birr {
  background: #FFF3E0;
  color: #F57C00;
}

.summary-grid.small {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: #F9F7EB;
  border-radius: 8px;
}

.summary-item label {
  color: #8C8C90;
}

.summary-item span {
  font-weight: 600;
  color: #332F2E;
}

.summary-item span.used {
  color: #EFCA71;
}

.summary-item span.remaining {
  color: #4CAF50;
}

.notes-section {
  margin-top: 20px;
}

.notes-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #332F2E;
}

.notes-section textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  resize: vertical;
  margin-bottom: 12px;
  font-family: inherit;
}

.btn-primary {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  color: #332F2E;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(239, 202, 113, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #8C8C90;
}

@media (max-width: 768px) {
  .daily-report {
    padding: 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .date-selector-card {
    flex-direction: column;
    align-items: stretch;
  }
  
  .quick-buttons {
    justify-content: center;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-grid.small {
    grid-template-columns: 1fr;
  }
  
  .item-revenue,
  .item-percentage {
    text-align: left;
    margin-left: 52px;
  }
  
  .transactions-table td {
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .chart-card canvas {
    height: 250px;
  }
  
  .item-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .item-revenue,
  .item-percentage {
    margin-left: 52px;
  }
}
</style>