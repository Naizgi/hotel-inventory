<template>
  <div class="revenue-summary">
    <div class="page-header">
      <h1 class="page-title">Revenue Summary</h1>
      <div class="header-actions">
        <button class="btn-secondary" @click="exportReport">
          <i class="fas fa-download"></i> Export
        </button>
        <button class="btn-secondary" @click="printReport">
          <i class="fas fa-print"></i> Print
        </button>
      </div>
    </div>

    <!-- Date Range Selector -->
    <div class="date-range-card">
      <div class="date-inputs">
        <label>From</label>
        <input type="date" v-model="dateFrom">
      </div>
      <div class="date-inputs">
        <label>To</label>
        <input type="date" v-model="dateTo">
      </div>
      <div class="quick-buttons">
        <button @click="setQuickFilter('today')" :class="{ active: quickFilter === 'today' }">Today</button>
        <button @click="setQuickFilter('week')" :class="{ active: quickFilter === 'week' }">This Week</button>
        <button @click="setQuickFilter('month')" :class="{ active: quickFilter === 'month' }">This Month</button>
        <button @click="setQuickFilter('year')" :class="{ active: quickFilter === 'year' }">This Year</button>
      </div>
      <button class="btn-primary" @click="fetchReport">Apply</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading report...</p>
    </div>

    <!-- Report Content -->
    <div v-else>
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="card-info">
            <h3>{{ formatCurrency(totalRevenue) }}</h3>
            <p>Total Revenue</p>
            <span :class="['trend', revenueTrend >= 0 ? 'positive' : 'negative']">
              <i :class="revenueTrend >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
              {{ Math.abs(revenueTrend) }}%
            </span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <div class="card-info">
            <h3>{{ totalTransactions }}</h3>
            <p>Transactions</p>
            <span :class="['trend', transactionsTrend >= 0 ? 'positive' : 'negative']">
              <i :class="transactionsTrend >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
              {{ Math.abs(transactionsTrend) }}%
            </span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-receipt"></i>
          </div>
          <div class="card-info">
            <h3>{{ formatCurrency(averageTransaction) }}</h3>
            <p>Average Transaction</p>
            <span :class="['trend', avgTrend >= 0 ? 'positive' : 'negative']">
              <i :class="avgTrend >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
              {{ Math.abs(avgTrend) }}%
            </span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-ticket-alt"></i>
          </div>
          <div class="card-info">
            <h3>{{ totalCouponsUsed }}</h3>
            <p>Coupons Used</p>
            <span :class="['trend', couponTrend >= 0 ? 'positive' : 'negative']">
              <i :class="couponTrend >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
              {{ Math.abs(couponTrend) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Revenue Chart -->
      <div class="chart-card">
        <h3>Revenue Trend</h3>
        <canvas ref="revenueChart"></canvas>
      </div>

      <!-- Category Breakdown -->
      <div class="category-card">
        <h3>Revenue by Category</h3>
        <div class="category-grid">
          <div v-for="category in categoryRevenue" :key="category.name" class="category-item">
            <div class="category-header">
              <div class="category-info">
                <div class="category-color" :style="{ background: category.color }"></div>
                <span class="category-name">{{ category.name }}</span>
              </div>
              <span class="category-revenue">{{ formatCurrency(category.revenue) }}</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: category.percentage + '%', background: category.color }"
              ></div>
            </div>
            <div class="category-stats">
              <span>{{ category.itemsSold }} items sold</span>
              <span>{{ category.percentage }}% of total</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Daily Breakdown Table -->
      <div class="daily-card">
        <h3>Daily Breakdown</h3>
        <div class="table-container">
          <table class="daily-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Transactions</th>
                <th>Items Sold</th>
                <th>Coupons Used</th>
                <th>Revenue</th>
                <th>Avg Transaction</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="day in dailyBreakdown" :key="day.date">
                <td class="date">{{ formatDate(day.date) }}</td>
                <td>{{ day.transactions }}</td>
                <td>{{ day.itemsSold }}</td>
                <td>{{ day.couponsUsed }}</td>
                <td class="revenue">{{ formatCurrency(day.revenue) }}</td>
                <td>{{ formatCurrency(day.revenue / day.transactions) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payment Method Breakdown -->
      <div class="payment-card">
        <h3>Payment Method Breakdown</h3>
        <div class="payment-grid">
          <div v-for="method in paymentMethods" :key="method.name" class="payment-item">
            <div class="payment-header">
              <i :class="getPaymentIcon(method.name)"></i>
              <span class="payment-name">{{ method.name }}</span>
              <span class="payment-percentage">{{ method.percentage }}%</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: method.percentage + '%', background: method.color }"
              ></div>
            </div>
            <div class="payment-amount">{{ formatCurrency(method.amount) }}</div>
          </div>
        </div>
      </div>

      <!-- Peak Hours Analysis -->
      <div class="peak-hours-card">
        <h3>Peak Hours Analysis</h3>
        <div class="peak-hours-grid">
          <div v-for="hour in peakHours" :key="hour.hour" class="peak-hour-item">
            <div class="hour-label">{{ hour.hour }}:00 - {{ hour.hour + 1 }}:00</div>
            <div class="hour-revenue">{{ formatCurrency(hour.revenue) }}</div>
            <div class="hour-bar">
              <div class="bar-fill" :style="{ width: (hour.revenue / maxHourlyRevenue * 100) + '%' }"></div>
            </div>
            <div class="hour-transactions">{{ hour.transactions }} transactions</div>
          </div>
        </div>
      </div>

      <!-- Profit Analysis -->
      <div class="profit-card">
        <h3>Profit Analysis</h3>
        <div class="profit-grid">
          <div class="profit-item">
            <label>Total Revenue</label>
            <span class="value">{{ formatCurrency(totalRevenue) }}</span>
          </div>
          <div class="profit-item">
            <label>Total Cost of Goods</label>
            <span class="value">{{ formatCurrency(totalCost) }}</span>
          </div>
          <div class="profit-item">
            <label>Gross Profit</label>
            <span class="value profit">{{ formatCurrency(grossProfit) }}</span>
          </div>
          <div class="profit-item">
            <label>Profit Margin</label>
            <span class="value profit">{{ profitMargin }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import Chart from 'chart.js/auto'

export default {
  name: 'RevenueSummary',
  setup() {
    const loading = ref(false)
    const dateFrom = ref('')
    const dateTo = ref('')
    const quickFilter = ref('')
    const revenueChart = ref(null)
    
    let revenueChartInstance = null
    
    const dailyBreakdown = ref([
      { date: '2024-03-15', transactions: 58, itemsSold: 158, couponsUsed: 152, revenue: 9450 },
      { date: '2024-03-14', transactions: 55, itemsSold: 150, couponsUsed: 145, revenue: 8950 },
      { date: '2024-03-13', transactions: 61, itemsSold: 168, couponsUsed: 162, revenue: 10100 },
      { date: '2024-03-12', transactions: 48, itemsSold: 132, couponsUsed: 128, revenue: 7900 },
      { date: '2024-03-11', transactions: 52, itemsSold: 145, couponsUsed: 140, revenue: 8650 },
      { date: '2024-03-10', transactions: 45, itemsSold: 120, couponsUsed: 115, revenue: 7200 }
    ])
    
    const categoryRevenue = ref([
      { name: 'Drinks', revenue: 54000, itemsSold: 630, percentage: 56, color: '#EFCA71' },
      { name: 'Food', revenue: 43600, itemsSold: 470, percentage: 44, color: '#F2E9C6' }
    ])
    
    const paymentMethods = ref([
      { name: 'Cash', amount: 45200, percentage: 52, color: '#4CAF50' },
      { name: 'TeleBirr', amount: 21800, percentage: 25, color: '#1976D2' },
      { name: 'CBE Birr', amount: 12000, percentage: 14, color: '#F57C00' },
      { name: 'Card', amount: 7800, percentage: 9, color: '#9C27B0' }
    ])
    
    const peakHours = ref([
      { hour: 12, revenue: 1650, transactions: 12 },
      { hour: 13, revenue: 1440, transactions: 10 },
      { hour: 14, revenue: 1260, transactions: 9 },
      { hour: 18, revenue: 1200, transactions: 8 },
      { hour: 11, revenue: 720, transactions: 6 },
      { hour: 19, revenue: 960, transactions: 7 }
    ])
    
    const totalRevenue = computed(() => {
      return dailyBreakdown.value.reduce((sum, d) => sum + d.revenue, 0)
    })
    
    const totalTransactions = computed(() => {
      return dailyBreakdown.value.reduce((sum, d) => sum + d.transactions, 0)
    })
    
    const averageTransaction = computed(() => {
      if (totalTransactions.value === 0) return 0
      return totalRevenue.value / totalTransactions.value
    })
    
    const totalCouponsUsed = computed(() => {
      return dailyBreakdown.value.reduce((sum, d) => sum + d.couponsUsed, 0)
    })
    
    const totalCost = computed(() => {
      return totalRevenue.value * 0.4 // Assuming 40% cost of goods
    })
    
    const grossProfit = computed(() => {
      return totalRevenue.value - totalCost.value
    })
    
    const profitMargin = computed(() => {
      if (totalRevenue.value === 0) return 0
      return Math.round((grossProfit.value / totalRevenue.value) * 100)
    })
    
    const maxHourlyRevenue = computed(() => {
      return Math.max(...peakHours.value.map(h => h.revenue))
    })
    
    const revenueTrend = ref(12.5)
    const transactionsTrend = ref(8.3)
    const avgTrend = ref(4.2)
    const couponTrend = ref(10.1)
    
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(value)
    }
    
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }
    
    const getPaymentIcon = (method) => {
      const icons = {
        Cash: 'fas fa-money-bill-wave',
        TeleBirr: 'fas fa-mobile-alt',
        'CBE Birr': 'fas fa-university',
        Card: 'fas fa-credit-card'
      }
      return icons[method] || 'fas fa-money-bill-wave'
    }
    
    const setQuickFilter = (filter) => {
      quickFilter.value = filter
      const today = new Date()
      const endDate = today.toISOString().split('T')[0]
      
      if (filter === 'today') {
        dateFrom.value = endDate
        dateTo.value = endDate
      } else if (filter === 'week') {
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - 7)
        dateFrom.value = weekStart.toISOString().split('T')[0]
        dateTo.value = endDate
      } else if (filter === 'month') {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        dateFrom.value = monthStart.toISOString().split('T')[0]
        dateTo.value = endDate
      } else if (filter === 'year') {
        const yearStart = new Date(today.getFullYear(), 0, 1)
        dateFrom.value = yearStart.toISOString().split('T')[0]
        dateTo.value = endDate
      }
      fetchReport()
    }
    
    const fetchReport = async () => {
      loading.value = true
      try {
        // API call to fetch revenue summary
        setTimeout(() => {
          loading.value = false
          initRevenueChart()
        }, 500)
      } catch (error) {
        console.error('Error fetching report:', error)
        loading.value = false
      }
    }
    
    const initRevenueChart = () => {
      if (revenueChartInstance) revenueChartInstance.destroy()
      
      const ctx = revenueChart.value?.getContext('2d')
      if (!ctx) return
      
      revenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dailyBreakdown.value.map(d => formatDate(d.date)),
          datasets: [
            {
              label: 'Revenue (ETB)',
              data: dailyBreakdown.value.map(d => d.revenue),
              borderColor: '#EFCA71',
              backgroundColor: 'rgba(239, 202, 113, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Transactions',
              data: dailyBreakdown.value.map(d => d.transactions),
              borderColor: '#F4A261',
              backgroundColor: 'rgba(244, 162, 97, 0.1)',
              tension: 0.4,
              fill: true,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Revenue (ETB)'
              }
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              title: {
                display: true,
                text: 'Transactions'
              },
              grid: {
                drawOnChartArea: false
              }
            }
          }
        }
      })
    }
    
    const exportReport = () => {
      alert('Export functionality coming soon')
    }
    
    const printReport = () => {
      window.print()
    }
    
    onMounted(() => {
      // Set default date range (last 7 days)
      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - 6)
      dateFrom.value = weekStart.toISOString().split('T')[0]
      dateTo.value = today.toISOString().split('T')[0]
      fetchReport()
    })
    
    return {
      loading,
      dateFrom,
      dateTo,
      quickFilter,
      dailyBreakdown,
      categoryRevenue,
      paymentMethods,
      peakHours,
      revenueChart,
      totalRevenue,
      totalTransactions,
      averageTransaction,
      totalCouponsUsed,
      totalCost,
      grossProfit,
      profitMargin,
      maxHourlyRevenue,
      revenueTrend,
      transactionsTrend,
      avgTrend,
      couponTrend,
      formatCurrency,
      formatDate,
      getPaymentIcon,
      setQuickFilter,
      fetchReport,
      exportReport,
      printReport
    }
  }
}
</script>

