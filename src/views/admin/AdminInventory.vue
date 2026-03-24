<template>
  <div class="admin-inventory">
    <div class="page-header">
      <h1 class="page-title">Admin Inventory</h1>
      <div class="header-actions">
        <button class="btn-secondary" @click="initializeInventory">
          <i class="fas fa-database"></i> Initialize
        </button>
        <button class="btn-primary" @click="refreshInventory">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-boxes"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalItems }}</h3>
          <p>Total Items</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalStock }}</h3>
          <p>Total Stock Units</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="stat-info">
          <h3>{{ lowStockCount }}</h3>
          <p>Low Stock Items</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-chart-bar"></i>
        </div>
        <div class="stat-info">
          <h3>{{ averageStock }}</h3>
          <p>Avg Stock/Item</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input v-model="searchQuery" placeholder="Search items...">
      </div>
      <select v-model="statusFilter" class="filter-select">
        <option value="">All Status</option>
        <option value="critical">Critical</option>
        <option value="low">Low</option>
        <option value="adequate">Adequate</option>
      </select>
      <select v-model="categoryFilter" class="filter-select">
        <option value="">All Categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
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
            <th>Category</th>
            <th>Current Stock</th>
            <th>Threshold</th>
            <th>Status</th>
            <th>Last Updated</th>
            <th>Actions</th></tr>
          </thead>
        <tbody>
          <tr v-for="item in filteredInventory" :key="item.id">
            <td>
              <div class="item-info">
                <div class="item-icon-small" :style="{ background: item.item_color }">
                  <i :class="item.item_icon"></i>
                </div>
                <span>{{ item.item_name }}</span>
              </div>
            </td>
            <td>
              <span class="category-badge">{{ item.item_category }}</span>
            </td>
            <td :class="{ 'critical': item.quantity <= item.low_stock_threshold * 0.3, 'low': item.quantity <= item.low_stock_threshold }">
              <strong>{{ item.quantity }}</strong>
            </td>
            <td>{{ item.low_stock_threshold }}</td>
            <td>
              <span :class="['status-badge', item.status]">{{ item.status }}</span>
            </td>
            <td>{{ formatDate(item.last_updated) }}</td>
            <td class="actions">
              <button class="btn-icon" @click="openAdjustModal(item)" title="Adjust Stock">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-icon" @click="openThresholdModal(item)" title="Update Threshold">
                <i class="fas fa-sliders-h"></i>
              </button>
              <button class="btn-icon" @click="viewHistory(item)" title="View History">
                <i class="fas fa-history"></i>
              </button>
            </td>
          </tr>
          <tr v-if="filteredInventory.length === 0">
            <td colspan="7" class="empty-state">No inventory items found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Adjust Stock Modal -->
    <div v-if="showAdjustModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Adjust Stock</h2>
          <button class="close-btn" @click="closeModals">&times;</button>
        </div>
        <div class="modal-body">
          <div class="selected-item" v-if="selectedItem">
            <div class="item-icon" :style="{ background: selectedItem.item_color }">
              <i :class="selectedItem.item_icon"></i>
            </div>
            <div>
              <div class="item-name">{{ selectedItem.item_name }}</div>
              <div class="item-detail">Current Stock: {{ selectedItem.quantity }} units</div>
            </div>
          </div>

          <div class="form-group">
            <label>Adjustment Type</label>
            <div class="adjustment-types">
              <label class="radio-label">
                <input type="radio" v-model="adjustmentType" value="add"> Add Stock
              </label>
              <label class="radio-label">
                <input type="radio" v-model="adjustmentType" value="remove"> Remove Stock
              </label>
              <label class="radio-label">
                <input type="radio" v-model="adjustmentType" value="set"> Set New Value
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>Quantity</label>
            <input type="number" v-model.number="adjustmentQuantity" 
                   :max="adjustmentType === 'remove' ? selectedItem?.quantity : 9999"
                   min="1" placeholder="Enter quantity">
          </div>

          <div class="form-group">
            <label>Reason</label>
            <textarea v-model="adjustmentReason" rows="2" placeholder="Reason for adjustment..."></textarea>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModals">Cancel</button>
            <button class="btn-primary" @click="submitAdjustment" :disabled="submitting">
              <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
              <span v-else>Apply Adjustment</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Update Threshold Modal -->
    <div v-if="showThresholdModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content small">
        <div class="modal-header">
          <h2>Update Low Stock Threshold</h2>
          <button class="close-btn" @click="closeModals">&times;</button>
        </div>
        <div class="modal-body">
          <div class="selected-item" v-if="selectedItem">
            <div class="item-icon" :style="{ background: selectedItem.item_color }">
              <i :class="selectedItem.item_icon"></i>
            </div>
            <div>
              <div class="item-name">{{ selectedItem.item_name }}</div>
              <div class="item-detail">Current Threshold: {{ selectedItem.low_stock_threshold }}</div>
            </div>
          </div>

          <div class="form-group">
            <label>New Threshold</label>
            <input type="number" v-model.number="newThreshold" min="1" placeholder="Enter threshold value">
            <small>Stock below this level will show as "Low" or "Critical"</small>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModals">Cancel</button>
            <button class="btn-primary" @click="updateThreshold" :disabled="submitting">
              <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
              <span v-else>Update Threshold</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Stock History Modal -->
    <div v-if="showHistoryModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content large">
        <div class="modal-header">
          <h2>Stock History - {{ selectedItem?.item_name }}</h2>
          <button class="close-btn" @click="closeModals">&times;</button>
        </div>
        <div class="modal-body">
          <div class="history-list">
            <div v-for="movement in stockHistory" :key="movement.id" class="history-item">
              <div class="history-date">{{ formatDateTime(movement.created_at) }}</div>
              <div class="history-details">
                <span :class="['movement-badge', movement.movement_type]">
                  {{ formatMovementType(movement.movement_type) }}
                </span>
                <span :class="{ 'positive': movement.quantity > 0, 'negative': movement.quantity < 0 }">
                  {{ movement.quantity > 0 ? '+' : '' }}{{ movement.quantity }}
                </span>
                <span>{{ movement.source }} → {{ movement.destination }}</span>
                <span class="performed-by">{{ movement.performed_by }}</span>
              </div>
              <div class="history-notes">{{ movement.notes || '-' }}</div>
            </div>
            <div v-if="stockHistory.length === 0" class="empty-state-small">
              No history found for this item
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="toastMessage" class="toast" :class="toastType">
      <i :class="toastIcon"></i>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'

