<template>
  <div class="daily-coupons">
    <div class="page-header">
      <h1 class="page-title">Daily Coupons</h1>
      <div class="date-info">
        <i class="fas fa-calendar"></i>
        <span>{{ currentDate }}</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading daily coupons...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button class="btn-primary" @click="refreshData">Try Again</button>
    </div>

    <div v-else>
      <!-- Day Progress -->
      <div class="day-progress-card">
        <div class="progress-header">
          <h3>Today's Coupon Usage</h3>
          <div class="progress-stats">
            <span class="used">{{ totalUsedToday }} used</span>
            <span class="remaining">{{ totalRemaining }} remaining</span>
          </div>
        </div>
        <div class="overall-progress">
          <div 
            class="progress-fill" 
            :style="{ width: utilizationRate + '%' }"
          ></div>
        </div>
        <div class="progress-label">{{ utilizationRate }}% Utilization</div>
      </div>

      <!-- Items Grid -->
      <div class="items-grid">
        <div v-for="item in items" :key="item.id" class="item-card">
          <div class="item-header">
            <div class="item-icon" :style="{ background: item.color }">
              <i :class="item.icon"></i>
            </div>
            <div class="item-name">{{ item.name }}</div>
            <span :class="['status-badge', getStatusClass(item)]">
              {{ getStatusText(item) }}
            </span>
          </div>
          
          <div class="item-stats">
            <div class="stat">
              <label>Daily Quota</label>
              <span class="value">{{ item.default_coupon }}</span>
            </div>
            <div class="stat">
              <label>Used Today</label>
              <span class="value used">{{ item.default_coupon - item.remaining }}</span>
            </div>
            <div class="stat">
              <label>Remaining</label>
              <span class="value remaining">{{ item.remaining }}</span>
            </div>
          </div>
          
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ 
                width: ((item.default_coupon - item.remaining) / item.default_coupon * 100) + '%',
                background: getProgressColor(item)
              }"
            ></div>
          </div>
          
          <div class="item-actions" v-if="canDistribute">
            <button class="btn-small" @click="distributeCoupons(item)">
              <i class="fas fa-hand-holding-heart"></i> Distribute
            </button>
            <button class="btn-small btn-view" @click="viewItemDetails(item)">
              <i class="fas fa-chart-line"></i> Details
            </button>
          </div>
        </div>
      </div>

      <!-- Hourly Breakdown -->
      <div class="hourly-breakdown">
        <h3>Hourly Usage Breakdown</h3>
        <div class="chart-container">
          <canvas ref="hourlyChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Item Details Modal -->
    <div v-if="showItemModal" class="modal" @click.self="closeItemModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ selectedItem?.name }} - Coupon Details</h2>
          <button class="close-btn" @click="closeItemModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="item-detail-card" v-if="selectedItem">
            <div class="detail-row">
              <label>Daily Quota:</label>
              <span>{{ selectedItem.default_coupon }}</span>
            </div>
            <div class="detail-row">
              <label>Used Today:</label>
              <span class="used">{{ selectedItem.default_coupon - selectedItem.remaining }}</span>
            </div>
            <div class="detail-row">
              <label>Remaining:</label>
              <span class="remaining">{{ selectedItem.remaining }}</span>
            </div>
            <div class="detail-row">
              <label>Utilization:</label>
              <span>{{ Math.round((selectedItem.default_coupon - selectedItem.remaining) / selectedItem.default_coupon * 100) }}%</span>
            </div>
            <div class="detail-row">
              <label>Status:</label>
              <span :class="['status-badge', getStatusClass(selectedItem)]">
                {{ getStatusText(selectedItem) }}
              </span>
            </div>
            <div class="detail-row" v-if="selectedItem.has_pending_request">
              <label>Pending Request:</label>
              <span class="pending">{{ selectedItem.pending_request_quantity }} units requested</span>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeItemModal">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Distribute Modal -->
    <div v-if="showDistributeModal" class="modal" @click.self="closeDistributeModal">
      <div class="modal-content small">
        <div class="modal-header">
          <h2>Distribute Coupons</h2>
          <button class="close-btn" @click="closeDistributeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="selected-item" v-if="selectedItem">
            <div class="item-icon" :style="{ background: selectedItem.color }">
              <i :class="selectedItem.icon"></i>
            </div>
            <div class="item-details">
              <div class="item-name">{{ selectedItem.name }}</div>
              <div class="item-remaining">{{ selectedItem.remaining }} coupons remaining</div>
            </div>
          </div>
          
          <form @submit.prevent="submitDistribution">
            <div class="form-group">
              <label>Quantity to Distribute</label>
              <input 
                type="number" 
                v-model.number="distributeQuantity" 
                required
                min="1"
                :max="selectedItem?.remaining"
              >
            </div>
            <div class="form-group">
              <label>Assign To</label>
              <select v-model="distributeTo" required>
                <option value="">Select waiter/waitress</option>
                <option v-for="waiter in waiters" :key="waiter.id" :value="waiter.name">
                  {{ waiter.name }}
                </option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="closeDistributeModal">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="isDistributing">
                <i v-if="isDistributing" class="fas fa-spinner fa-spin"></i>
                <span v-else>Distribute</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../../store/auth'
