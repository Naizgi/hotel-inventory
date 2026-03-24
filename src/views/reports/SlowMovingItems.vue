<template>
  <div class="slow-moving-items">
    <div class="page-header">
      <h1 class="page-title">Slow Moving Items</h1>
      <div class="header-actions">
        <button class="btn-secondary" @click="exportReport">
          <i class="fas fa-download"></i> Export
        </button>
        <button class="btn-primary" @click="showPromotionModal">
          <i class="fas fa-chart-line"></i> Promote Items
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
        <div class="summary-card warning">
          <div class="card-icon">
            <i class="fas fa-turtle"></i>
          </div>
          <div class="card-info">
            <h3>{{ slowItems.length }}</h3>
            <p>Slow Moving Items</p>
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
            <h3>{{ avgDaysSinceLastSale }}</h3>
            <p>Avg Days Since Last Sale</p>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="items-table-card">
        <h3>Slow Moving Items Analysis</h3>
        <div class="table-container">
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Units Sold</th>
                <th>Revenue</th>
                <th>Days Since Last Sale</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
              </thead>
            <tbody>
              <tr v-for="item in slowItems" :key="item.id">
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
                <td>
                  <span :class="['days-badge', getDaysClass(item.daysSinceLastSale)]">
                    {{ item.daysSinceLastSale }} days
                  </span>
                </td>
                <td>
                  <span :class="['status-badge', getStatusClass(item.daysSinceLastSale)]">
                    {{ getStatusText(item.daysSinceLastSale) }}
                  </span>
                </td>
                <td class="actions">
                  <button class="btn-icon" @click="promoteItem(item)" title="Promote Item">
                    <i class="fas fa-chart-line"></i>
                  </button>
                  <button class="btn-icon" @click="adjustPrice(item)" title="Adjust Price">
                    <i class="fas fa-tag"></i>
                  </button>
                  <button class="btn-icon" @click="viewDetails(item)" title="View Details">
                    <i class="fas fa-eye"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recommendations Card -->
      <div class="recommendations-card">
        <h3>Recommendations</h3>
        <div class="recommendations-list">
          <div v-for="rec in recommendations" :key="rec.id" class="recommendation-item">
            <div class="rec-icon" :class="rec.type">
              <i :class="rec.icon"></i>
            </div>
            <div class="rec-content">
              <div class="rec-title">{{ rec.title }}</div>
              <div class="rec-description">{{ rec.description }}</div>
            </div>
            <button class="rec-action" @click="applyRecommendation(rec)">
              {{ rec.action }}
            </button>
          </div>
        </div>
      </div>

      <!-- Sales Trend Chart -->
      <div class="chart-card">
        <h3>Sales Trend (Last 30 Days)</h3>
        <canvas ref="trendChart"></canvas>
      </div>
    </div>

    <!-- Promotion Modal -->
    <div v-if="showPromotionModal" class="modal" @click.self="closePromotionModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Promote Items</h2>
          <button class="close-btn" @click="closePromotionModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="promotion-items">
            <div v-for="item in slowItems" :key="item.id" class="promotion-item">
              <label class="checkbox-label">
                <input type="checkbox" v-model="item.selected">
                <div class="item-info">
                  <div class="item-icon" :style="{ background: item.color }">
                    <i :class="item.icon"></i>
                  </div>
                  <div>
                    <div class="item-name">{{ item.name }}</div>
                    <div class="item-stats">{{ item.daysSinceLastSale }} days since last sale</div>
                  </div>
                </div>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>Promotion Type</label>
            <select v-model="promotionType">
              <option value="discount">Discount (%)</option>
              <option value="bundle">Bundle Deal</option>
              <option value="feature">Featured Item</option>
            </select>
          </div>
          <div class="form-group" v-if="promotionType === 'discount'">
            <label>Discount Percentage</label>
            <input type="number" v-model="discountValue" min="0" max="100">
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closePromotionModal">Cancel</button>
            <button class="btn-primary" @click="applyPromotion">Apply Promotion</button>
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
import Chart from 'chart.js/auto'

