<template>
  <div class="barista-dashboard">
    <!-- Page Header -->
    <div class="page-header card">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <span class="title-gradient">Barista</span>
            <span class="title-management">Dashboard</span>
          </h1>
          <p class="page-subtitle">Manage drink inventory and distribute coupons to waiters</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" @click="quickDistribute" :disabled="isLoading">
            <i class="fas fa-hand-holding-heart"></i>
            <span>Quick Distribute</span>
          </button>
          <button class="btn btn-outline" @click="requestStock" :disabled="isLoading">
            <i class="fas fa-boxes"></i>
            <span>Request Stock</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container card">
      <div class="loading-spinner"></div>
      <p>Loading dashboard...</p>
    </div>

    <div v-else>
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-ticket-alt"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalRemainingCoupons }}</span>
            <span class="stat-label">Remaining Coupons</span>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-hand-holding-heart"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalDistributedToday }}</span>
            <span class="stat-label">Distributed Today</span>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-chart-line"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalSoldToday }}</span>
            <span class="stat-label">Sold Today</span>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-boxes"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.pendingRequests }}</span>
            <span class="stat-label">Pending Requests</span>
          </div>
        </div>
      </div>

      <!-- Drink Inventory Status -->
      <div class="section-card card">
        <div class="section-header">
          <h3>Drink Inventory Status</h3>
          <span class="section-subtitle">Current coupon availability</span>
        </div>
        <div class="drinks-grid">
          <div v-for="drink in drinks" :key="drink.id" class="drink-card">
            <div class="drink-icon" :style="{ background: drink.color }">
              <i :class="drink.icon"></i>
            </div>
            <div class="drink-info">
              <div class="drink-name">{{ drink.name }}</div>
              <div class="drink-stats">
                <span class="remaining">{{ drink.remaining }} / {{ drink.default_coupon }} coupons left</span>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ 
                      width: getUsagePercentage(drink.remaining, drink.default_coupon) + '%',
                      background: getProgressColor(drink.remaining, drink.default_coupon)
                    }"
                  ></div>
                </div>
              </div>
            </div>
            <button 
              class="btn-distribute" 
              @click="openDistributeModal(drink)"
              :disabled="drink.remaining === 0 || isDistributing"
            >
              <i class="fas fa-hand-holding-heart"></i>
              <span>Distribute</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Distributions -->
      <div class="section-card card">
        <div class="section-header">
          <h3>Recent Distributions</h3>
          <router-link to="/barista/track-coupons" class="view-link">
            View All <i class="fas fa-arrow-right"></i>
          </router-link>
        </div>
        <div class="table-container">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="dist in recentDistributions" :key="dist.id">
                  <td data-label="Time">{{ formatTime(dist.created_at) }}</td>
                  <td data-label="Item">
                    <div class="item-info">
                      <div class="item-icon-small" :style="{ background: dist.color }">
                        <i :class="dist.icon"></i>
                      </div>
                      <span>{{ dist.item_name }}</span>
                    </div>
                  </td>
                  <td data-label="Quantity" class="quantity-cell">{{ dist.quantity }}</td>
                  <td data-label="To">{{ dist.assigned_to }}</td>
                  <td data-label="Status">
                    <span class="status-badge completed">{{ dist.status }}</span>
                  </td>
                </tr>
                <tr v-if="recentDistributions.length === 0">
                  <td colspan="5" class="empty-state">No recent distributions</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Pending Stock Requests -->
      <div v-if="stockRequests.length > 0" class="section-card card">
        <div class="section-header">
          <h3>Pending Stock Requests</h3>
          <button class="btn-text" @click="viewAllRequests">View All</button>
        </div>
        <div class="requests-list">
          <div v-for="request in stockRequests" :key="request.id" class="request-item">
            <div class="request-info">
              <div class="item-icon-small" :style="{ background: request.color }">
                <i :class="request.icon"></i>
              </div>
              <div>
                <div class="request-name">{{ request.item_name }}</div>
                <div class="request-details">
                  Quantity: {{ request.requested_quantity }} | 
                  Requested: {{ formatTime(request.created_at) }}
                </div>
              </div>
            </div>
            <div class="request-status">
              <span class="status-badge pending">Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Distribute Modal -->
    <div v-if="showDistributeModal" class="modal-overlay" @click.self="closeDistributeModal">
      <div class="modal-content card" @click.stop>
        <div class="modal-header">
          <h2>Distribute Coupons</h2>
          <button class="close-btn" @click="closeDistributeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="selected-item" v-if="selectedDrink">
            <div class="item-icon" :style="{ background: selectedDrink.color }">
              <i :class="selectedDrink.icon"></i>
            </div>
            <div class="item-details">
              <div class="item-name">{{ selectedDrink.name }}</div>
              <div class="item-remaining">{{ selectedDrink.remaining }} coupons remaining</div>
            </div>
          </div>
          
          <form @submit.prevent="distributeCoupons">
            <div class="form-group">
              <label>Quantity to Distribute *</label>
              <input 
                type="number" 
                v-model="distributeQuantity" 
                required
                min="1"
                :max="selectedDrink?.remaining"
                placeholder="Enter quantity"
              >
              <small>Maximum: {{ selectedDrink?.remaining }} coupons</small>
            </div>
            
            <div class="form-group">
              <label>Assign To (Waiter/Waitress) *</label>
              <select v-model="assignedTo" required>
                <option value="">Select waiter/waitress</option>
                <option v-for="waiter in waiters" :key="waiter.id" :value="waiter.name">
                  {{ waiter.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Notes (Optional)</label>
              <textarea v-model="notes" rows="3" placeholder="Add any notes..."></textarea>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" @click="closeDistributeModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="!isValidDistribution || isDistributing">
                <i class="fas" :class="isDistributing ? 'fa-spinner fa-spin' : 'fa-hand-holding-heart'"></i>
                <span>{{ isDistributing ? 'Distributing...' : 'Distribute Coupons' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="toastMessage" class="toast-notification" :class="toastType">
      <i :class="toastIcon"></i>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api';

export default {
  name: 'BaristaDashboard',
  setup() {
    const router = useRouter()
    
    // State
    const isLoading = ref(true)
    const isDistributing = ref(false)
    const showDistributeModal = ref(false)
    const selectedDrink = ref(null)
    const distributeQuantity = ref(1)
    const assignedTo = ref('')
    const notes = ref('')
    const toastMessage = ref('')
    const toastType = ref('success')
    
    // Data
    const drinks = ref([])
    const waiters = ref([])
    const recentDistributions = ref([])
    const stockRequests = ref([])
    
    const stats = ref({
      totalRemainingCoupons: 0,
      totalDistributedToday: 0,
      totalSoldToday: 0,
      pendingRequests: 0
    })

    const toastIcon = computed(() => {
      return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
    })

    const isValidDistribution = computed(() => {
      return distributeQuantity.value > 0 && 
             distributeQuantity.value <= (selectedDrink.value?.remaining || 0) &&
             assignedTo.value !== ''
    })

    const getAuthHeaders = () => {
      const token = localStorage.getItem('authToken')
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }

    const showToast = (message, type = 'success') => {
      toastMessage.value = message
      toastType.value = type
      setTimeout(() => {
        toastMessage.value = ''
      }, 3000)
    }

    const getUsagePercentage = (remaining, total) => {
      if (total === 0) return 0
      return ((total - remaining) / total) * 100
    }

    const getProgressColor = (remaining, total) => {
      const usedPercent = ((total - remaining) / total) * 100
      if (usedPercent >= 90) return '#C45A5A'
      if (usedPercent >= 70) return '#F57C00'
      return '#88B788'
    }
    
    const formatTime = (date) => {
      if (!date) return '-'
      return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const fetchDashboardData = async () => {
      isLoading.value = true
      try {
        const token = localStorage.getItem('authToken')
        
        // Fetch inventory
        const inventoryResponse = await api.get('/barista/inventory')
        
        if (inventoryResponse.status === 401 || inventoryResponse.status === 403) {
          showToast('Session expired. Please login again.', 'error')
          setTimeout(() => {
            router.push('/login')
          }, 1500)
          return
        }
        
        if (inventoryResponse.status==200) {
          const data = await inventoryResponse.data
          drinks.value = Array.isArray(data) ? data : (data.items || data)
          stats.value.totalRemainingCoupons = drinks.value.reduce((sum, d) => sum + (d.remaining || 0), 0)
        }
        
        // Fetch distributions
        const distResponse = await api.get('/barista/distributions')
        
        if (distResponse.status==200) {
          const data = await distResponse.data
          const distributions = Array.isArray(data) ? data : (data.distributions || data)
          recentDistributions.value = distributions.slice(0, 10)
          stats.value.totalDistributedToday = recentDistributions.value.reduce((sum, d) => sum + (d.quantity || 0), 0)
        }
        
        // Fetch stock requests
        const requestsResponse = await api.get('/barista/stock-requests')
        
        if (requestsResponse.status==200) {
          const data = await requestsResponse.data
          const requests = Array.isArray(data) ? data : (data.requests || data)
          stockRequests.value = requests.filter(r => r.status === 'pending')
          stats.value.pendingRequests = stockRequests.value.length
        }
        
        // Fetch waiters (users with role cashier or barista)
        const usersResponse = await api.get('/admin/users')
        
        if (usersResponse.status==200) {
          const data = await usersResponse.data
          const users = Array.isArray(data) ? data : (data.users || data)
          waiters.value = users.filter(u => u.role === 'cashier' || u.role === 'barista')
        }
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        showToast('Failed to load data. Using demo data.', 'error')
        loadDemoData()
      } finally {
        isLoading.value = false
      }
    }

    const loadDemoData = () => {
      drinks.value = [
        { id: 1, name: 'Beer', icon: 'fas fa-beer', color: '#F4A261', default_coupon: 100, remaining: 45 },
        { id: 2, name: 'Wine', icon: 'fas fa-wine-bottle', color: '#9C6B42', default_coupon: 50, remaining: 30 },
        { id: 3, name: 'Whiskey', icon: 'fas fa-glass-whiskey', color: '#E9C46A', default_coupon: 40, remaining: 28 },
        { id: 4, name: 'Cocktail', icon: 'fas fa-cocktail', color: '#2A9D8F', default_coupon: 35, remaining: 20 },
        { id: 5, name: 'Soft Drinks', icon: 'fas fa-cola', color: '#E76F51', default_coupon: 200, remaining: 150 },
        { id: 6, name: 'Juice', icon: 'fas fa-apple-alt', color: '#88B788', default_coupon: 100, remaining: 85 }
      ]
      
      waiters.value = [
        { id: 1, name: 'Abebe Bekele' },
        { id: 2, name: 'Almaz Tadese' },
        { id: 3, name: 'Chala Desta' }
      ]
      
      recentDistributions.value = [
        { id: 1, created_at: new Date().toISOString(), item_name: 'Beer', quantity: 10, assigned_to: 'Abebe Bekele', status: 'completed', icon: 'fas fa-beer', color: '#F4A261' },
        { id: 2, created_at: new Date().toISOString(), item_name: 'Wine', quantity: 5, assigned_to: 'Almaz Tadese', status: 'completed', icon: 'fas fa-wine-bottle', color: '#9C6B42' }
      ]
      
      stockRequests.value = [
        { id: 1, item_name: 'Beer', requested_quantity: 50, created_at: new Date().toISOString(), status: 'pending', icon: 'fas fa-beer', color: '#F4A261' }
      ]
      
      stats.value = {
        totalRemainingCoupons: 358,
        totalDistributedToday: 15,
        totalSoldToday: 142,
        pendingRequests: 1
      }
    }

    const quickDistribute = () => {
      const drinkWithStock = drinks.value.find(d => d.remaining > 0)
      if (drinkWithStock) {
        openDistributeModal(drinkWithStock)
      } else {
        showToast('No drinks available for distribution', 'error')
      }
    }
    
    const requestStock = () => {
      router.push('/barista/request-stock')
    }
    
    const openDistributeModal = (drink) => {
      selectedDrink.value = drink
      distributeQuantity.value = 1
      assignedTo.value = ''
      notes.value = ''
      showDistributeModal.value = true
    }
    
    const closeDistributeModal = () => {
      showDistributeModal.value = false
      selectedDrink.value = null
    }
    
    const distributeCoupons = async () => {
      if (!isValidDistribution.value) return
      
      isDistributing.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await api.post('/barista/distribute', {
            item_id: selectedDrink.value.id,
            quantity: distributeQuantity.value,
            assigned_to: assignedTo.value,
            notes: notes.value
          })
        
        if (response.status === 401 || response.status === 403) {
          showToast('Session expired. Please login again.', 'error')
          setTimeout(() => {
            router.push('/login')
          }, 1500)
          return
        }
        
        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const result = await response.data
        
        // Update local data
        selectedDrink.value.remaining -= distributeQuantity.value
        
        // Add to recent distributions
        recentDistributions.value.unshift({
          id: result.id || Date.now(),
          created_at: new Date().toISOString(),
          item_name: selectedDrink.value.name,
          quantity: distributeQuantity.value,
          assigned_to: assignedTo.value,
          status: 'completed',
          icon: selectedDrink.value.icon,
          color: selectedDrink.value.color
        })
        
        // Update stats
        stats.value.totalRemainingCoupons -= distributeQuantity.value
        stats.value.totalDistributedToday += distributeQuantity.value
        
        showToast(`${distributeQuantity.value} coupons for ${selectedDrink.value.name} distributed to ${assignedTo.value}`, 'success')
        closeDistributeModal()
      } catch (error) {
        console.error('Error distributing coupons:', error)
        showToast(error.message || 'Error distributing coupons', 'error')
      } finally {
        isDistributing.value = false
      }
    }
    
    const viewAllRequests = () => {
      router.push('/barista/request-stock')
    }
    
    onMounted(() => {
      fetchDashboardData()
    })
    
    return {
      isLoading,
      isDistributing,
      drinks,
      waiters,
      recentDistributions,
      stockRequests,
      stats,
      showDistributeModal,
      selectedDrink,
      distributeQuantity,
      assignedTo,
      notes,
      toastMessage,
      toastType,
      toastIcon,
      isValidDistribution,
      getUsagePercentage,
      getProgressColor,
      formatTime,
      quickDistribute,
      requestStock,
      openDistributeModal,
      closeDistributeModal,
      distributeCoupons,
      viewAllRequests
    }
  }
}
</script>


<style scoped>
/* ==============================================
   BARISTA DASHBOARD - MATCHING ADMIN STYLES
   ============================================== */

.barista-dashboard {
  padding: 30px;
  min-height: 100vh;
  background: #F9F7EB;
  color: #332F2E;
}

/* Card Component */
.card {
  background: #FFFFFF;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  padding: 24px;
  border: 1px solid rgba(239, 202, 113, 0.15);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.12);
  border-color: rgba(239, 202, 113, 0.3);
}

/* Page Header */
.page-header {
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.title-gradient {
  color: #332F2E;
}

.title-management {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 2rem;
}

.page-subtitle {
  color: #6F6C6D;
  font-size: 1rem;
  margin: 0;
}

/* Buttons */
.btn {
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  color: #332F2E;
  box-shadow: 0 4px 12px rgba(239, 202, 113, 0.2);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(239, 202, 113, 0.3);
}

.btn-outline {
  background: transparent;
  border: 1px solid #E5E5E2;
  color: #332F2E;
}

.btn-outline:hover:not(:disabled) {
  background: #F9F7EB;
  border-color: #EFCA71;
}

.btn-text {
  background: none;
  border: none;
  color: #EFCA71;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.3s ease;
}

.btn-text:hover {
  color: #332F2E;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Loading State */
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

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.stat-icon-wrapper {
  width: 60px;
  height: 60px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #332F2E;
  font-size: 1.5rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 1.8rem;
  font-weight: 700;
  color: #332F2E;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.9rem;
  color: #6F6C6D;
}

/* Section Card */
.section-card {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  color: #332F2E;
}

.section-subtitle {
  font-size: 0.85rem;
  color: #6F6C6D;
}

.view-link {
  color: #EFCA71;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.view-link:hover {
  color: #332F2E;
}

/* Drinks Grid */
.drinks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.drink-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F9F7EB;
  border-radius: 16px;
  transition: all 0.3s ease;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.drink-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.drink-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.drink-info {
  flex: 1;
}

.drink-name {
  font-weight: 600;
  color: #332F2E;
  margin-bottom: 4px;
}

.drink-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.remaining {
  font-size: 0.75rem;
  color: #6F6C6D;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #E5E5E2;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.btn-distribute {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-distribute:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(239, 202, 113, 0.3);
}

.btn-distribute:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Table Styles */
.table-container {
  overflow: hidden;
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.data-table th {
  text-align: left;
  padding: 12px 16px;
  background: #F9F7EB;
  font-weight: 600;
  color: #332F2E;
  border-bottom: 1px solid #E5E5E2;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #F0F0F0;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-icon-small {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.quantity-cell {
  font-weight: 600;
  color: #EFCA71;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-block;
}

.status-badge.completed {
  background: #E8F5E9;
  color: #4CAF50;
}

.status-badge.pending {
  background: #FFF3E0;
  color: #F57C00;
}

.empty-state {
  text-align: center;
  padding: 40px !important;
  color: #8C8C90;
}

/* Requests List */
.requests-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.request-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #F9F7EB;
  border-radius: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.request-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.request-name {
  font-weight: 600;
  color: #332F2E;
  margin-bottom: 4px;
}

.request-details {
  font-size: 0.7rem;
  color: #6F6C6D;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content {
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E5E5E2;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #E5E5E2;
  background: #FFFFFF;
  color: #6F6C6D;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #F9F7EB;
  color: #332F2E;
  border-color: #EFCA71;
}

.modal-body {
  padding: 24px;
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

.item-remaining {
  font-size: 0.75rem;
  color: #6F6C6D;
}

/* Form Styles */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #332F2E;
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E5E5E2;
  border-radius: 12px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #EFCA71;
  box-shadow: 0 0 0 3px rgba(239, 202, 113, 0.1);
}

.form-group small {
  display: block;
  margin-top: 4px;
  font-size: 0.7rem;
  color: #6F6C6D;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

/* Toast Notification */
.toast-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 3000;
  animation: slideIn 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-notification.success {
  background: #88B788;
  color: white;
}

.toast-notification.error {
  background: #C45A5A;
  color: white;
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

/* Responsive */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .barista-dashboard {
    padding: 20px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .title-management {
    font-size: 1.6rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .drinks-grid {
    grid-template-columns: 1fr;
  }
  
  .drink-card {
    flex-wrap: wrap;
  }
  
  .btn-distribute {
    width: 100%;
    justify-content: center;
  }
  
  .request-item {
    flex-direction: column;
    text-align: center;
  }
  
  .request-info {
    flex-direction: column;
  }
  
  .modal-content {
    margin: 16px;
  }
}

@media (max-width: 480px) {
  .barista-dashboard {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn {
    justify-content: center;
  }
  
  .section-header {
    flex-direction: column;
    text-align: center;
  }
}
</style>