export default {
  name: 'AdminInventory',
  setup() {
    const toast = useToast()
    
    // State
    const loading = ref(true)
    const submitting = ref(false)
    const searchQuery = ref('')
    const statusFilter = ref('')
    const categoryFilter = ref('')
    const inventory = ref([])
    const categories = ref([])
    
    // Modal state
    const showAdjustModal = ref(false)
    const showThresholdModal = ref(false)
    const showHistoryModal = ref(false)
    const selectedItem = ref(null)
    const adjustmentType = ref('add')
    const adjustmentQuantity = ref(1)
    const adjustmentReason = ref('')
    const newThreshold = ref(20)
    const stockHistory = ref([])
    
    // Toast state
    const toastMessage = ref('')
    const toastType = ref('success')
    
    const toastIcon = computed(() => {
      return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
    })
    
    const totalItems = computed(() => inventory.value.length)
    const totalStock = computed(() => inventory.value.reduce((sum, i) => sum + (i.quantity || 0), 0))
    const lowStockCount = computed(() => inventory.value.filter(i => i.status === 'low' || i.status === 'critical').length)
    const averageStock = computed(() => totalItems.value ? Math.round(totalStock.value / totalItems.value) : 0)
    
    const filteredInventory = computed(() => {
      let filtered = inventory.value
      
      if (searchQuery.value) {
        filtered = filtered.filter(i => 
          i.item_name?.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }
      
      if (statusFilter.value) {
        filtered = filtered.filter(i => i.status === statusFilter.value)
      }
      
      if (categoryFilter.value) {
        filtered = filtered.filter(i => i.item_category === categoryFilter.value)
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
    
    const showToastMessage = (message, type = 'success') => {
      toastMessage.value = message
      toastType.value = type
      setTimeout(() => {
        toastMessage.value = ''
      }, 3000)
    }
    
    const formatDate = (dateTime) => {
      if (!dateTime) return '-'
      const date = new Date(dateTime)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }
    
    const formatDateTime = (dateTime) => {
      if (!dateTime) return '-'
      const date = new Date(dateTime)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    const formatMovementType = (type) => {
      const types = {
        purchase: 'Purchase',
        transfer_out: 'Transfer Out',
        transfer_in: 'Transfer In',
        adjustment: 'Adjustment'
      }
      return types[type] || type
    }
    
    const fetchInventory = async () => {
      try {
        const response = await fetch('/api/admin/admin-inventory', {
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const data = await response.json()
          inventory.value = Array.isArray(data) ? data : []
          
          // Extract unique categories
          const uniqueCategories = [...new Set(inventory.value.map(i => i.item_category).filter(Boolean))]
          categories.value = uniqueCategories
        }
      } catch (error) {
        console.error('Error fetching inventory:', error)
        showToastMessage('Failed to load inventory', 'error')
      }
    }
    
    const initializeInventory = async () => {
      try {
        const response = await fetch('/api/admin/admin-inventory/initialize', {
          method: 'POST',
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const result = await response.json()
          showToastMessage(result.message || 'Inventory initialized successfully')
          fetchInventory()
        }
      } catch (error) {
        console.error('Error initializing inventory:', error)
        showToastMessage('Failed to initialize inventory', 'error')
      }
    }
    
    const refreshInventory = () => {
      fetchInventory()
      showToastMessage('Inventory refreshed')
    }
    
    const openAdjustModal = (item) => {
      selectedItem.value = item
      adjustmentType.value = 'add'
      adjustmentQuantity.value = 1
      adjustmentReason.value = ''
      showAdjustModal.value = true
    }
    
    const openThresholdModal = (item) => {
      selectedItem.value = item
      newThreshold.value = item.low_stock_threshold
      showThresholdModal.value = true
    }
    
    const viewHistory = async (item) => {
      selectedItem.value = item
      try {
        const response = await fetch(`/api/admin/stock-movements?item_id=${item.item_id}`, {
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const data = await response.json()
          stockHistory.value = Array.isArray(data) ? data : []
          showHistoryModal.value = true
        }
      } catch (error) {
        console.error('Error fetching history:', error)
        showToastMessage('Failed to load history', 'error')
      }
    }
    
    const submitAdjustment = async () => {
      if (!adjustmentQuantity.value || adjustmentQuantity.value <= 0) {
        showToastMessage('Please enter a valid quantity', 'error')
        return
      }
      
      submitting.value = true
      try {
        const response = await fetch('/api/admin/admin-inventory/adjust', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            item_id: selectedItem.value.item_id,
            type: adjustmentType.value,
            quantity: adjustmentQuantity.value,
            reason: adjustmentReason.value
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          showToastMessage(result.message || 'Inventory adjusted successfully')
          closeModals()
          fetchInventory()
        } else {
          const error = await response.json()
          showToastMessage(error.detail || 'Failed to adjust inventory', 'error')
        }
      } catch (error) {
        console.error('Error adjusting inventory:', error)
        showToastMessage('Failed to adjust inventory', 'error')
      } finally {
        submitting.value = false
      }
    }
    
    const updateThreshold = async () => {
      if (!newThreshold.value || newThreshold.value < 1) {
        showToastMessage('Please enter a valid threshold', 'error')
        return
      }
      
      submitting.value = true
      try {
        const response = await fetch(`/api/admin/admin-inventory/${selectedItem.value.item_id}/threshold?threshold=${newThreshold.value}`, {
          method: 'PUT',
          headers: getAuthHeaders()
        })
        
        if (response.ok) {
          const result = await response.json()
          showToastMessage(result.message || 'Threshold updated successfully')
          closeModals()
          fetchInventory()
        } else {
          const error = await response.json()
          showToastMessage(error.detail || 'Failed to update threshold', 'error')
        }
      } catch (error) {
        console.error('Error updating threshold:', error)
        showToastMessage('Failed to update threshold', 'error')
      } finally {
        submitting.value = false
      }
    }
    
    const closeModals = () => {
      showAdjustModal.value = false
      showThresholdModal.value = false
      showHistoryModal.value = false
      selectedItem.value = null
      stockHistory.value = []
    }
    
    onMounted(() => {
      fetchInventory()
    })
    
    return {
      loading,
      submitting,
      searchQuery,
      statusFilter,
      categoryFilter,
      inventory,
      categories,
      totalItems,
      totalStock,
      lowStockCount,
      averageStock,
      filteredInventory,
      showAdjustModal,
      showThresholdModal,
      showHistoryModal,
      selectedItem,
      adjustmentType,
      adjustmentQuantity,
      adjustmentReason,
      newThreshold,
      stockHistory,
      toastMessage,
      toastType,
      toastIcon,
      formatDate,
      formatDateTime,
      formatMovementType,
      initializeInventory,
      refreshInventory,
      openAdjustModal,
      openThresholdModal,
      viewHistory,
      submitAdjustment,
      updateThreshold,
      closeModals
    }
  }
}
</script>

<style scoped>
.admin-inventory {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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
  font-size: 14px;
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

@keyframes spin {
  to { transform: rotate(360deg); }
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
  gap: 10px;
}

.item-icon-small {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.category-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  background: #E3F2FD;
  color: #1976D2;
}

.critical {
  color: #F44336;
  font-weight: 600;
}

.low {
  color: #F57C00;
  font-weight: 600;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.status-badge.critical {
  background: #FFEBEE;
  color: #F44336;
}

.status-badge.low {
  background: #FFF3E0;
  color: #F57C00;
}

.status-badge.adequate {
  background: #E8F5E9;
  color: #4CAF50;
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
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 202, 113, 0.3);
}

.btn-secondary {
  background: #F5F5F5;
  border: 1px solid #E5E5E2;
  padding: 10px 20px;
  border-radius: 8px;
  color: #6F6C6D;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #E5E5E2;
}

.empty-state {
  text-align: center;
  padding: 60px !important;
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

.modal-content.small {
  max-width: 400px;
}

.modal-content.large {
  max-width: 700px;
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

.selected-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F9F7EB;
  border-radius: 12px;
  margin-bottom: 20px;
}

.item-name {
  font-weight: 600;
  color: #332F2E;
  margin-bottom: 4px;
}

.item-detail {
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
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
}

.form-group small {
  font-size: 12px;
  color: #8C8C90;
  margin-top: 4px;
  display: block;
}

.adjustment-types {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio-label input {
  width: auto;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-approve {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-reject {
  background: #F44336;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}

.movement-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.movement-badge.purchase {
  background: #E8F5E9;
  color: #4CAF50;
}

.movement-badge.transfer_out {
  background: #FFEBEE;
  color: #F44336;
}

.movement-badge.transfer_in {
  background: #E3F2FD;
  color: #1976D2;
}

.movement-badge.adjustment {
  background: #FFF3E0;
  color: #F57C00;
}

.positive {
  color: #4CAF50;
  font-weight: 600;
}

.negative {
  color: #F44336;
  font-weight: 600;
}

.history-list {
  max-height: 500px;
  overflow-y: auto;
}

.history-item {
  padding: 12px;
  border-bottom: 1px solid #F0F0F0;
}

.history-date {
  font-size: 12px;
  color: #8C8C90;
  margin-bottom: 4px;
}

.history-details {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.history-notes {
  font-size: 12px;
  color: #6F6C6D;
}

.performed-by {
  font-size: 11px;
  color: #8C8C90;
}

.empty-state-small {
  text-align: center;
  padding: 40px;
  color: #8C8C90;
}

.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 3000;
  animation: slideIn 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast.success {
  background: #88B788;
  color: white;
}

.toast.error {
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

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .admin-inventory {
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
  
  .modal-content {
    margin: 16px;
  }
  
  .adjustment-types {
    flex-direction: column;
    gap: 8px;
  }
}
</style>