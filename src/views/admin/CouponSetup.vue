<template>
  <div class="coupon-setup">
    <div class="page-header">
      <h1 class="page-title">Coupon Setup</h1>
      <div class="header-actions">
        <button class="btn-secondary" @click="applyToAll">
          <i class="fas fa-copy"></i> Apply to All
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading items...</p>
    </div>

    <div v-else>
      <div class="info-card">
        <i class="fas fa-info-circle"></i>
        <p>Set daily coupon quotas for each item. Coupons are automatically reset at the start of each day.</p>
      </div>

      <!-- Bulk Update -->
      <div class="bulk-update">
        <h3>Bulk Update</h3>
        <div class="bulk-controls">
          <select v-model="bulkCategory">
            <option value="">All Categories</option>
            <option value="drink">Drinks</option>
            <option value="food">Food</option>
            <option value="other">Other</option>
          </select>
          <input type="number" v-model="bulkValue" placeholder="Coupon quantity">
          <button class="btn-primary" @click="applyBulkUpdate">Apply to Filtered Items</button>
        </div>
      </div>

      <!-- Coupon Setup Table -->
      <div class="setup-table-container">
        <div class="table-responsive">
          <table class="setup-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Current Daily Coupon</th>
                <th>New Coupon Quota</th>
                <th>Today's Remaining</th>
                <th>Sold Today</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td data-label="Item" class="item-name">
                  <div class="item-info">
                    <div class="item-icon" :style="{ background: item.color }">
                      <i :class="item.icon"></i>
                    </div>
                    <span>{{ item.name }}</span>
                  </div>
                </td>
                <td data-label="Category">
                  <span :class="['category-badge', item.category]">
                    {{ item.category }}
                  </span>
                </td>
                <td data-label="Current Daily Coupon">
                  <span class="current-coupon">{{ item.default_coupon }}</span>
                </td>
                <td data-label="New Coupon Quota">
                  <input 
                    type="number" 
                    v-model="item.newCoupon" 
                    :placeholder="item.default_coupon"
                    class="coupon-input"
                    min="0"
                  >
                </td>
                <td data-label="Today's Remaining">
                  <span :class="['remaining-badge', getRemainingClass(item.remaining || 0, item.default_coupon)]">
                    {{ item.remaining || item.default_coupon }}
                  </span>
                </td>
                <td data-label="Sold Today">
                  <span class="sold-count">{{ item.sold || 0 }}</span>
                </td>
                <td data-label="Actions" class="actions">
                  <button class="btn-icon" @click="updateItemCoupon(item)" :disabled="isUpdating || !item.newCoupon">
                    <i class="fas fa-save"></i>
                  </button>
                  <button class="btn-icon" @click="resetItemCoupon(item)" :disabled="isUpdating">
                    <i class="fas fa-undo"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="items.length === 0">
                <td colspan="7" class="empty-state">
                  <i class="fas fa-box-open"></i>
                  <p>No items found</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Save All Button -->
      <div class="save-all">
        <button class="btn-primary large" @click="saveAllChanges" :disabled="isSavingAll">
          <i class="fas fa-save"></i> {{ isSavingAll ? 'Saving...' : 'Save All Changes' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'

export default {
  name: 'AdminCouponSetup',
  setup() {
    const toast = useToast()
    const items = ref([])
    const bulkCategory = ref('')
    const bulkValue = ref(null)
    const isLoading = ref(true)
    const isUpdating = ref(false)
    const isSavingAll = ref(false)

    const getAuthHeaders = () => {
      const token = localStorage.getItem('authToken')
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }

    const getRemainingClass = (remaining, total) => {
      if (!remaining || total === 0) return 'critical'
      const percentage = (remaining / total) * 100
      if (percentage <= 20) return 'critical'
      if (percentage <= 50) return 'warning'
      return 'normal'
    }

    const fetchItems = async () => {
      isLoading.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/admin/items', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.status === 401 || response.status === 403) {
          toast.error('Session expired. Please login again.')
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
          return
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const data = await response.json()
        const itemsArray = Array.isArray(data) ? data : (data.items || data.data || [])
        
        // Fetch daily coupon data
        const today = new Date().toISOString().split('T')[0]
        const dailyResponse = await fetch(`/api/admin/daily-coupons?date=${today}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        let dailyData = []
        if (dailyResponse.ok) {
          dailyData = await dailyResponse.json()
        }
        
        items.value = itemsArray.map(item => {
          const todayData = dailyData.find(d => d.item_id === item.id)
          return {
            ...item,
            newCoupon: item.default_coupon,
            remaining: todayData?.remaining_coupon || item.default_coupon,
            sold: todayData?.sold_quantity || 0
          }
        })
      } catch (error) {
        console.error('Error fetching items:', error)
        toast.error('Failed to load items. Using demo data.')
        // Demo data
        items.value = [
          { id: 1, name: 'Beer', category: 'drink', default_coupon: 100, newCoupon: 100, remaining: 100, sold: 0, icon: 'fas fa-beer', color: '#F4A261' },
          { id: 2, name: 'Wine', category: 'drink', default_coupon: 50, newCoupon: 50, remaining: 50, sold: 0, icon: 'fas fa-wine-bottle', color: '#9C6B42' },
          { id: 3, name: 'Shiro', category: 'food', default_coupon: 80, newCoupon: 80, remaining: 80, sold: 0, icon: 'fas fa-utensils', color: '#E9C46A' }
        ]
      } finally {
        isLoading.value = false
      }
    }

    const updateItemCoupon = async (item) => {
      if (!item.newCoupon || item.newCoupon === item.default_coupon) return
      if (item.newCoupon < 0) {
        toast.error('Coupon quantity cannot be negative')
        return
      }
      
      isUpdating.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(`/api/admin/items/${item.id}/coupon?default_coupon=${item.newCoupon}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.status === 401 || response.status === 403) {
          toast.error('Session expired. Please login again.')
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
          return
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || `HTTP ${response.status}`)
        }
        
        item.default_coupon = item.newCoupon
        toast.success(`${item.name} coupon updated to ${item.newCoupon}`)
      } catch (error) {
        console.error('Error updating coupon:', error)
        toast.error(error.message || 'Error updating coupon')
      } finally {
        isUpdating.value = false
      }
    }

    const resetItemCoupon = (item) => {
      item.newCoupon = item.default_coupon
      toast.info(`${item.name} coupon reset to original value`)
    }

    const saveAllChanges = async () => {
      const updates = items.value.filter(item => item.newCoupon !== item.default_coupon)
      
      if (updates.length === 0) {
        toast.info('No changes to save')
        return
      }

      isSavingAll.value = true
      let successCount = 0
      let errorCount = 0
      
      try {
        for (const item of updates) {
          try {
            await updateItemCoupon(item)
            successCount++
          } catch (error) {
            errorCount++
            console.error(`Error updating ${item.name}:`, error)
          }
        }
        
        if (successCount > 0) {
          toast.success(`Updated ${successCount} items successfully`)
        }
        if (errorCount > 0) {
          toast.error(`Failed to update ${errorCount} items`)
        }
      } catch (error) {
        console.error('Error saving all changes:', error)
        toast.error('Error saving some changes')
      } finally {
        isSavingAll.value = false
      }
    }

    const applyBulkUpdate = () => {
      if (!bulkValue.value || bulkValue.value < 0) {
        toast.warning('Please enter a valid coupon quantity')
        return
      }

      const filteredItems = bulkCategory.value 
        ? items.value.filter(i => i.category === bulkCategory.value)
        : items.value

      if (filteredItems.length === 0) {
        toast.warning('No items found for the selected category')
        return
      }

      filteredItems.forEach(item => {
        item.newCoupon = parseInt(bulkValue.value)
      })

      toast.success(`Applied to ${filteredItems.length} items`)
    }

    const applyToAll = () => {
      if (items.value.length === 0) {
        toast.warning('No items to apply to')
        return
      }
      
      const maxCoupon = Math.max(...items.value.map(i => i.default_coupon))
      items.value.forEach(item => {
        item.newCoupon = maxCoupon
      })
      toast.info('Applied maximum coupon value to all items')
    }

    onMounted(() => {
      fetchItems()
    })

    return {
      items,
      bulkCategory,
      bulkValue,
      isLoading,
      isUpdating,
      isSavingAll,
      getRemainingClass,
      updateItemCoupon,
      resetItemCoupon,
      saveAllChanges,
      applyBulkUpdate,
      applyToAll
    }
  }
}
</script>

