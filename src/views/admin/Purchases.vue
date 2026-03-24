<template>
  <div class="purchases">
    <div class="page-header">
      <h1 class="page-title">Purchases & Restocking</h1>
      <button class="btn-primary" @click="openPurchaseModal">
        <i class="fas fa-plus"></i> New Purchase
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading purchases...</p>
    </div>

    <div v-else>
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-info">
            <h3>{{ formatCurrency(totalPurchases) }}</h3>
            <p>Total Spent (30 days)</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-boxes"></i>
          </div>
          <div class="stat-info">
            <h3>{{ totalItemsPurchased }}</h3>
            <p>Items Purchased</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-truck"></i>
          </div>
          <div class="stat-info">
            <h3>{{ purchaseCount }}</h3>
            <p>Purchase Orders</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-chart-bar"></i>
          </div>
          <div class="stat-info">
            <h3>{{ avgPurchase.toLocaleString() }} ETB</h3>
            <p>Average Purchase</p>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" v-model="searchQuery" placeholder="Search purchases...">
        </div>
        <div class="date-range">
          <input type="date" v-model="dateFrom">
          <span>to</span>
          <input type="date" v-model="dateTo">
        </div>
        <button class="btn-secondary" @click="resetFilters">
          <i class="fas fa-redo"></i> Reset
        </button>
      </div>

      <!-- Purchases Table -->
      <div class="purchases-table-container">
        <div class="table-responsive">
          <table class="purchases-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Cost</th>
                <th>Total Cost</th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="purchase in filteredPurchases" :key="purchase.id">
                <td data-label="ID">#{{ purchase.id }}</td>
                <td data-label="Date">{{ formatDate(purchase.created_at) }}</td>
                <td data-label="Item" class="item-name">
                  <div class="item-info">
                    <div class="item-icon" :style="{ background: purchase.item_color || '#EFCA71' }">
                      <i :class="purchase.item_icon || 'fas fa-cube'"></i>
                    </div>
                    <span>{{ purchase.item_name }}</span>
                  </div>
                </td>
                <td data-label="Quantity">{{ purchase.quantity }}</td>
                <td data-label="Unit Cost">{{ formatCurrency(purchase.unit_cost) }}</td>
                <td data-label="Total Cost" class="total-cost">{{ formatCurrency(purchase.total_cost) }}</td>
                <td data-label="Supplier">{{ purchase.supplier || '-' }}</td>
                <td data-label="Status">
                  <span :class="['status-badge', purchase.status]">
                    {{ purchase.status }}
                  </span>
                </td>
                <td data-label="Actions" class="actions">
                  <button class="btn-icon" @click="viewPurchase(purchase)" title="View Details">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button v-if="purchase.status === 'pending'" class="btn-icon" @click="editPurchase(purchase)" title="Edit">
                    <i class="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredPurchases.length === 0">
                <td colspan="9" class="empty-state">
                  <i class="fas fa-box-open"></i>
                  <p>No purchases found</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Purchase Modal -->
    <div v-if="showModal" class="modal" @click.self="closeModal">
      <div class="modal-content large">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Edit Purchase' : 'New Purchase Order' }}</h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="savePurchase">
            <div class="form-row">
              <div class="form-group">
                <label>Item *</label>
                <select v-model="formData.item_id" required @change="onItemSelect">
                  <option value="">Select Item</option>
                  <option v-for="item in items" :key="item.id" :value="item.id">
                    {{ item.name }} - {{ formatPrice(item.price) }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Quantity *</label>
                <input 
                  type="number" 
                  v-model="formData.quantity" 
                  required
                  min="1"
                  @input="calculateTotal"
                >
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Unit Cost (ETB) *</label>
                <input 
                  type="number" 
                  v-model="formData.unit_cost" 
                  required
                  step="0.01"
                  min="0"
                  @input="calculateTotal"
                >
              </div>
              <div class="form-group">
                <label>Total Cost (ETB)</label>
                <input 
                  type="text" 
                  :value="formatCurrency(formData.total_cost)" 
                  readonly
                  disabled
                  class="readonly"
                >
              </div>
            </div>
            <div class="form-group">
              <label>Supplier</label>
              <input type="text" v-model="formData.supplier" placeholder="Supplier name">
            </div>
            <div class="form-group">
              <label>Notes</label>
              <textarea v-model="formData.notes" rows="3" placeholder="Additional notes..."></textarea>
            </div>
            <div class="form-group">
              <label>Status</label>
              <select v-model="formData.status">
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="isSaving">
                {{ isSaving ? 'Saving...' : 'Save Purchase' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- View Details Modal -->
    <div v-if="showViewModal" class="modal" @click.self="closeViewModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Purchase Details</h2>
          <button class="close-btn" @click="closeViewModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="details-card" v-if="selectedPurchase">
            <div class="detail-row">
              <label>Purchase ID:</label>
              <span>#{{ selectedPurchase.id }}</span>
            </div>
            <div class="detail-row">
              <label>Date:</label>
              <span>{{ formatDate(selectedPurchase.created_at) }}</span>
            </div>
            <div class="detail-row">
              <label>Item:</label>
              <span>{{ selectedPurchase.item_name }}</span>
            </div>
            <div class="detail-row">
              <label>Quantity:</label>
              <span>{{ selectedPurchase.quantity }}</span>
            </div>
            <div class="detail-row">
              <label>Unit Cost:</label>
              <span>{{ formatCurrency(selectedPurchase.unit_cost) }}</span>
            </div>
            <div class="detail-row">
              <label>Total Cost:</label>
              <span class="total">{{ formatCurrency(selectedPurchase.total_cost) }}</span>
            </div>
            <div class="detail-row">
              <label>Supplier:</label>
              <span>{{ selectedPurchase.supplier || '-' }}</span>
            </div>
            <div class="detail-row">
              <label>Status:</label>
              <span :class="['status-badge', selectedPurchase.status]">{{ selectedPurchase.status }}</span>
            </div>
            <div class="detail-row" v-if="selectedPurchase.notes">
              <label>Notes:</label>
              <p>{{ selectedPurchase.notes }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import api from '../../services/api'

export default {
  name: 'AdminPurchases',
  setup() {
    const toast = useToast()
    const purchases = ref([])
    const items = ref([])
    const isLoading = ref(true)
    const isSaving = ref(false)
    const searchQuery = ref('')
    const dateFrom = ref('')
    const dateTo = ref('')
    const showModal = ref(false)
    const showViewModal = ref(false)
    const isEditing = ref(false)
    const selectedPurchase = ref(null)
    
    const formData = ref({
      item_id: '',
      quantity: 1,
      unit_cost: 0,
      total_cost: 0,
      supplier: '',
      notes: '',
      status: 'completed'
    })

    const getAuthHeaders = () => {
      const token = localStorage.getItem('authToken')
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }

    const totalPurchases = computed(() => {
      if (!Array.isArray(purchases.value)) return 0
      return purchases.value.reduce((sum, p) => sum + (p.total_cost || 0), 0)
    })

    const totalItemsPurchased = computed(() => {
      if (!Array.isArray(purchases.value)) return 0
      return purchases.value.reduce((sum, p) => sum + (p.quantity || 0), 0)
    })

    const purchaseCount = computed(() => {
      return Array.isArray(purchases.value) ? purchases.value.length : 0
    })

    const avgPurchase = computed(() => {
      if (purchaseCount.value === 0) return 0
      return totalPurchases.value / purchaseCount.value
    })

    const filteredPurchases = computed(() => {
      if (!Array.isArray(purchases.value)) return []
      
      let filtered = [...purchases.value]
      
      if (searchQuery.value) {
        filtered = filtered.filter(p => 
          p.item_name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          (p.supplier && p.supplier.toLowerCase().includes(searchQuery.value.toLowerCase()))
        )
      }
      
      if (dateFrom.value) {
        filtered = filtered.filter(p => p.created_at >= dateFrom.value)
      }
      
      if (dateTo.value) {
        filtered = filtered.filter(p => p.created_at <= dateTo.value)
      }
      
      return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    })

    const formatPrice = (price) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(price)
    }

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(value || 0)
    }

    const formatDate = (date) => {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const calculateTotal = () => {
      formData.value.total_cost = (formData.value.quantity || 0) * (formData.value.unit_cost || 0)
    }

    const onItemSelect = () => {
      const selectedItem = items.value.find(i => i.id === formData.value.item_id)
      if (selectedItem) {
        formData.value.unit_cost = selectedItem.price
        calculateTotal()
      }
    }

    const fetchPurchases = async () => {
      isLoading.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await api.get('/admin/purchases' )
        
        if (response.status === 401 || response.status === 403) {
          toast.error('Session expired. Please login again.')
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
          return
        }
        
        if (!response.status==200) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const data = await response.data
        purchases.value = Array.isArray(data) ? data : (data.purchases || data.data || [])
      } catch (error) {
        console.error('Error fetching purchases:', error)
        toast.error('Failed to load purchases. Using demo data.')
        // Demo data
        purchases.value = [
          { id: 1, created_at: new Date().toISOString(), item_name: 'Beer', quantity: 50, unit_cost: 55, total_cost: 2750, supplier: 'BGI Ethiopia', status: 'completed', item_icon: 'fas fa-beer', item_color: '#F4A261' },
          { id: 2, created_at: new Date().toISOString(), item_name: 'Wine', quantity: 30, unit_cost: 120, total_cost: 3600, supplier: 'Castel Winery', status: 'completed', item_icon: 'fas fa-wine-bottle', item_color: '#9C6B42' },
          { id: 3, created_at: new Date().toISOString(), item_name: 'Shiro', quantity: 100, unit_cost: 45, total_cost: 4500, supplier: 'Local Market', status: 'pending', item_icon: 'fas fa-utensils', item_color: '#E9C46A' }
        ]
      } finally {
        isLoading.value = false
      }
    }

    const fetchItems = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const response = await api.get('/admin/items')
        
        if (!response.status==200) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const data = await response.data
        items.value = Array.isArray(data) ? data : (data.items || data.data || [])
      } catch (error) {
        console.error('Error fetching items:', error)
        items.value = [
          { id: 1, name: 'Beer', price: 60, icon: 'fas fa-beer', color: '#F4A261' },
          { id: 2, name: 'Wine', price: 150, icon: 'fas fa-wine-bottle', color: '#9C6B42' },
          { id: 3, name: 'Shiro', price: 80, icon: 'fas fa-utensils', color: '#E9C46A' }
        ]
      }
    }

    const openPurchaseModal = () => {
      isEditing.value = false
      formData.value = {
        item_id: '',
        quantity: 1,
        unit_cost: 0,
        total_cost: 0,
        supplier: '',
        notes: '',
        status: 'completed'
      }
      showModal.value = true
    }

    const closeModal = () => {
      showModal.value = false
    }

    const savePurchase = async () => {
      if (!formData.value.item_id) {
        toast.error('Please select an item')
        return
      }
      if (formData.value.quantity <= 0) {
        toast.error('Please enter a valid quantity')
        return
      }
      if (formData.value.unit_cost <= 0) {
        toast.error('Please enter a valid unit cost')
        return
      }

      isSaving.value = true
      try {
        const selectedItem = items.value.find(i => i.id === formData.value.item_id)
        
        const purchaseData = {
          item_id: parseInt(formData.value.item_id),
          quantity: parseInt(formData.value.quantity),
          unit_cost: parseFloat(formData.value.unit_cost),
          supplier: formData.value.supplier,
          notes: formData.value.notes,
          status: formData.value.status
        }
        
        const token = localStorage.getItem('authToken')
        
        if (isEditing.value && selectedPurchase.value) {
          const response = await api.put(`/admin/purchases/${selectedPurchase.value.id}`,purchaseData)
          
          if (!response.status==200) {
            throw new Error(`HTTP ${response.status}`)
          }
          
          toast.success('Purchase updated successfully')
        } else {
          const response = await api.post('/admin/purchases', purchaseData)
          
          if (!response.status==200) {
            throw new Error(`HTTP ${response.status}`)
          }
          
          const newPurchase = await response.data
          purchases.value.unshift(newPurchase)
          toast.success('Purchase recorded successfully')
        }
        closeModal()
        fetchPurchases()
      } catch (error) {
        console.error('Error saving purchase:', error)
        toast.error(error.message || 'Error saving purchase')
      } finally {
        isSaving.value = false
      }
    }

    const viewPurchase = (purchase) => {
      selectedPurchase.value = purchase
      showViewModal.value = true
    }

    const closeViewModal = () => {
      showViewModal.value = false
      selectedPurchase.value = null
    }

    const editPurchase = (purchase) => {
      isEditing.value = true
      selectedPurchase.value = purchase
      formData.value = {
        item_id: purchase.item_id,
        quantity: purchase.quantity,
        unit_cost: purchase.unit_cost,
        total_cost: purchase.total_cost,
        supplier: purchase.supplier,
        notes: purchase.notes,
        status: purchase.status
      }
      showModal.value = true
    }

    const resetFilters = () => {
      searchQuery.value = ''
      dateFrom.value = ''
      dateTo.value = ''
    }

    onMounted(() => {
      fetchPurchases()
      fetchItems()
    })

    return {
      purchases,
      items,
      isLoading,
      isSaving,
      searchQuery,
      dateFrom,
      dateTo,
      showModal,
      showViewModal,
      isEditing,
      selectedPurchase,
      formData,
      totalPurchases,
      totalItemsPurchased,
      purchaseCount,
      avgPurchase,
      filteredPurchases,
      formatPrice,
      formatCurrency,
      formatDate,
      calculateTotal,
      onItemSelect,
      openPurchaseModal,
      closeModal,
      savePurchase,
      viewPurchase,
      closeViewModal,
      editPurchase,
      resetFilters
    }
  }
}
</script>

