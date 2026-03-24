<template>
  <div class="sales-history">
    <div class="page-header">
      <h1 class="page-title">Sales History</h1>
      <div class="header-actions">
        <button class="btn-secondary" @click="exportSales">
          <i class="fas fa-download"></i> Export
        </button>
        <button class="btn-secondary" @click="printReport">
          <i class="fas fa-print"></i> Print
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="card-info">
          <h3>{{ formatCurrency(totalSales) }}</h3>
          <p>Total Sales</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon">
          <i class="fas fa-ticket-alt"></i>
        </div>
        <div class="card-info">
          <h3>{{ totalCouponsUsed }}</h3>
          <p>Coupons Used</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <div class="card-info">
          <h3>{{ totalOrders }}</h3>
          <p>Total Orders</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon">
          <i class="fas fa-chart-bar"></i>
        </div>
        <div class="card-info">
          <h3>{{ formatCurrency(averageOrder) }}</h3>
          <p>Average Order</p>
        </div>
      </div>
    </div>

    <!-- Date Range Selector -->
    <div class="date-range-card">
      <div class="date-selector">
        <label>Period</label>
        <div class="date-inputs">
          <input type="date" v-model="dateFrom">
          <span>to</span>
          <input type="date" v-model="dateTo">
        </div>
      </div>
      <div class="quick-filters">
        <button @click="setQuickFilter('today')" :class="{ active: quickFilter === 'today' }">Today</button>
        <button @click="setQuickFilter('yesterday')" :class="{ active: quickFilter === 'yesterday' }">Yesterday</button>
        <button @click="setQuickFilter('week')" :class="{ active: quickFilter === 'week' }">This Week</button>
        <button @click="setQuickFilter('month')" :class="{ active: quickFilter === 'month' }">This Month</button>
      </div>
    </div>

    <!-- Chart -->
    <div class="chart-container">
      <h3>Sales Trend</h3>
      <canvas ref="salesChart"></canvas>
    </div>

    <!-- Top Selling Items -->
    <div class="top-items">
      <h3>Top Selling Items</h3>
      <div class="items-grid">
        <div v-for="item in topItems" :key="item.id" class="top-item">
          <div class="item-icon" :style="{ background: item.color }">
            <i :class="item.icon"></i>
          </div>
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-stats">
              <span>{{ item.quantity }} sold</span>
              <span>{{ formatCurrency(item.revenue) }}</span>
            </div>
          </div>
          <div class="item-percentage">{{ item.percentage }}%</div>
        </div>
      </div>
    </div>

    <!-- Daily Sales Table -->
    <div class="daily-sales">
      <h3>Daily Sales Breakdown</h3>
      <div class="sales-table-container">
        <table class="sales-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Orders</th>
              <th>Items Sold</th>
              <th>Coupons Used</th>
              <th>Revenue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in dailySalesData" :key="day.date">
              <td class="date">{{ formatDate(day.date) }}</td>
              <td>{{ day.orders }}</td>
              <td>{{ day.items_sold }}</td>
              <td>{{ day.coupons_used }}</td>
              <td class="revenue">{{ formatCurrency(day.revenue) }}</td>
              <td>
                <button class="btn-icon" @click="viewDayDetails(day)" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Day Details Modal -->
    <div v-if="showDayModal" class="modal" @click.self="closeDayModal">
      <div class="modal-content large">
        <div class="modal-header">
          <h2>Sales Details - {{ selectedDay?.date }}</h2>
          <button class="close-btn" @click="closeDayModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="day-summary">
            <div class="summary-item">
              <label>Total Revenue:</label>
              <span>{{ formatCurrency(selectedDay?.revenue) }}</span>
            </div>
            <div class="summary-item">
              <label>Orders:</label>
              <span>{{ selectedDay?.orders }}</span>
            </div>
            <div class="summary-item">
              <label>Coupons Used:</label>
              <span>{{ selectedDay?.coupons_used }}</span>
            </div>
          </div>
          
          <h4>Items Sold</h4>
          <table class="items-sold-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in selectedDay?.items" :key="item.name">
                <td>{{ item.name }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ formatCurrency(item.revenue) }}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="modal-actions">
            <button class="btn-primary" @click="printDayReport">
              <i class="fas fa-print"></i> Print Report
            </button>
            <button class="btn-secondary" @click="closeDayModal">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="showToast" class="toast success">
      <i class="fas fa-check-circle"></i>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import Chart from 'chart.js/auto'