<style scoped>
.coupon-setup {
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

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-secondary {
  background: #F5F5F5;
  border: 1px solid #E5E5E2;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #E5E5E2;
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

.btn-primary.large {
  padding: 12px 32px;
  font-size: 16px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 202, 113, 0.3);
}

.btn-primary:disabled {
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
  margin: 0 4px;
}

.btn-icon:hover:not(:disabled) {
  background: #F9F7EB;
  border-color: #EFCA71;
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.info-card {
  background: #F9F7EB;
  border-left: 4px solid #EFCA71;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.info-card i {
  color: #EFCA71;
  font-size: 20px;
}

.info-card p {
  margin: 0;
  color: #6F6C6D;
}

.bulk-update {
  background: white;
  border: 1px solid #E5E5E2;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.bulk-update h3 {
  margin: 0 0 16px 0;
  color: #332F2E;
  font-size: 18px;
}

.bulk-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.bulk-controls select,
.bulk-controls input {
  padding: 10px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 14px;
}

.bulk-controls select {
  min-width: 150px;
}

.bulk-controls input {
  width: 150px;
}

.setup-table-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.setup-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.setup-table th {
  text-align: left;
  padding: 16px;
  background: #F9F7EB;
  color: #332F2E;
  font-weight: 600;
  border-bottom: 1px solid #E5E5E2;
}

.setup-table td {
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

.current-coupon {
  font-weight: 600;
  color: #332F2E;
}

.coupon-input {
  width: 100px;
  padding: 8px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 14px;
}

.remaining-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.remaining-badge.normal {
  background: #E8F5E9;
  color: #4CAF50;
}

.remaining-badge.warning {
  background: #FFF3E0;
  color: #F57C00;
}

.remaining-badge.critical {
  background: #FFEBEE;
  color: #F44336;
}

.sold-count {
  font-weight: 600;
  color: #EFCA71;
}

.actions {
  display: flex;
  gap: 4px;
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

.save-all {
  text-align: center;
}

@media (max-width: 768px) {
  .coupon-setup {
    padding: 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .bulk-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .bulk-controls select,
  .bulk-controls input {
    width: 100%;
  }
  
  .coupon-input {
    width: 80px;
  }
  
  .setup-table td {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .btn-primary,
  .btn-secondary {
    padding: 8px 16px;
    font-size: 14px;
  }
  
  .coupon-input {
    width: 70px;
  }
}
</style>