<style scoped>
.purchases {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
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

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: white;
  border-radius: 16px;
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
  margin: 0 4px;
}

.btn-icon:hover {
  background: #F9F7EB;
  border-color: #EFCA71;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
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

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.date-range input {
  padding: 10px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 14px;
}

.purchases-table-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.purchases-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

.purchases-table th {
  text-align: left;
  padding: 16px;
  background: #F9F7EB;
  color: #332F2E;
  font-weight: 600;
  border-bottom: 1px solid #E5E5E2;
}

.purchases-table td {
  padding: 16px;
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
  flex-shrink: 0;
}

.total-cost {
  font-weight: 600;
  color: #EFCA71;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
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

.status-badge.cancelled {
  background: #FFEBEE;
  color: #F44336;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
  max-width: 700px;
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
}

.form-group input.readonly {
  background: #F5F5F5;
  cursor: not-allowed;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.details-card {
  background: #F9F7EB;
  border-radius: 12px;
  padding: 20px;
}

.detail-row {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #E5E5E2;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row label {
  width: 120px;
  font-weight: 600;
  color: #332F2E;
}

.detail-row span {
  flex: 1;
  color: #6F6C6D;
}

.detail-row .total {
  font-weight: 600;
  color: #EFCA71;
}

.detail-row p {
  flex: 1;
  margin: 0;
  color: #6F6C6D;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .purchases {
    padding: 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .date-range {
    flex-direction: column;
    align-items: stretch;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .detail-row {
    flex-direction: column;
  }
  
  .detail-row label {
    margin-bottom: 8px;
  }
  
  .modal-content {
    margin: 16px;
  }
  
  .purchases-table td {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .stat-card {
    padding: 16px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .stat-info h3 {
    font-size: 20px;
  }
  
  .btn-primary,
  .btn-secondary {
    padding: 8px 16px;
    font-size: 14px;
  }
}
</style>