export default {
  name: 'CashierSalesHistory',
  setup() {
    const toast = useToast()
    const dateFrom = ref('')
    const dateTo = ref('')
    const quickFilter = ref('')
    const showDayModal = ref(false)
    const selectedDay = ref(null)
    const showToast = ref(false)
    const toastMessage = ref('')
    const salesChart = ref(null)
    
    let salesChartInstance = null
    
    const dailySalesData = ref([
      { 
        date: '2024-03-15', 
        orders: 58, 
        items_sold: 158, 
        coupons_used: 152, 
        revenue: 9450,
        items: [
          { name: 'Beer', quantity: 85, revenue: 5100 },
          { name: 'Wine', quantity: 32, revenue: 4800 },
          { name: 'Shiro', quantity: 41, revenue: 3280 }
        ]
      },
      { 
        date: '2024-03-14', 
        orders: 55, 
        items_sold: 150, 
        coupons_used: 145, 
        revenue: 8950,
        items: [
          { name: 'Beer', quantity: 78, revenue: 4680 },
          { name: 'Wine', quantity: 28, revenue: 4200 },
          { name: 'Shiro', quantity: 44, revenue: 3520 }
        ]
      },
      { 
        date: '2024-03-13', 
        orders: 61, 
        items_sold: 168, 
        coupons_used: 162, 
        revenue: 10100,
        items: [
          { name: 'Beer', quantity: 92, revenue: 5520 },
          { name: 'Wine', quantity: 35, revenue: 5250 },
          { name: 'Shiro', quantity: 41, revenue: 3280 }
        ]
      },
      { 
        date: '2024-03-12', 
        orders: 48, 
        items_sold: 132, 
        coupons_used: 128, 
        revenue: 7900,
        items: [
          { name: 'Beer', quantity: 70, revenue: 4200 },
          { name: 'Wine', quantity: 25, revenue: 3750 },
          { name: 'Shiro', quantity: 37, revenue: 2960 }
        ]
      }
    ])
    
    const topItems = ref([
      { id: 1, name: 'Beer', quantity: 325, revenue: 19500, percentage: 32, icon: 'fas fa-beer', color: '#F4A261' },
      { id: 2, name: 'Wine', quantity: 120, revenue: 18000, percentage: 29, icon: 'fas fa-wine-bottle', color: '#9C6B42' },
      { id: 3, name: 'Shiro', quantity: 163, revenue: 13040, percentage: 21, icon: 'fas fa-utensils', color: '#E9C46A' },
      { id: 4, name: 'Tibs', quantity: 85, revenue: 10200, percentage: 17, icon: 'fas fa-utensil-spoon', color: '#E76F51' }
    ])
    
    const totalSales = computed(() => {
      return dailySalesData.value.reduce((sum, d) => sum + d.revenue, 0)
    })
    
    const totalCouponsUsed = computed(() => {
      return dailySalesData.value.reduce((sum, d) => sum + d.coupons_used, 0)
    })
    
    const totalOrders = computed(() => {
      return dailySalesData.value.reduce((sum, d) => sum + d.orders, 0)
    })
    
    const averageOrder = computed(() => {
      if (totalOrders.value === 0) return 0
      return totalSales.value / totalOrders.value
    })
    
    const filteredSales = computed(() => {
      let filtered = dailySalesData.value
      
      if (dateFrom.value) {
        filtered = filtered.filter(d => d.date >= dateFrom.value)
      }
      
      if (dateTo.value) {
        filtered = filtered.filter(d => d.date <= dateTo.value)
      }
      
      return filtered
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
        day: 'numeric',
        year: 'numeric'
      })
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
    }
    
    const initSalesChart = () => {
      if (salesChartInstance) salesChartInstance.destroy()
      
      const ctx = salesChart.value?.getContext('2d')
      if (!ctx) return
      
      const labels = filteredSales.value.map(d => formatDate(d.date))
      const revenues = filteredSales.value.map(d => d.revenue)
      const coupons = filteredSales.value.map(d => d.coupons_used)
      
      salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Revenue (ETB)',
              data: revenues,
              borderColor: '#EFCA71',
              backgroundColor: 'rgba(239, 202, 113, 0.1)',
              tension: 0.4,
              fill: true,
              yAxisID: 'y'
            },
            {
              label: 'Coupons Used',
              data: coupons,
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
                text: 'Coupons Used'
              },
              grid: {
                drawOnChartArea: false
              }
            }
          }
        }
      })
    }
    
    const viewDayDetails = (day) => {
      selectedDay.value = day
      showDayModal.value = true
    }
    
    const closeDayModal = () => {
      showDayModal.value = false
      selectedDay.value = null
    }
    
    const printDayReport = () => {
      showSuccessToast('Printing report...')
      window.print()
    }
    
    const exportSales = () => {
      showSuccessToast('Exporting sales data...')
      // Implement export logic
    }
    
    const printReport = () => {
      window.print()
    }
    
    const showSuccessToast = (message) => {
      toastMessage.value = message
      showToast.value = true
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    }
    
    onMounted(() => {
      // Set default date range (last 7 days)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - 6)
      dateFrom.value = startDate.toISOString().split('T')[0]
      dateTo.value = endDate.toISOString().split('T')[0]
      
      initSalesChart()
    })
    
    return {
      dateFrom,
      dateTo,
      quickFilter,
      showDayModal,
      selectedDay,
      showToast,
      toastMessage,
      salesChart,
      dailySalesData,
      topItems,
      totalSales,
      totalCouponsUsed,
      totalOrders,
      averageOrder,
      filteredSales,
      formatCurrency,
      formatDate,
      setQuickFilter,
      viewDayDetails,
      closeDayModal,
      printDayReport,
      exportSales,
      printReport
    }
  }
}
</script>