<style scoped>
.revenue-summary {
  padding: 24px;
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
}

.btn-secondary:hover {
  background: #E5E5E2;
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

.btn-primary:hover {
  transform: translateY(-1px);
}

.date-range-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  gap: 20px;
  align-items: flex-end;
  flex-wrap: wrap;
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

.loading-state i {
  font-size: 48px;
  color: #EFCA71;
  margin-bottom: 16px;
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
  position: relative;
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

.trend {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}

.trend.positive {
  background: #E8F5E9;
  color: #4CAF50;
}

.trend.negative {
  background: #FFEBEE;
  color: #F44336;
}

.chart-card,
.category-card,
.daily-card,
.payment-card,
.peak-hours-card,
.profit-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.chart-card h3,
.category-card h3,
.daily-card h3,
.payment-card h3,
.peak-hours-card h3,
.profit-card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #332F2E;
}

.chart-card canvas {
  height: 400px;
}

.category-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.category-item {
  padding: 12px;
  background: #F9F7EB;
  border-radius: 12px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
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
  width: 100%;
  height: 8px;
  background: #E5E5E2;
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

.table-container {
  overflow-x: auto;
}

.daily-table {
  width: 100%;
  border-collapse: collapse;
}

.daily-table th {
  text-align: left;
  padding: 12px;
  background: #F9F7EB;
  font-weight: 600;
  color: #332F2E;
}

.daily-table td {
  padding: 12px;
  border-bottom: 1px solid #F0F0F0;
}

.date {
  font-weight: 500;
}

.revenue {
  font-weight: 600;
  color: #EFCA71;
}

.payment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.payment-item {
  padding: 16px;
  background: #F9F7EB;
  border-radius: 12px;
}

.payment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.payment-header i {
  font-size: 20px;
  color: #EFCA71;
}

.payment-name {
  flex: 1;
  font-weight: 600;
  color: #332F2E;
}

.payment-percentage {
  font-weight: 600;
  color: #EFCA71;
}

.payment-amount {
  margin-top: 8px;
  text-align: right;
  font-weight: 600;
  color: #332F2E;
}

.peak-hours-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.peak-hour-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #F9F7EB;
  border-radius: 12px;
  flex-wrap: wrap;
}

.hour-label {
  width: 100px;
  font-weight: 600;
  color: #332F2E;
}

.hour-revenue {
  width: 120px;
  font-weight: 600;
  color: #EFCA71;
}

.hour-bar {
  flex: 1;
  height: 8px;
  background: #E5E5E2;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #EFCA71;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.hour-transactions {
  width: 120px;
  font-size: 12px;
  color: #8C8C90;
}

.profit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.profit-item {
  text-align: center;
  padding: 16px;
  background: #F9F7EB;
  border-radius: 12px;
}

.profit-item label {
  display: block;
  font-size: 12px;
  color: #8C8C90;
  margin-bottom: 8px;
}

.profit-item .value {
  font-size: 24px;
  font-weight: 700;
  color: #332F2E;
}

.profit-item .value.profit {
  color: #4CAF50;
}

@media (max-width: 768px) {
  .revenue-summary {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-range-card {
    flex-direction: column;
    align-items: stretch;
  }
  
  .quick-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .payment-grid {
    grid-template-columns: 1fr;
  }
  
  .peak-hour-item {
    flex-direction: column;
    text-align: center;
  }
  
  .hour-label,
  .hour-revenue,
  .hour-transactions {
    width: auto;
  }
  
  .profit-grid {
    grid-template-columns: 1fr;
  }
}
</style>