export default {
  name: 'SlowMovingItems',
  setup() {
    const loading = ref(false)
    const dateFrom = ref('')
    const dateTo = ref('')
    const isPromotionModalVisible = ref(false)  // Renamed this
    const promotionType = ref('discount')
    const discountValue = ref(10)
    const showToast = ref(false)
    const toastMessage = ref('')
    const trendChart = ref(null)
    
    let trendChartInstance = null
    
    const slowItems = ref([
      { id: 1, name: 'Special Cocktail', category: 'drink', quantity: 15, revenue: 2700, daysSinceLastSale: 12, selected: false, icon: 'fas fa-cocktail', color: '#2A9D8F' },
      { id: 2, name: 'Vegan Platter', category: 'food', quantity: 8, revenue: 960, daysSinceLastSale: 8, selected: false, icon: 'fas fa-leaf', color: '#6B4E71' },
      { id: 3, name: 'Premium Whiskey', category: 'drink', quantity: 12, revenue: 2400, daysSinceLastSale: 15, selected: false, icon: 'fas fa-glass-whiskey', color: '#E9C46A' },
      { id: 4, name: 'Seafood Pasta', category: 'food', quantity: 10, revenue: 1500, daysSinceLastSale: 10, selected: false, icon: 'fas fa-utensil-spoon', color: '#E76F51' }
    ])
    
    const recommendations = ref([
      {
        id: 1,
        type: 'discount',
        icon: 'fas fa-tag',
        title: '20% Discount on Special Cocktail',
        description: 'Offer a 20% discount to boost sales. Estimated impact: +40% sales',
        action: 'Apply Discount'
      },
      {
        id: 2,
        type: 'bundle',
        icon: 'fas fa-gift',
        title: 'Bundle Vegan Platter with Juice',
        description: 'Create a combo deal with popular items. Estimated impact: +35% sales',
        action: 'Create Bundle'
      },
      {
        id: 3,
        type: 'feature',
        icon: 'fas fa-star',
        title: 'Feature Premium Whiskey',
        description: 'Highlight on menu and train staff to recommend. Estimated impact: +50% sales',
        action: 'Feature Item'
      }
    ])
    
    const trendData = ref({
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Special Cocktail',
          data: [5, 3, 2, 1],
          borderColor: '#2A9D8F',
          tension: 0.4
        },
        {
          label: 'Vegan Platter',
          data: [3, 2, 2, 1],
          borderColor: '#6B4E71',
          tension: 0.4
        },
        {
          label: 'Premium Whiskey',
          data: [4, 3, 2, 2],
          borderColor: '#E9C46A',
          tension: 0.4
        }
      ]
    })
    
    const totalQuantitySold = computed(() => {
      return slowItems.value.reduce((sum, i) => sum + i.quantity, 0)
    })
    
    const totalRevenue = computed(() => {
      return slowItems.value.reduce((sum, i) => sum + i.revenue, 0)
    })
    
    const avgDaysSinceLastSale = computed(() => {
      if (slowItems.value.length === 0) return 0
      const sum = slowItems.value.reduce((sum, i) => sum + i.daysSinceLastSale, 0)
      return Math.round(sum / slowItems.value.length)
    })
    
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(value)
    }
    
    const getDaysClass = (days) => {
      if (days > 14) return 'critical'
      if (days > 7) return 'warning'
      return 'normal'
    }
    
    const getStatusClass = (days) => {
      if (days > 14) return 'critical'
      if (days > 7) return 'warning'
      return 'normal'
    }
    
    const getStatusText = (days) => {
      if (days > 14) return 'Very Slow'
      if (days > 7) return 'Slow'
      return 'Moderate'
    }
    
    const fetchReport = async () => {
      loading.value = true
      try {
        // API call to fetch slow moving items
        setTimeout(() => {
          loading.value = false
          initTrendChart()
        }, 500)
      } catch (error) {
        console.error('Error fetching report:', error)
        loading.value = false
      }
    }
    
    const initTrendChart = () => {
      if (trendChartInstance) trendChartInstance.destroy()
      
      const ctx = trendChart.value?.getContext('2d')
      if (!ctx) return
      
      trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: trendData.value,
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
    
    const promoteItem = (item) => {
      showSuccessToast(`Promotion started for ${item.name}`)
    }
    
    const adjustPrice = (item) => {
      showSuccessToast(`Price adjustment suggested for ${item.name}`)
    }
    
    const viewDetails = (item) => {
      showSuccessToast(`Viewing details for ${item.name}`)
    }
    
    // Renamed this function to openPromotionModal
    const openPromotionModal = () => {
      isPromotionModalVisible.value = true
    }
    
    const closePromotionModal = () => {
      isPromotionModalVisible.value = false
      slowItems.value.forEach(item => item.selected = false)
    }
    
    const applyPromotion = () => {
      const selectedItems = slowItems.value.filter(i => i.selected)
      if (selectedItems.length === 0) {
        showSuccessToast('Please select at least one item')
        return
      }
      
      showSuccessToast(`Promotion applied to ${selectedItems.length} items`)
      closePromotionModal()
    }
    
    const applyRecommendation = (rec) => {
      showSuccessToast(`Applying: ${rec.title}`)
    }
    
    const exportReport = () => {
      alert('Export functionality coming soon')
    }
    
    const showSuccessToast = (message) => {
      toastMessage.value = message
      showToast.value = true
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    }
    
    onMounted(() => {
      // Set default date range (last 30 days)
      const today = new Date()
      const monthStart = new Date(today)
      monthStart.setDate(today.getDate() - 30)
      dateFrom.value = monthStart.toISOString().split('T')[0]
      dateTo.value = today.toISOString().split('T')[0]
      fetchReport()
    })
    
    return {
      loading,
      dateFrom,
      dateTo,
      slowItems,
      recommendations,
      isPromotionModalVisible,  // Changed this
      promotionType,
      discountValue,
      showToast,
      toastMessage,
      trendChart,
      totalQuantitySold,
      totalRevenue,
      avgDaysSinceLastSale,
      formatCurrency,
      getDaysClass,
      getStatusClass,
      getStatusText,
      fetchReport,
      promoteItem,
      adjustPrice,
      viewDetails,
      openPromotionModal,  // Changed this
      closePromotionModal,
      applyPromotion,
      applyRecommendation,
      exportReport
    }
  }
}
</script>