import Chart from 'chart.js/auto'
import api from '../../services/api';

export default {
  name: 'DailyCoupons',
  setup() {
    const authStore = useAuthStore()
    const loading = ref(true)
    const error = ref('')
    const isDistributing = ref(false)
    const showItemModal = ref(false)
    const showDistributeModal = ref(false)
    const selectedItem = ref(null)
    const distributeQuantity = ref(1)
    const distributeTo = ref('')
    const hourlyChart = ref(null)
    
    const items = ref([])
    const waiters = ref([])
    const hourlyData = ref([])
    
    let hourlyChartInstance = null
    let refreshInterval = null
    
    const currentDate = computed(() => {
      return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    })
    
    const totalUsedToday = computed(() => {
      return items.value.reduce((sum, i) => sum + (i.default_coupon - i.remaining), 0)
    })
    
    const totalRemaining = computed(() => {
      return items.value.reduce((sum, i) => sum + i.remaining, 0)
    })
    
    const totalQuota = computed(() => {
      return items.value.reduce((sum, i) => sum + i.default_coupon, 0)
    })
    
    const utilizationRate = computed(() => {
      if (totalQuota.value === 0) return 0
      return Math.round((totalUsedToday.value / totalQuota.value) * 100)
    })
    
    const canDistribute = computed(() => {
      const role = authStore.user?.role
      return role === 'barista' || role === 'admin'
    })
    
    const getAuthHeaders = () => {
      const token = localStorage.getItem('authToken')
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
    
    const getStatusClass = (item) => {
      const ratio = item.remaining / item.default_coupon
      if (ratio < 0.2) return 'critical'
      if (ratio < 0.5) return 'warning'
      return 'healthy'
    }
    
    const getStatusText = (item) => {
      const ratio = item.remaining / item.default_coupon
      if (ratio < 0.2) return 'Critical'
      if (ratio < 0.5) return 'Low'
      return 'Good'
    }
    
    const getProgressColor = (item) => {
      const ratio = item.remaining / item.default_coupon
      if (ratio < 0.2) return '#F44336'
      if (ratio < 0.5) return '#F57C00'
      return '#4CAF50'
    }
    
    const fetchDailyCoupons = async () => {
      try {
        const token = localStorage.getItem('authToken')
        
        if (!token) {
          error.value = 'No authentication token found. Please login again.'
          loading.value = false
          return
        }
        
        console.log('Fetching daily coupons...')
        const response = await api.get('/barista/inventory')
        
        if (response.status === 401 || response.status === 403) {
          error.value = 'Authentication failed. Please login again.'
          loading.value = false
          return
        }
        
        if (response.status === 200) {
          const data = await response.data
          console.log('Daily coupons data received:', data)
          
          if (Array.isArray(data) && data.length > 0) {
            items.value = data.map(item => ({
              id: item.id,
              name: item.name,
              category: item.category,
              price: item.price,
              default_coupon: item.default_coupon,
              remaining: item.remaining,
              has_pending_request: item.has_pending_request || false,
              pending_request_quantity: item.pending_request_quantity || 0,
              icon: item.icon || 'fas fa-cube',
              color: item.color || '#EFCA71'
            }))
            error.value = ''
          } else {
            console.warn('No inventory data received, using demo data')
            loadDemoData()
          }
        } else {
          console.error('Failed to fetch daily coupons:', response.status)
          loadDemoData()
        }
      } catch (err) {
        console.error('Error fetching daily coupons:', err)
        error.value = 'Failed to load data. Using demo data.'
        loadDemoData()
      } finally {
        loading.value = false
      }
    }
    
    const fetchWaiters = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const response = await api.get('/barista/waiters')
        
        if (response.status === 200) {
          const data = await response.data
          waiters.value = Array.isArray(data) ? data : []
        } else {
          console.error('Failed to fetch waiters:', response.status)
          loadDemoWaiters()
        }
      } catch (error) {
        console.error('Error fetching waiters:', error)
        loadDemoWaiters()
      }
    }
    
    const fetchHourlyData = async () => {
      try {
        // Generate demo hourly data for now
        const now = new Date()
        const currentHour = now.getHours()
        
        const hourly = []
        for (let i = 10; i <= currentHour; i++) {
          hourly.push({
            hour: i,
            usage: Math.floor(Math.random() * 50) + 10
          })
        }
        
        hourlyData.value = hourly
        initHourlyChart()
      } catch (error) {
        console.error('Error fetching hourly data:', error)
      }
    }
    
    const loadDemoData = () => {
      items.value = [
        { id: 1, name: 'Beer', icon: 'fas fa-beer', color: '#F4A261', default_coupon: 100, remaining: 45 },
        { id: 2, name: 'Wine', icon: 'fas fa-wine-bottle', color: '#9C6B42', default_coupon: 50, remaining: 30 },
        { id: 3, name: 'Whiskey', icon: 'fas fa-glass-whiskey', color: '#E9C46A', default_coupon: 40, remaining: 28 },
        { id: 4, name: 'Cocktail', icon: 'fas fa-cocktail', color: '#2A9D8F', default_coupon: 35, remaining: 20 },
        { id: 5, name: 'Soft Drinks', icon: 'fas fa-cola', color: '#E76F51', default_coupon: 200, remaining: 150 },
        { id: 6, name: 'Juice', icon: 'fas fa-apple-alt', color: '#88B788', default_coupon: 100, remaining: 85 }
      ]
    }
    
    const loadDemoWaiters = () => {
      waiters.value = [
        { id: 1, name: 'Abebe Bekele' },
        { id: 2, name: 'Almaz Tadese' },
        { id: 3, name: 'Chala Desta' }
      ]
    }
    
    const viewItemDetails = (item) => {
      selectedItem.value = item
      showItemModal.value = true
    }
    
    const closeItemModal = () => {
      showItemModal.value = false
      selectedItem.value = null
    }
    
    const distributeCoupons = (item) => {
      selectedItem.value = item
      distributeQuantity.value = 1
      distributeTo.value = ''
      showDistributeModal.value = true
    }
    
    const closeDistributeModal = () => {
      showDistributeModal.value = false
      selectedItem.value = null
    }
    
    const submitDistribution = async () => {
      if (!distributeQuantity.value || !distributeTo.value) return
      
      isDistributing.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await api.post('/barista/distribute', {
          item_id: selectedItem.value.id,
          quantity: distributeQuantity.value,
            assigned_to: distributeTo.value,
            notes: ''
          })
      
        
        if (response.status === 401 || response.status === 403) {
          alert('Session expired. Please login again.')
          return
        }
        
        if (response.status === 200) {
          const result = await response.data
          
          // Update local data
          selectedItem.value.remaining -= distributeQuantity.value
          
          alert(`Successfully distributed ${distributeQuantity.value} coupons to ${distributeTo.value}`)
          closeDistributeModal()
          
          // Refresh data
          await fetchDailyCoupons()
        } else {
          const error = await response.json()
          alert(error.detail || 'Distribution failed')
        }
      } catch (error) {
        console.error('Error distributing coupons:', error)
        alert('Error distributing coupons')
      } finally {
        isDistributing.value = false
      }
    }
    
    const initHourlyChart = () => {
      if (hourlyChartInstance) hourlyChartInstance.destroy()
      
      const ctx = hourlyChart.value?.getContext('2d')
      if (!ctx || hourlyData.value.length === 0) return
      
      hourlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: hourlyData.value.map(h => `${h.hour}:00`),
          datasets: [
            {
              label: 'Coupons Used',
              data: hourlyData.value.map(h => h.usage),
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
                text: 'Coupons Used'
              }
            }
          }
        }
      })
    }
    
    const refreshData = () => {
      loading.value = true
      error.value = ''
      fetchDailyCoupons()
      fetchHourlyData()
    }
    
    onMounted(async () => {
      await Promise.all([
        fetchDailyCoupons(),
        fetchWaiters(),
        fetchHourlyData()
      ])
      
      // Refresh every 30 seconds
      refreshInterval = setInterval(refreshData, 30000)
    })
    
    // Cleanup on unmount
    onUnmounted(() => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
      if (hourlyChartInstance) {
        hourlyChartInstance.destroy()
      }
    })
    
    return {
      loading,
      error,
      isDistributing,
      items,
      waiters,
      hourlyData,
      currentDate,
      totalUsedToday,
      totalRemaining,
      utilizationRate,
      canDistribute,
      showItemModal,
      showDistributeModal,
      selectedItem,
      distributeQuantity,
      distributeTo,
      hourlyChart,
      getStatusClass,
      getStatusText,
      getProgressColor,
      viewItemDetails,
      closeItemModal,
      distributeCoupons,
      closeDistributeModal,
      submitDistribution,
      refreshData
    }
  }
}
</script>

