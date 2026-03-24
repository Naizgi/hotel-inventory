<template>
  <div class="cashier-dashboard">
    <!-- Page Header -->
    <div class="page-header card">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <span class="title-gradient">Cashier</span>
            <span class="title-management">Dashboard</span>
          </h1>
          <p class="page-subtitle">Manage sales, track coupons, and process payments</p>
        </div>
        <div class="date-info">
          <i class="fas fa-calendar-alt"></i>
          <span>{{ currentDate }}</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container card">
      <div class="loading-spinner"></div>
      <p>Loading dashboard data...</p>
    </div>

    <div v-else>
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-chart-line"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ formatCurrency(stats.todayRevenue) }}</span>
            <span class="stat-label">Today's Revenue</span>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-ticket-alt"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.couponsUsedToday }}</span>
            <span class="stat-label">Coupons Used</span>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-shopping-cart"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.transactionsToday }}</span>
            <span class="stat-label">Transactions</span>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-chart-bar"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ formatCurrency(stats.averageTransaction) }}</span>
            <span class="stat-label">Avg Transaction</span>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="dashboard-grid">
        <!-- Recent Sales Section -->
        <div class="section-card card">
          <div class="section-header">
            <h3>Recent Sales</h3>
            <button class="btn-text" @click="viewAllSales">
              View All <i class="fas fa-arrow-right"></i>
            </button>
          </div>
          <div class="table-container">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Items</th>
                    <th>Coupons</th>
                    <th>Amount</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="sale in recentSales" :key="sale.id">
                    <td data-label="Time">{{ formatTime(sale.created_at) }}</td>
                    <td data-label="Items">
                      <div class="items-badge">
                        <span v-for="item in sale.items?.slice(0, 2)" :key="item.name">
                          {{ item.quantity }}x {{ item.name }}
                        </span>
                        <span v-if="sale.items?.length > 2" class="more">
                          +{{ sale.items.length - 2 }}
                        </span>
                      </div>
                    </td>
                    <td data-label="Coupons">{{ sale.coupons_used || sale.items?.reduce((sum, i) => sum + i.quantity, 0) || 0 }}</td>
                    <td data-label="Amount" class="amount-cell">{{ formatCurrency(sale.total_amount) }}</td>
                    <td data-label="Payment">
                      <span :class="['payment-badge', sale.payment_method?.toLowerCase()]">
                        {{ sale.payment_method || 'Cash' }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="recentSales.length === 0">
                    <td colspan="5" class="empty-state">No recent sales</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="right-column">
          <!-- Quick Sale Button -->
          <div class="section-card card quick-sale-card">
            <div class="quick-sale-content">
              <i class="fas fa-cash-register"></i>
              <div>
                <h3>Quick Sale</h3>
                <p>Process a new sale quickly</p>
              </div>
              <button class="btn btn-primary" @click="openNewSale">
                <i class="fas fa-plus"></i>
                <span>New Sale</span>
              </button>
            </div>
          </div>

          <!-- End of Day Summary -->
          <div class="section-card card">
            <div class="section-header">
              <h3>End of Day Summary</h3>
            </div>
            <div class="summary-stats">
              <div class="summary-item">
                <span class="summary-label">Opening Coupons:</span>
                <span class="summary-value">{{ stats.openingCoupons || 0 }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Coupons Used:</span>
                <span class="summary-value used">{{ stats.couponsUsedToday || 0 }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Remaining Coupons:</span>
                <span class="summary-value remaining">{{ (stats.openingCoupons || 0) - (stats.couponsUsedToday || 0) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Utilization Rate:</span>
                <span class="summary-value">{{ utilizationRate }}%</span>
              </div>
            </div>
            <button class="btn btn-outline full-width" @click="processEndOfDay" :disabled="isProcessingEOD">
              <i class="fas" :class="isProcessingEOD ? 'fa-spinner fa-spin' : 'fa-sunset'"></i>
              <span>{{ isProcessingEOD ? 'Processing...' : 'Process End of Day' }}</span>
            </button>
          </div>

          <!-- Payment Methods Breakdown -->
          <div class="section-card card">
            <div class="section-header">
              <h3>Payment Methods</h3>
            </div>
            <div class="payment-breakdown">
              <div v-for="method in paymentBreakdown" :key="method.name" class="payment-item">
                <div class="payment-info">
                  <span :class="['payment-badge', method.name.toLowerCase()]">{{ method.name }}</span>
                  <span class="payment-amount">{{ formatCurrency(method.amount) }}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: method.percentage + '%' }"></div>
                </div>
                <div class="payment-stats">
                  <span>{{ method.count }} transactions</span>
                  <span>{{ method.percentage }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Today's Top Items -->
          <div class="section-card card">
            <div class="section-header">
              <h3>Top Selling Items</h3>
            </div>
            <div class="top-items-list">
              <div v-for="item in topItems" :key="item.id" class="top-item">
                <div class="item-info">
                  <div class="item-icon-small" :style="{ background: item.color }">
                    <i :class="item.icon"></i>
                  </div>
                  <div>
                    <div class="item-name">{{ item.name }}</div>
                    <div class="item-quantity">{{ item.quantity }} sold</div>
                  </div>
                </div>
                <div class="item-revenue">{{ formatCurrency(item.revenue) }}</div>
              </div>
              <div v-if="topItems.length === 0" class="empty-state small">
                <p>No sales data available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Sale Modal -->
    <div v-if="showSaleModal" class="modal-overlay" @click.self="closeSaleModal">
      <div class="modal-content card" @click.stop>
        <div class="modal-header">
          <h2>New Sale</h2>
          <button class="close-btn" @click="closeSaleModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="sale-items-section">
            <div class="section-header small">
              <h4>Items</h4>
              <button class="btn-text" @click="addItemToSale">
                <i class="fas fa-plus"></i> Add Item
              </button>
            </div>
            
            <div v-for="(item, index) in saleItems" :key="index" class="sale-item-row">
              <select v-model="item.item_id" class="item-select" @change="updateItemPrice(item)">
                <option value="">Select Item</option>
                <option v-for="menuItem in menuItems" :key="menuItem.id" :value="menuItem.id">
                  {{ menuItem.name }} - {{ formatCurrency(menuItem.price) }}
                </option>
              </select>
              <input type="number" v-model="item.quantity" min="1" class="quantity-input" @input="calculateItemTotal(item)">
              <span class="item-price">{{ formatCurrency(item.total || 0) }}</span>
              <button class="btn-icon" @click="removeSaleItem(index)" title="Remove">
                <i class="fas fa-trash"></i>
              </button>
            </div>
            
            <div v-if="saleItems.length === 0" class="empty-state small">
              <p>No items added. Click "Add Item" to start.</p>
            </div>
          </div>
          
          <div class="sale-total">
            <span class="total-label">Total Amount:</span>
            <span class="total-amount">{{ formatCurrency(saleTotal) }}</span>
          </div>
          
          <div class="form-group">
            <label>Payment Method</label>
            <select v-model="paymentMethod" class="form-select">
              <option value="cash">Cash</option>
              <option value="telebirr">TeleBirr</option>
              <option value="cbe-birr">CBE Birr</option>
              <option value="card">Card</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="saleNotes" rows="2" placeholder="Optional notes..."></textarea>
          </div>
          
          <div class="modal-actions">
            <button class="btn btn-outline" @click="closeSaleModal">Cancel</button>
            <button class="btn btn-primary" @click="processSale" :disabled="isProcessingSale || saleItems.length === 0">
              <i class="fas" :class="isProcessingSale ? 'fa-spinner fa-spin' : 'fa-check'"></i>
              <span>{{ isProcessingSale ? 'Processing...' : 'Complete Sale' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- End of Day Modal -->
    <div v-if="showEODModal" class="modal-overlay" @click.self="closeEODModal">
      <div class="modal-content card" @click.stop>
        <div class="modal-header">
          <h2>End of Day Summary</h2>
          <button class="close-btn" @click="closeEODModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="eod-summary">
            <div class="summary-row">
              <span>Total Revenue:</span>
              <strong>{{ formatCurrency(stats.todayRevenue) }}</strong>
            </div>
            <div class="summary-row">
              <span>Total Transactions:</span>
              <strong>{{ stats.transactionsToday }}</strong>
            </div>
            <div class="summary-row">
              <span>Coupons Used:</span>
              <strong>{{ stats.couponsUsedToday }}</strong>
            </div>
            <div class="summary-row">
              <span>Remaining Coupons:</span>
              <strong>{{ (stats.openingCoupons || 0) - (stats.couponsUsedToday || 0) }}</strong>
            </div>
          </div>
          
          <div class="form-group">
            <label>End of Day Notes</label>
            <textarea v-model="eodNotes" rows="3" placeholder="Enter any notes about today's operations..."></textarea>
          </div>
          
          <div class="modal-actions">
            <button class="btn btn-outline" @click="closeEODModal">Cancel</button>
            <button class="btn btn-primary" @click="confirmEndOfDay" :disabled="isProcessingEOD">
              <i class="fas" :class="isProcessingEOD ? 'fa-spinner fa-spin' : 'fa-check'"></i>
              <span>{{ isProcessingEOD ? 'Processing...' : 'Confirm End of Day' }}</span>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api';

export default {
  name: 'CashierDashboard',
  setup() {
    const router = useRouter()
    
    // State
    const isLoading = ref(true)
    const isProcessingSale = ref(false)
    const isProcessingEOD = ref(false)
    const showSaleModal = ref(false)
    const showEODModal = ref(false)
    const toastMessage = ref('')
    const toastType = ref('success')
    
    // Data
    const stats = ref({
      todayRevenue: 0,
      couponsUsedToday: 0,
      transactionsToday: 0,
      averageTransaction: 0,
      openingCoupons: 0
    })
    
    const recentSales = ref([])
    const paymentBreakdown = ref([])
    const topItems = ref([])
    const menuItems = ref([])
    
    // Sale Form
    const saleItems = ref([])
    const paymentMethod = ref('cash')
    const saleNotes = ref('')
    const eodNotes = ref('')
    
    const toastIcon = computed(() => {
      return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
    })
    
    const saleTotal = computed(() => {
      return saleItems.value.reduce((sum, item) => sum + (item.total || 0), 0)
    })
    
    const utilizationRate = computed(() => {
      if (!stats.value.openingCoupons) return 0
      return Math.round((stats.value.couponsUsedToday / stats.value.openingCoupons) * 100)
    })
    
    const currentDate = computed(() => {
      return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
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

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(value || 0)
    }
    
    const formatTime = (dateTime) => {
      if (!dateTime) return '-'
      return new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    
    const fetchDashboardData = async () => {
      isLoading.value = true
      try {
        const token = localStorage.getItem('authToken')
        
        // Fetch today's stats
        const statsResponse = await api.get('/cashier/daily-coupons')
        
        if (statsResponse.status === 401 || statsResponse.status === 403) {
          showToast('Session expired. Please login again.', 'error')
          setTimeout(() => {
            router.push('/login')
          }, 1500)
          return
        }
        
        if (statsResponse.status==200) {
          const data = await statsResponse.data
          const dailyCoupons = Array.isArray(data) ? data : (data.daily_coupons || data)
          stats.value.couponsUsedToday = dailyCoupons.reduce((sum, d) => sum + (d.sold_quantity || 0), 0)
          stats.value.openingCoupons = dailyCoupons.reduce((sum, d) => sum + (d.initial_coupon || 0), 0)
        }
        
        // Fetch recent sales
        const salesResponse = await api.get('/cashier/sales')
        
        if (salesResponse.status==200) {
          const data = await salesResponse.data
          const sales = Array.isArray(data) ? data : (data.sales || data)
          recentSales.value = sales.slice(0, 10)
          
          // Calculate stats
          stats.value.transactionsToday = sales.length
          stats.value.todayRevenue = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0)
          stats.value.averageTransaction = stats.value.transactionsToday > 0 
            ? stats.value.todayRevenue / stats.value.transactionsToday 
            : 0
        }
        
        // Fetch menu items
        const itemsResponse = await api.get('/admin/items')
        
        if (itemsResponse.status==200) {
          const data = await itemsResponse.data
          menuItems.value = Array.isArray(data) ? data : (data.items || data)
        }
        
        // Calculate payment breakdown and top items from sales
        calculateStatsFromSales()
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        showToast('Failed to load data. Using demo data.', 'error')
        loadDemoData()
      } finally {
        isLoading.value = false
      }
    }
    
    const calculateStatsFromSales = () => {
      // Calculate payment breakdown
      const paymentMap = {}
      recentSales.value.forEach(sale => {
        const method = sale.payment_method || 'cash'
        if (!paymentMap[method]) {
          paymentMap[method] = { amount: 0, count: 0 }
        }
        paymentMap[method].amount += sale.total_amount || 0
        paymentMap[method].count++
      })
      
      const totalRevenue = stats.value.todayRevenue
      paymentBreakdown.value = Object.entries(paymentMap).map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        amount: data.amount,
        count: data.count,
        percentage: totalRevenue > 0 ? Math.round((data.amount / totalRevenue) * 100) : 0
      }))
      
      // Calculate top items
      const itemMap = {}
      recentSales.value.forEach(sale => {
        sale.items?.forEach(item => {
          if (!itemMap[item.name]) {
            itemMap[item.name] = {
              id: item.id,
              name: item.name,
              icon: item.icon || 'fas fa-cube',
              color: item.color || '#EFCA71',
              quantity: 0,
              revenue: 0
            }
          }
          itemMap[item.name].quantity += item.quantity
          itemMap[item.name].revenue += item.line_total || (item.price * item.quantity)
        })
      })
      
      topItems.value = Object.values(itemMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
    }
    
    const loadDemoData = () => {
      stats.value = {
        todayRevenue: 12500,
        couponsUsedToday: 142,
        transactionsToday: 58,
        averageTransaction: 215.52,
        openingCoupons: 585
      }
      
      recentSales.value = [
        { id: 1, created_at: new Date().toISOString(), items: [{ name: 'Beer', quantity: 2, price: 60 }], total_amount: 120, payment_method: 'cash' },
        { id: 2, created_at: new Date(Date.now() - 3600000).toISOString(), items: [{ name: 'Wine', quantity: 1, price: 150 }], total_amount: 150, payment_method: 'telebirr' }
      ]
      
      menuItems.value = [
        { id: 1, name: 'Beer', price: 60, icon: 'fas fa-beer', color: '#F4A261' },
        { id: 2, name: 'Wine', price: 150, icon: 'fas fa-wine-bottle', color: '#9C6B42' },
        { id: 3, name: 'Shiro', price: 80, icon: 'fas fa-utensils', color: '#E9C46A' }
      ]
      
      paymentBreakdown.value = [
        { name: 'Cash', amount: 8750, count: 42, percentage: 70 },
        { name: 'TeleBirr', amount: 2500, count: 12, percentage: 20 },
        { name: 'CBE Birr', amount: 1250, count: 4, percentage: 10 }
      ]
      
      topItems.value = [
        { id: 1, name: 'Beer', icon: 'fas fa-beer', color: '#F4A261', quantity: 85, revenue: 5100 },
        { id: 2, name: 'Wine', icon: 'fas fa-wine-bottle', color: '#9C6B42', quantity: 32, revenue: 4800 },
        { id: 3, name: 'Shiro', icon: 'fas fa-utensils', color: '#E9C46A', quantity: 41, revenue: 3280 }
      ]
      
      calculateStatsFromSales()
    }
    
    const addItemToSale = () => {
      saleItems.value.push({
        item_id: '',
        quantity: 1,
        price: 0,
        total: 0
      })
    }
    
    const updateItemPrice = (item) => {
      const selectedItem = menuItems.value.find(i => i.id === parseInt(item.item_id))
      if (selectedItem) {
        item.price = selectedItem.price
        calculateItemTotal(item)
      }
    }
    
    const calculateItemTotal = (item) => {
      item.total = (item.price || 0) * (item.quantity || 0)
    }
    
    const removeSaleItem = (index) => {
      saleItems.value.splice(index, 1)
    }
    
    const processSale = async () => {
      if (saleItems.value.length === 0) {
        showToast('Please add items to the sale', 'error')
        return
      }
      
      if (!paymentMethod.value) {
        showToast('Please select a payment method', 'error')
        return
      }
      
      isProcessingSale.value = true
      try {
        const token = localStorage.getItem('authToken')
        const saleData = {
          items: saleItems.value.map(item => ({
            item_id: parseInt(item.item_id),
            quantity: item.quantity,
            unit_price: item.price
          })),
          payment_method: paymentMethod.value,
          notes: saleNotes.value
        }
        
        const response = await api.post('/cashier/sales',saleData)
        
        if (response.status === 401 || response.status === 403) {
          showToast('Session expired. Please login again.', 'error')
          setTimeout(() => {
            router.push('/login')
          }, 1500)
          return
        }
        
        if (!response.status==200) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const result = await response.data
        
        showToast('Sale completed successfully!', 'success')
        closeSaleModal()
        await fetchDashboardData()
        
      } catch (error) {
        console.error('Error processing sale:', error)
        showToast(error.message || 'Error processing sale', 'error')
      } finally {
        isProcessingSale.value = false
      }
    }
    
    const openNewSale = () => {
      saleItems.value = []
      paymentMethod.value = 'cash'
      saleNotes.value = ''
      showSaleModal.value = true
    }
    
    const closeSaleModal = () => {
      showSaleModal.value = false
    }
    
    const processEndOfDay = () => {
      showEODModal.value = true
    }
    
    const closeEODModal = () => {
      showEODModal.value = false
      eodNotes.value = ''
    }
    
    const confirmEndOfDay = async () => {
      isProcessingEOD.value = true
      try {
        const token = localStorage.getItem('authToken')
        const remainingCoupons = (stats.value.openingCoupons || 0) - (stats.value.couponsUsedToday || 0)
        
        const response = await api.post('/cashier/end-of-day', {
            remaining_coupons: remainingCoupons,
            notes: eodNotes.value
          })
        
        if (response.status === 401 || response.status === 403) {
          showToast('Session expired. Please login again.', 'error')
          setTimeout(() => {
            router.push('/login')
          }, 1500)
          return
        }
        
        if (!response.status==200) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        showToast('End of day processed successfully!', 'success')
        closeEODModal()
        await fetchDashboardData()
        
      } catch (error) {
        console.error('Error processing end of day:', error)
        showToast(error.message || 'Error processing end of day', 'error')
      } finally {
        isProcessingEOD.value = false
      }
    }
    
    const viewAllSales = () => {
      router.push('/cashier/sales-history')
    }
    
    onMounted(() => {
      fetchDashboardData()
    })
    
    return {
      isLoading,
      isProcessingSale,
      isProcessingEOD,
      showSaleModal,
      showEODModal,
      toastMessage,
      toastType,
      toastIcon,
      stats,
      recentSales,
      paymentBreakdown,
      topItems,
      menuItems,
      saleItems,
      paymentMethod,
      saleNotes,
      eodNotes,
      saleTotal,
      utilizationRate,
      currentDate,
      formatCurrency,
      formatTime,
      addItemToSale,
      updateItemPrice,
      calculateItemTotal,
      removeSaleItem,
      processSale,
      openNewSale,
      closeSaleModal,
      processEndOfDay,
      closeEODModal,
      confirmEndOfDay,
      viewAllSales
    }
  }
}
</script>

<style scoped>
/* ==============================================
   CASHIER DASHBOARD - MATCHING ADMIN STYLES
   ============================================== */

.cashier-dashboard {
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

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.stat-icon-wrapper {
  width: 60px;
  height: 60px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #332F2E;
  font-size: 1.5rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 1.8rem;
  font-weight: 700;
  color: #332F2E;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.9rem;
  color: #6F6C6D;
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 30px;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* Section Card */
.section-card {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  color: #332F2E;
}

.section-header.small h4 {
  font-size: 1rem;
  margin: 0;
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
}

.btn-text:hover {
  color: #332F2E;
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
  min-width: 500px;
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

.items-badge {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.items-badge span {
  background: #F5F5F5;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
}

.items-badge .more {
  background: #EFCA71;
  color: #332F2E;
}

.amount-cell {
  font-weight: 600;
  color: #EFCA71;
}

.payment-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 500;
  display: inline-block;
}

.payment-badge.cash {
  background: #E8F5E9;
  color: #4CAF50;
}

.payment-badge.telebirr {
  background: #E3F2FD;
  color: #1976D2;
}

.payment-badge.cbe-birr {
  background: #FFF3E0;
  color: #F57C00;
}

.payment-badge.card {
  background: #F3E5F5;
  color: #7B1FA2;
}

/* Quick Sale Card */
.quick-sale-card {
  background: linear-gradient(135deg, #F9F7EB, #FFFFFF);
}

.quick-sale-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.quick-sale-content i {
  font-size: 2rem;
  color: #EFCA71;
}

.quick-sale-content h3 {
  margin: 0 0 4px;
  font-size: 1.1rem;
}

.quick-sale-content p {
  margin: 0;
  font-size: 0.8rem;
  color: #6F6C6D;
}

.quick-sale-content .btn {
  margin-left: auto;
}

/* Summary Stats */
.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #F0F0F0;
}

.summary-label {
  color: #6F6C6D;
}

.summary-value {
  font-weight: 600;
  color: #332F2E;
}

.summary-value.used {
  color: #EFCA71;
}

.summary-value.remaining {
  color: #88B788;
}

/* Payment Breakdown */
.payment-breakdown {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.payment-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.payment-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-amount {
  font-weight: 600;
  color: #EFCA71;
}

.payment-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: #6F6C6D;
}

/* Top Items List */
.top-items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #F9F7EB;
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.top-item:hover {
  transform: translateX(4px);
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-icon-small {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  flex-shrink: 0;
}

.item-name {
  font-weight: 600;
  color: #332F2E;
  font-size: 0.9rem;
}

.item-quantity {
  font-size: 0.7rem;
  color: #6F6C6D;
}

.item-revenue {
  font-weight: 600;
  color: #EFCA71;
  font-size: 0.9rem;
}

/* Progress Bar */
.progress-bar {
  width: 100%;
  height: 6px;
  background: #E5E5E2;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #EFCA71, #F2E9C6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
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

.full-width {
  width: 100%;
  justify-content: center;
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
  max-width: 600px;
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

/* Sale Items Section */
.sale-items-section {
  margin-bottom: 20px;
}

.sale-item-row {
  display: grid;
  grid-template-columns: 1fr 100px 100px 40px;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.item-select, .quantity-input {
  padding: 8px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 0.9rem;
}

.item-price {
  font-weight: 600;
  color: #EFCA71;
  text-align: right;
}

.sale-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #F9F7EB;
  border-radius: 12px;
  margin: 20px 0;
}

.total-label {
  font-weight: 600;
  font-size: 1.1rem;
}

.total-amount {
  font-weight: 700;
  font-size: 1.3rem;
  color: #EFCA71;
}

/* Form Styles */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #332F2E;
  font-size: 0.9rem;
}

.form-select,
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

/* EOD Summary */
.eod-summary {
  background: #F9F7EB;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #E5E5E2;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row strong {
  color: #EFCA71;
  font-size: 1.1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #8C8C90;
}

.empty-state.small {
  padding: 20px;
}

.empty-state i {
  font-size: 2rem;
  margin-bottom: 8px;
  display: block;
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
@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .cashier-dashboard {
    padding: 20px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .title-management {
    font-size: 1.6rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .sale-item-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .quick-sale-content {
    flex-direction: column;
    text-align: center;
  }
  
  .quick-sale-content .btn {
    margin-left: 0;
  }
  
  .modal-content {
    margin: 16px;
  }
}

@media (max-width: 480px) {
  .cashier-dashboard {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-info {
    justify-content: center;
  }
  
  .top-item {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .item-info {
    flex-direction: column;
  }
}
</style>