<style scoped>
.slow-moving-items {
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

.summary-card.warning {
  border-left: 4px solid #F57C00;
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

.items-table-card,
.recommendations-card,
.chart-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.items-table-card h3,
.recommendations-card h3,
.chart-card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #332F2E;
}

.table-container {
  overflow-x: auto;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th {
  text-align: left;
  padding: 12px;
  background: #F9F7EB;
  font-weight: 600;
  color: #332F2E;
}

.items-table td {
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

.category-badge.food {
  background: #FFF3E0;
  color: #F57C00;
}

.quantity {
  font-weight: 600;
}

.revenue {
  font-weight: 600;
  color: #EFCA71;
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

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.normal {
  background: #E8F5E9;
  color: #4CAF50;
}

.status-badge.warning {
  background: #FFF3E0;
  color: #F57C00;
}

.status-badge.critical {
  background: #FFEBEE;
  color: #F44336;
}

.actions {
  display: flex;
  gap: 8px;
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

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.recommendation-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F9F7EB;
  border-radius: 12px;
}

.rec-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.rec-icon.discount {
  background: #E8F5E9;
  color: #4CAF50;
}

.rec-icon.bundle {
  background: #FFF3E0;
  color: #F57C00;
}

.rec-icon.feature {
  background: #E3F2FD;
  color: #1976D2;
}

.rec-content {
  flex: 1;
}

.rec-title {
  font-weight: 600;
  color: #332F2E;
  margin-bottom: 4px;
}

.rec-description {
  font-size: 12px;
  color: #8C8C90;
}

.rec-action {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

.chart-card canvas {
  height: 300px;
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
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

.promotion-items {
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.promotion-item {
  padding: 12px;
  border-bottom: 1px solid #F0F0F0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
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

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #332F2E;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
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
  .slow-moving-items {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .recommendation-item {
    flex-wrap: wrap;
  }
  
  .rec-action {
    width: 100%;
  }
}
</style>