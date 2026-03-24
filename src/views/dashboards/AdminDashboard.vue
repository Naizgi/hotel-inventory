<template>
  <div class="admin-dashboard">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading dashboard...</p>
    </div>

    <div v-else>
      <!-- Page Header -->
      <div class="page-header card">
        <div class="header-content">
          <div class="title-section">
            <h1 class="page-title">
              <span class="title-gradient">Admin</span>
              <span class="title-management">Dashboard</span>
            </h1>
            <p class="page-subtitle">Manage items, coupons, and monitor daily operations</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-outline" @click="resetDailyCoupons" :disabled="resetting">
              <i class="fas" :class="resetting ? 'fa-spinner fa-spin' : 'fa-sync-alt'"></i>
              <span>{{ resetting ? 'Resetting...' : 'Reset Daily Coupons' }}</span>
            </button>
            <button class="btn btn-primary" @click="openItemModal()">
              <i class="fas fa-plus"></i>
              <span>Add Item</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-boxes"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalItems }}</span>
            <span class="stat-label">Total Items</span>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-ticket-alt"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalCouponsUsed }}</span>
            <span class="stat-label">Coupons Used Today</span>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-dollar-sign"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">${{ stats.todayRevenue.toLocaleString() }}</span>
            <span class="stat-label">Today's Revenue</span>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-chart-line"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.pendingRequests }}</span>
            <span class="stat-label">Pending Stock Requests</span>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-container card">
        <div class="tabs-nav">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="switchTab(tab.id)"
          >
            <i :class="tab.icon"></i>
            <span>{{ tab.name }}</span>
          </button>
        </div>
      </div>

      <!-- Items Management Tab -->
      <div v-if="activeTab === 'items'" class="tab-content">
        <div class="filters-section card">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              v-model="filters.search" 
              placeholder="Search items by name..."
              class="search-input"
            >
          </div>
          <div class="filter-info">
            <span class="results-count">Showing {{ filteredItems.length }} of {{ items.length }} items</span>
            <button class="btn-icon" @click="resetFilters" title="Reset Filters">
              <i class="fas fa-undo-alt"></i>
            </button>
          </div>
        </div>

        <div class="table-container card">
          <div v-if="loadingItems" class="loading-table">
            <div class="loading-spinner"></div>
          </div>
          <table v-else class="data-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Price</th>
                <th>Default Coupon</th>
                <th>Today's Initial</th>
                <th>Today's Remaining</th>
                <th>Today's Sold</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredItems" :key="item.id" class="data-row">
                <td>
                  <div class="item-info">
                    <div class="item-avatar" :style="{ background: getGradient(item.name) }">
                      {{ item.name.charAt(0) }}
                    </div>
                    <div class="item-name">{{ item.name }}</div>
                  </div>
                </td>
                <td class="price-cell">${{ parseFloat(item.price).toFixed(2) }}</td>
                <td>{{ item.default_coupon }}</td>
                <td>{{ getDailyCoupon(item.id, 'initial') }}</td>
                <td>
                  <div class="coupon-input">
                    <input 
                      type="number" 
                      :value="getDailyCoupon(item.id, 'remaining')"
                      @change="updateRemainingCoupon(item.id, $event)"
                      class="coupon-field"
                    >
                    <span class="coupon-unit">coupons</span>
                  </div>
                </td>
                <td>
                  <span class="sold-badge">{{ getSoldQuantity(item.id) }}</span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-icon" @click="openItemModal(item)" title="Edit Item">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" @click="adjustCoupon(item)" title="Adjust Coupon">
                      <i class="fas fa-adjust"></i>
                    </button>
                    <button class="btn-icon danger" @click="deleteItem(item.id)" title="Delete Item">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Daily Reports Tab -->
      <div v-if="activeTab === 'reports'" class="tab-content">
        <div class="reports-container">
          <div class="date-selector card">
            <div class="date-input-group">
              <label>Select Date:</label>
              <input type="date" v-model="reportDate" @change="loadDailyReport" class="date-input">
            </div>
            <button class="btn btn-primary" @click="exportReport" :disabled="exporting">
              <i class="fas" :class="exporting ? 'fa-spinner fa-spin' : 'fa-download'"></i>
              <span>{{ exporting ? 'Exporting...' : 'Export Report' }}</span>
            </button>
          </div>

          <div v-if="loadingReport" class="loading-container">
            <div class="loading-spinner"></div>
          </div>

          <div v-else>
            <!-- Daily Summary -->
            <div class="report-summary card">
              <h3>Daily Summary - {{ formatDate(reportDate) }}</h3>
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="summary-label">Total Revenue</span>
                  <span class="summary-value">${{ dailyReport.total_revenue?.toLocaleString() || 0 }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Total Items Sold</span>
                  <span class="summary-value">{{ dailyReport.total_items_sold || 0 }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Total Coupons Used</span>
                  <span class="summary-value">{{ dailyReport.total_coupons_used || 0 }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Transactions</span>
                  <span class="summary-value">{{ dailyReport.transaction_count || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- Item Performance -->
            <div class="performance-section card">
              <h3>Item Performance</h3>
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Initial Coupon</th>
                      <th>Remaining</th>
                      <th>Sold</th>
                      <th>Utilization</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in dailyReport.item_performance || []" :key="item.id">
                      <td>{{ item.name }}</td>
                      <td>{{ item.initial_coupon }}</td>
                      <td>{{ item.remaining_coupon }}</td>
                      <td class="sold-cell">{{ item.sold_quantity }}</td>
                      <td>
                        <div class="utilization-bar">
                          <div 
                            class="utilization-fill"
                            :style="{ width: item.utilization + '%', background: getUtilizationColor(item.utilization) }"
                          ></div>
                          <span class="utilization-text">{{ item.utilization }}%</span>
                        </div>
                      </td>
                      <td class="price-cell">${{ parseFloat(item.revenue).toFixed(2) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Fast & Slow Moving Items -->
            <div class="insights-grid">
              <div class="insight-card card">
                <h3>
                  <i class="fas fa-rocket"></i>
                  Fast Moving Items
                </h3>
                <div class="insight-list">
                  <div v-for="item in dailyReport.fast_moving || []" :key="item.id" class="insight-item">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-value">{{ item.sold_quantity }} sold ({{ item.utilization }}%)</span>
                  </div>
                  <div v-if="(!dailyReport.fast_moving || dailyReport.fast_moving.length === 0)" class="empty-state">
                    No data available
                  </div>
                </div>
              </div>

              <div class="insight-card card">
                <h3>
                  <i class="fas fa-turtle"></i>
                  Slow Moving Items
                </h3>
                <div class="insight-list">
                  <div v-for="item in dailyReport.slow_moving || []" :key="item.id" class="insight-item">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-value">{{ item.sold_quantity }} sold ({{ item.utilization }}%)</span>
                  </div>
                  <div v-if="(!dailyReport.slow_moving || dailyReport.slow_moving.length === 0)" class="empty-state">
                    No data available
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stock Requests Tab -->
      <div v-if="activeTab === 'requests'" class="tab-content">
        <div class="requests-container">
          <div class="table-container card">
            <div v-if="loadingRequests" class="loading-table">
              <div class="loading-spinner"></div>
            </div>
            <table v-else class="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Requested Quantity</th>
                  <th>Requested By</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="request in stockRequests" :key="request.id" class="data-row">
                  <td>{{ request.item_name }}</td>
                  <td>{{ request.requested_quantity }}</td>
                  <td>{{ request.requested_by || 'Barista' }}</td>
                  <td>{{ formatDate(request.created_at) }}</td>
                  <td>
                    <span class="status-badge" :class="'status-' + request.status">
                      {{ request.status }}
                    </span>
                  </td>
                  <td v-if="request.status === 'pending'">
                    <div class="action-buttons">
                      <button class="btn-icon success" @click="approveRequest(request.id)" title="Approve">
                        <i class="fas fa-check"></i>
                      </button>
                      <button class="btn-icon danger" @click="rejectRequest(request.id)" title="Reject">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </td>
                  <td v-else>-</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Purchase Recording -->
          <div class="purchase-section card">
            <h3>Record Purchase/Restock</h3>
            <form @submit.prevent="recordPurchase" class="purchase-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Item *</label>
                  <select v-model="purchaseForm.item_id" required class="form-control">
                    <option value="">Select Item</option>
                    <option v-for="item in items" :key="item.id" :value="item.id">
                      {{ item.name }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Quantity *</label>
                  <input type="number" v-model="purchaseForm.quantity" required class="form-control">
                </div>
                <div class="form-group">
                  <label>Total Cost ($) *</label>
                  <input type="number" v-model="purchaseForm.cost" step="0.01" required class="form-control">
                </div>
              </div>
              <button type="submit" class="btn btn-primary" :disabled="recordingPurchase">
                <i class="fas" :class="recordingPurchase ? 'fa-spinner fa-spin' : 'fa-shopping-cart'"></i>
                <span>{{ recordingPurchase ? 'Recording...' : 'Record Purchase' }}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Coupon Transactions Tab -->
      <div v-if="activeTab === 'transactions'" class="tab-content">
        <div class="transactions-container">
          <div class="filters-section card">
            <div class="date-range">
              <input type="date" v-model="transactionFilters.startDate" class="date-input">
              <span>to</span>
              <input type="date" v-model="transactionFilters.endDate" class="date-input">
            </div>
            <select v-model="transactionFilters.type" class="filter-select">
              <option value="">All Types</option>
              <option value="issued">Issued</option>
              <option value="used">Used</option>
              <option value="adjusted">Adjusted</option>
            </select>
            <button class="btn btn-outline" @click="loadTransactions">
              <i class="fas fa-search"></i>
              <span>Filter</span>
            </button>
          </div>

          <div class="table-container card">
            <div v-if="loadingTransactions" class="loading-table">
              <div class="loading-spinner"></div>
            </div>
            <table v-else class="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="transaction in couponTransactions" :key="transaction.id" class="data-row">
                  <td>{{ formatDateTime(transaction.created_at) }}</td>
                  <td>{{ transaction.item_name }}</td>
                  <td>
                    <span class="transaction-badge" :class="'type-' + transaction.type">
                      {{ transaction.type }}
                    </span>
                  </td>
                  <td :class="getTransactionClass(transaction.type)">{{ transaction.quantity }}</td>
                  <td>{{ transaction.user_name }}</td>
                </tr>
                <tr v-if="couponTransactions.length === 0">
                  <td colspan="5" class="empty-state">No transactions found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Item Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content card" @click.stop>
        <div class="modal-header">
          <h2>{{ editingItem ? 'Edit' : 'Add New' }} Item</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <form @submit.prevent="saveItem" class="modal-form">
          <div class="form-group">
            <label>Item Name *</label>
            <input type="text" v-model="itemForm.name" required class="form-control" placeholder="e.g., Beer, Wine, Shiro">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Price *</label>
              <div class="input-wrapper">
                <span class="input-prefix">$</span>
                <input type="number" v-model="itemForm.price" step="0.01" required class="form-control with-prefix">
              </div>
            </div>
            <div class="form-group">
              <label>Default Daily Coupon *</label>
              <input type="number" v-model="itemForm.default_coupon" required class="form-control">
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="closeModal">
              <span>Cancel</span>
            </button>
            <button type="submit" class="btn btn-primary" :disabled="savingItem">
              <i class="fas" :class="savingItem ? 'fa-spinner fa-spin' : (editingItem ? 'fa-save' : 'fa-plus')"></i>
              <span>{{ savingItem ? 'Saving...' : (editingItem ? 'Update' : 'Create') + ' Item' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Coupon Adjustment Modal -->
    <div v-if="showCouponModal" class="modal-overlay" @click="closeCouponModal">
      <div class="modal-content card" @click.stop>
        <div class="modal-header">
          <h2>Adjust Coupons - {{ selectedItem?.name }}</h2>
          <button class="close-btn" @click="closeCouponModal">×</button>
        </div>
        <form @submit.prevent="saveCouponAdjustment" class="modal-form">
          <div class="form-group">
            <label>Adjustment Type</label>
            <select v-model="couponAdjustment.type" required class="form-control">
              <option value="issued">Issue to Waiter</option>
              <option value="adjusted">Manual Adjustment</option>
            </select>
          </div>
          <div class="form-group">
            <label>Quantity</label>
            <input type="number" v-model="couponAdjustment.quantity" required class="form-control">
          </div>
          <div class="form-group" v-if="couponAdjustment.type === 'issued'">
            <label>Assign to User (Waiter)</label>
            <select v-model="couponAdjustment.user_id" required class="form-control">
              <option value="">Select Waiter</option>
              <option v-for="user in waiters" :key="user.id" :value="user.id">
                {{ user.name }}
              </option>
            </select>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" @click="closeCouponModal">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="adjustingCoupon">
              <i class="fas" :class="adjustingCoupon ? 'fa-spinner fa-spin' : 'fa-save'"></i>
              <span>{{ adjustingCoupon ? 'Saving...' : 'Save Adjustment' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Error Toast -->
    <div v-if="errorMessage" class="error-toast">
      <i class="fas fa-exclamation-circle"></i>
      <span>{{ errorMessage }}</span>
      <button @click="errorMessage = ''" class="close-toast">×</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import AdminService from '../../services/admin.service'
import ReportsService from '../../services/reports.service'
import BaristaService from '../../services/barista.service'
import CommonService from '../../services/common.service'

export default {
  name: 'AdminDashboard',
  setup() {
    const activeTab = ref('items')
    const showModal = ref(false)
    const showCouponModal = ref(false)
    const editingItem = ref(null)
    const selectedItem = ref(null)
    const reportDate = ref(new Date().toISOString().split('T')[0])
    const errorMessage = ref('')
    
    // Loading states
    const loading = ref(true)
    const loadingItems = ref(false)
    const loadingReport = ref(false)
    const loadingRequests = ref(false)
    const loadingTransactions = ref(false)
    const savingItem = ref(false)
    const resetting = ref(false)
    const exporting = ref(false)
    const recordingPurchase = ref(false)
    const adjustingCoupon = ref(false)
    
    // Data
    const items = ref([])
    const dailyCouponsData = ref([])
    const stockRequests = ref([])
    const couponTransactions = ref([])
    const waiters = ref([])
    const users = ref([])
    
    // Stats
    const stats = ref({
      totalItems: 0,
      totalCouponsUsed: 0,
      todayRevenue: 0,
      pendingRequests: 0
    })
    
    const dailyReport = ref({
      total_revenue: 0,
      total_items_sold: 0,
      total_coupons_used: 0,
      transaction_count: 0,
      item_performance: [],
      fast_moving: [],
      slow_moving: []
    })
    
    const filters = ref({
      search: ''
    })
    
    const transactionFilters = ref({
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      type: ''
    })
    
    const itemForm = ref({
      name: '',
      price: 0,
      default_coupon: 100
    })
    
    const purchaseForm = ref({
      item_id: '',
      quantity: 0,
      cost: 0
    })
    
    const couponAdjustment = ref({
      type: 'issued',
      quantity: 0,
      user_id: ''
    })
    
    const tabs = ref([
      { id: 'items', name: 'Items Management', icon: 'fas fa-boxes' },
      { id: 'reports', name: 'Daily Reports', icon: 'fas fa-chart-bar' },
      { id: 'requests', name: 'Stock Requests', icon: 'fas fa-clipboard-list' },
      { id: 'transactions', name: 'Coupon Transactions', icon: 'fas fa-receipt' }
    ])
    
    // Computed
    const filteredItems = computed(() => {
      return items.value.filter(item => 
        filters.value.search === '' || 
        item.name.toLowerCase().includes(filters.value.search.toLowerCase())
      )
    })
    
    const getGradient = (name) => {
      const gradients = [
        'linear-gradient(135deg, #EFCA71, #F2E9C6)',
        'linear-gradient(135deg, #F2E9C6, #EFCA71)',
        'linear-gradient(135deg, #EFCA71, #E5B95C)'
      ]
      return gradients[name.charCodeAt(0) % gradients.length]
    }
    
    const getDailyCoupon = (itemId, type) => {
      const daily = dailyCouponsData.value.find(dc => dc.item_id === itemId)
      if (type === 'initial') return daily ? daily.initial_coupon : 0
      return daily ? daily.remaining_coupon : 0
    }
    
    const getSoldQuantity = (itemId) => {
      const daily = dailyCouponsData.value.find(dc => dc.item_id === itemId)
      return daily ? daily.sold_quantity || 0 : 0
    }
    
    // API Calls
    const loadAllData = async () => {
      loading.value = true
      try {
        await Promise.all([
          loadItems(),
          loadDailyCoupons(),
          loadStockRequests(),
          loadWaiters(),
          loadStats()
        ])
      } catch (error) {
        errorMessage.value = error.detail || 'Failed to load dashboard data'
      } finally {
        loading.value = false
      }
    }
    
    const loadItems = async () => {
      loadingItems.value = true
      try {
        const response = await AdminService.getItems()
        items.value = response.items || response
      } catch (error) {
        errorMessage.value = error.detail || 'Failed to load items'
        throw error
      } finally {
        loadingItems.value = false
      }
    }
    
    const loadDailyCoupons = async () => {
      try {
        const response = await AdminService.getDailyCoupons()
        dailyCouponsData.value = response.daily_coupons || response || []
      } catch (error) {
        console.error('Failed to load daily coupons:', error)
        dailyCouponsData.value = []
      }
    }
    
    const loadStockRequests = async () => {
      loadingRequests.value = true
      try {
        const response = await AdminService.getBaristaRequests('pending')
        stockRequests.value = response.requests || response || []
      } catch (error) {
        errorMessage.value = error.detail || 'Failed to load stock requests'
      } finally {
        loadingRequests.value = false
      }
    }
    
    const loadWaiters = async () => {
      try {
        const response = await AdminService.getUsers()
        waiters.value = (response.users || response).filter(u => u.role === 'barista')
      } catch (error) {
        console.error('Failed to load waiters:', error)
        waiters.value = []
      }
    }
    
    const loadStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const report = await ReportsService.getDailyReport(today)
        
        stats.value = {
          totalItems: items.value.length,
          totalCouponsUsed: report.total_coupons_used || 0,
          todayRevenue: report.total_revenue || 0,
          pendingRequests: stockRequests.value.filter(r => r.status === 'pending').length
        }
      } catch (error) {
        console.error('Failed to load stats:', error)
      }
    }
    
    const loadDailyReport = async () => {
      loadingReport.value = true
      try {
        const response = await ReportsService.getDailyReport(reportDate.value)
        dailyReport.value = response
      } catch (error) {
        errorMessage.value = error.detail || 'Failed to load daily report'
      } finally {
        loadingReport.value = false
      }
    }
    
    const loadTransactions = async () => {
      loadingTransactions.value = true
      try {
        const response = await ReportsService.getCouponUsage(
          transactionFilters.value.startDate,
          transactionFilters.value.endDate
        )
        couponTransactions.value = response.transactions || response || []
      } catch (error) {
        errorMessage.value = error.detail || 'Failed to load transactions'
      } finally {
        loadingTransactions.value = false
      }
    }
    
    const saveItem = async () => {
      savingItem.value = true
      try {
        if (editingItem.value) {
          await AdminService.updateItem(editingItem.value.id, itemForm.value)
        } else {
          await AdminService.createItem(itemForm.value)
        }
        await loadItems()
        closeModal()
      } catch (error) {
        errorMessage.value = error.detail || 'Failed to save item'
      } finally {
        savingItem.value = false
      }
    }
    
    const deleteItem = async (id) => {
      if (!confirm('Are you sure you want to delete this item? This will affect all related records.')) return
      
      try {
        await AdminService.deleteItem(id)
        await loadItems()
        await loadDailyCoupons()
      } catch (error) {
        errorMessage.value = error.detail || 'Failed to delete item'
      }
    }
    
    const resetDailyCoupons = async () => {
      if (!confirm('Reset all daily coupons to default values?')) return
      
      resetting.value = true
      try {
        await AdminService.resetDailyCoupons()
        await loadDailyCoupons()
        await loadStats()
        errorMessage.value = 'Daily coupons reset successfully'
        setTimeout(() => errorMessage.value = '', 3000)
      } catch (error) {
        errorMessage.value = error.detail || 'Failed to reset coupons'
      } finally {
        resetting.value = false
      }
    }
    
    const updateRemainingCoupon = async (itemId, event) => {
      const newRemaining = parseInt(event.target.value)
      // This would need a dedicated endpoint to update remaining coupons
      // For now, just update local state
      const daily = dailyCouponsData.value.find(dc => dc.item_id === itemId)
      if (daily) {
        daily.remaining_coupon = newRemaining
        daily.sold_quantity = daily.initial_coupon - newRemaining
      }
    }
    
    const saveCouponAdjustment = async () => {
      adjustingCoupon.value = true
      try {
        await BaristaService.distributeCoupons({
          item_id: selectedItem.value.id,
          quantity: couponAdjustment.value.quantity,
          assigned_to: couponAdjustment.value.user_id || null,
          notes: `Admin adjustment: ${couponAdjustment.value.type}`
        })
        await loadDailyCoupons()
        await loadTransactions()
        closeCouponModal()
      } catch (error) {
        errorMessage.value = error.detail || 'Failed to adjust coupons'
      } finally {
        adjustingCoupon.value = false
      }
    }
    
    const approveRequest = async (requestId) => {
      try {
        await AdminService.updateBaristaRequest(requestId, {
          status: 'approved',
          admin_response: 'Approved by admin'
        })
        await loadStockRequests()
        await loadStats()
      } catch (error) {
        errorMessage.value = error.detail || 'Failed to approve request'
      }
    }
    
    const rejectRequest = async (requestId) => {
      try {
        await AdminService.updateBaristaRequest(requestId, {
          status: 'rejected',
          admin_response: 'Rejected by admin'
        })
        await loadStockRequests()
      } catch (error) {
        errorMessage.value = error.detail || 'Failed to reject request'
      }
    }
    
    const recordPurchase = async () => {
      recordingPurchase.value = true
      try {
        const selectedItem = items.value.find(i => i.id === purchaseForm.value.item_id)
        await AdminService.createPurchase({
          item_name: selectedItem?.name,
          quantity: purchaseForm.value.quantity,
          cost: purchaseForm.value.cost
        })
        purchaseForm.value = { item_id: '', quantity: 0, cost: 0 }
        errorMessage.value = 'Purchase recorded successfully'
        setTimeout(() => errorMessage.value = '', 3000)
      } catch (error) {
        errorMessage.value = error.detail || 'Failed to record purchase'
      } finally {
        recordingPurchase.value = false
      }
    }
    
    const exportReport = async () => {
      exporting.value = true
      try {
        const report = await ReportsService.getDailyReport(reportDate.value)
        const csv = convertToCSV(report.item_performance || [])
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `daily_report_${reportDate.value}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      } catch (error) {
        errorMessage.value = error.detail || 'Failed to export report'
      } finally {
        exporting.value = false
      }
    }
    
    const convertToCSV = (data) => {
      if (!data.length) return ''
      const headers = Object.keys(data[0])
      const rows = data.map(obj => headers.map(header => JSON.stringify(obj[header] || '')).join(','))
      return [headers.join(','), ...rows].join('\n')
    }
    
    const switchTab = (tabId) => {
      activeTab.value = tabId
      if (tabId === 'reports') loadDailyReport()
      if (tabId === 'transactions') loadTransactions()
    }
    
    const openItemModal = (item = null) => {
      if (item) {
        editingItem.value = item
        itemForm.value = { ...item }
      } else {
        editingItem.value = null
        itemForm.value = {
          name: '',
          price: 0,
          default_coupon: 100
        }
      }
      showModal.value = true
    }
    
    const adjustCoupon = (item) => {
      selectedItem.value = item
      couponAdjustment.value = { type: 'issued', quantity: 0, user_id: '' }
      showCouponModal.value = true
    }
    
    const closeModal = () => {
      showModal.value = false
      editingItem.value = null
    }
    
    const closeCouponModal = () => {
      showCouponModal.value = false
      selectedItem.value = null
    }
    
    const resetFilters = () => {
      filters.value.search = ''
    }
    
    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleDateString()
    }
    
    const formatDateTime = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleString()
    }
    
    const getUtilizationColor = (utilization) => {
      if (utilization >= 80) return '#88B788'
      if (utilization >= 50) return '#EFCA71'
      return '#C45A5A'
    }
    
    const getTransactionClass = (type) => {
      if (type === 'used') return 'text-danger'
      if (type === 'issued') return 'text-warning'
      return 'text-info'
    }
    
    // Watch for date changes
    watch(reportDate, () => {
      loadDailyReport()
    })
    
    onMounted(() => {
      loadAllData()
      loadDailyReport()
    })
    
    return {
      activeTab,
      tabs,
      filters,
      transactionFilters,
      showModal,
      showCouponModal,
      editingItem,
      selectedItem,
      reportDate,
      loading,
      loadingItems,
      loadingReport,
      loadingRequests,
      loadingTransactions,
      savingItem,
      resetting,
      exporting,
      recordingPurchase,
      adjustingCoupon,
      errorMessage,
      items,
      dailyCouponsData,
      stockRequests,
      couponTransactions,
      waiters,
      stats,
      dailyReport,
      itemForm,
      purchaseForm,
      couponAdjustment,
      filteredItems,
      getGradient,
      getDailyCoupon,
      getSoldQuantity,
      saveItem,
      deleteItem,
      resetDailyCoupons,
      updateRemainingCoupon,
      saveCouponAdjustment,
      approveRequest,
      rejectRequest,
      recordPurchase,
      exportReport,
      switchTab,
      openItemModal,
      adjustCoupon,
      closeModal,
      closeCouponModal,
      resetFilters,
      formatDate,
      formatDateTime,
      getUtilizationColor,
      getTransactionClass,
      loadTransactions
    }
  }
}
</script>



<style scoped>
/* Same styling as before with minor additions */
.admin-dashboard {
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
}


/* ==============================================
   PREMIUM WARM GOLD THEME - NO REFLECTING EFFECTS
   ============================================== */

.products-page {
  padding: 30px;
  min-height: 100vh;
  position: relative;
  background: #F9F7EB;
  color: #332F2E;
}

/* Premium Card Component */
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
  padding: 24px 30px;
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
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
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

.stat-trend {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #F9F7EB;
}

.stat-trend.up {
  color: #88B788;
}

.stat-trend.down {
  color: #C45A5A;
}

/* Filters Section */
.filters-section {
  padding: 20px 24px;
  margin-bottom: 30px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  flex: 2;
  min-width: 300px;
  position: relative;
}

.search-box i {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #8C8C90;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  border-radius: 12px;
  border: 1px solid #E5E5E2;
  background: #FFFFFF;
  color: #332F2E;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #EFCA71;
  box-shadow: 0 0 0 3px rgba(239, 202, 113, 0.1);
}

.search-input::placeholder {
  color: #8C8C90;
}

.clear-search {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #8C8C90;
  cursor: pointer;
  padding: 4px;
}

.clear-search:hover {
  color: #332F2E;
}

.filter-group {
  display: flex;
  gap: 12px;
  flex: 1;
  min-width: 300px;
}

.filter-select {
  flex: 1;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #E5E5E2;
  background: #FFFFFF;
  color: #332F2E;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23332F2E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 48px;
}

.filter-select:focus {
  outline: none;
  border-color: #EFCA71;
  box-shadow: 0 0 0 3px rgba(239, 202, 113, 0.1);
}

.filter-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px;
}

.results-count {
  color: #6F6C6D;
  font-size: 0.9rem;
  white-space: nowrap;
}

/* Table Container */
.table-container {
  overflow: auto;
  border-radius: 20px;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

.products-table th {
  text-align: left;
  padding: 20px 24px;
  background: #F9F7EB;
  font-weight: 600;
  font-size: 0.9rem;
  color: #6F6C6D;
  border-bottom: 1px solid #E5E5E2;
}

.products-table td {
  padding: 16px 24px;
  border-bottom: 1px solid #E5E5E2;
  color: #332F2E;
}

.product-row {
  transition: background 0.3s ease;
}

.product-row:hover {
  background: rgba(239, 202, 113, 0.05);
}

/* Product Info */
.product-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.product-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #332F2E;
  font-weight: 600;
  font-size: 1.2rem;
}

.product-name {
  font-weight: 600;
  margin-bottom: 4px;
  color: #332F2E;
}

.product-sku {
  font-size: 0.8rem;
  color: #6F6C6D;
}

/* Category Badge */
.category-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Price Cell */
.price-cell {
  font-weight: 600;
  color: #EFCA71;
}

/* Stock Indicator */
.stock-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 120px;
}

.stock-bar {
  flex: 1;
  height: 6px;
  background: #E5E5E2;
  border-radius: 3px;
  overflow: hidden;
}

.stock-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.stock-value {
  font-weight: 600;
  min-width: 30px;
  text-align: right;
}

.stock-good {
  color: #EFCA71;
}

.stock-low {
  color: #EFCA71;
}

.stock-out {
  color: #C45A5A;
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-active {
  background: rgba(239, 202, 113, 0.1);
  color: #332F2E;
}

.status-low {
  background: rgba(239, 202, 113, 0.15);
  color: #332F2E;
}

.status-out {
  background: rgba(196, 90, 90, 0.1);
  color: #C45A5A;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #E5E5E2;
  background: #FFFFFF;
  color: #6F6C6D;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.btn-icon:hover {
  background: #F9F7EB;
  color: #332F2E;
  border-color: #EFCA71;
}

.btn-icon.danger:hover {
  color: #C45A5A;
  border-color: #C45A5A;
}

/* Buttons */
.btn {
  padding: 14px 28px;
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

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(239, 202, 113, 0.3);
}

.btn-outline {
  background: transparent;
  border: 1px solid #E5E5E2;
  color: #332F2E;
}

.btn-outline:hover {
  background: #F9F7EB;
  border-color: #EFCA71;
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
  padding: 32px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E5E5E2;
}

.modal-header h2 {
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin: 0;
}

.close-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #E5E5E2;
  background: #FFFFFF;
  color: #6F6C6D;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #F9F7EB;
  color: #332F2E;
  border-color: #EFCA71;
}

/* Form Styles */
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  font-size: 0.9rem;
  font-weight: 500;
  color: #6F6C6D;
}

.form-control {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #E5E5E2;
  background: #FFFFFF;
  color: #332F2E;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #EFCA71;
  box-shadow: 0 0 0 3px rgba(239, 202, 113, 0.1);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-prefix {
  position: absolute;
  left: 16px;
  color: #8C8C90;
  z-index: 2;
}

.form-control.with-prefix {
  padding-left: 32px;
}

textarea.form-control {
  resize: vertical;
  min-height: 100px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E5E5E2;
}

/* Animations - Simple fade only */
@keyframes fadeIn {
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.fade-in {
  animation: fadeIn 0.4s ease-out;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .products-page {
    padding: 20px;
  }
  
  .page-header {
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
  
  .filters-section {
    flex-direction: column;
  }
  
  .filter-group {
    flex-direction: column;
    width: 100%;
  }
  
  .filter-info {
    justify-content: space-between;
    width: 100%;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    padding: 24px;
  }
}

@media (max-width: 480px) {
  .products-page {
    padding: 16px;
  }
  
  .page-header {
    padding: 16px;
  }
  
  .btn {
    padding: 12px 20px;
  }
  
  .product-info {
    flex-direction: column;
    text-align: center;
  }
}
</style>