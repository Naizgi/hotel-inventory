<template>
  <div class="barista-inventory">
    <div class="page-header">
      <h1 class="page-title">Barista Inventory</h1>
      <div class="header-actions">
        <button class="btn-secondary" @click="refreshInventory">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-ticket-alt"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalCoupons }}</h3>
          <p>Total Coupons</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalUsed }}</h3>
          <p>Used Today</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-hourglass-half"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalRemaining }}</h3>
          <p>Remaining</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-percent"></i>
        </div>
        <div class="stat-info">
          <h3>{{ utilizationRate }}%</h3>
          <p>Utilization Rate</p>
        </div>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="filters">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input v-model="searchQuery" placeholder="Search items...">
      </div>
      <select v-model="stockFilter" class="filter-select">
        <option value="">All Stock Levels</option>
        <option value="critical">Critical (&lt;20%)</option>
        <option value="low">Low (20-50%)</option>
        <option value="adequate">Adequate (&gt;50%)</option>
      </select>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading inventory...</p>
    </div>

    <!-- Inventory Table -->
    <div v-else class="inventory-table-container">
      <table class="inventory-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Total Coupons</th>
            <th>Remaining</th>
            <th>Used</th>
            <th>Utilization</th>
            <th>Status</th>
            <th>Actions</th></tr>
          </thead>
        <tbody>
          <tr v-for="item in filteredInventory" :key="item.id">
            <td>
              <div class="item-info">
                <div class="item-icon" :style="{ background: item.color }">
                  <i :class="item.icon"></i>
                </div>
                <span>{{ item.name }}</span>
              </div></td>
            
            <td class="total-cell">{{ item.default_coupon }}</td>
            <td class="remaining-cell">
              <span :class="getRemainingClass(item.remaining, item.default_coupon)">
                {{ item.remaining }}
              </span>
            </td>
            <td class="used-cell">{{ item.default_coupon - item.remaining }}</td>
            <td>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ 
                    width: getUsagePercentage(item.remaining, item.default_coupon) + '%',
                    background: getProgressColor(item.remaining, item.default_coupon)
                  }"
                ></div>
                <span class="progress-text">{{ getUsagePercentage(item.remaining, item.default_coupon) }}%</span>
              </div>
            </td>
            <td>
              <span :class="['status-badge', getStatusClass(item.remaining, item.default_coupon)]">
                {{ getStatusText(item.remaining, item.default_coupon) }}
              </span>
            </td>
            <td class="actions">
              <button class="btn-icon" @click="viewDetails(item)" title="View Details">
                <i class="fas fa-eye"></i>
              </button>
            </td>
          </tr>
          <tr v-if="filteredInventory.length === 0">
            <td colspan="7" class="empty-state">No inventory items found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="closeDetailsModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Item Details</h2>
          <button class="close-btn" @click="closeDetailsModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="details-card" v-if="selectedItem">
            <div class="detail-row">
              <label>Item:</label>
              <div class="item-info">
                <div class="item-icon" :style="{ background: selectedItem.color }">
                  <i :class="selectedItem.icon"></i>
                </div>
                <span>{{ selectedItem.name }}</span>
              </div>
            </div>
            <div class="detail-row">
              <label>Category:</label>
              <span>{{ selectedItem.category }}</span>
            </div>
            <div class="detail-row">
              <label>Price:</label>
              <span>{{ formatCurrency(selectedItem.price) }}</span>
            </div>
            <div class="detail-row">
              <label>Total Coupons:</label>
              <span>{{ selectedItem.default_coupon }}</span>
            </div>
            <div class="detail-row">
              <label>Remaining:</label>
              <span class="remaining-highlight">{{ selectedItem.remaining }}</span>
            </div>
            <div class="detail-row">
              <label>Used:</label>
              <span>{{ selectedItem.default_coupon - selectedItem.remaining }}</span>
            </div>
            <div class="detail-row">
              <label>Utilization:</label>
              <span>{{ getUsagePercentage(selectedItem.remaining, selectedItem.default_coupon) }}%</span>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeDetailsModal">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api';
