<template>
  <div class="distribute-coupons">
    <!-- Page Header -->
    <div class="page-header card">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <span class="title-gradient">Distribute</span>
            <span class="title-management">Coupons</span>
          </h1>
          <p class="page-subtitle">Distribute drink coupons to waiters and track inventory</p>
        </div>
        <div class="date-info">
          <i class="fas fa-calendar"></i>
          <span>{{ currentDate }}</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container card">
      <div class="loading-spinner"></div>
      <p>Loading inventory...</p>
    </div>

    <div v-else>
      <!-- Available Items -->
      <div class="section-card card">
        <div class="section-header">
          <h3>Available Items for Distribution</h3>
          <span class="section-subtitle">Current coupon availability</span>
        </div>
        <div class="items-grid">
          <div v-for="item in availableItems" :key="item.item_id" class="item-card">
            <div class="item-icon" :style="{ background: getItemColor(item.item_id) }">
              <i :class="getItemIcon(item.item_id)"></i>
            </div>
            <div class="item-info">
              <div class="item-name">{{ item.item_name }}</div>
              <div class="item-stats">
                <span class="remaining">Available: {{ item.remaining_coupon }} coupons</span>
                <span class="used">Used: {{ item.initial_coupon - item.remaining_coupon }}</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ 
                    width: getUsagePercentage(item.remaining_coupon, item.initial_coupon) + '%',
                    background: getProgressColor(item.remaining_coupon, item.initial_coupon)
                  }"
                ></div>
              </div>
            </div>
            <button 
              class="btn-distribute" 
              @click="openDistributeForm(item)"
              :disabled="item.remaining_coupon === 0 || isDistributing"
            >
              <i class="fas fa-hand-holding-heart"></i>
              <span>Distribute</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Distribution Form -->
      <div class="section-card card">
        <div class="section-header">
          <h3>Quick Distribution</h3>
          <span class="section-subtitle">Fast coupon distribution</span>
        </div>
        <div class="distribution-form">
          <div class="form-row">
            <div class="form-group">
              <label>Select Item *</label>
              <select v-model="quickForm.item_id" @change="onItemSelect">
                <option value="">Select an item</option>
                <option v-for="item in availableItems" :key="item.item_id" :value="item.item_id">
                  {{ item.item_name }} ({{ item.remaining_coupon }} left)
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Quantity *</label>
              <input 
                type="number" 
                v-model.number="quickForm.quantity" 
                :max="selectedItemData?.remaining_coupon || 0"
                min="1"
                placeholder="Enter quantity"
              >
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Assign To *</label>
              <select v-model="quickForm.assigned_to">
                <option value="">Select waiter/waitress</option>
                <option v-for="waiter in waiters" :key="waiter.id" :value="waiter.name">
                  {{ waiter.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Notes</label>
              <input type="text" v-model="quickForm.notes" placeholder="Optional notes">
            </div>
          </div>
          <button 
            class="btn btn-primary" 
            @click="quickDistribute"
            :disabled="!isQuickFormValid || isDistributing"
          >
            <i class="fas" :class="isDistributing ? 'fa-spinner fa-spin' : 'fa-hand-holding-heart'"></i>
            <span>{{ isDistributing ? 'Distributing...' : 'Distribute Now' }}</span>
          </button>
        </div>
      </div>

      <!-- Distribution History -->
      <div class="section-card card">
        <div class="section-header">
          <h3>Distribution History</h3>
          <div class="filters">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Search by item or waiter..."
              >
            </div>
            <select v-model="filterItem" class="filter-select">
              <option value="">All Items</option>
              <option v-for="item in availableItems" :key="item.item_id" :value="item.item_name">
                {{ item.item_name }}
              </option>
            </select>
          </div>
        </div>
        <div class="table-container">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Distributed To</th>
                  <th>Notes</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="dist in filteredHistory" :key="dist.id">
                  <td data-label="Date & Time">{{ formatDateTime(dist.created_at) }}</td>
                  <td data-label="Item">
                    <div class="item-info">
                      <div class="item-icon-small" :style="{ background: getItemColor(dist.item_id) }">
                        <i :class="getItemIcon(dist.item_id)"></i>
                      </div>
                      <span>{{ dist.item_name }}</span>
                    </div>
                  </td>
                  <td data-label="Quantity" class="quantity-cell">{{ dist.quantity }}</td>
                  <td data-label="Distributed To">{{ dist.assigned_to || '-' }}</td>
                  <td data-label="Notes">{{ dist.notes || '-' }}</td>
                  <td data-label="Status">
                    <span class="status-badge completed">Completed</span>
                  </td>
                </tr>
                <tr v-if="filteredHistory.length === 0">
                  <td colspan="6" class="empty-state">No distribution history found</td>
                </tr>
              </tbody>
            </table>
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
          <div class="selected-item" v-if="selectedItem">
            <div class="item-icon" :style="{ background: getItemColor(selectedItem.item_id) }">
              <i :class="getItemIcon(selectedItem.item_id)"></i>
            </div>
            <div class="item-details">
              <div class="item-name">{{ selectedItem.item_name }}</div>
              <div class="item-remaining">{{ selectedItem.remaining_coupon }} coupons remaining</div>
            </div>
          </div>
          
          <form @submit.prevent="submitDistribution">
            <div class="form-group">
              <label>Quantity to Distribute *</label>
              <input 
                type="number" 
                v-model.number="formData.quantity" 
                required
                min="1"
                :max="selectedItem?.remaining_coupon"
                placeholder="Enter quantity"
              >
              <small>Maximum: {{ selectedItem?.remaining_coupon }} coupons</small>
            </div>
            
            <div class="form-group">
              <label>Assign To (Waiter/Waitress) *</label>
              <select v-model="formData.assigned_to" required>
                <option value="">Select waiter/waitress</option>
                <option v-for="waiter in waiters" :key="waiter.id" :value="waiter.name">
                  {{ waiter.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Notes</label>
              <textarea v-model="formData.notes" rows="3" placeholder="Add any notes..."></textarea>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" @click="closeDistributeModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="!isFormValid || isDistributing">
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

export default {
  name: 'BaristaDistributeCoupons',
  setup() {
    const router = useRouter()
    
    // State
    const isLoading = ref(true)
    const isDistributing = ref(false)
    const showDistributeModal = ref(false)
    const selectedItem = ref(null)
    const searchQuery = ref('')
    const filterItem = ref('')
    const toastMessage = ref('')
    const toastType = ref('success')
    
    const formData = ref({
      quantity: 1,
      assigned_to: '',
      notes: ''
    })
    
    const quickForm = ref({
      item_id: '',
      quantity: 1,
      assigned_to: '',
      notes: ''
    })
    
    const availableItems = ref([])
    const waiters = ref([])
    const distributionHistory = ref([])
    const itemDetails = ref({})

    const toastIcon = computed(() => {
      return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
    })

    const currentDate = computed(() => {
      return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    })
    
    const selectedItemData = computed(() => {
      if (!quickForm.value.item_id) return null
      return availableItems.value.find(i => i.item_id === parseInt(quickForm.value.item_id))
    })
    
    const isQuickFormValid = computed(() => {
      return quickForm.value.item_id && 
             quickForm.value.quantity > 0 && 
             quickForm.value.quantity <= (selectedItemData.value?.remaining_coupon || 0) &&
             quickForm.value.assigned_to
    })
    
    const isFormValid = computed(() => {
      return formData.value.quantity > 0 && 
             formData.value.quantity <= (selectedItem.value?.remaining_coupon || 0) &&
             formData.value.assigned_to
    })
    
    const filteredHistory = computed(() => {
      let filtered = [...distributionHistory.value]
      
      if (searchQuery.value) {
        filtered = filtered.filter(d => 
          d.item_name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          d.assigned_to?.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }
      
      if (filterItem.value) {
        filtered = filtered.filter(d => d.item_name === filterItem.value)
      }
      
      return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
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
    
    const getItemColor = (itemId) => {
      return itemDetails.value[itemId]?.color || '#EFCA71'
    }
    
    const getItemIcon = (itemId) => {
      return itemDetails.value[itemId]?.icon || 'fas fa-cube'
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
    
    const fetchData = async () => {
      isLoading.value = true
      try {
        const token = localStorage.getItem('authToken')
        
        if (!token) {
          showToast('Please login again', 'error')
          setTimeout(() => router.push('/login'), 1500)
          return
        }
        
        // Fetch item details from barista/items endpoint ONLY
        const itemsResponse = await fetch('/api/barista/items', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (itemsResponse.status === 401 || itemsResponse.status === 403) {
          showToast('Session expired. Please login again.', 'error')
          setTimeout(() => router.push('/login'), 1500)
          return
        }
        
        if (itemsResponse.ok) {
          const data = await itemsResponse.json()
          const items = Array.isArray(data) ? data : (data.items || data)
          items.forEach(item => {
            itemDetails.value[item.id] = {
              icon: item.icon,
              color: item.color
            }
          })
        } else {
          console.error('Failed to fetch items:', itemsResponse.status)
        }
        
        // Fetch inventory from barista/inventory endpoint
        const inventoryResponse = await fetch('/api/barista/inventory', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (inventoryResponse.ok) {
          const data = await inventoryResponse.json()
          availableItems.value = Array.isArray(data) ? data : (data.items || data)
        } else {
          console.error('Failed to fetch inventory:', inventoryResponse.status)
          loadDemoItems()
        }
        
        // Fetch waiters from barista/waiters endpoint ONLY
        const waitersResponse = await fetch('/api/barista/waiters', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (waitersResponse.ok) {
          const data = await waitersResponse.json()
          waiters.value = Array.isArray(data) ? data : (data.waiters || data)
        } else {
          console.error('Failed to fetch waiters:', waitersResponse.status)
          loadDemoWaiters()
        }
        
        // Fetch distribution history from barista/distributions endpoint
        const distResponse = await fetch('/api/barista/distributions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (distResponse.ok) {
          const data = await distResponse.json()
          distributionHistory.value = Array.isArray(data) ? data : (data.distributions || data)
        } else {
          console.error('Failed to fetch distributions:', distResponse.status)
          loadDemoDistributions()
        }
        
      } catch (error) {
        console.error('Error fetching data:', error)
        showToast('Failed to load data. Using demo data.', 'error')
        loadDemoItems()
        loadDemoWaiters()
        loadDemoDistributions()
      } finally {
        isLoading.value = false
      }
    }

    const loadDemoItems = () => {
      availableItems.value = [
        { item_id: 1, item_name: 'Beer', initial_coupon: 100, remaining_coupon: 45 },
        { item_id: 2, item_name: 'Wine', initial_coupon: 50, remaining_coupon: 30 },
        { item_id: 3, item_name: 'Whiskey', initial_coupon: 40, remaining_coupon: 28 },
        { item_id: 4, item_name: 'Cocktail', initial_coupon: 35, remaining_coupon: 20 }
      ]
      
      itemDetails.value = {
        1: { icon: 'fas fa-beer', color: '#F4A261' },
        2: { icon: 'fas fa-wine-bottle', color: '#9C6B42' },
        3: { icon: 'fas fa-glass-whiskey', color: '#E9C46A' },
        4: { icon: 'fas fa-cocktail', color: '#2A9D8F' }
      }
    }
    
    const loadDemoWaiters = () => {
      waiters.value = [
        { id: 1, name: 'Abebe Bekele' },
        { id: 2, name: 'Almaz Tadese' },
        { id: 3, name: 'Chala Desta' }
      ]
    }
    
    const loadDemoDistributions = () => {
      distributionHistory.value = [
        { id: 1, created_at: new Date().toISOString(), item_id: 1, item_name: 'Beer', quantity: 10, assigned_to: 'Abebe Bekele', notes: 'For table 5' },
        { id: 2, created_at: new Date().toISOString(), item_id: 2, item_name: 'Wine', quantity: 5, assigned_to: 'Almaz Tadese', notes: '' }
      ]
    }
    
    const onItemSelect = () => {
      // Triggered when item is selected
    }
    
    const openDistributeForm = (item) => {
      selectedItem.value = item
      formData.value = {
        quantity: 1,
        assigned_to: '',
        notes: ''
      }
      showDistributeModal.value = true
    }
    
    const closeDistributeModal = () => {
      showDistributeModal.value = false
      selectedItem.value = null
    }
    
    const submitDistribution = async () => {
      if (!isFormValid.value) return
      
      isDistributing.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/barista/distribute', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            item_id: selectedItem.value.item_id,
            quantity: formData.value.quantity,
            assigned_to: formData.value.assigned_to,
            notes: formData.value.notes
          })
        })
        
        if (response.status === 401 || response.status === 403) {
          showToast('Session expired. Please login again.', 'error')
          setTimeout(() => router.push('/login'), 1500)
          return
        }
        
        let result
        try {
          result = await response.json()
        } catch (e) {
          const text = await response.text()
          console.error('Failed to parse response:', text)
          throw new Error(text || 'Server returned invalid response')
        }
        
        if (!response.ok) {
          throw new Error(result.detail || `HTTP ${response.status}`)
        }
        
        // Update local data
        selectedItem.value.remaining_coupon -= formData.value.quantity
        
        // Add to history
        distributionHistory.value.unshift({
          id: result.id,
          created_at: new Date().toISOString(),
          item_id: selectedItem.value.item_id,
          item_name: selectedItem.value.item_name,
          quantity: formData.value.quantity,
          assigned_to: formData.value.assigned_to,
          notes: formData.value.notes
        })
        
        showToast(`${formData.value.quantity} coupons for ${selectedItem.value.item_name} distributed to ${formData.value.assigned_to}`, 'success')
        closeDistributeModal()
      } catch (error) {
        console.error('Error distributing coupons:', error)
        showToast(error.message || 'Error distributing coupons', 'error')
      } finally {
        isDistributing.value = false
      }
    }
    
    const quickDistribute = async () => {
      const item = selectedItemData.value
      if (!item || !isQuickFormValid.value) return
      
      isDistributing.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/barista/distribute', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            item_id: parseInt(quickForm.value.item_id),
            quantity: quickForm.value.quantity,
            assigned_to: quickForm.value.assigned_to,
            notes: quickForm.value.notes
          })
        })
        
        if (response.status === 401 || response.status === 403) {
          showToast('Session expired. Please login again.', 'error')
          setTimeout(() => router.push('/login'), 1500)
          return
        }
        
        let result
        try {
          result = await response.json()
        } catch (e) {
          const text = await response.text()
          console.error('Failed to parse response:', text)
          throw new Error(text || 'Server returned invalid response')
        }
        
        if (!response.ok) {
          throw new Error(result.detail || `HTTP ${response.status}`)
        }
        
        // Update local data
        item.remaining_coupon -= quickForm.value.quantity
        
        // Add to history
        distributionHistory.value.unshift({
          id: result.id,
          created_at: new Date().toISOString(),
          item_id: item.item_id,
          item_name: item.item_name,
          quantity: quickForm.value.quantity,
          assigned_to: quickForm.value.assigned_to,
          notes: quickForm.value.notes
        })
        
        showToast(`${quickForm.value.quantity} coupons for ${item.item_name} distributed to ${quickForm.value.assigned_to}`, 'success')
        
        // Reset form
        quickForm.value = {
          item_id: '',
          quantity: 1,
          assigned_to: '',
          notes: ''
        }
      } catch (error) {
        console.error('Error distributing coupons:', error)
        showToast(error.message || 'Error distributing coupons', 'error')
      } finally {
        isDistributing.value = false
      }
    }
    
    onMounted(() => {
      fetchData()
    })
    
    return {
      isLoading,
      isDistributing,
      showDistributeModal,
      selectedItem,
      searchQuery,
      filterItem,
      toastMessage,
      toastType,
      toastIcon,
      formData,
      quickForm,
      availableItems,
      waiters,
      distributionHistory,
      currentDate,
      selectedItemData,
      isQuickFormValid,
      isFormValid,
      filteredHistory,
      getUsagePercentage,
      getProgressColor,
      getItemColor,
      getItemIcon,
      formatDateTime,
      onItemSelect,
      openDistributeForm,
      closeDistributeModal,
      submitDistribution,
      quickDistribute
    }
  }
}
</script>

<style scoped>
/* Keep all your existing styles - they remain the same */
.distribute-coupons {
  padding: 30px;
  min-height: 100vh;
  background: #F9F7EB;
  color: #332F2E;
}

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

.date-info {
  background: #F9F7EB;
  padding: 12px 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #332F2E;
  font-weight: 500;
}

.date-info i {
  color: #EFCA71;
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
  font-size: 0.75rem;
  margin-bottom: 8px;
}

.remaining {
  color: #88B788;
}

.used {
  color: #EFCA71;
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
  white-space: nowrap;
}

.btn-distribute:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(239, 202, 113, 0.3);
}

