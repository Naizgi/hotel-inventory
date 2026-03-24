<template>
  <div class="coupon-usage-report">
    <div class="page-header">
      <h1 class="page-title">Coupon Usage Report</h1>
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
            <i class="fas fa-ticket-alt"></i>
          </div>
          <div class="card-info">
            <h3>{{ totalCouponsIssued }}</h3>
            <p>Total Issued</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="card-info">
            <h3>{{ totalCouponsUsed }}</h3>
            <p>Total Used</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-hourglass-half"></i>
          </div>
          <div class="card-info">
            <h3>{{ totalCouponsRemaining }}</h3>
            <p>Remaining</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">
            <i class="fas fa-percent"></i>
          </div>
          <div class="card-info">
            <h3>{{ utilizationRate }}%</h3>
            <p>Utilization Rate</p>
          </div>
        </div>
      </div>

      <!-- Utilization Chart -->
      <div class="chart-card">
        <h3>Coupon Utilization by Item</h3>
        <canvas ref="utilizationChart"></canvas>
      </div>

      <!-- Items Table -->
      <div class="items-table-card">
        <h3>Coupon Usage by Item</h3>
        <div class="table-container">
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Issued</th>
                <th>Used</th>
                <th>Remaining</th>
                <th>Utilization</th>
                <th>Trend</th>
                </tr>
              </thead>
            <tbody>
              <tr v-for="item in couponItems" :key="item.id">
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
                <td class="issued">{{ item.issued }}</td>
                <td class="used">{{ item.used }}</td>
                <td class="remaining">{{ item.remaining }}</td>
                <td>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ 
                        width: item.utilization + '%',
                        background: getUtilizationColor(item.utilization)
                      }"
                    ></div>
                    <span class="progress-text">{{ item.utilization }}%</span>
                  </div>
                </td>
                <td>
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

      <!-- Hourly Usage Chart -->
      <div class="chart-card">
        <h3>Hourly Coupon Usage</h3>
        <canvas ref="hourlyChart"></canvas>
      </div>

      <!-- Waiter Performance -->
      <div class="waiter-card">
        <h3>Waiter Performance</h3>
        <div class="table-container">
          <table class="waiter-table">
            <thead>
              <tr>
                <th>Waiter</th>
                <th>Coupons Issued</th>
                <th>Coupons Used</th>
                <th>Conversion Rate</th>
                <th>Top Item</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="waiter in waiterPerformance" :key="waiter.id">
                <td class="waiter-name">
                  <div class="waiter-info">
                    <div class="waiter-avatar">
                      {{ getInitials(waiter.name) }}
                    </div>
                    <span>{{ waiter.name }}</span>
                  </div>
                </td>
                <td>{{ waiter.issued }}</td>
                <td>{{ waiter.used }}</td>
                <td>
                  <div class="conversion-bar">
                    <div 
                      class="conversion-fill" 
                      :style="{ width: waiter.conversionRate + '%' }"
                    ></div>
                    <span>{{ waiter.conversionRate }}%</span>
                  </div>
                </td>
                <td>{{ waiter.topItem }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="recommendations-card">
        <h3>Insights & Recommendations</h3>
        <div class="insights-list">
          <div v-for="insight in insights" :key="insight.id" class="insight-item">
            <div class="insight-icon" :class="insight.type">
              <i :class="insight.icon"></i>
            </div>
            <div class="insight-content">
              <div class="insight-title">{{ insight.title }}</div>
              <div class="insight-description">{{ insight.description }}</div>
            </div>
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
  name: 'CouponUsageReport',
  setup() {
    const loading = ref(false)
    const dateFrom = ref('')
    const dateTo = ref('')
    const utilizationChart = ref(null)
    const hourlyChart = ref(null)
    
    let utilizationChartInstance = null
    let hourlyChartInstance = null
    
    const couponItems = ref([
      { id: 1, name: 'Beer', category: 'drink', issued: 100, used: 85, remaining: 15, utilization: 85, trend: 'up', trendValue: 12, icon: 'fas fa-beer', color: '#F4A261' },
      { id: 2, name: 'Wine', category: 'drink', issued: 50, used: 40, remaining: 10, utilization: 80, trend: 'up', trendValue: 8, icon: 'fas fa-wine-bottle', color: '#9C6B42' },
      { id: 3, name: 'Whiskey', category: 'drink', issued: 40, used: 28, remaining: 12, utilization: 70, trend: 'down', trendValue: 5, icon: 'fas fa-glass-whiskey', color: '#E9C46A' },
      { id: 4, name: 'Cocktail', category: 'drink', issued: 35, used: 20, remaining: 15, utilization: 57, trend: 'up', trendValue: 15, icon: 'fas fa-cocktail', color: '#2A9D8F' },
      { id: 5, name: 'Soft Drinks', category: 'non-alcoholic', issued: 200, used: 150, remaining: 50, utilization: 75, trend: 'up', trendValue: 10, icon: 'fas fa-cola', color: '#E76F51' },
      { id: 6, name: 'Juice', category: 'non-alcoholic', issued: 100, used: 85, remaining: 15, utilization: 85, trend: 'up', trendValue: 20, icon: 'fas fa-apple-alt', color: '#88B788' }
    ])
    
    const hourlyUsage = ref([
      { hour: 10, usage: 15 },
      { hour: 11, usage: 25 },
      { hour: 12, usage: 45 },
      { hour: 13, usage: 55 },
      { hour: 14, usage: 48 },
      { hour: 15, usage: 42 },
      { hour: 16, usage: 38 },
      { hour: 17, usage: 35 },
      { hour: 18, usage: 40 },
      { hour: 19, usage: 32 },
      { hour: 20, usage: 28 }
    ])
    
    const waiterPerformance = ref([
      { id: 1, name: 'Abebe Bekele', issued: 45, used: 38, conversionRate: 84, topItem: 'Beer' },
      { id: 2, name: 'Almaz Tadese', issued: 38, used: 32, conversionRate: 84, topItem: 'Wine' },
      { id: 3, name: 'Chala Desta', issued: 42, used: 35, conversionRate: 83, topItem: 'Soft Drinks' },
      { id: 4, name: 'Meron Assefa', issued: 35, used: 30, conversionRate: 86, topItem: 'Juice' }
    ])
    
    const insights = ref([
      {
        id: 1,
        type: 'success',
        icon: 'fas fa-chart-line',
        title: 'High Utilization Alert',
        description: 'Beer and Juice have utilization rates above 85%. Consider increasing their daily quotas.'
      },
      {
        id: 2,
        type: 'warning',
        icon: 'fas fa-exclamation-triangle',
        title: 'Low Utilization Alert',
        description: 'Cocktail utilization is only 57%. Consider promoting this item or adjusting its quota.'
      },
      {
        id: 3,
        type: 'info',
        icon: 'fas fa-clock',
        title: 'Peak Hours Identified',
        description: 'Peak coupon usage occurs between 12:00-14:00. Ensure adequate stock during these hours.'
      },
      {
        id: 4,
        type: 'success',
        icon: 'fas fa-trophy',
        title: 'Top Performer',
        description: 'Meron Assefa has the highest conversion rate at 86%. Great job!'
      }
    ])
    
    const totalCouponsIssued = computed(() => {
      return couponItems.value.reduce((sum, i) => sum + i.issued, 0)
    })
    
    const totalCouponsUsed = computed(() => {
      return couponItems.value.reduce((sum, i) => sum + i.used, 0)
    })
    
    const totalCouponsRemaining = computed(() => {
      return couponItems.value.reduce((sum, i) => sum + i.remaining, 0)
    })
    
    const utilizationRate = computed(() => {
      if (totalCouponsIssued.value === 0) return 0
      return Math.round((totalCouponsUsed.value / totalCouponsIssued.value) * 100)
    })
    
    const getUtilizationColor = (utilization) => {
      if (utilization >= 80) return '#4CAF50'
      if (utilization >= 50) return '#EFCA71'
      return '#F44336'
    }
    
    const getInitials = (name) => {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(value)
    }
    
    const fetchReport = async () => {
      loading.value = true
      try {
        // API call to fetch coupon usage report
        setTimeout(() => {
          loading.value = false
          initCharts()
        }, 500)
      } catch (error) {
        console.error('Error fetching report:', error)
        loading.value = false
      }
    }
    
    const initCharts = () => {
      initUtilizationChart()
      initHourlyChart()
    }
    
    const initUtilizationChart = () => {
      if (utilizationChartInstance) utilizationChartInstance.destroy()
      
      const ctx = utilizationChart.value?.getContext('2d')
      if (!ctx) return
      
      utilizationChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: couponItems.value.map(i => i.name),
          datasets: [
            {
              label: 'Used',
              data: couponItems.value.map(i => i.used),
              backgroundColor: '#EFCA71',
              borderRadius: 8
            },
            {
              label: 'Remaining',
              data: couponItems.value.map(i => i.remaining),
              backgroundColor: '#E5E5E2',
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
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.raw} coupons`
                }
              }
            }
          },
          scales: {
            x: {
              stacked: true
            },
            y: {
              stacked: true,
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Coupons'
              }
            }
          }
        }
      })
    }
    
    const initHourlyChart = () => {
      if (hourlyChartInstance) hourlyChartInstance.destroy()
      
      const ctx = hourlyChart.value?.getContext('2d')
      if (!ctx) return
      
      hourlyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: hourlyUsage.value.map(h => `${h.hour}:00`),
          datasets: [
            {
              label: 'Coupons Used',
              data: hourlyUsage.value.map(h => h.usage),
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
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Coupons Used'
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
      weekStart.setDate(today.getDate() - 7)
      dateFrom.value = weekStart.toISOString().split('T')[0]
      dateTo.value = today.toISOString().split('T')[0]
      fetchReport()
    })
    
    return {
      loading,
      dateFrom,
      dateTo,
      couponItems,
      hourlyUsage,
      waiterPerformance,
      insights,
      utilizationChart,
      hourlyChart,
      totalCouponsIssued,
      totalCouponsUsed,
      totalCouponsRemaining,
      utilizationRate,
      getUtilizationColor,
      getInitials,
      formatCurrency,
      fetchReport,
      exportReport,
      printReport
    }
  }
}
</script>

<style scoped>
.coupon-usage-report {
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
.waiter-card,
.recommendations-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.chart-card h3,
.items-table-card h3,
.waiter-card h3,
.recommendations-card h3 {
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
.waiter-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.waiter-table th {
  text-align: left;
  padding: 12px;
  background: #F9F7EB;
  font-weight: 600;
  color: #332F2E;
}

.items-table td,
.waiter-table td {
  padding: 12px;
  border-bottom: 1px solid #F0F0F0;
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

.category-badge.non-alcoholic {
  background: #E8F5E9;
  color: #4CAF50;
}

.issued,
.used,
.remaining {
  font-weight: 600;
}

.used {
  color: #EFCA71;
}

.remaining {
  color: #4CAF50;
}

.progress-bar {
  position: relative;
  width: 100px;
  height: 24px;
  background: #F5F5F5;
  border-radius: 12px;
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 12px;
  transition: width 0.3s ease;
}

.progress-text {
  position: relative;
  display: block;
  text-align: center;
  line-height: 24px;
  font-size: 11px;
  font-weight: 600;
  color: #332F2E;
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

.waiter-name {
  font-weight: 500;
}

.waiter-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.waiter-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  color: #332F2E;
}

.conversion-bar {
  position: relative;
  width: 100px;
  height: 24px;
  background: #F5F5F5;
  border-radius: 12px;
  overflow: hidden;
}

.conversion-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #4CAF50;
  border-radius: 12px;
  transition: width 0.3s ease;
}

.conversion-bar span {
  position: relative;
  display: block;
  text-align: center;
  line-height: 24px;
  font-size: 11px;
  font-weight: 600;
  color: #332F2E;
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F9F7EB;
  border-radius: 12px;
}

.insight-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.insight-icon.success {
  background: #E8F5E9;
  color: #4CAF50;
}

.insight-icon.warning {
  background: #FFF3E0;
  color: #F57C00;
}

.insight-icon.info {
  background: #E3F2FD;
  color: #1976D2;
}

.insight-content {
  flex: 1;
}

.insight-title {
  font-weight: 600;
  color: #332F2E;
  margin-bottom: 4px;
}

.insight-description {
  font-size: 12px;
  color: #8C8C90;
}

@media (max-width: 768px) {
  .coupon-usage-report {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .items-table,
  .waiter-table {
    font-size: 12px;
  }
  
  .insight-item {
    flex-direction: column;
    text-align: center;
  }
}
</style>