<template>
  <div class="stock-management">
    <div class="page-header">
      <h1 class="page-title">Stock Management</h1>
      <div class="header-actions">
        <button class="btn-secondary" @click="activeTab = 'requests'">
          <i class="fas fa-clipboard-list"></i> Stock Requests
        </button>
        <button class="btn-secondary" @click="activeTab = 'inventory'">
          <i class="fas fa-boxes"></i> Admin Inventory
        </button>
        <button class="btn-secondary" @click="activeTab = 'movements'">
          <i class="fas fa-history"></i> Stock Movements
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        :class="['tab', { active: activeTab === 'requests' }]" 
        @click="activeTab = 'requests'"
      >
        <i class="fas fa-clipboard-list"></i> Stock Requests
        <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
      </button>
      <button 
        :class="['tab', { active: activeTab === 'inventory' }]" 
        @click="activeTab = 'inventory'"
      >
        <i class="fas fa-boxes"></i> Admin Inventory
      </button>
      <button 
        :class="['tab', { active: activeTab === 'movements' }]" 
        @click="activeTab = 'movements'"
      >
        <i class="fas fa-history"></i> Stock Movements
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>

    <!-- Stock Requests Tab -->
    <div v-else-if="activeTab === 'requests'">
      <div class="filters">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input v-model="requestSearch" placeholder="Search by item or requester...">
        </div>
        <select v-model="requestStatusFilter" class="filter-select">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div class="requests-grid">
        <div v-for="request in filteredRequests" :key="request.id" class="request-card">
          <div class="request-header">
            <div class="item-info">
              <div class="item-icon" :style="{ background: getItemColor(request.item_id) }">
                <i :class="getItemIcon(request.item_id)"></i>
              </div>
              <div>
                <h3>{{ request.item_name }}</h3>
                <p class="category">{{ request.item_category }}</p>
              </div>
            </div>
            <span :class="['status-badge', request.status]">{{ request.status }}</span>
          </div>

          <div class="request-details">
            <div class="detail-row">
              <label>Quantity:</label>
              <span class="quantity">{{ request.requested_quantity }}</span>
            </div>
            <div class="detail-row">
              <label>Priority:</label>
              <span :class="['priority-badge', request.priority]">{{ request.priority }}</span>
            </div>
            <div class="detail-row">
              <label>Requested By:</label>
              <span>{{ request.requested_by }}</span>
            </div>
            <div class="detail-row">
              <label>Reason:</label>
              <span>{{ request.reason || '-' }}</span>
            </div>
            <div class="detail-row">
              <label>Date:</label>
              <span>{{ formatDate(request.created_at) }}</span>
            </div>
          </div>

          <div v-if="request.status === 'pending'" class="request-actions">
            <button class="btn-approve" @click="openApproveModal(request)">
              <i class="fas fa-check"></i> Approve
            </button>
            <button class="btn-reject" @click="openRejectModal(request)">
              <i class="fas fa-times"></i> Reject
            </button>
          </div>
          
          <div v-if="request.status !== 'pending'" class="admin-response">
            <strong>Admin Response:</strong>
            <p>{{ request.admin_response || '-' }}</p>
            <small v-if="request.response_date">{{ formatDate(request.response_date) }}</small>
          </div>
        </div>
        
        <div v-if="filteredRequests.length === 0" class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>No stock requests found</p>
        </div>
      </div>
    </div>

    <!-- Admin Inventory Tab -->
    <div v-else-if="activeTab === 'inventory'">
      <div class="filters">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input v-model="inventorySearch" placeholder="Search items...">
        </div>
        <select v-model="stockFilter" class="filter-select">
          <option value="">All Stock Levels</option>
          <option value="critical">Critical</option>
          <option value="low">Low</option>
          <option value="adequate">Adequate</option>
        </select>
        <button class="btn-primary" @click="refreshInventory">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      <div class="inventory-table-container">
        <table class="inventory-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Threshold</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
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
              <td>{{ item.item_category }}</td>
              <td :class="{ 'critical': item.quantity <= item.low_stock_threshold * 0.3, 'low': item.quantity <= item.low_stock_threshold }">
                {{ item.quantity }}
              </td>
              <td>{{ item.low_stock_threshold }}</td>
              <td>
                <span :class="['status-badge', item.status]">{{ item.status }}</span>
              </td>
              <td>
                <button class="btn-icon" @click="openAdjustModal(item)" title="Adjust Stock">
                  <i class="fas fa-edit"></i>
                </button>
              </td>
            </tr>
            <tr v-if="filteredInventory.length === 0">
              <td colspan="6" class="empty-state">No inventory items found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Stock Movements Tab -->
    <div v-else-if="activeTab === 'movements'">
      <div class="filters">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input v-model="movementSearch" placeholder="Search by item...">
        </div>
        <select v-model="movementTypeFilter" class="filter-select">
          <option value="">All Types</option>
          <option value="purchase">Purchase</option>
          <option value="transfer_out">Transfer Out</option>
          <option value="transfer_in">Transfer In</option>
          <option value="adjustment">Adjustment</option>
        </select>
        <input type="date" v-model="fromDate" class="date-input">
        <input type="date" v-model="toDate" class="date-input">
      </div>

      <div class="movements-table-container">
        <table class="movements-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Item</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Source/Destination</th>
              <th>Performed By</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="movement in filteredMovements" :key="movement.id">
              <td>{{ formatDateTime(movement.created_at) }}</td>
              <td>{{ movement.item_name }}</td>
              <td>
                <span :class="['movement-badge', movement.movement_type]">
                  {{ formatMovementType(movement.movement_type) }}
                </span>
              </td>
              <td :class="{ 'positive': movement.quantity > 0, 'negative': movement.quantity < 0 }">
                {{ movement.quantity > 0 ? '+' : '' }}{{ movement.quantity }}
              </td>
              <td>{{ movement.source }} → {{ movement.destination }}</td>
              <td>{{ movement.performed_by }}</td>
              <td>{{ movement.notes || '-' }}</td>
            </tr>
            <tr v-if="filteredMovements.length === 0">
              <td colspan="7" class="empty-state">No stock movements found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Approve Modal -->
    <div v-if="showApproveModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Approve Stock Request</h2>
          <button class="close-btn" @click="closeModals">&times;</button>
        </div>
        <div class="modal-body">
          <div class="selected-item" v-if="selectedRequest">
            <div class="item-icon" :style="{ background: getItemColor(selectedRequest.item_id) }">
              <i :class="getItemIcon(selectedRequest.item_id)"></i>
            </div>
            <div>
              <div class="item-name">{{ selectedRequest.item_name }}</div>
              <div class="item-detail">Requested: {{ selectedRequest.requested_quantity }} units</div>
              <div class="item-detail">Priority: {{ selectedRequest.priority }}</div>
            </div>
          </div>

          <div class="form-group">
            <label>Transfer Quantity</label>
            <input type="number" v-model.number="transferQuantity" 
                   :max="selectedRequest?.requested_quantity" min="1"
                   placeholder="Enter quantity to transfer">
            <small>Available in admin inventory: {{ getAvailableStock(selectedRequest?.item_id) }}</small>
          </div>

          <div class="form-group">
            <label>Admin Response (Optional)</label>
            <textarea v-model="adminResponse" rows="2" placeholder="Add a response message..."></textarea>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModals">Cancel</button>
            <button class="btn-approve" @click="approveRequest" :disabled="submitting">
              <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
              <span v-else>Approve & Transfer</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Reject Stock Request</h2>
          <button class="close-btn" @click="closeModals">&times;</button>
        </div>
        <div class="modal-body">
          <div class="selected-item" v-if="selectedRequest">
            <div class="item-icon" :style="{ background: getItemColor(selectedRequest.item_id) }">
              <i :class="getItemIcon(selectedRequest.item_id)"></i>
            </div>
            <div>
              <div class="item-name">{{ selectedRequest.item_name }}</div>
              <div class="item-detail">Requested: {{ selectedRequest.requested_quantity }} units</div>
            </div>
          </div>

          <div class="form-group">
            <label>Reason for Rejection *</label>
            <textarea v-model="rejectReason" rows="3" placeholder="Explain why the request is being rejected..."></textarea>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModals">Cancel</button>
            <button class="btn-reject" @click="rejectRequest" :disabled="submitting || !rejectReason">
              <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
              <span v-else>Reject Request</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Adjust Inventory Modal -->
    <div v-if="showAdjustModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Adjust Admin Inventory</h2>
          <button class="close-btn" @click="closeModals">&times;</button>
        </div>
        <div class="modal-body">
          <div class="selected-item" v-if="selectedInventoryItem">
            <div class="item-icon" :style="{ background: selectedInventoryItem.item_color }">
              <i :class="selectedInventoryItem.item_icon"></i>
            </div>
            <div>
              <div class="item-name">{{ selectedInventoryItem.item_name }}</div>
              <div class="item-detail">Current Stock: {{ selectedInventoryItem.quantity }} units</div>
              <div class="item-detail">Threshold: {{ selectedInventoryItem.low_stock_threshold }}</div>
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
                   :max="adjustmentType === 'remove' ? selectedInventoryItem?.quantity : 9999"
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
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'

