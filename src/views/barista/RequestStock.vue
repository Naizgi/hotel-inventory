<template>
  <div class="request-stock">
    <!-- Page Header -->
    <div class="page-header card">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <span class="title-gradient">Request</span>
            <span class="title-management">Stock</span>
          </h1>
          <p class="page-subtitle">Submit stock requests and track their status</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" @click="viewRequestHistory">
            <i class="fas fa-history"></i>
            <span>View History</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container card">
      <div class="loading-spinner"></div>
      <p>Loading stock data...</p>
    </div>

    <div v-else>
      <!-- Quick Request Form -->
      <div class="section-card card">
        <div class="section-header">
          <h3>New Stock Request</h3>
          <span class="section-subtitle">Submit a request for additional stock</span>
        </div>
        <form @submit.prevent="submitRequest">
          <div class="form-row">
            <div class="form-group">
              <label>Select Item *</label>
              <select v-model="requestForm.item_id" required @change="onItemSelect">
                <option value="">Select an item</option>
                <option v-for="item in items" :key="item.id" :value="item.id">
                  {{ item.name }} (Current: {{ item.remaining || 0 }} left)
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Requested Quantity *</label>
              <input 
                type="number" 
                v-model.number="requestForm.quantity" 
                required
                min="1"
                :max="maxRequestQuantity"
                placeholder="Enter quantity"
              >
              <small v-if="selectedItem">Recommended: {{ getRecommendedQuantity(selectedItem) }} units</small>
            </div>
          </div>
          
          <div class="form-group">
            <label>Priority Level</label>
            <div class="priority-options">
              <label class="priority-option">
                <input type="radio" v-model="requestForm.priority" value="low">
                <span class="priority-badge low">Low</span>
              </label>
              <label class="priority-option">
                <input type="radio" v-model="requestForm.priority" value="medium">
                <span class="priority-badge medium">Medium</span>
              </label>
              <label class="priority-option">
                <input type="radio" v-model="requestForm.priority" value="high">
                <span class="priority-badge high">High</span>
              </label>
              <label class="priority-option">
                <input type="radio" v-model="requestForm.priority" value="urgent">
                <span class="priority-badge urgent">Urgent</span>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label>Reason for Request</label>
            <textarea 
              v-model="requestForm.reason" 
              rows="3" 
              placeholder="Explain why you need this stock (e.g., high demand, event, etc.)"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>Additional Notes</label>
            <textarea 
              v-model="requestForm.notes" 
              rows="2" 
              placeholder="Any additional information..."
            ></textarea>
          </div>
          
          <button type="submit" class="btn btn-primary" :disabled="!isFormValid || isSubmitting">
            <i class="fas" :class="isSubmitting ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
            <span>{{ isSubmitting ? 'Submitting...' : 'Submit Request' }}</span>
          </button>
        </form>
      </div>

      <!-- Current Stock Status -->
      <div class="section-card card">
        <div class="section-header">
          <h3>Current Stock Status</h3>
          <span class="section-subtitle">Monitor inventory levels</span>
        </div>
        <div class="items-grid">
          <div v-for="item in items" :key="item.id" class="item-card">
            <div class="item-icon" :style="{ background: item.color || '#EFCA71' }">
              <i :class="item.icon || 'fas fa-cube'"></i>
            </div>
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-stats">
                <span class="remaining">Remaining: {{ item.remaining || 0 }}</span>
                <span class="threshold">Threshold: {{ item.threshold || 20 }}</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ 
                    width: ((item.remaining || 0) / (item.default_coupon || 100) * 100) + '%',
                    background: getStockColor(item.remaining || 0, item.threshold || 20)
                  }"
                ></div>
              </div>
              <div class="status-indicator" :class="getStockStatus(item.remaining || 0, item.threshold || 20)">
                {{ getStockStatusText(item.remaining || 0, item.threshold || 20) }}
              </div>
            </div>
            <button 
              class="btn-request" 
              @click="quickRequest(item)"
              :disabled="(item.remaining || 0) > (item.threshold || 20) || isSubmitting"
            >
              <i class="fas fa-plus"></i>
              <span>Request</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Requests -->
      <div class="section-card card">
        <div class="section-header">
          <h3>Recent Requests</h3>
          <button class="btn-text" @click="refreshRequests" :disabled="isRefreshing">
            <i class="fas" :class="isRefreshing ? 'fa-spinner fa-spin' : 'fa-sync-alt'"></i>
            <span>{{ isRefreshing ? 'Refreshing...' : 'Refresh' }}</span>
          </button>
        </div>
        <div class="table-container">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Response</th>
                  <th>Actions</th></tr>
                 </thead>
              <tbody>
                <tr v-for="request in recentRequests" :key="request.id">
                  <td data-label="Date">{{ formatDateTime(request.created_at) }}</td>
                  <td data-label="Item">
                    <div class="item-info">
                      <div class="item-icon-small" :style="{ background: request.color || '#EFCA71' }">
                        <i :class="request.icon || 'fas fa-cube'"></i>
                      </div>
                      <span>{{ request.item_name }}</span>
                    </div>
                  </td>
                  <td data-label="Quantity" class="quantity-cell">{{ request.requested_quantity || 0 }}</td>
                  <td data-label="Priority">
                    <span :class="['priority-badge', request.priority || 'medium']">
                      {{ request.priority || 'medium' }}
                    </span>
                  </td>
                  <td data-label="Status">
                    <span :class="['status-badge', request.status || 'pending']">
                      {{ request.status || 'pending' }}
                    </span>
                  </td>
                  <td data-label="Response">
                    {{ request.response_date ? formatDateTime(request.response_date) : '-' }}
                  </td>
                  <td data-label="Actions" class="actions-cell">
                    <button v-if="request.status === 'pending'" class="btn-icon" @click="cancelRequest(request)" title="Cancel Request">
                      <i class="fas fa-times-circle"></i>
                    </button>
                    <button class="btn-icon" @click="viewRequestDetails(request)" title="View Details">
                      <i class="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="recentRequests.length === 0">
                  <td colspan="7" class="empty-state">No recent requests found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Request Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="closeDetailsModal">
      <div class="modal-content card" @click.stop>
        <div class="modal-header">
          <h2>Request Details</h2>
          <button class="close-btn" @click="closeDetailsModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="details-card" v-if="selectedRequest">
            <div class="detail-row">
              <label>Request ID:</label>
              <span>#{{ selectedRequest.id }}</span>
            </div>
            <div class="detail-row">
              <label>Date:</label>
              <span>{{ formatDateTime(selectedRequest.created_at) }}</span>
            </div>
            <div class="detail-row">
              <label>Item:</label>
              <div class="item-info">
                <div class="item-icon-small" :style="{ background: selectedRequest.color || '#EFCA71' }">
                  <i :class="selectedRequest.icon || 'fas fa-cube'"></i>
                </div>
                <span>{{ selectedRequest.item_name }}</span>
              </div>
            </div>
            <div class="detail-row">
              <label>Quantity:</label>
              <span class="quantity-highlight">{{ selectedRequest.requested_quantity || 0 }}</span>
            </div>
            <div class="detail-row">
              <label>Priority:</label>
              <span :class="['priority-badge', selectedRequest.priority || 'medium']">
                {{ selectedRequest.priority || 'medium' }}
              </span>
            </div>
            <div class="detail-row">
              <label>Status:</label>
              <span :class="['status-badge', selectedRequest.status || 'pending']">
                {{ selectedRequest.status || 'pending' }}
              </span>
            </div>
            <div class="detail-row">
              <label>Reason:</label>
              <p>{{ selectedRequest.reason || '-' }}</p>
            </div>
            <div class="detail-row">
              <label>Notes:</label>
              <p>{{ selectedRequest.notes || '-' }}</p>
            </div>
            <div v-if="selectedRequest.admin_response" class="detail-row">
              <label>Admin Response:</label>
              <p>{{ selectedRequest.admin_response }}</p>
            </div>
            <div v-if="selectedRequest.response_date" class="detail-row">
              <label>Response Date:</label>
              <span>{{ formatDateTime(selectedRequest.response_date) }}</span>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" @click="closeDetailsModal">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancel Confirmation Modal -->
    <div v-if="showCancelModal" class="modal-overlay" @click.self="closeCancelModal">
      <div class="modal-content card small" @click.stop>
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
            <button class="btn btn-outline" @click="closeCancelModal">No, Keep</button>
            <button class="btn btn-danger" @click="confirmCancel">Yes, Cancel</button>
          </div>
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
  name: 'BaristaRequestStock',
  setup() {
    const router = useRouter()
    
    // State
    const isLoading = ref(true)
    const isSubmitting = ref(false)
    const isRefreshing = ref(false)
    const showDetailsModal = ref(false)
    const showCancelModal = ref(false)
    const selectedRequest = ref(null)
    const requestToCancel = ref(null)
    const toastMessage = ref('')
    const toastType = ref('success')
    
    const requestForm = ref({
      item_id: '',
      quantity: 1,
      priority: 'medium',
      reason: '',
      notes: ''
    })
    
    const items = ref([])
    const recentRequests = ref([])

    const toastIcon = computed(() => {
      return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
    })

    const selectedItem = computed(() => {
      if (!requestForm.value.item_id) return null
      return items.value.find(i => i.id === parseInt(requestForm.value.item_id))
    })
    
    const maxRequestQuantity = computed(() => {
      if (!selectedItem.value) return 100
      return Math.min((selectedItem.value.default_coupon || 100) * 2, 500)
    })
    
    const isFormValid = computed(() => {
      return requestForm.value.item_id && 
             requestForm.value.quantity > 0 && 
             requestForm.value.quantity <= maxRequestQuantity.value &&
             requestForm.value.priority
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

    const getRecommendedQuantity = (item) => {
      const deficit = (item.default_coupon || 100) - (item.remaining || 0)
      if (deficit <= 0) return 20
      return Math.min(Math.ceil(deficit * 1.5), item.default_coupon || 100)
    }
    
    const getStockColor = (remaining, threshold) => {
      if (remaining <= threshold * 0.3) return '#C45A5A'
      if (remaining <= threshold) return '#F57C00'
      return '#88B788'
    }
    
    const getStockStatus = (remaining, threshold) => {
      if (remaining <= threshold * 0.3) return 'critical'
      if (remaining <= threshold) return 'low'
      return 'adequate'
    }
    
    const getStockStatusText = (remaining, threshold) => {
      if (remaining <= threshold * 0.3) return 'Critical - Immediate Action Required'
      if (remaining <= threshold) return 'Low - Restock Soon'
      return 'Adequate Stock'
    }
    
    const formatDateTime = (dateTime) => {
      if (!dateTime) return '-'
      try {
        const date = new Date(dateTime)
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (e) {
        return '-'
      }
    }
    
    const loadDemoData = () => {
      items.value = [
        { 
          id: 1, 
          name: 'Beer', 
          category: 'Drinks',
          price: 60,
          default_coupon: 100, 
          remaining: 45, 
          threshold: 30,
          icon: 'fas fa-beer', 
          color: '#F4A261' 
        },
        { 
          id: 2, 
          name: 'Wine', 
          category: 'Drinks',
          price: 150,
          default_coupon: 50, 
          remaining: 30, 
          threshold: 20,
          icon: 'fas fa-wine-bottle', 
          color: '#9C6B42' 
        },
        { 
          id: 3, 
          name: 'Whiskey', 
          category: 'Drinks',
          price: 200,
          default_coupon: 40, 
          remaining: 28, 
          threshold: 15,
          icon: 'fas fa-glass-whiskey', 
          color: '#E9C46A' 
        },
        { 
          id: 4, 
          name: 'Cocktail', 
          category: 'Drinks',
          price: 180,
          default_coupon: 35, 
          remaining: 20, 
          threshold: 15,
          icon: 'fas fa-cocktail', 
          color: '#2A9D8F' 
        },
        { 
          id: 5, 
          name: 'Shiro', 
          category: 'Food',
          price: 80,
          default_coupon: 80, 
          remaining: 25, 
          threshold: 24,
          icon: 'fas fa-utensils', 
          color: '#E9C46A' 
        },
        { 
          id: 6, 
          name: 'Tibs', 
          category: 'Food',
          price: 120,
          default_coupon: 60, 
          remaining: 40, 
          threshold: 18,
          icon: 'fas fa-utensil-spoon', 
          color: '#E76F51' 
        }
      ]
      
      recentRequests.value = [
        { 
          id: 1, 
          created_at: new Date().toISOString(), 
          item_name: 'Beer', 
          requested_quantity: 50, 
          priority: 'high',
          status: 'approved',
          reason: 'High demand from customers',
          notes: 'Weekend event',
          admin_response: 'Order placed with supplier',
          response_date: new Date().toISOString(),
          icon: 'fas fa-beer',
          color: '#F4A261'
        },
        { 
          id: 2, 
          created_at: new Date(Date.now() - 86400000).toISOString(), 
          item_name: 'Wine', 
          requested_quantity: 30, 
          priority: 'medium',
          status: 'pending',
          reason: 'Running low',
          notes: '',
          icon: 'fas fa-wine-bottle',
          color: '#9C6B42'
        }
      ]
    }
    
    const fetchData = async () => {
      isLoading.value = true
      try {
        const token = localStorage.getItem('authToken')
        
        if (!token) {
          showToast('Please login again', 'error')
          setTimeout(() => router.push('/login'), 1500)
          return
        }
        
        console.log('Fetching items from /barista/items...')
        
        // First fetch all items from items table
        const itemsResponse = await api.get('/barista/items')
        
        if (itemsResponse.status === 401 || itemsResponse.status === 403) {
          showToast('Session expired. Please login again.', 'error')
          setTimeout(() => router.push('/login'), 1500)
          return
        }
        
        if (itemsResponse.status === 200) {
          const itemsData = await itemsResponse.data
          console.log('Items data received:', itemsData)
          const itemsList = Array.isArray(itemsData) ? itemsData : (itemsData.items || itemsData)
          
          // Now fetch current inventory to get remaining quantities
          console.log('Fetching inventory from /barista/inventory...')
          const inventoryResponse = await api.get('/barista/inventory')
          
          let inventoryMap = {}
          if (inventoryResponse.status === 200) {
            const inventoryData = await inventoryResponse.data
            console.log('Inventory data received:', inventoryData)
            const inventoryList = Array.isArray(inventoryData) ? inventoryData : (inventoryData.items || inventoryData)
            
            // Create a map of item_id to remaining quantity
            inventoryList.forEach(inv => {
              inventoryMap[inv.item_id] = {
                remaining: inv.remaining_coupon || inv.remaining || 0,
                default_coupon: inv.initial_coupon || inv.default_coupon || 0
              }
            })
          }
          
          // Combine items with their current stock levels
          items.value = itemsList.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            price: item.price,
            default_coupon: item.default_coupon,
            remaining: inventoryMap[item.id]?.remaining || 0,
            icon: item.icon || 'fas fa-cube',
            color: item.color || '#EFCA71',
            threshold: Math.floor((item.default_coupon || 100) * 0.3)
          }))
          
          console.log('Final items with stock levels:', items.value)
          
        } else {
          console.error('Failed to fetch items:', itemsResponse.status)
          loadDemoData()
        }
        
        // Fetch stock requests from barista/stock-requests
        console.log('Fetching stock requests from /barista/stock-requests...')
        const requestsResponse = await api.get('/barista/stock-requests')
        
        if (requestsResponse.status === 200) {
          const data = await requestsResponse.data
          console.log('Stock requests received:', data)
          const requests = Array.isArray(data) ? data : (data.requests || data)
          recentRequests.value = requests.slice(0, 10).map(req => {
            const item = items.value.find(i => i.id === req.item_id)
            return {
              ...req,
              icon: item?.icon || 'fas fa-cube',
              color: item?.color || '#EFCA71'
            }
          })
        } else {
          console.error('Failed to fetch requests:', requestsResponse.status)
        }
        
      } catch (error) {
        console.error('Error fetching data:', error)
        showToast('Failed to load data. Using demo data.', 'error')
        loadDemoData()
      } finally {
        isLoading.value = false
      }
    }
    
    const onItemSelect = () => {
      if (selectedItem.value) {
        const recommended = getRecommendedQuantity(selectedItem.value)
        requestForm.value.quantity = Math.min(recommended, maxRequestQuantity.value)
        
        // Auto-set priority based on stock level
        const threshold = selectedItem.value.threshold || 20
        const remaining = selectedItem.value.remaining || 0
        if (remaining <= threshold * 0.5) {
          requestForm.value.priority = 'urgent'
        } else if (remaining <= threshold) {
          requestForm.value.priority = 'high'
        } else {
          requestForm.value.priority = 'medium'
        }
      }
    }
    
    const submitRequest = async () => {
      if (!isFormValid.value) return
      
      isSubmitting.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await api.post('/barista/stock-requests', {
            item_id: parseInt(requestForm.value.item_id),
            requested_quantity: requestForm.value.quantity,
            priority: requestForm.value.priority,
            reason: requestForm.value.reason,
            notes: requestForm.value.notes
          })
        
        if (response.status === 401 || response.status === 403) {
          showToast('Session expired. Please login again.', 'error')
          setTimeout(() => {
            router.push('/login')
          }, 1500)
          return
        }
        
        if (!response.status==200) {
          const error = await response.error
          throw new Error(error.detail || `HTTP ${response.status}`)
        }
        
        const result = await response.data
        
        // Add to recent requests
        const item = selectedItem.value
        recentRequests.value.unshift({
          id: result.id || Date.now(),
          created_at: new Date().toISOString(),
          item_id: item.id,
          item_name: item.name,
          requested_quantity: requestForm.value.quantity,
          priority: requestForm.value.priority,
          status: 'pending',
          reason: requestForm.value.reason,
          notes: requestForm.value.notes,
          icon: item.icon,
          color: item.color
        })
        
        showToast(`Stock request for ${item.name} (${requestForm.value.quantity} units) submitted successfully`, 'success')
        
        // Reset form
        requestForm.value = {
          item_id: '',
          quantity: 1,
          priority: 'medium',
          reason: '',
          notes: ''
        }
      } catch (error) {
        console.error('Error submitting request:', error)
        showToast(error.message || 'Error submitting request', 'error')
      } finally {
        isSubmitting.value = false
      }
    }
    
    const quickRequest = (item) => {
      requestForm.value.item_id = item.id.toString()
      requestForm.value.quantity = getRecommendedQuantity(item)
      requestForm.value.priority = (item.remaining || 0) <= (item.threshold || 20) ? 'urgent' : 'medium'
      requestForm.value.reason = 'Low stock alert'
      requestForm.value.notes = ''
    }
    
    const viewRequestDetails = (request) => {
      selectedRequest.value = request
      showDetailsModal.value = true
    }
    
    const closeDetailsModal = () => {
      showDetailsModal.value = false
      selectedRequest.value = null
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
      
      try {
        const token = localStorage.getItem('authToken')
        const response = await api.delete(`/barista/stock-requests/${requestToCancel.value.id}`)
        
        if (response.status === 401 || response.status === 403) {
          showToast('Session expired. Please login again.', 'error')
          setTimeout(() => {
            router.push('/login')
          }, 1500)
          return
        }
        
        if (!response.status==200) {
          const error = await response.error
          throw new Error(error.detail || `HTTP ${response.status}`)
        }
        
        // Update local data
        const index = recentRequests.value.findIndex(r => r.id === requestToCancel.value.id)
        if (index !== -1) {
          recentRequests.value[index].status = 'cancelled'
        }
        
        showToast(`Request for ${requestToCancel.value.item_name} cancelled successfully`, 'success')
        closeCancelModal()
      } catch (error) {
        console.error('Error cancelling request:', error)
        showToast(error.message || 'Error cancelling request', 'error')
      }
    }
    
    const viewRequestHistory = () => {
      router.push('/barista/stock-requests')
    }
    
    const refreshRequests = async () => {
      isRefreshing.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await api.get('/barista/stock-requests')
        
        if (response.status==200) {
          const data = await response.data
          const requests = Array.isArray(data) ? data : (data.requests || data)
          recentRequests.value = requests.slice(0, 10).map(req => {
            const item = items.value.find(i => i.id === req.item_id)
            return {
              ...req,
              icon: item?.icon || 'fas fa-cube',
              color: item?.color || '#EFCA71'
            }
          })
          showToast('Requests refreshed successfully', 'success')
        }
      } catch (error) {
        console.error('Error refreshing requests:', error)
        showToast('Error refreshing requests', 'error')
      } finally {
        isRefreshing.value = false
      }
    }
    
    onMounted(() => {
      fetchData()
    })
    
    return {
      isLoading,
      isSubmitting,
      isRefreshing,
      showDetailsModal,
      showCancelModal,
      selectedRequest,
      requestToCancel,
      toastMessage,
      toastType,
      toastIcon,
      requestForm,
      items,
      recentRequests,
      selectedItem,
      maxRequestQuantity,
      isFormValid,
      getRecommendedQuantity,
      getStockColor,
      getStockStatus,
      getStockStatusText,
      formatDateTime,
      onItemSelect,
      submitRequest,
      quickRequest,
      viewRequestDetails,
      closeDetailsModal,
      cancelRequest,
      closeCancelModal,
      confirmCancel,
      viewRequestHistory,
      refreshRequests
    }
  }
}
</script>