.btn-distribute:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.distribution-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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
  font-size: 0.7rem;
  color: #6F6C6D;
}

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

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #8C8C90;
  font-size: 0.9rem;
}

.search-box input {
  padding: 8px 12px 8px 36px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 0.9rem;
  width: 200px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  background: white;
  cursor: pointer;
}

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
  min-width: 700px;
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

.status-badge.used {
  background: #E3F2FD;
  color: #1976D2;
}

.status-badge.partial {
  background: #F3E5F5;
  color: #7B1FA2;
}

.status-badge.returned {
  background: #FFEBEE;
  color: #F44336;
}

.empty-state {
  text-align: center;
  padding: 40px !important;
  color: #8C8C90;
}

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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

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

@media (max-width: 1024px) {
  .items-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .distribute-coupons {
    padding: 20px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .title-management {
    font-size: 1.6rem;
  }
  
  .items-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filters {
    width: 100%;
    flex-direction: column;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .filter-select {
    width: 100%;
  }
  
  .item-card {
    flex-wrap: wrap;
  }
  
  .btn-distribute {
    width: 100%;
    justify-content: center;
  }
  
  .modal-content {
    margin: 16px;
  }
}

@media (max-width: 480px) {
  .distribute-coupons {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-info {
    justify-content: center;
  }
  
  .btn {
    justify-content: center;
  }
}
</style>