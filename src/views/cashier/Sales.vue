<template>
  <div class="pos-system">
    <div class="page-header">
      <h1 class="page-title">Point of Sale</h1>
      <div class="header-info">
        <div class="date-time">
          <i class="fas fa-calendar"></i>
          <span>{{ currentDate }}</span>
          <i class="fas fa-clock"></i>
          <span>{{ currentTime }}</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading items...</p>
    </div>

    <div v-else class="pos-layout">
      <!-- Left Panel - Items Grid -->
      <div class="items-panel">
        <div class="category-filter">
          <button 
            v-for="cat in categories" 
            :key="cat"
            @click="selectedCategory = cat"
            :class="{ active: selectedCategory === cat }"
          >
            {{ cat }}
          </button>
        </div>
        
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search items..."
          >
        </div>
        
        <div class="items-grid">
          <div 
            v-for="item in filteredItems" 
            :key="item.id"
            class="item-card"
            :class="{ 'out-of-stock': item.remaining_coupon === 0 }"
            @click="addToCart(item)"
          >
            <div class="item-icon" :style="{ background: item.color }">
              <i :class="item.icon"></i>
            </div>
            <div class="item-name">{{ item.name }}</div>
            <div class="item-price">{{ formatCurrency(item.price) }}</div>
            <div class="item-coupon" v-if="item.remaining_coupon !== undefined">
              <i class="fas fa-ticket-alt"></i> {{ item.remaining_coupon }} left
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel - Cart -->
      <div class="cart-panel">
        <div class="cart-header">
          <h3>Current Order</h3>
          <button class="clear-cart" @click="clearCart" v-if="cart.length > 0">
            <i class="fas fa-trash"></i> Clear
          </button>
        </div>

        <div class="cart-items">
          <div v-for="(item, index) in cart" :key="index" class="cart-item">
            <div class="item-details">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-price">{{ formatCurrency(item.price) }}</div>
            </div>
            <div class="item-controls">
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
          <div class="summary-row coupons">
            <span>Coupons to use:</span>
            <span class="coupon-count">{{ totalCoupons }}</span>
          </div>
        </div>

        <div class="cart-actions">
          <div class="payment-methods">
            <button 
              v-for="method in paymentMethods" 
              :key="method"
              @click="selectedPayment = method"
              :class="{ active: selectedPayment === method }"
            >
              <i :class="getPaymentIcon(method)"></i>
              {{ method }}
            </button>
          </div>
          
          <div class="amount-input" v-if="selectedPayment === 'Cash'">
            <label>Amount Paid (ETB):</label>
            <input 
              type="number" 
              v-model.number="amountPaid" 
              :placeholder="formatCurrency(total)"
              step="1"
              min="0"
            >
            <div class="change" v-if="amountPaid >= total">
              Change: {{ formatCurrency(amountPaid - total) }}
            </div>
          </div>
          
          <button 
            class="btn-primary checkout-btn" 
            @click="processSale"
            :disabled="cart.length === 0 || isProcessing"
          >
            <i class="fas" :class="isProcessing ? 'fa-spinner fa-spin' : 'fa-check-circle'"></i>
            {{ isProcessing ? 'Processing...' : 'Complete Sale' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Receipt Modal -->
    <div v-if="showReceiptModal" class="modal" @click.self="closeReceiptModal">
      <div class="modal-content receipt">
        <div class="receipt-header">
          <h2>Eyob Bar & Restaurant</h2>
          <p>Receipt #{{ receiptData.id }}</p>
          <p>{{ receiptData.date }}</p>
        </div>
        <div class="receipt-items">
          <div v-for="item in receiptData.items" :key="item.name" class="receipt-item">
            <span>{{ item.name }} x {{ item.quantity }}</span>
            <span>{{ formatCurrency(item.price * item.quantity) }}</span>
          </div>
        </div>
        <div class="receipt-summary">
          <div class="receipt-row">
            <span>Subtotal:</span>
            <span>{{ formatCurrency(receiptData.subtotal) }}</span>
          </div>
          <div class="receipt-row">
            <span>Tax:</span>
            <span>{{ formatCurrency(receiptData.tax) }}</span>
          </div>
          <div class="receipt-row total">
            <span>Total:</span>
            <span>{{ formatCurrency(receiptData.total) }}</span>
          </div>
          <div class="receipt-row">
            <span>Payment:</span>
            <span>{{ receiptData.paymentMethod }}</span>
          </div>
          <div v-if="receiptData.change" class="receipt-row">
            <span>Change:</span>
            <span>{{ formatCurrency(receiptData.change) }}</span>
          </div>
          <div class="receipt-row coupons">
            <span>Coupons Used:</span>
            <span>{{ receiptData.couponsUsed }}</span>
          </div>
        </div>
        <div class="receipt-footer">
          <p>Thank you for your business!</p>
          <button class="btn-primary" @click="printReceipt">
            <i class="fas fa-print"></i> Print Receipt
          </button>
          <button class="btn-secondary" @click="closeReceiptModal">Close</button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="showToast" class="toast" :class="toastType">
      <i :class="toastIcon"></i>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'CashierPOS',
  setup() {
    const router = useRouter()
    
    // State
    const isLoading = ref(true)
    const isProcessing = ref(false)
    const searchQuery = ref('')
    const selectedCategory = ref('All')
    const cart = ref([])
    const selectedPayment = ref('Cash')
    const amountPaid = ref(0)
    const showReceiptModal = ref(false)
    const showToast = ref(false)
    const toastMessage = ref('')
    const toastType = ref('success')
    const receiptData = ref({})
    
    // Data
    const items = ref([])
    const categories = ref(['All', 'Drinks', 'Food', 'Other'])
    const paymentMethods = ['Cash', 'TeleBirr', 'CBE Birr', 'Card']
    
    let timer = null
    
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
    
    const currentTime = ref('')
    
    const filteredItems = computed(() => {
      let filtered = items.value
      
      if (selectedCategory.value !== 'All') {
        filtered = filtered.filter(item => item.category === selectedCategory.value)
      }
      
      if (searchQuery.value) {
        filtered = filtered.filter(item => 
          item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }
      
      return filtered
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
      }).format(value || 0)
    }
    
    const getPaymentIcon = (method) => {
      const icons = {
        Cash: 'fas fa-money-bill-wave',
        TeleBirr: 'fas fa-mobile-alt',
        'CBE Birr': 'fas fa-university',
        Card: 'fas fa-credit-card'
      }
      return icons[method] || 'fas fa-money-bill-wave'
    }
    
    const showSuccessToast = (message, type = 'success') => {
      toastMessage.value = message
      toastType.value = type
      showToast.value = true
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    }
    
    const fetchItems = async () => {
      try {
        const token = localStorage.getItem('authToken')
        
        if (!token) {
          showSuccessToast('Please login again', 'error')
          setTimeout(() => router.push('/login'), 1500)
          return
        }
        
        const response = await fetch('/api/cashier/items', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.status === 401) {
          showSuccessToast('Session expired. Please login again.', 'error')
          setTimeout(() => router.push('/login'), 1500)
          return
        }
        
        if (response.ok) {
          const data = await response.json()
          items.value = Array.isArray(data) ? data : (data.items || data)
          
          // Extract unique categories
          const uniqueCategories = ['All', ...new Set(items.value.map(item => item.category))]
          categories.value = uniqueCategories
        } else {
          console.error('Failed to fetch items:', response.status)
          loadDemoItems()
        }
      } catch (error) {
        console.error('Error fetching items:', error)
        showSuccessToast('Failed to load items. Using demo data.', 'error')
        loadDemoItems()
      }
    }
    
    const loadDemoItems = () => {
      items.value = [
        { id: 1, name: 'Beer', category: 'Drinks', price: 60, default_coupon: 100, remaining_coupon: 45, icon: 'fas fa-beer', color: '#F4A261' },
        { id: 2, name: 'Wine', category: 'Drinks', price: 150, default_coupon: 50, remaining_coupon: 30, icon: 'fas fa-wine-bottle', color: '#9C6B42' },
        { id: 3, name: 'Whiskey', category: 'Drinks', price: 200, default_coupon: 40, remaining_coupon: 28, icon: 'fas fa-glass-whiskey', color: '#E9C46A' },
        { id: 4, name: 'Cocktail', category: 'Drinks', price: 180, default_coupon: 35, remaining_coupon: 20, icon: 'fas fa-cocktail', color: '#2A9D8F' },
        { id: 5, name: 'Shiro', category: 'Food', price: 80, default_coupon: 80, remaining_coupon: 25, icon: 'fas fa-utensils', color: '#E9C46A' },
        { id: 6, name: 'Tibs', category: 'Food', price: 120, default_coupon: 60, remaining_coupon: 40, icon: 'fas fa-utensil-spoon', color: '#E76F51' },
        { id: 7, name: 'Kitfo', category: 'Food', price: 150, default_coupon: 50, remaining_coupon: 35, icon: 'fas fa-utensils', color: '#F4A261' },
        { id: 8, name: 'Pasta', category: 'Food', price: 100, default_coupon: 70, remaining_coupon: 45, icon: 'fas fa-utensil-spoon', color: '#9C6B42' }
      ]
    }
    
    const addToCart = (item) => {
      if (item.remaining_coupon === 0) {
        showSuccessToast(`${item.name} is out of coupons!`, 'error')
        return
      }
      
      const existingItem = cart.value.find(i => i.id === item.id)
      if (existingItem) {
        if (existingItem.quantity + 1 > item.remaining_coupon) {
          showSuccessToast(`Only ${item.remaining_coupon} coupons left for ${item.name}`, 'error')
          return
        }
        existingItem.quantity++
      } else {
        cart.value.push({ ...item, quantity: 1 })
      }
    }
    
    const updateQuantity = (index, delta) => {
      const newQuantity = cart.value[index].quantity + delta
      const item = items.value.find(i => i.id === cart.value[index].id)
      
      if (newQuantity >= 1 && newQuantity <= item.remaining_coupon) {
        cart.value[index].quantity = newQuantity
      } else if (newQuantity > item.remaining_coupon) {
        showSuccessToast(`Only ${item.remaining_coupon} coupons left for ${item.name}`, 'error')
      }
    }
    
    const removeFromCart = (index) => {
      cart.value.splice(index, 1)
    }
    
    const clearCart = () => {
      cart.value = []
      amountPaid.value = 0
    }
    
    const processSale = async () => {
      // Check if enough coupons available
      for (const cartItem of cart.value) {
        const item = items.value.find(i => i.id === cartItem.id)
        if (item.remaining_coupon < cartItem.quantity) {
          showSuccessToast(`Not enough coupons for ${item.name}. Only ${item.remaining_coupon} left.`, 'error')
          return
        }
      }
      
      // Check payment
      if (selectedPayment.value === 'Cash' && amountPaid.value < total.value) {
        showSuccessToast(`Amount paid is less than total. Please add ${formatCurrency(total.value - amountPaid.value)}`, 'error')
        return
      }
      
      isProcessing.value = true
      
      try {
        const token = localStorage.getItem('authToken')
        
        const saleData = {
          items: cart.value.map(item => ({
            item_id: item.id,
            quantity: item.quantity,
            unit_price: item.price
          })),
          payment_method: selectedPayment.value,
          amount_paid: amountPaid.value
        }
        
        console.log('Sending sale data:', saleData)
        
        const response = await fetch('/api/cashier/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(saleData)
        })
        
        if (response.status === 401) {
          showSuccessToast('Session expired. Please login again.', 'error')
          setTimeout(() => router.push('/login'), 1500)
          return
        }
        
        // Parse the response
        let result
        try {
          result = await response.json()
          console.log('Server response:', result)
        } catch (e) {
          console.error('Failed to parse response:', e)
          const text = await response.text()
          console.error('Raw response:', text)
          showSuccessToast('Server returned invalid response', 'error')
          return
        }
        
        // Check if the response indicates success
        if (result.success === false) {
          showSuccessToast(result.error || 'Error processing sale', 'error')
          return
        }
        
        if (response.ok || result.success === true) {
          // Update local item quantities
          for (const cartItem of cart.value) {
            const item = items.value.find(i => i.id === cartItem.id)
            if (item) {
              item.remaining_coupon -= cartItem.quantity
            }
          }
          
          // Generate receipt
          receiptData.value = {
            id: result.id || Math.floor(Math.random() * 10000),
            date: new Date().toLocaleString(),
            items: cart.value.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            subtotal: subtotal.value,
            tax: tax.value,
            total: total.value,
            paymentMethod: selectedPayment.value,
            change: selectedPayment.value === 'Cash' ? amountPaid.value - total.value : 0,
            couponsUsed: totalCoupons.value
          }
          
          showReceiptModal.value = true
          clearCart()
          showSuccessToast('Sale completed successfully!')
        } else {
          showSuccessToast(result.error || 'Error processing sale', 'error')
        }
      } catch (error) {
        console.error('Error processing sale:', error)
        showSuccessToast('Error processing sale. Please try again.', 'error')
      } finally {
        isProcessing.value = false
      }
    }
    
    const closeReceiptModal = () => {
      showReceiptModal.value = false
    }
    
    const printReceipt = () => {
      window.print()
    }
    
    const updateTime = () => {
      currentTime.value = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
    
    onMounted(async () => {
      updateTime()
      timer = setInterval(updateTime, 1000)
      await fetchItems()
      isLoading.value = false
    })
    
    onUnmounted(() => {
      if (timer) clearInterval(timer)
    })
    
    return {
      isLoading,
      isProcessing,
      searchQuery,
      selectedCategory,
      categories,
      cart,
      selectedPayment,
      paymentMethods,
      amountPaid,
      showReceiptModal,
      showToast,
      toastMessage,
      toastType,
      toastIcon,
      receiptData,
      items,
      currentDate,
      currentTime,
      filteredItems,
      subtotal,
      tax,
      total,
      totalCoupons,
      formatCurrency,
      getPaymentIcon,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      processSale,
      closeReceiptModal,
      printReceipt
    }
  }
}
</script>

<style scoped>
/* All your existing styles remain the same */
.pos-system {
  padding: 24px;
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #332F2E;
  margin: 0;
}

.header-info {
  background: #F9F7EB;
  padding: 8px 16px;
  border-radius: 12px;
}

.date-time {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #332F2E;
}

.date-time i {
  color: #EFCA71;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
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

.pos-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  flex: 1;
  min-height: 0;
}

.items-panel {
  background: white;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.category-filter {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.category-filter button {
  padding: 8px 16px;
  border: 1px solid #E5E5E2;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-filter button.active {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border-color: #EFCA71;
  color: #332F2E;
}

.search-bar {
  position: relative;
}

.search-bar i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #8C8C90;
}

.search-bar input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  overflow-y: auto;
  padding: 4px;
}

.item-card {
  background: #F9F7EB;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.item-card:hover:not(.out-of-stock) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.item-card.out-of-stock {
  opacity: 0.5;
  cursor: not-allowed;
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

.cart-panel {
  background: white;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-header h3 {
  margin: 0;
  font-size: 18px;
  color: #332F2E;
}

.clear-cart {
  background: none;
  border: none;
  color: #C45A5A;
  cursor: pointer;
  font-size: 14px;
}

.cart-items {
  flex: 1;
  overflow-y: auto;
  border: 1px solid #E5E5E2;
  border-radius: 12px;
  padding: 12px;
  min-height: 200px;
}

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F0F0F0;
}

.cart-item:last-child {
  border-bottom: none;
}

.item-details {
  flex: 1;
}

.item-details .item-name {
  font-weight: 500;
  color: #332F2E;
  margin: 0;
}

.item-details .item-price {
  font-size: 12px;
  margin-top: 4px;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-controls button {
  width: 28px;
  height: 28px;
  border: 1px solid #E5E5E2;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.item-controls button:hover:not(:disabled) {
  background: #EFCA71;
  border-color: #EFCA71;
}

.item-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity {
  min-width: 30px;
  text-align: center;
  font-weight: 600;
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

.summary-row.coupons {
  background: white;
  border-radius: 8px;
  padding: 8px;
  margin-top: 8px;
}

.coupon-count {
  font-weight: 700;
  color: #EFCA71;
}

.cart-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-methods {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.payment-methods button {
  padding: 10px;
  border: 1px solid #E5E5E2;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.payment-methods button.active {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border-color: #EFCA71;
}

.amount-input {
  background: #F9F7EB;
  padding: 12px;
  border-radius: 8px;
}

.amount-input label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.amount-input input {
  width: 100%;
  padding: 10px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
}

.change {
  margin-top: 8px;
  color: #4CAF50;
  font-weight: 600;
}

.checkout-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
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

.modal-content.receipt {
  max-width: 400px;
  background: white;
  border-radius: 16px;
  padding: 24px;
}

.receipt-header {
  text-align: center;
  border-bottom: 2px dashed #E5E5E2;
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.receipt-header h2 {
  margin: 0 0 8px;
  color: #332F2E;
}

.receipt-header p {
  margin: 4px 0;
  color: #8C8C90;
  font-size: 12px;
}

.receipt-items {
  border-bottom: 1px solid #E5E5E2;
  margin-bottom: 16px;
}

.receipt-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.receipt-summary {
  margin-bottom: 16px;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.receipt-row.total {
  font-weight: 700;
  font-size: 16px;
  border-top: 1px solid #E5E5E2;
  margin-top: 8px;
  padding-top: 8px;
}

.receipt-row.coupons {
  color: #EFCA71;
  font-weight: 600;
}

.receipt-footer {
  text-align: center;
  border-top: 2px dashed #E5E5E2;
  padding-top: 16px;
}

.receipt-footer p {
  margin: 0 0 16px;
  font-style: italic;
  color: #8C8C90;
}

.receipt-footer button {
  margin: 0 8px;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 2000;
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

/* Buttons */
.btn-primary {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  color: #332F2E;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
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
  background: #F9F7EB;
  color: #332F2E;
  border: 1px solid #E5E5E2;
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #EFCA71;
  border-color: #EFCA71;
}

@media (max-width: 1024px) {
  .pos-layout {
    grid-template-columns: 1fr;
  }
  
  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}

@media (max-width: 768px) {
  .pos-system {
    padding: 16px;
  }
  
  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
  
  .payment-methods {
    grid-template-columns: 1fr;
  }
}
</style>