<style scoped>
/* Keep all your existing styles */
.daily-coupons {
  padding: 24px;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  text-align: center;
  background: #FFF3E0;
  border-radius: 16px;
  margin: 20px;
}

.error-container i {
  font-size: 48px;
  color: #F57C00;
  margin-bottom: 16px;
}

.error-container p {
  color: #F57C00;
  margin-bottom: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  text-align: center;
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

.btn-view {
  margin-left: 8px;
  background: #F5F5F5;
  color: #332F2E;
}

.btn-view:hover {
  background: #E5E5E2;
}


/* Keep all your existing styles */
.daily-coupons {
  padding: 24px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  text-align: center;
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

/* Add btn-view style */
.btn-view {
  margin-left: 8px;
  background: #F5F5F5;
  color: #332F2E;
}

.btn-view:hover {
  background: #E5E5E2;
}


.daily-coupons {
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

.date-info {
  background: #F9F7EB;
  padding: 10px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #332F2E;
}

.date-info i {
  color: #EFCA71;
}

.day-progress-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 32px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.progress-header h3 {
  margin: 0;
  font-size: 18px;
  color: #332F2E;
}

.progress-stats {
  display: flex;
  gap: 16px;
}

.progress-stats .used {
  color: #EFCA71;
  font-weight: 600;
}

.progress-stats .remaining {
  color: #4CAF50;
  font-weight: 600;
}

.overall-progress {
  height: 12px;
  background: #F5F5F5;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.overall-progress .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #EFCA71, #F2E9C6);
  border-radius: 6px;
  transition: width 0.5s ease;
}

.progress-label {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #EFCA71;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.item-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(239, 202, 113, 0.15);
  transition: all 0.3s ease;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.item-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.item-name {
  flex: 1;
  font-weight: 600;
  font-size: 18px;
  color: #332F2E;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.healthy {
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

.item-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
  text-align: center;
}

.stat label {
  display: block;
  font-size: 11px;
  color: #8C8C90;
  margin-bottom: 4px;
}

.stat .value {
  font-size: 18px;
  font-weight: 700;
  color: #332F2E;
}

.stat .value.used {
  color: #EFCA71;
}

.stat .value.remaining {
  color: #4CAF50;
}

.progress-bar {
  height: 8px;
  background: #F5F5F5;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.item-actions {
  text-align: center;
}

.btn-small {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-small:hover {
  transform: translateY(-1px);
}

.hourly-breakdown {
  background: white;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.hourly-breakdown h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #332F2E;
}

.chart-container {
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

.modal-content.small {
  max-width: 400px;
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

.item-detail-card {
  background: #F9F7EB;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #E5E5E2;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row label {
  font-weight: 600;
  color: #332F2E;
}

.detail-row .used {
  color: #EFCA71;
  font-weight: 600;
}

.detail-row .remaining {
  color: #4CAF50;
  font-weight: 600;
}

.hourly-usage h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #332F2E;
}

.hourly-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hour-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hour {
  width: 50px;
  font-size: 12px;
  color: #8C8C90;
}

.hour-bar {
  flex: 1;
  height: 8px;
  background: #F5F5F5;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #EFCA71;
  border-radius: 4px;
}

.usage {
  width: 60px;
  font-size: 12px;
  font-weight: 500;
  color: #332F2E;
  text-align: right;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F9F7EB;
  border-radius: 12px;
  margin-bottom: 20px;
}

.item-details {
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: #332F2E;
  margin-bottom: 4px;
}

.item-remaining {
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

.btn-secondary {
  background: #F5F5F5;
  border: 1px solid #E5E5E2;
  padding: 10px 20px;
  border-radius: 8px;
  color: #6F6C6D;
  cursor: pointer;
}

@media (max-width: 768px) {
  .daily-coupons {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .items-grid {
    grid-template-columns: 1fr;
  }
  
  .item-stats {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .stat label {
    margin-bottom: 0;
  }
}
</style>