<template>
  <div class="admin-items">
    <div class="page-header">
      <h1 class="page-title">Items & Menu Management</h1>
      <button class="btn-primary" @click="openItemModal()">
        <i class="fas fa-plus"></i> Add New Item
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading items...</p>
    </div>

    <div v-else>
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-utensils"></i>
          </div>
          <div class="stat-info">
            <h3>{{ items.length }}</h3>
            <p>Total Items</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-beer"></i>
          </div>
          <div class="stat-info">
            <h3>{{ drinkItems }}</h3>
            <p>Drinks</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-utensil-spoon"></i>
          </div>
          <div class="stat-info">
            <h3>{{ foodItems }}</h3>
            <p>Food Items</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-info">
            <h3>{{ totalValue.toLocaleString() }} ETB</h3>
            <p>Total Value</p>
          </div>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="search-filter">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search items..."
          >
        </div>
        <div class="filter-box">
          <select v-model="filterCategory">
            <option value="">All Categories</option>
            <option value="drink">Drinks</option>
            <option value="food">Food</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <!-- Items Table -->
      <div class="items-table-container">
        <div class="table-responsive">
          <table class="items-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Price (ETB)</th>
                <th>Daily Coupon</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredItems" :key="item.id">
                <td data-label="ID">{{ item.id }}</td>
                <td data-label="Item Name">
                  <div class="item-info">
                    <div class="item-icon" :style="{ background: item.color || '#EFCA71' }">
                      <i :class="item.icon || 'fas fa-cube'"></i>
                    </div>
                    <span>{{ item.name }}</span>
                  </div>
                </td>
                <td data-label="Category">
                  <span :class="['category-badge', item.category]">
                    {{ item.category }}
                  </span>
                </td>
                <td data-label="Price" class="price">{{ formatPrice(item.price) }}</td>
                <td data-label="Daily Coupon">
                  <span class="coupon-badge">
                    {{ item.default_coupon }} coupons/day
                  </span>
                </td>
                <td data-label="Status">
                  <span :class="['status-badge', item.status]">
                    {{ item.status }}
                  </span>
                </td>
                <td data-label="Actions" class="actions">
                  <button class="btn-icon" @click="openItemModal(item)" title="Edit">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-icon danger" @click="confirmDelete(item)" title="Delete">
                    <i class="fas fa-trash"></i>
                  </button>
                  <button class="btn-icon" @click="viewCouponHistory(item)" title="Coupon History">
                    <i class="fas fa-chart-line"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="filteredItems.length === 0">
                <td colspan="7" class="empty-state">
                  <i class="fas fa-box-open"></i>
                  <p>No items found</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Item Modal -->
    <div v-if="showModal" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Edit Item' : 'Add New Item' }}</h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveItem">
            <div class="form-group">
              <label>Item Name *</label>
              <input 
                type="text" 
                v-model="formData.name" 
                required
                placeholder="e.g., Beer, Shiro, Wine"
              >
            </div>
            <div class="form-group">
              <label>Category *</label>
              <select v-model="formData.category" required>
                <option value="drink">Drink</option>
                <option value="food">Food</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Price (ETB) *</label>
                <input 
                  type="number" 
                  v-model="formData.price" 
                  required
                  step="0.01"
                  min="0"
                >
              </div>
              <div class="form-group">
                <label>Daily Coupon Quota *</label>
                <input 
                  type="number" 
                  v-model="formData.default_coupon" 
                  required
                  min="0"
                  placeholder="Number of coupons per day"
                >
              </div>
            </div>
            <div class="form-group">
              <label>Icon</label>
              <div class="icon-selector">
                <div 
                  v-for="icon in icons" 
                  :key="icon" 
                  class="icon-option"
                  :class="{ active: formData.icon === icon }"
                  @click="formData.icon = icon"
                >
                  <i :class="icon"></i>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>Color</label>
              <input type="color" v-model="formData.color">
            </div>
            <div class="form-group">
              <label>Status</label>
              <select v-model="formData.status">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="isSaving">
                {{ isSaving ? 'Saving...' : 'Save Item' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal" @click.self="closeDeleteModal">
      <div class="modal-content small">
        <div class="modal-header">
          <h2>Confirm Delete</h2>
          <button class="close-btn" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete "{{ itemToDelete?.name }}"?</p>
          <p class="warning-text">This action cannot be undone and will affect all related records.</p>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeDeleteModal">Cancel</button>
            <button class="btn-danger" @click="deleteItem" :disabled="isDeleting">
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
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
import api from '../../services/api';
export default {
  name: 'AdminItems',
  setup() {
    const toast = useToast()
    const items = ref([])
    const isLoading = ref(true)
    const isSaving = ref(false)
    const isDeleting = ref(false)
    const searchQuery = ref('')
    const filterCategory = ref('')
    const showModal = ref(false)
    const showDeleteModal = ref(false)
    const isEditing = ref(false)
    const itemToDelete = ref(null)
    
    const formData = ref({
      name: '',
      category: 'drink',
      price: 0,
      default_coupon: 100,
      icon: 'fas fa-cube',
      color: '#EFCA71',
      status: 'active'
    })

    const icons = [
      'fas fa-beer', 'fas fa-wine-bottle', 'fas fa-coffee', 'fas fa-utensils',
      'fas fa-hamburger', 'fas fa-pizza-slice', 'fas fa-cocktail', 'fas fa-mug-hot',
      'fas fa-glass-cheers', 'fas fa-cube'
    ]

    const drinkItems = computed(() => {
      if (!Array.isArray(items.value)) return 0
      return items.value.filter(i => i.category === 'drink').length
    })
    
    const foodItems = computed(() => {
      if (!Array.isArray(items.value)) return 0
      return items.value.filter(i => i.category === 'food').length
    })
    
    const totalValue = computed(() => {
      if (!Array.isArray(items.value)) return 0
      return items.value.reduce((sum, i) => sum + (i.price * 100), 0)
    })

    const filteredItems = computed(() => {
      if (!Array.isArray(items.value)) return []
      
      let filtered = [...items.value]
      if (searchQuery.value) {
        filtered = filtered.filter(i => 
          i.name?.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }
      if (filterCategory.value) {
        filtered = filtered.filter(i => i.category === filterCategory.value)
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

    const formatPrice = (price) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(price)
    }

    const fetchItems = async () => {
      isLoading.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await api.get('/admin/items')
        
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
        items.value = Array.isArray(data) ? data : (data.items || data.data || [])
      } catch (error) {
        console.error('Error fetching items:', error)
        toast.error('Failed to load items. Using demo data.')
        // Demo data
        items.value = [
          { id: 1, name: 'Beer', category: 'drink', price: 60, default_coupon: 100, status: 'active', icon: 'fas fa-beer', color: '#F4A261' },
          { id: 2, name: 'Wine', category: 'drink', price: 150, default_coupon: 50, status: 'active', icon: 'fas fa-wine-bottle', color: '#9C6B42' },
          { id: 3, name: 'Shiro', category: 'food', price: 80, default_coupon: 80, status: 'active', icon: 'fas fa-utensils', color: '#E9C46A' },
          { id: 4, name: 'Tibs', category: 'food', price: 120, default_coupon: 60, status: 'active', icon: 'fas fa-utensil-spoon', color: '#E76F51' }
        ]
      } finally {
        isLoading.value = false
      }
    }

    const openItemModal = (item = null) => {
      if (item) {
        isEditing.value = true
        formData.value = { ...item }
      } else {
        isEditing.value = false
        formData.value = {
          name: '',
          category: 'drink',
          price: 0,
          default_coupon: 100,
          icon: 'fas fa-cube',
          color: '#EFCA71',
          status: 'active'
        }
      }
      showModal.value = true
    }

    const closeModal = () => {
      showModal.value = false
    }

    const saveItem = async () => {
      // Validation
      if (!formData.value.name) {
        toast.error('Please enter item name')
        return
      }
      if (formData.value.price <= 0) {
        toast.error('Please enter a valid price')
        return
      }
      if (formData.value.default_coupon < 0) {
        toast.error('Please enter a valid coupon quantity')
        return
      }

      isSaving.value = true
      try {
        const token = localStorage.getItem('authToken')
        const url = isEditing.value 
          ? `/admin/items/${formData.value.id}` 
          : '/admin/items'
        
        const method = isEditing.value ? 'PUT' : 'POST'
        
        const itemData = {
          name: formData.value.name,
          category: formData.value.category,
          price: parseFloat(formData.value.price),
          default_coupon: parseInt(formData.value.default_coupon),
          icon: formData.value.icon,
          color: formData.value.color,
          status: formData.value.status
        }
        
        const response = await api({
  method: method,
  url: url,
  data: itemData
})
        
        if (response.status === 401 || response.status === 403) {
          toast.error('Session expired. Please login again.')
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
          return
        }
        
        if (!response.status==200) {
          const errorData = await response.data
          throw new Error(errorData.detail || `HTTP ${response.status}`)
        }
        
        const responseData = await response.data
        
        if (isEditing.value) {
          const index = items.value.findIndex(i => i.id === formData.value.id)
          if (index !== -1) {
            items.value[index] = { ...items.value[index], ...responseData }
          }
          toast.success('Item updated successfully')
        } else {
          items.value.push(responseData)
          toast.success('Item added successfully')
        }
        closeModal()
      } catch (error) {
        console.error('Error saving item:', error)
        toast.error(error.message || 'Error saving item')
      } finally {
        isSaving.value = false
      }
    }

    const confirmDelete = (item) => {
      itemToDelete.value = item
      showDeleteModal.value = true
    }

    const closeDeleteModal = () => {
      showDeleteModal.value = false
      itemToDelete.value = null
    }

    const deleteItem = async () => {
      if (!itemToDelete.value) return
      
      isDeleting.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await api.delete(`/admin/items/${itemToDelete.value.id}`)
        
        if (response.status === 401 || response.status === 403) {
          toast.error('Session expired. Please login again.')
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
          return
        }
        
        if (!response.status==200) {
          const errorData = await response.data
          throw new Error(errorData.detail || `HTTP ${response.status}`)
        }
        
        items.value = items.value.filter(i => i.id !== itemToDelete.value.id)
        toast.success('Item deleted successfully')
        closeDeleteModal()
      } catch (error) {
        console.error('Error deleting item:', error)
        toast.error(error.message || 'Error deleting item')
      } finally {
        isDeleting.value = false
      }
    }

    const viewCouponHistory = (item) => {
      toast.info(`Coupon history for ${item.name}`)
    }

    onMounted(() => {
      fetchItems()
    })

    return {
      items,
      isLoading,
      isSaving,
      isDeleting,
      searchQuery,
      filterCategory,
      showModal,
      showDeleteModal,
      isEditing,
      formData,
      icons,
      drinkItems,
      foodItems,
      totalValue,
      filteredItems,
      formatPrice,
      openItemModal,
      closeModal,
      saveItem,
      confirmDelete,
      closeDeleteModal,
      deleteItem,
      viewCouponHistory
    }
  }
}
</script>

<style scoped>
.admin-items {
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

/* Stats Grid */
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
  padding: 12px 12px 12px 40px;
  border: 1px solid #E5E5E2;
  border-radius: 12px;
  font-size: 14px;
}

.filter-box select {
  padding: 12px 24px;
  border: 1px solid #E5E5E2;
  border-radius: 12px;
  background: white;
  cursor: pointer;
}

/* Table Styles */
.items-table-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.items-table th {
  text-align: left;
  padding: 16px;
  background: #F9F7EB;
  color: #332F2E;
  font-weight: 600;
  border-bottom: 1px solid #E5E5E2;
}

.items-table td {
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

.category-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.category-badge.drink {
  background: #E3F2FD;
  color: #1976D2;
}

.category-badge.food {
  background: #FFF3E0;
  color: #F57C00;
}

.category-badge.other {
  background: #F3E5F5;
  color: #7B1FA2;
}

.price {
  font-weight: 600;
  color: #EFCA71;
}

.coupon-badge {
  background: #F9F7EB;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #332F2E;
  display: inline-block;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.status-badge.active {
  background: #E8F5E9;
  color: #4CAF50;
}

.status-badge.inactive {
  background: #FFEBEE;
  color: #F44336;
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
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.icon-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.icon-option {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #E5E5E2;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.icon-option:hover,
.icon-option.active {
  background: #EFCA71;
  border-color: #EFCA71;
  color: white;
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

/* Responsive Styles */
@media (max-width: 768px) {
  .admin-items {
    padding: 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .search-filter {
    flex-direction: column;
  }
  
  .filter-box select {
    width: 100%;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    margin: 16px;
  }
  
  .items-table td {
    padding: 12px;
  }
  
  .actions {
    justify-content: flex-start;
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
  .btn-secondary,
  .btn-danger {
    padding: 8px 16px;
    font-size: 14px;
  }
}
</style>