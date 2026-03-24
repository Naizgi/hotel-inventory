<template>
  <div class="fast-moving-items">
    <div class="page-header">
      <h1 class="page-title">Fast Moving Items</h1>
      <div class="header-actions">
        <button class="btn-secondary" @click="exportReport">
          <i class="fas fa-download"></i> Export
        </button>
        <button class="btn-secondary" @click="setDateRange('week')">
          <i class="fas fa-calendar-week"></i> This Week
        </button>
        <button class="btn-secondary" @click="setDateRange('month')">
          <i class="fas fa-calendar-alt"></i> This Month
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
            <i class="fas fa-rocket"></i>
          </div>
          <div class="card-info">
            <h3>{{ topItems.length }}</h3>
            <p>Fast Moving Items</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="card-info">
            <h3>{{ totalQuantitySold }}</h3>
            <p>Total Units Sold</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="card-info">
            <h3>{{ formatCurrency(totalRevenue) }}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-chart-bar"></i>
          </div>
          <div class="card-info">
            <h3>{{ formatCurrency(averageRevenuePerItem) }}</h3>
            <p>Avg Revenue/Item</p>
          </div>
        </div>
      </div>

      <!-- Top Items Chart -->
      <div class="chart-card">
        <h3>Top 10 Fast Moving Items</h3>
        <canvas ref="topItemsChart"></canvas>
      </div>

      <!-- Items Table -->
      <div class="items-table-card">
        <h3>Detailed Item Performance</h3>
        <div class="table-container">
          <table class="items-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Item</th>
                <th>Category</th>
                <th>Units Sold</th>
                <th>Revenue</th>
                <th>% of Total</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in topItems" :key="item.id">
                <td class="rank">#{{ index + 1 }}</td>
                <td class="item-name">
                  <div class="item-info">
                    <div class="item-icon" :style="{ background: item.color }">
                      <i :class="item.icon"></i>
                    </div>
                    <span>{{ item.name }}</span>
                  </div>
                </td>
                <td>
                  <span :class="['category-badge', item.category]">
                    {{ item.category }}
                  </span>
                </td>
                <td class="quantity">{{ item.quantity }}</td>
                <td class="revenue">{{ formatCurrency(item.revenue) }}</td>
                <td class="percentage">{{ item.percentage }}%</td>
                <td class="trend">
                  <span :class="['trend-badge', item.trend]">
                    <i :class="item.trend === 'up' ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
                    {{ Math.abs(item.trendValue) }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Daily Breakdown -->
      <div class="daily-breakdown-card">
        <h3>Daily Breakdown</h3>
        <div class="table-container">
          <table class="daily-table">
            <thead>
              <tr>
                <th>Date</th>
                <th v-for="item in topItems.slice(0, 5)" :key="item.id">
                  {{ item.name }}
                </th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="day in dailyBreakdown" :key="day.date">
                <td class="date">{{ formatDate(day.date) }}</td>
                <td v-for="item in topItems.slice(0, 5)" :key="item.id">
                  {{ day.items[item.id] || 0 }}
                </td>
                <td class="total">{{ day.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import Chart from 'chart.js/auto'

export default {
  name: 'FastMovingItems',
  setup() {
    const loading = ref(false)
    const dateFrom = ref('')
    const dateTo = ref('')
    const topItemsChart = ref(null)
    
    let topItemsChartInstance = null
    
    const topItems = ref([
      { id: 1, name: 'Beer', category: 'drink', quantity: 325, revenue: 19500, percentage: 32, trend: 'up', trendValue: 15, icon: 'fas fa-beer', color: '#F4A261' },
      { id: 2, name: 'Wine', category: 'drink', quantity: 120, revenue: 18000, percentage: 29, trend: 'up', trendValue: 8, icon: 'fas fa-wine-bottle', color: '#9C6B42' },
      { id: 3, name: 'Shiro', category: 'food', quantity: 163, revenue: 13040, percentage: 21, trend: 'down', trendValue: 3, icon: 'fas fa-utensils', color: '#E9C46A' },
      { id: 4, name: 'Tibs', category: 'food', quantity: 85, revenue: 10200, percentage: 17, trend: 'up', trendValue: 12, icon: 'fas fa-utensil-spoon', color: '#E76F51' },
      { id: 5, name: 'Cocktail', category: 'drink', quantity: 45, revenue: 8100, percentage: 13, trend: 'up', trendValue: 25, icon: 'fas fa-cocktail', color: '#2A9D8F' }
    ])
    
    const dailyBreakdown = ref([
      { date: '2024-03-15', items: { 1: 85, 2: 32, 3: 41, 4: 25, 5: 12 }, total: 195 },
      { date: '2024-03-14', items: { 1: 78, 2: 28, 3: 44, 4: 22, 5: 10 }, total: 182 },
      { date: '2024-03-13', items: { 1: 92, 2: 35, 3: 41, 4: 28, 5: 15 }, total: 211 },
      { date: '2024-03-12', items: { 1: 70, 2: 25, 3: 37, 4: 10, 5: 8 }, total: 150 }
    ])
    
    const totalQuantitySold = computed(() => {
      return topItems.value.reduce((sum, i) => sum + i.quantity, 0)
    })
    
    const totalRevenue = computed(() => {
      return topItems.value.reduce((sum, i) => sum + i.revenue, 0)
    })
    
    const averageRevenuePerItem = computed(() => {
      if (totalQuantitySold.value === 0) return 0
      return totalRevenue.value / totalQuantitySold.value
    })
    
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(value)
    }
    
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
    
    const setDateRange = (range) => {
      const today = new Date()
      if (range === 'week') {
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - 7)
        dateFrom.value = weekStart.toISOString().split('T')[0]
        dateTo.value = today.toISOString().split('T')[0]
      } else if (range === 'month') {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        dateFrom.value = monthStart.toISOString().split('T')[0]
        dateTo.value = today.toISOString().split('T')[0]
      }
      fetchReport()
    }
    
    const fetchReport = async () => {
      loading.value = true
      try {
        // API call to fetch fast moving items
        // const response = await fetch(`/api/reports/fast-moving?from=${dateFrom.value}&to=${dateTo.value}`)
        // const data = await response.json()
        // topItems.value = data.items
        // dailyBreakdown.value = data.dailyBreakdown
        
        setTimeout(() => {
          loading.value = false
          initTopItemsChart()
        }, 500)
      } catch (error) {
        console.error('Error fetching report:', error)
        loading.value = false
      }
    }
    
    const initTopItemsChart = () => {
      if (topItemsChartInstance) topItemsChartInstance.destroy()
      
      const ctx = topItemsChart.value?.getContext('2d')
      if (!ctx) return
      
      topItemsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: topItems.value.map(i => i.name),
          datasets: [
            {
              label: 'Units Sold',
              data: topItems.value.map(i => i.quantity),
              backgroundColor: '#EFCA71',
              borderRadius: 8
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
                text: 'Units Sold'
              }
            }
          }
        }
      })
    }
    
    const exportReport = () => {
      alert('Export functionality coming soon')
    }
    
    onMounted(() => {
      // Set default date range (last 7 days)
      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - 7)
      dateFrom.value = weekStart.toISOString().split('T')[0]
      dateTo.value = today.toISOString().split('T')[0]
      fetchReport()
    })
    
    return {
      loading,
      dateFrom,
      dateTo,
      topItems,
      dailyBreakdown,
      topItemsChart,
      totalQuantitySold,
      totalRevenue,
      averageRevenuePerItem,
      formatCurrency,
      formatDate,
      setDateRange,
      fetchReport,
      exportReport
    }
  }
}
</script>

<style scoped>
.fast-moving-items {
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
.items-table-card,
.daily-breakdown-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.chart-card h3,
.items-table-card h3,
.daily-breakdown-card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #332F2E;
}

.chart-card canvas {
  height: 400px;
}

.table-container {
  overflow-x: auto;
}

.items-table,
.daily-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.daily-table th {
  text-align: left;
  padding: 12px;
  background: #F9F7EB;
  font-weight: 600;
  color: #332F2E;
}

.items-table td,
.daily-table td {
  padding: 12px;
  border-bottom: 1px solid #F0F0F0;
}

.rank {
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

.quantity {
  font-weight: 600;
  color: #332F2E;
}

.revenue {
  font-weight: 600;
  color: #EFCA71;
}

.percentage {
  font-weight: 600;
}

.trend-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.trend-badge.up {
  background: #E8F5E9;
  color: #4CAF50;
}

.trend-badge.down {
  background: #FFEBEE;
  color: #F44336;
}

.date {
  font-weight: 500;
}

.total {
  font-weight: 600;
  color: #EFCA71;
}

@media (max-width: 768px) {
  .fast-moving-items {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .items-table,
  .daily-table {
    font-size: 12px;
  }
}
</style>