<style scoped>
/* ==============================================
   REQUEST STOCK - MATCHING ADMIN STYLES
   ============================================== */

.request-stock {
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

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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
  gap: 16px;
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

/* Form Styles */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #332F2E;
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #EFCA71;
  box-shadow: 0 0 0 3px rgba(239, 202, 113, 0.1);
}

.form-group textarea {
  resize: vertical;
}

.form-group small {
  font-size: 0.7rem;
  color: #6F6C6D;
}

/* Priority Options */
.priority-options {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.priority-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.priority-option input {
  width: auto;
  margin: 0;
}

.priority-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
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
  width: 100%;
  justify-content: center;
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
}

.btn-text:hover:not(:disabled) {
  color: #332F2E;
}

.btn-danger {
  background: #C45A5A;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b04a4a;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #E5E5E2;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: #F9F7EB;
  border-color: #EFCA71;
  color: #332F2E;
}

/* Items Grid */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F9F7EB;
  border-radius: 16px;
  transition: all 0.3s ease;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.item-icon {
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
  font-size: 0.7rem;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.remaining {
  color: #88B788;
}

.threshold {
  color: #F57C00;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #E5E5E2;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.status-indicator {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.status-indicator.critical {
  background: #FFEBEE;
  color: #F44336;
}

.status-indicator.low {
  background: #FFF3E0;
  color: #F57C00;
}

.status-indicator.adequate {
  background: #E8F5E9;
  color: #4CAF50;
}

.btn-request {
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
  white-space: nowrap;
}

.btn-request:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(239, 202, 113, 0.3);
}

