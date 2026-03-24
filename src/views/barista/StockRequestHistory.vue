<template>
  <div class="stock-request-history">
    <div class="page-header">
      <h1 class="page-title">My Stock Requests</h1>
      <div class="header-actions">
        <router-link to="/barista/request-stock" class="btn-primary">
          <i class="fas fa-plus"></i> New Request
        </router-link>
        <button class="btn-secondary" @click="refreshHistory">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon pending">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-info">
          <h3>{{ pendingCount }}</h3>
          <p>Pending</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon approved">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-info">
          <h3>{{ approvedCount }}</h3>
          <p>Approved</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon rejected">
          <i class="fas fa-times-circle"></i>
        </div>
        <div class="stat-info">
          <h3>{{ rejectedCount }}</h3>
          <p>Rejected</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalRequests }}</h3>
          <p>Total Requests</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input v-model="searchQuery" placeholder="Search by item...">
      </div>
      <select v-model="statusFilter" class="filter-select">
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <select v-model="priorityFilter" class="filter-select">
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
      <input type="date" v-model="fromDate" class="date-input" placeholder="From Date">
      <input type="date" v-model="toDate" class="date-input" placeholder="To Date">
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading your requests...</p>
    </div>

    <!-- Requests List -->
    <div v-else class="requests-container">
      <div v-for="request in filteredRequests" :key="request.id" class="request-card">
        <div class="request-header">
          <div class="item-info">
            <div class="item-icon" :style="{ background: getItemColor(request.item_id) }">
              <i :class="getItemIcon(request.item_id)"></i>
            </div>
            <div>
              <h3>{{ request.item_name }}</h3>
              <p class="request-date">{{ formatDate(request.created_at) }}</p>
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
            <label>Reason:</label>
            <span>{{ request.reason || '-' }}</span>
          </div>
          <div class="detail-row" v-if="request.status !== 'pending'">
            <label>Response:</label>
            <span>{{ request.admin_response || '-' }}</span>
          </div>
          <div class="detail-row" v-if="request.response_date">
            <label>Response Date:</label>
            <span>{{ formatDate(request.response_date) }}</span>
          </div>
        </div>

        <div class="request-footer" v-if="request.status === 'pending'">
          <button class="btn-cancel" @click="cancelRequest(request)">
            <i class="fas fa-times"></i> Cancel Request
          </button>
        </div>
      </div>

      <div v-if="filteredRequests.length === 0" class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>No stock requests found</p>
        <router-link to="/barista/request-stock" class="btn-primary">
          Create Your First Request
        </router-link>
      </div>
    </div>

    <!-- Cancel Confirmation Modal -->
    <div v-if="showCancelModal" class="modal-overlay" @click.self="closeCancelModal">
      <div class="modal-content small">
        <div class="modal-header">
          <h2>Cancel Request</h2>
          <button class="close-btn" @click="closeCancelModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="warning-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p>Are you sure you want to cancel this request for <strong>{{ requestToCancel?.item_name }}</strong>?</p>
          <p class="warning-text">This action cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeCancelModal">No, Keep</button>
            <button class="btn-danger" @click="confirmCancel" :disabled="cancelling">
              <i v-if="cancelling" class="fas fa-spinner fa-spin"></i>
              <span v-else>Yes, Cancel</span>
            </button>
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
import { useRouter } from 'vue-router'
import api from '../../services/api';
export default {
  name: 'BaristaStockRequestHistory',
  setup() {
    const router = useRouter()
    
    // State
    const loading = ref(true)
    const cancelling = ref(false)
    const searchQuery = ref('')
    const statusFilter = ref('')
    const priorityFilter = ref('')
    const fromDate = ref('')
    const toDate = ref('')
    const requests = ref([])
    const itemDetails = ref({})
    
    // Modal state
    const showCancelModal = ref(false)
    const requestToCancel = ref(null)
    
    // Toast state
    const toastMessage = ref('')
    const toastType = ref('success')
    
    const toastIcon = computed(() => {
      return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
    })
    
    const pendingCount = computed(() => requests.value.filter(r => r.status === 'pending').length)
    const approvedCount = computed(() => requests.value.filter(r => r.status === 'approved').length)
    const rejectedCount = computed(() => requests.value.filter(r => r.status === 'rejected').length)
    const totalRequests = computed(() => requests.value.length)
    
    const filteredRequests = computed(() => {
      let filtered = requests.value
      
      if (searchQuery.value) {
        filtered = filtered.filter(r => 
          r.item_name?.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }
      
      if (statusFilter.value) {
        filtered = filtered.filter(r => r.status === statusFilter.value)
      }
      
      if (priorityFilter.value) {
        filtered = filtered.filter(r => r.priority === priorityFilter.value)
      }
      
      if (fromDate.value) {
        filtered = filtered.filter(r => r.created_at >= fromDate.value)
      }
      
      if (toDate.value) {
        filtered = filtered.filter(r => r.created_at <= toDate.value)
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
    
    const getItemColor = (itemId) => {
      return itemDetails.value[itemId]?.color || '#EFCA71'
    }
    
    const getItemIcon = (itemId) => {
      return itemDetails.value[itemId]?.icon || 'fas fa-cube'
    }
    
    const fetchRequests = async () => {
      try {
        const response = await api.get('/barista/stock-requests')
        if (response.status ==200) {
          const data = await response.data
          requests.value = Array.isArray(data) ? data : []
        }
      } catch (error) {
        console.error('Error fetching requests:', error)
        showToastMessage('Failed to load your requests', 'error')
      }
    }
    
    const fetchItemDetails = async () => {
      try {
        const response = await api.get('/barista/items')
        if (response.status === 200) {
          const data = await response.data
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
    
    const refreshHistory = async () => {
      await fetchRequests()
      showToastMessage('Requests refreshed')
    }
    
    const cancelRequest = (request) => {
      requestToCancel.value = request
      showCancelModal.value = true
    }
    
    const closeCancelModal = () => {
      showCancelModal.value = false
      requestToCancel.value = null
    }
    
    const confirmCancel = async () => {
      if (!requestToCancel.value) return
      
      cancelling.value = true
      try {
        const response = await api.delete(`/barista/stock-requests/${requestToCancel.value.id}`)
        
        if (response.status === 200) {
          showToastMessage(`Request for ${requestToCancel.value.item_name} cancelled successfully`)
          closeCancelModal()
          fetchRequests()
        } else {
          const error = await response.data
          showToastMessage(error.detail || 'Failed to cancel request', 'error')
        }
      } catch (error) {
        console.error('Error cancelling request:', error)
        showToastMessage('Failed to cancel request', 'error')
      } finally {
        cancelling.value = false
      }
    }
    
    onMounted(async () => {
      loading.value = true
      await Promise.all([fetchRequests(), fetchItemDetails()])
      loading.value = false
    })
    
    return {
      loading,
      cancelling,
      searchQuery,
      statusFilter,
      priorityFilter,
      fromDate,
      toDate,
      requests,
      pendingCount,
      approvedCount,
      rejectedCount,
      totalRequests,
      filteredRequests,
      showCancelModal,
      requestToCancel,
      toastMessage,
      toastType,
      toastIcon,
      formatDate,
      getItemColor,
      getItemIcon,
      refreshHistory,
      cancelRequest,
      closeCancelModal,
      confirmCancel
    }
  }
}
</script>

<style scoped>
.stock-request-history {
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

.btn-primary {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  color: #332F2E;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary:hover {
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
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #E5E5E2;
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
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.pending {
  background: #FFF3E0;
  color: #F57C00;
}

.stat-icon.approved {
  background: #E8F5E9;
  color: #4CAF50;
}

.stat-icon.rejected {
  background: #FFEBEE;
  color: #F44336;
}

.stat-icon.total {
  background: #E3F2FD;
  color: #1976D2;
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

.filter-select, .date-input {
  padding: 10px 16px;
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

.requests-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
}

.request-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(239, 202, 113, 0.15);
  transition: all 0.3s ease;
}

.request-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F0F0F0;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
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
  flex-shrink: 0;
}

.item-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #332F2E;
  margin: 0 0 4px;
}

.request-date {
  font-size: 12px;
  color: #8C8C90;
  margin: 0;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background: #FFF3E0;
  color: #F57C00;
}

.status-badge.approved {
  background: #E8F5E9;
  color: #4CAF50;
}

.status-badge.rejected {
  background: #FFEBEE;
  color: #F44336;
}

.request-details {
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #F9F7EB;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row label {
  width: 90px;
  font-weight: 500;
  color: #332F2E;
  font-size: 13px;
}

.detail-row span {
  flex: 1;
  color: #6F6C6D;
  font-size: 13px;
}

.quantity {
  font-weight: 600;
  color: #EFCA71;
}

.priority-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-block;
}

.priority-badge.low {
  background: #E8F5E9;
  color: #4CAF50;
}

.priority-badge.medium {
  background: #FFF3E0;
  color: #F57C00;
}

.priority-badge.high {
  background: #FFEBEE;
  color: #F44336;
}

.priority-badge.urgent {
  background: #FF5252;
  color: white;
}

.request-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #F0F0F0;
}

.btn-cancel {
  background: none;
  border: 1px solid #FFEBEE;
  color: #F44336;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-cancel:hover {
  background: #FFEBEE;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #8C8C90;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin-bottom: 20px;
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
  max-width: 400px;
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
  text-align: center;
}

.warning-icon {
  font-size: 48px;
  color: #F57C00;
  margin-bottom: 16px;
}

.warning-text {
  color: #F44336;
  font-size: 12px;
  margin-top: 8px;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}

.btn-danger {
  background: #F44336;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-danger:hover:not(:disabled) {
  background: #da190b;
}

.btn-secondary {
  background: #F5F5F5;
  border: 1px solid #E5E5E2;
  padding: 8px 20px;
  border-radius: 6px;
  color: #6F6C6D;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #E5E5E2;
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
  
  .requests-container {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

@media (max-width: 768px) {
  .stock-request-history {
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
  
  .filter-select, .date-input {
    width: 100%;
  }
  
  .requests-container {
    grid-template-columns: 1fr;
  }
  
  .request-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .detail-row {
    flex-direction: column;
  }
  
  .detail-row label {
    margin-bottom: 4px;
  }
}
</style>