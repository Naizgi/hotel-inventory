<template>
  <div class="remaining-coupons">
    <!-- Page Header -->
    <div class="page-header card">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <span class="title-gradient">Remaining</span>
            <span class="title-management">Coupons</span>
          </h1>
          <p class="page-subtitle">Track and update remaining coupons from waiters</p>
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
      <p>Loading coupon data...</p>
    </div>

    <div v-else>
      <!-- Summary Cards -->
      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-ticket-alt"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ totalRemaining || 0 }}</span>
            <span class="stat-label">Total Remaining Coupons</span>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-chart-line"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ totalUsed || 0 }}</span>
            <span class="stat-label">Total Used Today</span>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-percent"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ utilizationRate || 0 }}%</span>
            <span class="stat-label">Utilization Rate</span>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-chart-bar"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ lowStockCount || 0 }}</span>
            <span class="stat-label">Low Stock Items</span>
          </div>
        </div>
      </div>

      <!-- Waiters Cards - Compact Design -->
      <div class="waiters-grid">
        <div v-for="waiter in waiters" :key="waiter.id" class="waiter-card">
          <div class="waiter-header">
            <div class="waiter-info">
              <div class="waiter-avatar">
                {{ getInitials(waiter.name) }}
              </div>
              <div>
                <div class="waiter-name">{{ waiter.name }}</div>
                <div class="waiter-stats">
                  <span class="stat-badge">📦 {{ waiter.totalAssigned }}</span>
                  <span class="stat-badge">✅ {{ waiter.totalUsed }}</span>
                  <span class="stat-badge">💵 {{ formatCurrency(waiter.revenueGenerated) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Items Grid for this Waiter - Compact -->
          <div class="items-compact">
            <div v-for="item in waiter.groupedItems" :key="item.item_name" class="item-row">
              <div class="item-icon-small" :style="{ background: getItemColor(item.item_name) }">
                <i :class="getItemIcon(item.item_name)"></i>
              </div>
              <div class="item-details">
                <div class="item-name">{{ item.item_name }}</div>
                <div class="item-price">{{ formatCurrency(item.price) }}</div>
              </div>
              <div class="item-quantity">
                <span class="assigned">{{ item.total_assigned }}</span>
                <span class="separator">→</span>
                <span class="used">{{ item.total_used }}</span>
              </div>
              <div class="item-remaining-input">
                <input 
                  type="number" 
                  v-model.number="item.remainingInput" 
                  class="remaining-input-small"
                  :max="item.total_assigned"
                  min="0"
                  @change="updateItemRemaining(waiter, item)"
                />
              </div>
              <div class="item-revenue">
                {{ formatCurrency((item.remainingInput || item.total_remaining) * item.price) }}
              </div>
              <div class="item-actions">
                <button 
                  class="btn-save-small" 
                  @click="saveItemRemaining(waiter, item)"
                  :disabled="savingItems.includes(`${waiter.id}-${item.item_name}`) || item.remainingInput === item.total_remaining"
                  title="Save"
                >
                  <i class="fas" :class="savingItems.includes(`${waiter.id}-${item.item_name}`) ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="waiter-footer">
            <button 
              class="btn-save-waiter-small" 
              @click="saveWaiterItems(waiter)"
              :disabled="savingWaiters.includes(waiter.id)"
            >
              <i class="fas" :class="savingWaiters.includes(waiter.id) ? 'fa-spinner fa-spin' : 'fa-save'"></i>
              {{ savingWaiters.includes(waiter.id) ? 'Saving...' : 'Save All' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Low Stock Warning -->
      <div v-if="lowStockItems && lowStockItems.length > 0" class="warning-card card">
        <div class="warning-header">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Low Stock Warning</h3>
        </div>
        <div class="warning-items">
          <div v-for="item in lowStockItems" :key="item.id" class="warning-item">
            <div class="item-info">
              <div class="item-icon-small" :style="{ background: item.color }">
                <i :class="item.icon"></i>
              </div>
              <div class="item-details">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-price">{{ formatCurrency(item.price) }}</div>
              </div>
            </div>
            <div class="stock-info">
              <span class="remaining">{{ item.remaining }} left</span>
              <span class="percentage">{{ getUsagePercentage(item.remaining, item.default_coupon) }}% used</span>
            </div>
            <button class="notify-btn" @click="notifyBarista(item)">
              <i class="fas fa-bell"></i> Request
            </button>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api';
export default {
  name: 'CashierRemainingCoupons',
  setup() {
    const router = useRouter()
    
    // State
    const isLoading = ref(true)
    const savingWaiters = ref([])
    const savingItems = ref([])
    const toastMessage = ref('')
    const toastType = ref('success')
    
    // Data
    const items = ref([])
    const waiters = ref([])
    const distributions = ref([])
    let refreshInterval = null
    
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
    
    const totalRemaining = computed(() => {
      if (!items.value.length) return 0
      return items.value.reduce((sum, item) => sum + (item.remaining || 0), 0)
    })
    
    const totalUsed = computed(() => {
      if (!items.value.length) return 0
      return items.value.reduce((sum, item) => sum + ((item.default_coupon || 0) - (item.remaining || 0)), 0)
    })
    
    const utilizationRate = computed(() => {
      const totalDefault = items.value.reduce((sum, item) => sum + (item.default_coupon || 0), 0)
      if (totalDefault === 0) return 0
      return Math.round((totalUsed.value / totalDefault) * 100)
    })
    
    const lowStockCount = computed(() => {
      if (!items.value.length) return 0
      return items.value.filter(item => {
        const usedPercent = getUsagePercentage(item.remaining, item.default_coupon)
        return usedPercent >= 70
      }).length
    })
    
    const lowStockItems = computed(() => {
      if (!items.value.length) return []
      return items.value.filter(item => {
        const usedPercent = getUsagePercentage(item.remaining, item.default_coupon)
        return usedPercent >= 80
      })
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
    
    const getInitials = (name) => {
      if (!name) return '??'
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    
    const getUsagePercentage = (remaining, total) => {
      if (total === 0) return 0
      return Math.round(((total - remaining) / total) * 100)
    }
    
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(value || 0)
    }
    
    const getItemColor = (itemName) => {
      const item = items.value.find(i => i.name === itemName)
      return item?.color || '#EFCA71'
    }
    
    const getItemIcon = (itemName) => {
      const item = items.value.find(i => i.name === itemName)
      return item?.icon || 'fas fa-cube'
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
        
        // Fetch items
        const itemsResponse = await api.get('/cashier/items')
        
        if (itemsResponse.status == 200) {
          const data = await itemsResponse.data
          items.value = Array.isArray(data) ? data : (data.items || data)
        } else if (itemsResponse.status === 401) {
          showToast('Session expired. Please login again.', 'error')
          setTimeout(() => router.push('/login'), 1500)
          return
        } else {
          console.error('Failed to fetch items:', itemsResponse.status)
        }
        
        // Fetch waiters
        const waitersResponse = await api.get('/cashier/waiters')
        
        if (waitersResponse.status == 200) {
          const data = await waitersResponse.data
          const waitersList = Array.isArray(data) ? data : (data.waiters || data)
          waiters.value = waitersList.map(w => ({
            id: w.id,
            name: w.name,
            groupedItems: [],
            totalAssigned: 0,
            totalUsed: 0,
            revenueGenerated: 0
          }))
        }
        
        // Fetch distributions
        const distResponse = await api.get('/cashier/distributions')
        
        if (distResponse.status == 200) {
          const data = await distResponse.data
          distributions.value = Array.isArray(data) ? data : (data.distributions || data)
          calculateWaiterStats()
        } else {
          console.error('Failed to fetch distributions:', distResponse.status)
          loadDemoDistributions()
        }
        
      } catch (error) {
        console.error('Error fetching data:', error)
        showToast('Failed to load data. Using demo data.', 'error')
        loadDemoData()
      } finally {
        isLoading.value = false
      }
    }
    
    const loadDemoDistributions = () => {
      distributions.value = [
        { id: 1, item_name: 'Beer', quantity: 20, waiter_name: 'Abebe Bekele', used_quantity: 15, remaining_quantity: 5 },
        { id: 2, item_name: 'Beer', quantity: 10, waiter_name: 'Abebe Bekele', used_quantity: 8, remaining_quantity: 2 },
        { id: 3, item_name: 'Wine', quantity: 10, waiter_name: 'Almaz Tadese', used_quantity: 8, remaining_quantity: 2 },
        { id: 4, item_name: 'Shiro', quantity: 15, waiter_name: 'Abebe Bekele', used_quantity: 13, remaining_quantity: 2 },
        { id: 5, item_name: 'Tibs', quantity: 8, waiter_name: 'Almaz Tadese', used_quantity: 6, remaining_quantity: 2 },
        { id: 6, item_name: 'Whiskey', quantity: 15, waiter_name: 'Chala Desta', used_quantity: 10, remaining_quantity: 5 }
      ]
      calculateWaiterStats()
    }
    
    const calculateWaiterStats = () => {
      if (!distributions.value.length || !waiters.value.length) return
      
      const waiterMap = new Map()
      
      distributions.value.forEach(dist => {
        const waiterName = dist.waiter_name || dist.assigned_to
        if (!waiterMap.has(waiterName)) {
          waiterMap.set(waiterName, {
            items: new Map(),
            totalAssigned: 0,
            totalUsed: 0,
            revenueGenerated: 0,
            distributions: [] // Store distribution IDs for reference
          })
        }
        
        const waiterData = waiterMap.get(waiterName)
        const quantity = dist.quantity
        const usedQuantity = dist.used_quantity || (dist.status === 'used' ? quantity : 0)
        
        waiterData.totalAssigned += quantity
        waiterData.totalUsed += usedQuantity
        
        if (!waiterData.items.has(dist.item_name)) {
          waiterData.items.set(dist.item_name, {
            item_name: dist.item_name,
            total_assigned: 0,
            total_used: 0,
            total_remaining: 0,
            remainingInput: 0,
            price: 0,
            distributions: [] // Store distribution IDs for this item
          })
        }
        
        const itemData = waiterData.items.get(dist.item_name)
        itemData.total_assigned += quantity
        itemData.total_used += usedQuantity
        itemData.total_remaining = itemData.total_assigned - itemData.total_used
        itemData.remainingInput = itemData.total_remaining
        itemData.distributions.push({
          id: dist.id,
          quantity: quantity,
          used_quantity: usedQuantity,
          remaining_quantity: dist.remaining_quantity || (quantity - usedQuantity)
        })
        
        const itemPrice = items.value.find(i => i.name === dist.item_name)?.price || 0
        itemData.price = itemPrice
        waiterData.revenueGenerated += usedQuantity * itemPrice
      })
      
      waiters.value = waiters.value.map(waiter => {
        const data = waiterMap.get(waiter.name)
        if (!data) {
          return {
            ...waiter,
            groupedItems: [],
            totalAssigned: 0,
            totalUsed: 0,
            revenueGenerated: 0
          }
        }
        
        return {
          ...waiter,
          groupedItems: Array.from(data.items.values()),
          totalAssigned: data.totalAssigned,
          totalUsed: data.totalUsed,
          revenueGenerated: data.revenueGenerated
        }
      })
    }
    
    const loadDemoData = () => {
      items.value = [
        { id: 1, name: 'Beer', category: 'Drink', default_coupon: 100, remaining: 45, icon: 'fas fa-beer', color: '#F4A261', price: 60 },
        { id: 2, name: 'Wine', category: 'Drink', default_coupon: 50, remaining: 30, icon: 'fas fa-wine-bottle', color: '#9C6B42', price: 150 },
        { id: 3, name: 'Whiskey', category: 'Drink', default_coupon: 40, remaining: 28, icon: 'fas fa-glass-whiskey', color: '#E9C46A', price: 120 },
        { id: 4, name: 'Shiro', category: 'Food', default_coupon: 80, remaining: 25, icon: 'fas fa-utensils', color: '#E9C46A', price: 80 },
        { id: 5, name: 'Tibs', category: 'Food', default_coupon: 60, remaining: 40, icon: 'fas fa-utensil-spoon', color: '#E76F51', price: 120 }
      ]
      
      waiters.value = [
        { id: 1, name: 'Abebe Bekele', groupedItems: [], totalAssigned: 0, totalUsed: 0, revenueGenerated: 0 },
        { id: 2, name: 'Almaz Tadese', groupedItems: [], totalAssigned: 0, totalUsed: 0, revenueGenerated: 0 },
        { id: 3, name: 'Chala Desta', groupedItems: [], totalAssigned: 0, totalUsed: 0, revenueGenerated: 0 }
      ]
    }
    
    const updateItemRemaining = (waiter, item) => {
      // Ensure input is a valid number
      let newValue = parseInt(item.remainingInput)
      if (isNaN(newValue)) {
        newValue = item.total_remaining
      }
      
      // Clamp between 0 and total_assigned
      newValue = Math.min(Math.max(0, newValue), item.total_assigned)
      item.remainingInput = newValue
      
      // Calculate new used quantity based on remaining
      const newUsed = item.total_assigned - newValue
      
      // Update waiter totals
      const newTotalUsed = waiter.groupedItems.reduce((sum, i) => {
        const itemUsed = i.total_assigned - i.remainingInput
        return sum + itemUsed
      }, 0)
      waiter.totalUsed = newTotalUsed
      
      // Update revenue
      waiter.revenueGenerated = waiter.groupedItems.reduce((sum, i) => {
        const itemUsed = i.total_assigned - i.remainingInput
        return sum + (itemUsed * i.price)
      }, 0)
    }
    
    const saveItemRemaining = async (waiter, item) => {
      const saveKey = `${waiter.id}-${item.item_name}`
      if (savingItems.value.includes(saveKey)) return
      
      savingItems.value.push(saveKey)
      try {
        const token = localStorage.getItem('authToken')
        
        // Calculate the new total used quantity for this item-waiter combination
        const newTotalUsed = item.total_assigned - item.remainingInput
        const currentTotalUsed = item.total_used
        const deltaUsed = newTotalUsed - currentTotalUsed
        
        // If no change, skip
        if (deltaUsed === 0) {
          showToast(`No changes for ${item.item_name}`, 'info')
          return
        }
        
        // Find all distributions for this item and waiter
        const itemDistributions = distributions.value.filter(
          d => d.waiter_name === waiter.name && d.item_name === item.item_name
        )
        
        if (itemDistributions.length === 0) {
          showToast(`No distribution found for ${item.item_name}`, 'error')
          return
        }
        
        console.log(`Updating ${item.item_name} for ${waiter.name}:`, {
          currentTotalUsed,
          newTotalUsed,
          deltaUsed,
          distributions: itemDistributions.map(d => ({ id: d.id, used: d.used_quantity, remaining: d.remaining_quantity }))
        })
        
        // Calculate how much to add or remove from each distribution
        // We'll distribute the delta proportionally based on remaining capacity
        let remainingDelta = Math.abs(deltaUsed)
        const isIncrease = deltaUsed > 0 // Using more coupons (decreasing remaining)
        
        // Sort distributions: for increase, use those with most remaining first
        const sortedDistributions = [...itemDistributions].sort((a, b) => {
          if (isIncrease) {
            return (b.quantity - b.used_quantity) - (a.quantity - a.used_quantity)
          } else {
            return b.used_quantity - a.used_quantity
          }
        })
        
        const updatePromises = []
        
        for (const dist of sortedDistributions) {
          if (remainingDelta <= 0) break
          
          const currentRemaining = dist.quantity - dist.used_quantity
          const maxChange = isIncrease ? currentRemaining : dist.used_quantity
          
          if (maxChange <= 0) continue
          
          const change = Math.min(remainingDelta, maxChange)
          const newUsedQuantity = isIncrease ? dist.used_quantity + change : dist.used_quantity - change
          
          // Validate the change
          if (newUsedQuantity < 0 || newUsedQuantity > dist.quantity) {
            console.warn(`Invalid quantity for distribution ${dist.id}: ${newUsedQuantity} (max: ${dist.quantity})`)
            continue
          }
          
          console.log(`Updating distribution ${dist.id}: used ${dist.used_quantity} -> ${newUsedQuantity} (change: ${change})`)
          
          const requestBody = {
            used_quantity: newUsedQuantity
          }
          
          const response = await api.put(`/cashier/distributions/${dist.id}`, requestBody)
          
          if (!response.status ==200) {
            const errorText = await response.data
            console.error('API Error:', response.status, errorText)
            throw new Error(`HTTP ${response.status}: ${errorText}`)
          }
          
          updatePromises.push(response.data)
          
          // Update local distribution data
          dist.used_quantity = newUsedQuantity
          dist.remaining_quantity = dist.quantity - newUsedQuantity
          
          remainingDelta -= change
        }
        
        if (remainingDelta > 0) {
          console.warn(`Could not distribute all ${deltaUsed} coupons. Remaining: ${remainingDelta}`)
          throw new Error(`Cannot update all coupons. Only ${deltaUsed - remainingDelta} of ${deltaUsed} could be updated.`)
        }
        
        await Promise.all(updatePromises)
        
        // Update local item data
        item.total_used = newTotalUsed
        item.total_remaining = item.total_assigned - newTotalUsed
        item.remainingInput = item.total_remaining
        
        // Update waiter revenue
        waiter.revenueGenerated = waiter.groupedItems.reduce((sum, i) => sum + (i.total_used * i.price), 0)
        
        showToast(`${item.item_name} updated for ${waiter.name}`, 'success')
      } catch (error) {
        console.error('Error saving item:', error)
        showToast(error.message || 'Error saving data', 'error')
        // Revert the input to original value
        item.remainingInput = item.total_remaining
        // Recalculate totals
        updateItemRemaining(waiter, item)
      } finally {
        const index = savingItems.value.indexOf(saveKey)
        if (index > -1) savingItems.value.splice(index, 1)
      }
    }
    
    const saveWaiterItems = async (waiter) => {
      if (savingWaiters.value.includes(waiter.id)) return
      
      savingWaiters.value.push(waiter.id)
      let hasErrors = false
      
      try {
        // Save each item sequentially
        for (const item of waiter.groupedItems) {
          if (item.remainingInput !== item.total_remaining) {
            await saveItemRemaining(waiter, item)
          }
        }
        
        if (!hasErrors) {
          showToast(`All items updated for ${waiter.name}`, 'success')
          // Refresh data to ensure consistency
          await fetchData()
        }
      } catch (error) {
        console.error('Error saving waiter items:', error)
        hasErrors = true
        showToast(`Error updating some items for ${waiter.name}`, 'error')
      } finally {
        const index = savingWaiters.value.indexOf(waiter.id)
        if (index > -1) savingWaiters.value.splice(index, 1)
      }
    }
    
    const notifyBarista = (item) => {
      showToast(`Stock request notification sent for ${item.name}`, 'success')
    }
    
    onMounted(() => {
      fetchData()
      refreshInterval = setInterval(() => {
        if (!isLoading.value) {
          fetchData()
        }
      }, 30000)
    })
    
    onUnmounted(() => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    })
    
    return {
      isLoading,
      savingWaiters,
      savingItems,
      toastMessage,
      toastType,
      toastIcon,
      items,
      waiters,
      currentDate,
      totalRemaining,
      totalUsed,
      utilizationRate,
      lowStockCount,
      lowStockItems,
      getInitials,
      getUsagePercentage,
      formatCurrency,
      getItemColor,
      getItemIcon,
      updateItemRemaining,
      saveItemRemaining,
      saveWaiterItems,
      notifyBarista
    }
  }
}
</script>

<style scoped>
/* Keep all existing styles exactly as they were */
.remaining-coupons {
  padding: 24px;
  min-height: 100vh;
  background: #F9F7EB;
  color: #332F2E;
}

.card {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 8px;
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
  font-size: 1.6rem;
}

.page-subtitle {
  color: #6F6C6D;
  font-size: 0.85rem;
  margin: 0;
}

.date-info {
  background: #F9F7EB;
  padding: 8px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(239, 202, 113, 0.2);
  border-top-color: #EFCA71;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon-wrapper {
  width: 44px;
  height: 44px;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.75rem;
  color: #6F6C6D;
}

.waiters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.waiter-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(239, 202, 113, 0.15);
  transition: all 0.2s ease;
}

.waiter-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.waiter-header {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #F0F0F0;
}

.waiter-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.waiter-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  color: #332F2E;
  flex-shrink: 0;
}

.waiter-name {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 4px;
  color: #332F2E;
}

.waiter-stats {
  display: flex;
  gap: 8px;
  font-size: 0.7rem;
}

.stat-badge {
  background: #F9F7EB;
  padding: 2px 6px;
  border-radius: 10px;
  color: #6F6C6D;
}

.items-compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  max-height: 280px;
  overflow-y: auto;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #F9F7EB;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.item-row:hover {
  background: #F5F3E6;
}

.item-icon-small {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  flex-shrink: 0;
}

.item-details {
  flex: 1;
  min-width: 80px;
}

.item-name {
  font-weight: 500;
  font-size: 0.85rem;
  color: #332F2E;
}

.item-price {
  font-size: 0.7rem;
  color: #EFCA71;
}

.item-quantity {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  min-width: 55px;
}

.assigned {
  color: #88B788;
  font-weight: 500;
}

.used {
  color: #EFCA71;
  font-weight: 500;
}

.separator {
  color: #8C8C90;
}

.item-remaining-input {
  min-width: 70px;
}

.remaining-input-small {
  width: 60px;
  padding: 4px 6px;
  border: 1px solid #E5E5E2;
  border-radius: 6px;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 500;
}

.item-revenue {
  min-width: 70px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #88B788;
  text-align: right;
}

.item-actions {
  min-width: 28px;
}

.btn-save-small {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #E5E5E2;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-save-small:hover:not(:disabled) {
  background: #EFCA71;
  border-color: #EFCA71;
}

.btn-save-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.waiter-footer {
  padding-top: 10px;
  border-top: 1px solid #F0F0F0;
  text-align: right;
}

.btn-save-waiter-small {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-save-waiter-small:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(239, 202, 113, 0.3);
}

.btn-save-waiter-small:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.warning-card {
  background: #FFF3E0;
  border-radius: 12px;
  padding: 16px;
  border-left: 3px solid #F57C00;
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.warning-header i {
  color: #F57C00;
  font-size: 1rem;
}

.warning-header h3 {
  margin: 0;
  font-size: 0.9rem;
  color: #F57C00;
}

.warning-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.warning-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 10px 12px;
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.warning-item .item-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stock-info {
  display: flex;
  gap: 12px;
  font-size: 0.7rem;
}

.remaining {
  color: #F57C00;
  font-weight: 600;
}

.notify-btn {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.7rem;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.notify-btn:hover {
  transform: translateY(-1px);
}

.toast-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 3000;
  animation: slideIn 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 0.85rem;
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

.items-compact::-webkit-scrollbar {
  width: 4px;
}

.items-compact::-webkit-scrollbar-track {
  background: #F0F0F0;
  border-radius: 4px;
}

.items-compact::-webkit-scrollbar-thumb {
  background: #EFCA71;
  border-radius: 4px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .waiters-grid {
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  }
}

@media (max-width: 768px) {
  .remaining-coupons {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .waiters-grid {
    grid-template-columns: 1fr;
  }
  
  .item-row {
    flex-wrap: wrap;
  }
  
  .item-revenue {
    text-align: left;
    margin-left: auto;
  }
}
</style>