.btn-request:disabled {
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
  min-width: 800px;
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
  font-size: 0.7rem;
  font-weight: 500;
  display: inline-block;
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

.status-badge.cancelled {
  background: #F5F5F5;
  color: #8C8C90;
}

.actions-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 0;
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
  font-size: 0.85rem;
}

.detail-row span,
.detail-row p {
  flex: 1;
  color: #6F6C6D;
  margin: 0;
}

.quantity-highlight {
  font-weight: 600;
  color: #EFCA71;
}

.warning-icon {
  text-align: center;
  font-size: 48px;
  color: #F57C00;
  margin-bottom: 16px;
}

.warning-text {
  color: #F44336;
  font-size: 0.7rem;
  text-align: center;
  margin-top: 16px;
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

.toast-notification.info {
  background: #2196F3;
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
@media (max-width: 1024px) {
  .items-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .request-stock {
    padding: 20px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .title-management {
    font-size: 1.6rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .items-grid {
    grid-template-columns: 1fr;
  }
  
  .item-card {
    flex-wrap: wrap;
  }
  
  .btn-request {
    width: 100%;
    justify-content: center;
    margin-top: 8px;
  }
  
  .priority-options {
    flex-wrap: wrap;
  }
  
  .detail-row {
    flex-direction: column;
  }
  
  .detail-row label {
    margin-bottom: 4px;
  }
  
  .modal-content {
    margin: 16px;
  }
}

@media (max-width: 480px) {
  .request-stock {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .item-stats {
    flex-direction: column;
    gap: 4px;
  }
}
</style>