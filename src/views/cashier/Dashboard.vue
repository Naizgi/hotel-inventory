<template>
  <div class="cashier-dashboard">
    <div class="page-header">
      <h1 class="page-title">Cashier Dashboard</h1>
      <div class="header-actions">
        <button class="btn-primary" @click="startNewSale">
          <i class="fas fa-plus"></i> New Sale
        </button>
        <button class="btn-secondary" @click="endOfDay">
          <i class="fas fa-calendar-check"></i> End of Day
        </button>
      </div>
    </div>

    <!-- Today's Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-info">
          <h3>{{ formatCurrency(todayStats.totalSales) }}</h3>
          <p>Today's Sales</p>
          <span class="trend positive" v-if="salesTrend > 0">
            <i class="fas fa-arrow-up"></i> {{ salesTrend }}%
          </span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-ticket-alt"></i>
        </div>
        <div class="stat-info">
          <h3>{{ todayStats.couponsUsed }}</h3>
          <p>Coupons Used</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <div class="stat-info">
          <h3>{{ todayStats.transactions }}</h3>
          <p>Transactions</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-info">
          <h3>{{ todayStats.customers }}</h3>
          <p>Customers Served</p>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h3>Quick Actions</h3>
      <div class="action-buttons">
        <button class="action-btn" @click="quickSale('beer')">
          <i class="fas fa-beer"></i>
          <span>Quick Beer</span>
        </button>
        <button class="action-btn" @click="quickSale('wine')">
          <i class="fas fa-wine-bottle"></i>
          <span>Quick Wine</span>
        </button>
        <button class="action-btn" @click="quickSale('shiro')">
          <i class="fas fa-utensils"></i>
          <span>Quick Shiro</span>
        </button>
        <button class="action-btn" @click="openPOS">
          <i class="fas fa-cash-register"></i>
          <span>Full POS</span>
        </button>
      </div>
    </div>

    <!-- Recent Sales -->
    <div class="recent-sales">
      <div class="section-header">
        <h3>Recent Transactions</h3>
        <router-link to="/cashier/sales-history" class="view-all">
          View All <i class="fas fa-arrow-right"></i>
        </router-link>
      </div>
      <div class="sales-table-container">
        <table class="sales-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Items</th>
              <th>Coupons</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sale in recentSales" :key="sale.id">
              <td>{{ formatTime(sale.time) }}</td>
              <td>{{ sale.items }}</td>
              <td>{{ sale.coupons }}</td>
              <td class="amount">{{ formatCurrency(sale.amount) }}</td>
              <td>
                <span :class="['status-badge', sale.status]">
                  {{ sale.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Low Stock Alerts -->
    <div v-if="lowStockItems.length > 0" class="low-stock-alert">
      <div class="alert-header">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Low Stock Alert</h3>
      </div>
      <div class="alert-items">
        <div v-for="item in lowStockItems" :key="item.id" class="alert-item">
          <div class="item-info">
            <div class="item-icon" :style="{ background: item.color }">
              <i :class="item.icon"></i>
            </div>
            <span class="item-name">{{ item.name }}</span>
          </div>
          <div class="stock-info">
            <span class="stock-remaining">{{ item.remaining }} coupons left</span>
            <span class="stock-percentage">{{ item.utilization }}% used</span>
          </div>
          <button class="btn-small" @click="notifyBarista(item)">
            <i class="fas fa-bell"></i> Notify Barista
          </button>
        </div>
      </div>
    </div>

    <!-- New Sale Modal -->
    <div v-if="showSaleModal" class="modal" @click.self="closeSaleModal">
      <div class="modal-content large">
        <div class="modal-header">
          <h2>New Sale</h2>
          <button class="close-btn" @click="closeSaleModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="sale-layout">
            <!-- Items List -->
            <div class="items-list">
              <h3>Menu Items</h3>
              <div class="search-items">
                <input type="text" v-model="itemSearch" placeholder="Search items...">
              </div>
              <div class="items-grid">
                <div 
                  v-for="item in filteredItems" 
                  :key="item.id"
                  class="item-card"
                  :class="{ disabled: item.remaining === 0 }"
                  @click="addToCart(item)"
                >
                  <div class="item-icon" :style="{ background: item.color }">
                    <i :class="item.icon"></i>
                  </div>
                  <div class="item-details">
                    <div class="item-name">{{ item.name }}</div>
                    <div class="item-price">{{ formatCurrency(item.price) }}</div>
                    <div class="item-coupon" v-if="item.remaining !== undefined">
                      {{ item.remaining }} coupons left
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Cart -->
            <div class="cart">
              <h3>Current Sale</h3>
              <div class="cart-items">
                <div v-for="(item, index) in cart" :key="index" class="cart-item">
                  <div class="cart-item-info">
                    <span class="cart-item-name">{{ item.name }}</span>
                    <span class="cart-item-price">{{ formatCurrency(item.price) }}</span>
                  </div>
                  <div class="cart-item-controls">
                    <button @click="updateQuantity(index, -1)" :disabled="item.quantity <= 1">
                      <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity">{{ item.quantity }}</span>
                    <button @click="updateQuantity(index, 1)">
                      <i class="fas fa-plus"></i>
                    </button>
                    <button class="remove-btn" @click="removeFromCart(index)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <div v-if="cart.length === 0" class="empty-cart">
                  <i class="fas fa-shopping-cart"></i>
                  <p>No items added</p>
                </div>
              </div>
              <div class="cart-summary">
                <div class="summary-row">
                  <span>Subtotal:</span>
                  <span>{{ formatCurrency(subtotal) }}</span>
                </div>
                <div class="summary-row">
                  <span>Tax (15%):</span>
                  <span>{{ formatCurrency(tax) }}</span>
                </div>
                <div class="summary-row total">
                  <span>Total:</span>
                  <span>{{ formatCurrency(total) }}</span>
                </div>
                <div class="coupon-usage">
                  <span>Coupons to use:</span>
                  <span class="coupon-count">{{ totalCoupons }}</span>
                </div>
              </div>
              <div class="cart-actions">
                <button class="btn-secondary" @click="clearCart">Clear</button>
                <button class="btn-primary" @click="processSale" :disabled="cart.length === 0">
                  Process Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- End of Day Modal -->
    <div v-if="showEndOfDayModal" class="modal" @click.self="closeEndOfDayModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>End of Day Report</h2>
          <button class="close-btn" @click="closeEndOfDayModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="eod-summary">
            <div class="eod-stat">
              <label>Total Sales:</label>
              <span class="value">{{ formatCurrency(todayStats.totalSales) }}</span>
            </div>
            <div class="eod-stat">
              <label>Total Coupons Used:</label>
              <span class="value">{{ todayStats.couponsUsed }}</span>
            </div>
            <div class="eod-stat">
              <label>Transactions:</label>
              <span class="value">{{ todayStats.transactions }}</span>
            </div>
            <div class="eod-stat">
              <label>Customers Served:</label>
              <span class="value">{{ todayStats.customers }}</span>
            </div>
          </div>
          <div class="remaining-coupons">
            <h4>Remaining Coupons</h4>
            <div v-for="item in remainingCoupons" :key="item.id" class="remaining-item">
              <span>{{ item.name }}</span>
              <span class="remaining-value">{{ item.remaining }}</span>
            </div>
          </div>
          <div class="eod-actions">
            <button class="btn-secondary" @click="closeEndOfDayModal">Cancel</button>
            <button class="btn-primary" @click="confirmEndOfDay">Confirm End of Day</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="showToast" class="toast success">
      <i class="fas fa-check-circle"></i>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

export default {
  name: 'CashierDashboard',
  setup() {
    const router = useRouter()
    const toast = useToast()
    const showSaleModal = ref(false)
    const showEndOfDayModal = ref(false)
    const showToast = ref(false)
    const toastMessage = ref('')
    const itemSearch = ref('')
    
    const cart = ref([])
    
    const todayStats = ref({
      totalSales: 8750,
      couponsUsed: 142,
      transactions: 58,
      customers: 45
    })
    
    const salesTrend = ref(12.5)
    
    const recentSales = ref([
      { id: 1, time: '14:30', items: '2x Beer, 1x Shiro', coupons: 3, amount: 200, status: 'completed' },
      { id: 2, time: '14:15', items: '1x Wine', coupons: 1, amount: 150, status: 'completed' },
      { id: 3, time: '13:45', items: '3x Beer', coupons: 3, amount: 180, status: 'completed' },
      { id: 4, time: '13:20', items: '2x Shiro, 1x Tibs', coupons: 3, amount: 280, status: 'completed' }
    ])
    
    const items = ref([
      { id: 1, name: 'Beer', category: 'drink', price: 60, default_coupon: 100, remaining: 45, icon: 'fas fa-beer', color: '#F4A261' },
      { id: 2, name: 'Wine', category: 'drink', price: 150, default_coupon: 50, remaining: 30, icon: 'fas fa-wine-bottle', color: '#9C6B42' },
      { id: 3, name: 'Shiro', category: 'food', price: 80, default_coupon: 80, remaining: 25, icon: 'fas fa-utensils', color: '#E9C46A' },
      { id: 4, name: 'Tibs', category: 'food', price: 120, default_coupon: 60, remaining: 40, icon: 'fas fa-utensil-spoon', color: '#E76F51' },
      { id: 5, name: 'Special Cocktail', category: 'drink', price: 200, default_coupon: 30, remaining: 5, icon: 'fas fa-cocktail', color: '#2A9D8F' }
    ])
    
    const lowStockItems = computed(() => {
      return items.value.filter(item => {
        const utilization = ((item.default_coupon - item.remaining) / item.default_coupon) * 100
        return utilization >= 80 && item.remaining > 0
      })
    })
    
    const remainingCoupons = computed(() => {
      return items.value.map(item => ({
        id: item.id,
        name: item.name,
        remaining: item.remaining
      }))
    })
    
    const filteredItems = computed(() => {
      if (!itemSearch.value) return items.value
      return items.value.filter(item => 
        item.name.toLowerCase().includes(itemSearch.value.toLowerCase())
      )
    })
    
    const subtotal = computed(() => {
      return cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    })
    
    const tax = computed(() => subtotal.value * 0.15)
    
    const total = computed(() => subtotal.value + tax.value)
    
    const totalCoupons = computed(() => {
      return cart.value.reduce((sum, item) => sum + item.quantity, 0)
    })
    
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(value)
    }
    
    const formatTime = (time) => {
      return time
    }
    
    const startNewSale = () => {
      cart.value = []
      itemSearch.value = ''
      showSaleModal.value = true
    }
    
    const openPOS = () => {
      router.push('/cashier/sales')
    }
    
    const quickSale = (itemName) => {
      const item = items.value.find(i => i.name.toLowerCase() === itemName)
      if (item && item.remaining > 0) {
        cart.value = [{ ...item, quantity: 1 }]
        processSale()
      } else {
        showSuccessToast(`${itemName} is out of coupons!`)
      }
    }
    
    const addToCart = (item) => {
      if (item.remaining === 0) {
        showSuccessToast(`${item.name} has no coupons left!`)
        return
      }
      
      const existingItem = cart.value.find(i => i.id === item.id)
      if (existingItem) {
        existingItem.quantity++
      } else {
        cart.value.push({ ...item, quantity: 1 })
      }
    }
    
    const updateQuantity = (index, delta) => {
      const newQuantity = cart.value[index].quantity + delta
      if (newQuantity >= 1) {
        cart.value[index].quantity = newQuantity
      }
    }
    
    const removeFromCart = (index) => {
      cart.value.splice(index, 1)
    }
    
    const clearCart = () => {
      cart.value = []
    }
    
    const processSale = async () => {
      // Check if enough coupons available
      for (const cartItem of cart.value) {
        const item = items.value.find(i => i.id === cartItem.id)
        if (item.remaining < cartItem.quantity) {
          showSuccessToast(`Not enough coupons for ${item.name}. Only ${item.remaining} left.`)
          return
        }
      }
      
      try {
        // Process sale
        const saleData = {
          items: cart.value.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          subtotal: subtotal.value,
          tax: tax.value,
          total: total.value,
          coupons_used: totalCoupons.value
        }
        
        // API call would go here
        // await fetch('/api/cashier/sales', { method: 'POST', body: JSON.stringify(saleData) })
        
        // Update local data
        for (const cartItem of cart.value) {
          const item = items.value.find(i => i.id === cartItem.id)
          item.remaining -= cartItem.quantity
          todayStats.value.couponsUsed += cartItem.quantity
          todayStats.value.totalSales += (cartItem.price * cartItem.quantity)
        }
        
        todayStats.value.transactions++
        todayStats.value.customers++
        
        showSuccessToast(`Sale processed successfully! Total: ${formatCurrency(total.value)}`)
        closeSaleModal()
      } catch (error) {
        console.error('Error processing sale:', error)
        toast.error('Error processing sale')
      }
    }
    
    const closeSaleModal = () => {
      showSaleModal.value = false
      cart.value = []
    }
    
    const endOfDay = () => {
      showEndOfDayModal.value = true
    }
    
    const closeEndOfDayModal = () => {
      showEndOfDayModal.value = false
    }
    
    const confirmEndOfDay = async () => {
      try {
        // API call to end of day
        // await fetch('/api/cashier/end-of-day', { method: 'POST', body: JSON.stringify(todayStats.value) })
        
        showSuccessToast('End of day report saved successfully')
        closeEndOfDayModal()
        
        // Reset today's stats
        todayStats.value = {
          totalSales: 0,
          couponsUsed: 0,
          transactions: 0,
          customers: 0
        }
        
        // Reset remaining coupons
        items.value.forEach(item => {
          item.remaining = item.default_coupon
        })
      } catch (error) {
        console.error('Error ending day:', error)
        toast.error('Error ending day')
      }
    }
    
    const notifyBarista = (item) => {
      showSuccessToast(`Notification sent to barista for ${item.name}`)
    }
    
    const showSuccessToast = (message) => {
      toastMessage.value = message
      showToast.value = true
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    }
    
    onMounted(() => {
      // Fetch today's stats
      // fetchTodayStats()
    })
    
    return {
      showSaleModal,
      showEndOfDayModal,
      showToast,
      toastMessage,
      itemSearch,
      cart,
      todayStats,
      salesTrend,
      recentSales,
      items,
      lowStockItems,
      remainingCoupons,
      filteredItems,
      subtotal,
      tax,
      total,
      totalCoupons,
      formatCurrency,
      formatTime,
      startNewSale,
      openPOS,
      quickSale,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      processSale,
      closeSaleModal,
      endOfDay,
      closeEndOfDayModal,
      confirmEndOfDay,
      notifyBarista
    }
  }
}
</script>

<style scoped>
.cashier-dashboard {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
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
  padding: 12px 24px;
  border-radius: 12px;
  color: #332F2E;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 202, 113, 0.3);
}

.btn-secondary {
  background: #F5F5F5;
  border: 1px solid #E5E5E2;
  padding: 12px 24px;
  border-radius: 12px;
  color: #6F6C6D;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #E5E5E2;
}

.btn-small {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-small:hover {
  transform: translateY(-1px);
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
  position: relative;
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

.trend {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}

.trend.positive {
  background: #E8F5E9;
  color: #4CAF50;
}

.quick-actions {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 32px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.quick-actions h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #332F2E;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #F9F7EB;
  border: 1px solid #E5E5E2;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #EFCA71;
  transform: translateY(-2px);
}

.recent-sales {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 32px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #E5E5E2;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  color: #332F2E;
}

.view-all {
  color: #EFCA71;
  text-decoration: none;
  font-size: 14px;
}

.sales-table-container {
  overflow-x: auto;
}

.sales-table {
  width: 100%;
  border-collapse: collapse;
}

.sales-table th {
  text-align: left;
  padding: 12px 20px;
  background: #F9F7EB;
  color: #332F2E;
  font-weight: 600;
}

.sales-table td {
  padding: 12px 20px;
  border-bottom: 1px solid #F0F0F0;
}

.amount {
  font-weight: 600;
  color: #EFCA71;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.completed {
  background: #E8F5E9;
  color: #4CAF50;
}

.low-stock-alert {
  background: #FFF3E0;
  border-radius: 16px;
  padding: 20px;
  border-left: 4px solid #F57C00;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.alert-header i {
  color: #F57C00;
  font-size: 20px;
}

.alert-header h3 {
  margin: 0;
  font-size: 16px;
  color: #F57C00;
}

.alert-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 12px;
  border-radius: 12px;
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

.stock-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
}

.stock-remaining {
  color: #F57C00;
  font-weight: 600;
}

.stock-percentage {
  color: #8C8C90;
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
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 1200px;
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

.sale-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}

.items-list {
  border-right: 1px solid #E5E5E2;
  padding-right: 24px;
}

.items-list h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #332F2E;
}

.search-items {
  margin-bottom: 16px;
}

.search-items input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.item-card {
  background: #F9F7EB;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.item-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.item-card.disabled:hover {
  transform: none;
}

.item-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.item-name {
  font-weight: 600;
  color: #332F2E;
  font-size: 14px;
}

.item-price {
  color: #EFCA71;
  font-weight: 600;
  font-size: 12px;
  margin-top: 4px;
}

.item-coupon {
  font-size: 10px;
  color: #8C8C90;
  margin-top: 4px;
}

.cart {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cart h3 {
  margin: 0;
  font-size: 18px;
  color: #332F2E;
}

.cart-items {
  flex: 1;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #E5E5E2;
  border-radius: 12px;
  padding: 12px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #F0F0F0;
}

.cart-item:last-child {
  border-bottom: none;
}

.cart-item-info {
  flex: 1;
}

.cart-item-name {
  font-weight: 500;
  color: #332F2E;
}

.cart-item-price {
  font-size: 12px;
  color: #EFCA71;
  margin-left: 8px;
}

.cart-item-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cart-item-controls button {
  width: 28px;
  height: 28px;
  border: 1px solid #E5E5E2;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cart-item-controls button:hover {
  background: #EFCA71;
  border-color: #EFCA71;
}

.remove-btn {
  color: #C45A5A;
}

.empty-cart {
  text-align: center;
  padding: 40px;
  color: #8C8C90;
}

.empty-cart i {
  font-size: 48px;
  margin-bottom: 16px;
}

.cart-summary {
  background: #F9F7EB;
  border-radius: 12px;
  padding: 16px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.summary-row.total {
  font-weight: 700;
  font-size: 18px;
  border-top: 1px solid #E5E5E2;
  margin-top: 8px;
  padding-top: 12px;
}

.coupon-usage {
  background: white;
  border-radius: 8px;
  padding: 8px;
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
}

.coupon-count {
  font-weight: 700;
  color: #EFCA71;
}

.cart-actions {
  display: flex;
  gap: 12px;
}

.cart-actions button {
  flex: 1;
}

.eod-summary {
  background: #F9F7EB;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.eod-stat {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.eod-stat .value {
  font-weight: 600;
  color: #EFCA71;
}

.remaining-coupons {
  margin-bottom: 20px;
}

.remaining-coupons h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #332F2E;
}

.remaining-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #F0F0F0;
}

.remaining-value {
  font-weight: 600;
  color: #EFCA71;
}

.eod-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #4CAF50;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 2000;
  animation: slideIn 0.3s ease;
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
  .sale-layout {
    grid-template-columns: 1fr;
  }
  
  .items-list {
    border-right: none;
    padding-right: 0;
  }
}

@media (max-width: 768px) {
  .cashier-dashboard {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .alert-item {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .stock-info {
    flex-direction: column;
    gap: 4px;
  }
  
  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>