export default {
  name: 'BaristaInventory',
  setup() {
    const loading = ref(true)
    const searchQuery = ref('')
    const stockFilter = ref('')
    const inventory = ref([])
    const showDetailsModal = ref(false)
    const selectedItem = ref(null)
    
    const totalCoupons = computed(() => {
      return inventory.value.reduce((sum, i) => sum + (i.default_coupon || 0), 0)
    })
    
    const totalUsed = computed(() => {
      return inventory.value.reduce((sum, i) => sum + ((i.default_coupon || 0) - (i.remaining || 0)), 0)
    })
    
    const totalRemaining = computed(() => {
      return inventory.value.reduce((sum, i) => sum + (i.remaining || 0), 0)
    })
    
    const utilizationRate = computed(() => {
      if (totalCoupons.value === 0) return 0
      return Math.round((totalUsed.value / totalCoupons.value) * 100)
    })
    
    const filteredInventory = computed(() => {
      let filtered = inventory.value
      
      if (searchQuery.value) {
        filtered = filtered.filter(i => 
          i.name?.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }
      
      if (stockFilter.value === 'critical') {
        filtered = filtered.filter(i => (i.remaining || 0) / (i.default_coupon || 100) < 0.2)
      } else if (stockFilter.value === 'low') {
        filtered = filtered.filter(i => {
          const ratio = (i.remaining || 0) / (i.default_coupon || 100)
          return ratio >= 0.2 && ratio < 0.5
        })
      } else if (stockFilter.value === 'adequate') {
        filtered = filtered.filter(i => (i.remaining || 0) / (i.default_coupon || 100) >= 0.5)
      }
      
      return filtered
    })
    
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
    
    const getUsagePercentage = (remaining, total) => {
      if (!total || total === 0) return 0
      return Math.round(((total - remaining) / total) * 100)
    }
    
    const getRemainingClass = (remaining, total) => {
      const ratio = remaining / total
      if (ratio < 0.2) return 'critical'
      if (ratio < 0.5) return 'warning'
      return 'normal'
    }
    
    const getProgressColor = (remaining, total) => {
      const ratio = remaining / total
      if (ratio < 0.2) return '#F44336'
      if (ratio < 0.5) return '#F57C00'
      return '#4CAF50'
    }
    
    const getStatusClass = (remaining, total) => {
      const ratio = remaining / total
      if (ratio < 0.2) return 'critical'
      if (ratio < 0.5) return 'low'
      return 'healthy'
    }
    
    const getStatusText = (remaining, total) => {
      const ratio = remaining / total
      if (ratio < 0.2) return 'Critical'
      if (ratio < 0.5) return 'Low Stock'
      return 'Healthy'
    }
    
    const fetchInventory = async () => {
  try {
    const token = localStorage.getItem('authToken')
    
    if (!token) {
      console.error('No token found')
      loading.value = false
      return
    }
    
    console.log('Fetching inventory from /api/barista/inventory...')
    const response = await api.get('/barista/inventory')
    
    console.log('Inventory response status:', response.status)
    
    if (response.status === 200) {
      const data = await response.data
      console.log('Inventory data received:', data)
      
      // Handle the data - it should already be an array
      if (Array.isArray(data)) {
        inventory.value = data.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          default_coupon: item.default_coupon,
          remaining: item.remaining,
          icon: item.icon,
          color: item.color
        }))
        console.log('Mapped inventory:', inventory.value)
      } else {
        console.error('Unexpected data format:', data)
        inventory.value = []
      }
    } else {
      console.error('Failed to fetch inventory:', response.status)
      const errorText = await response.text()
      console.error('Error response:', errorText)
      inventory.value = []
    }
  } catch (error) {
    console.error('Error fetching inventory:', error)
    inventory.value = []
  } finally {
    loading.value = false
  }
}
    
    const refreshInventory = () => {
      fetchInventory()
    }
    
    const viewDetails = (item) => {
      selectedItem.value = item
      showDetailsModal.value = true
    }
    
    const closeDetailsModal = () => {
      showDetailsModal.value = false
      selectedItem.value = null
    }
    
    onMounted(async () => {
      loading.value = true
      await fetchInventory()
      loading.value = false
    })
    
    return {
      loading,
      searchQuery,
      stockFilter,
      inventory,
      totalCoupons,
      totalUsed,
      totalRemaining,
      utilizationRate,
      filteredInventory,
      showDetailsModal,
      selectedItem,
      formatCurrency,
      getUsagePercentage,
      getRemainingClass,
      getProgressColor,
      getStatusClass,
      getStatusText,
      refreshInventory,
      viewDetails,
      closeDetailsModal
    }
  }
}
</script>

<style scoped>
/* Add styles similar to previous components */
.barista-inventory {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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
  color: #6F6C6D;
  cursor: pointer;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.stat-icon {
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

.stat-info h3 {
  font-size: 24px;
  font-weight: 700;
  color: #332F2E;
  margin: 0;
}

.stat-info p {
  color: #8C8C90;
  margin: 0;
  font-size: 14px;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  position: relative;
  min-width: 200px;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #8C8C90;
}

.search-box input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
}

.filter-select {
  padding: 10px 24px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  background: white;
  cursor: pointer;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
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

.inventory-table-container {
  background: white;
  border-radius: 16px;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
}

.inventory-table th {
  text-align: left;
  padding: 16px;
  background: #F9F7EB;
  color: #332F2E;
  font-weight: 600;
  border-bottom: 1px solid #E5E5E2;
}

.inventory-table td {
  padding: 16px;
  border-bottom: 1px solid #F0F0F0;
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

.total-cell, .used-cell {
  font-weight: 500;
}

.remaining-cell span {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.remaining-cell span.normal {
  background: #E8F5E9;
  color: #4CAF50;
}

.remaining-cell span.warning {
  background: #FFF3E0;
  color: #F57C00;
}

.remaining-cell span.critical {
  background: #FFEBEE;
  color: #F44336;
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

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.status-badge.healthy {
  background: #E8F5E9;
  color: #4CAF50;
}

.status-badge.low {
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

.empty-state {
  text-align: center;
  padding: 40px !important;
  color: #8C8C90;
}

/* Modal Styles */
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
  background: white;
  border-radius: 20px;
  width: 100%;
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

.details-card {
  background: #F9F7EB;
  border-radius: 12px;
  padding: 16px;
}

.detail-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #E5E5E2;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row label {
  width: 110px;
  font-weight: 600;
  color: #332F2E;
}

.detail-row span, .detail-row .item-info {
  flex: 1;
  color: #6F6C6D;
}

.remaining-highlight {
  font-weight: 600;
  color: #EFCA71;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .barista-inventory {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .filter-select {
    width: 100%;
  }
}
</style>