<style scoped>
.sales-history {
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

.btn-primary {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  color: #332F2E;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 202, 113, 0.3);
}

.btn-secondary {
  background: #F5F5F5;
  border: 1px solid #E5E5E2;
  padding: 12px 24px;
  border-radius: 12px;
  color: #6F6C6D;
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
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border-color: #EFCA71;
  color: #332F2E;
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

.top-items {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 32px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.top-items h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #332F2E;
}

.items-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #F9F7EB;
  border-radius: 12px;
}

.item-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: #332F2E;
  margin-bottom: 4px;
}

.item-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #8C8C90;
}

.item-percentage {
  font-size: 18px;
  font-weight: 700;
  color: #EFCA71;
}

.daily-sales {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.daily-sales h3 {
  padding: 20px;
  margin: 0;
  font-size: 18px;
  color: #332F2E;
  border-bottom: 1px solid #E5E5E2;
}

.sales-table-container {
  overflow-x: auto;
}

.sales-table {
  width: 100%;
  border-collapse: collapse;
}

.sales-table th {
  text-align: left;
  padding: 12px 20px;
  background: #F9F7EB;
  color: #332F2E;
  font-weight: 600;
}

.sales-table td {
  padding: 12px 20px;
  border-bottom: 1px solid #F0F0F0;
}

.date {
  font-weight: 500;
}

.revenue {
  font-weight: 600;
  color: #EFCA71;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E5E5E2;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #332F2E;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #8C8C90;
}

.modal-body {
  padding: 24px;
}

.day-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #F9F7EB;
  border-radius: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-item label {
  font-weight: 600;
  color: #6F6C6D;
}

.summary-item span {
  font-size: 18px;
  font-weight: 700;
  color: #EFCA71;
}

.items-sold-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
}

.items-sold-table th {
  text-align: left;
  padding: 8px;
  background: #F9F7EB;
  font-weight: 600;
}

.items-sold-table td {
  padding: 8px;
  border-bottom: 1px solid #F0F0F0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #4CAF50;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 2000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .sales-history {
    padding: 16px;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .date-range-card {
    flex-direction: column;
    align-items: stretch;
  }
  
  .quick-filters {
    flex-wrap: wrap;
  }
  
  .day-summary {
    grid-template-columns: 1fr;
  }
}
</style>