export default {
  name: 'StockManagement',
  setup() {
    const toast = useToast()
    
    // State
    const loading = ref(true)
    const submitting = ref(false)
    const activeTab = ref('requests')
    const requestSearch = ref('')
    const requestStatusFilter = ref('')
    const inventorySearch = ref('')
    const stockFilter = ref('')
    const movementSearch = ref('')
    const movementTypeFilter = ref('')
    const fromDate = ref('')
    const toDate = ref('')
    
    // Data
    const stockRequests = ref([])
    const adminInventory = ref([])
    const stockMovements = ref([])
    const itemDetails = ref({})
    
    // Modals
    const showApproveModal = ref(false)
    const showRejectModal = ref(false)
    const showAdjustModal = ref(false)
    const selectedRequest = ref(null)
    const selectedInventoryItem = ref(null)
    const transferQuantity = ref(1)
    const adminResponse = ref('')
    const rejectReason = ref('')
    const adjustmentType = ref('add')
    const adjustmentQuantity = ref(1)
    const adjustmentReason = ref('')
    
    // Computed
    const pendingCount = computed(() => {
      return stockRequests.value.filter(r => r.status === 'pending').length
    })
    
    const filteredRequests = computed(() => {
      let filtered = stockRequests.value
      if (requestSearch.value) {
        filtered = filtered.filter(r => 
          r.item_name?.toLowerCase().includes(requestSearch.value.toLowerCase()) ||
          r.requested_by?.toLowerCase().includes(requestSearch.value.toLowerCase())
        )
      }
      if (requestStatusFilter.value) {
        filtered = filtered.filter(r => r.status === requestStatusFilter.value)
      }
      return filtered
    })
    
    const filteredInventory = computed(() => {
      let filtered = adminInventory.value
      if (inventorySearch.value) {
        filtered = filtered.filter(i => 
          i.item_name?.toLowerCase().includes(inventorySearch.value.toLowerCase())
        )
      }
      if (stockFilter.value) {
        filtered = filtered.filter(i => i.status === stockFilter.value)
      }
      return filtered
    })
    
    const filteredMovements = computed(() => {
      let filtered = stockMovements.value
      if (movementSearch.value) {
        filtered = filtered.filter(m => 
          m.item_name?.toLowerCase().includes(movementSearch.value.toLowerCase())
        )
      }
      if (movementTypeFilter.value) {
        filtered = filtered.filter(m => m.movement_type === movementTypeFilter.value)
      }
      if (fromDate.value) {
        filtered = filtered.filter(m => m.created_at >= fromDate.value)
      }
      if (toDate.value) {
        filtered = filtered.filter(m => m.created_at <= toDate.value)
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
        adjustment: 'Adjustment',
        waste: 'Waste',
        sale: 'Sale'
      }
      return types[type] || type
    }
    
    const getItemColor = (itemId) => {
      return itemDetails.value[itemId]?.color || '#EFCA71'
    }
    
    const getItemIcon = (itemId) => {
      return itemDetails.value[itemId]?.icon || 'fas fa-cube'
    }
    
    const getAvailableStock = (itemId) => {
      const item = adminInventory.value.find(i => i.item_id === itemId)
      return item?.quantity || 0
    }
    
    const fetchStockRequests = async () => {
      try {
        const response = await fetch('/api/admin/stock-requests', {
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const data = await response.json()
          stockRequests.value = Array.isArray(data) ? data : []
        }
      } catch (error) {
        console.error('Error fetching stock requests:', error)
      }
    }
    
    const fetchAdminInventory = async () => {
      try {
        const response = await fetch('/api/admin/admin-inventory', {
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const data = await response.json()
          adminInventory.value = Array.isArray(data) ? data : []
        }
      } catch (error) {
        console.error('Error fetching admin inventory:', error)
      }
    }
    
    const fetchStockMovements = async () => {
      try {
        const response = await fetch('/api/admin/stock-movements', {
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const data = await response.json()
          stockMovements.value = Array.isArray(data) ? data : []
        }
      } catch (error) {
        console.error('Error fetching stock movements:', error)
      }
    }
    
    const fetchItemDetails = async () => {
      try {
        const response = await fetch('/api/admin/items', {
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const data = await response.json()
          const items = Array.isArray(data) ? data : []
          items.forEach(item => {
            itemDetails.value[item.id] = {
              icon: item.icon,
              color: item.color
            }
          })
        }
      } catch (error) {
        console.error('Error fetching item details:', error)
      }
    }
    
    const fetchAllData = async () => {
      loading.value = true
      await Promise.all([
        fetchStockRequests(),
        fetchAdminInventory(),
        fetchStockMovements(),
        fetchItemDetails()
      ])
      loading.value = false
    }
    
    const openApproveModal = (request) => {
      selectedRequest.value = request
      transferQuantity.value = request.requested_quantity
      adminResponse.value = ''
      showApproveModal.value = true
    }
    
    const openRejectModal = (request) => {
      selectedRequest.value = request
      rejectReason.value = ''
      showRejectModal.value = true
    }
    
    const openAdjustModal = (item) => {
      selectedInventoryItem.value = item
      adjustmentType.value = 'add'
      adjustmentQuantity.value = 1
      adjustmentReason.value = ''
      showAdjustModal.value = true
    }
    
    const approveRequest = async () => {
      if (!transferQuantity.value || transferQuantity.value <= 0) {
        toast.error('Please enter a valid quantity')
        return
      }
      
      submitting.value = true
      try {
        const response = await fetch(`/api/admin/stock-requests/${selectedRequest.value.id}/approve`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            admin_response: adminResponse.value,
            transfer_quantity: transferQuantity.value
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          toast.success(result.message || 'Stock request approved successfully')
          closeModals()
          fetchAllData()
        } else {
          const error = await response.json()
          toast.error(error.detail || 'Failed to approve request')
        }
      } catch (error) {
        console.error('Error approving request:', error)
        toast.error('Failed to approve request')
      } finally {
        submitting.value = false
      }
    }
    
    const rejectRequest = async () => {
      if (!rejectReason.value.trim()) {
        toast.error('Please provide a reason for rejection')
        return
      }
      
      submitting.value = true
      try {
        const response = await fetch(`/api/admin/stock-requests/${selectedRequest.value.id}/reject`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            admin_response: rejectReason.value
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          toast.success(result.message || 'Stock request rejected')
          closeModals()
          fetchAllData()
        } else {
          const error = await response.json()
          toast.error(error.detail || 'Failed to reject request')
        }
      } catch (error) {
        console.error('Error rejecting request:', error)
        toast.error('Failed to reject request')
      } finally {
        submitting.value = false
      }
    }
    
    const submitAdjustment = async () => {
      if (!adjustmentQuantity.value || adjustmentQuantity.value <= 0) {
        toast.error('Please enter a valid quantity')
        return
      }
      
      submitting.value = true
      try {
        const response = await fetch(`/api/admin/admin-inventory/adjust`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            item_id: selectedInventoryItem.value.item_id,
            type: adjustmentType.value,
            quantity: adjustmentQuantity.value,
            reason: adjustmentReason.value
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          toast.success(result.message || 'Inventory adjusted successfully')
          closeModals()
          fetchAdminInventory()
          fetchStockMovements()
        } else {
          const error = await response.json()
          toast.error(error.detail || 'Failed to adjust inventory')
        }
      } catch (error) {
        console.error('Error adjusting inventory:', error)
        toast.error('Failed to adjust inventory')
      } finally {
        submitting.value = false
      }
    }
    
    const closeModals = () => {
      showApproveModal.value = false
      showRejectModal.value = false
      showAdjustModal.value = false
      selectedRequest.value = null
      selectedInventoryItem.value = null
    }
    
    const refreshInventory = () => {
      fetchAdminInventory()
      toast.info('Inventory refreshed')
    }
    
    onMounted(() => {
      fetchAllData()
    })
    
    return {
      loading,
      submitting,
      activeTab,
      requestSearch,
      requestStatusFilter,
      inventorySearch,
      stockFilter,
      movementSearch,
      movementTypeFilter,
      fromDate,
      toDate,
      stockRequests,
      adminInventory,
      stockMovements,
      pendingCount,
      filteredRequests,
      filteredInventory,
      filteredMovements,
      showApproveModal,
      showRejectModal,
      showAdjustModal,
      selectedRequest,
      selectedInventoryItem,
      transferQuantity,
      adminResponse,
      rejectReason,
      adjustmentType,
      adjustmentQuantity,
      adjustmentReason,
      formatDate,
      formatDateTime,
      formatMovementType,
      getItemColor,
      getItemIcon,
      getAvailableStock,
      openApproveModal,
      openRejectModal,
      openAdjustModal,
      approveRequest,
      rejectRequest,
      submitAdjustment,
      closeModals,
      refreshInventory
    }
  }
}
</script>

<style scoped>
.users-management {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
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

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #E5E5E2;
}

.tab {
  padding: 12px 24px;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 600;
  color: #8C8C90;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
}

.tab:hover {
  color: #EFCA71;
}

.tab.active {
  color: #EFCA71;
  border-bottom-color: #EFCA71;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

/* Search and Filter */
.search-filter {
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

.filter-box select {
  padding: 10px 24px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  background: white;
  cursor: pointer;
}

/* Table Styles */
.table-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.data-table th {
  text-align: left;
  padding: 16px;
  background: #F9F7EB;
  color: #332F2E;
  font-weight: 600;
  border-bottom: 1px solid #E5E5E2;
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid #F0F0F0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar, .waiter-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #332F2E;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  flex-shrink: 0;
}

.name {
  font-weight: 600;
  color: #332F2E;
}

.email {
  font-size: 12px;
  color: #8C8C90;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.role-badge.admin { background: #FFF3E0; color: #F57C00; }
.role-badge.cashier { background: #E3F2FD; color: #1976D2; }
.role-badge.barista { background: #E8F5E9; color: #4CAF50; }

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.status-badge.active { background: #E8F5E9; color: #4CAF50; }
.status-badge.inactive { background: #FFEBEE; color: #F44336; }

.coupon-count {
  font-weight: 600;
  color: #EFCA71;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

.btn-icon.danger:hover {
  background: #FFEBEE;
  border-color: #F44336;
  color: #F44336;
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

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #F5F5F5;
  border: 1px solid #E5E5E2;
  padding: 10px 20px;
  border-radius: 8px;
  color: #6F6C6D;
  cursor: pointer;
}

.btn-danger {
  background: #C45A5A;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 48px !important;
  color: #8C8C90;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
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
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
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
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.warning-text {
  color: #C45A5A;
  font-size: 12px;
  margin-top: 8px;
}

/* Responsive */
@media (max-width: 768px) {
  .users-management { padding: 16px; }
  .page-title { font-size: 24px; }
  .stats-grid { grid-template-columns: 1fr; gap: 12px; }
  .search-filter { flex-direction: column; }
  .filter-box select { width: 100%; }
  .form-row { grid-template-columns: 1fr; }
  .tabs { flex-wrap: wrap; }
  .tab { flex: 1; text-align: center; }
}
</style>