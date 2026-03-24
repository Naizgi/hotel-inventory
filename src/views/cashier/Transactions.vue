<template>
  <div class="transactions">
    <div class="page-header">
      <h1 class="page-title">Transaction History</h1>
      <div class="header-actions">
        <button class="btn-secondary" @click="exportTransactions">
          <i class="fas fa-download"></i> Export
        </button>
        <button class="btn-secondary" @click="printReport">
          <i class="fas fa-print"></i> Print
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-info">
          <h3>{{ formatCurrency(totalRevenue) }}</h3>
          <p>Total Revenue</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-ticket-alt"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalCoupons }}</h3>
          <p>Coupons Used</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalTransactions }}</h3>
          <p>Transactions</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-chart-bar"></i>
        </div>
        <div class="stat-info">
          <h3>{{ formatCurrency(averageTransaction) }}</h3>
          <p>Average Transaction</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search by transaction ID or items..."
        >
      </div>
      <div class="date-range">
        <input type="date" v-model="dateFrom">
        <span>to</span>
        <input type="date" v-model="dateTo">
      </div>
      <div class="payment-filter">
        <select v-model="paymentMethod">
          <option value="">All Payment Methods</option>
          <option value="Cash">Cash</option>
          <option value="TeleBirr">TeleBirr</option>
          <option value="CBE Birr">CBE Birr</option>
          <option value="Card">Card</option>
        </select>
      </div>
      <button class="btn-secondary" @click="resetFilters">
        <i class="fas fa-redo"></i> Reset
      </button>
    </div>

    <!-- Transactions Table -->
    <div class="transactions-table-container">
      <table class="transactions-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Date & Time</th>
            <th>Items</th>
            <th>Coupons</th>
            <th>Subtotal</th>
            <th>Tax</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="transaction in filteredTransactions" :key="transaction.id">
            <td>#{{ transaction.id }}</td>
            <td>{{ formatDateTime(transaction.date) }}</td>
            <td>
              <div class="items-list">
                <span v-for="(item, idx) in transaction.items.slice(0, 2)" :key="idx">
                  {{ item.quantity }}x {{ item.name }}
                </span>
                <span v-if="transaction.items.length > 2" class="more-items">
                  +{{ transaction.items.length - 2 }} more
                </span>
              </div>
            </td>
            <td>{{ transaction.coupons }}</td>
            <td>{{ formatCurrency(transaction.subtotal) }}</td>
            <td>{{ formatCurrency(transaction.tax) }}</td>
            <td class="total-amount">{{ formatCurrency(transaction.total) }}</td>
            <td>
              <span :class="['payment-badge', transaction.paymentMethod.toLowerCase()]">
                <i :class="getPaymentIcon(transaction.paymentMethod)"></i>
                {{ transaction.paymentMethod }}
              </span>
            </td>
            <td>
              <span :class="['status-badge', transaction.status]">
                {{ transaction.status }}
              </span>
            </td>
            <td class="actions">
              <button class="btn-icon" @click="viewDetails(transaction)" title="View Details">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn-icon" @click="printReceipt(transaction)" title="Print Receipt">
                <i class="fas fa-print"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <button @click="currentPage--" :disabled="currentPage === 1">
        <i class="fas fa-chevron-left"></i>
      </button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="currentPage++" :disabled="currentPage === totalPages">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- Transaction Details Modal -->
    <div v-if="showDetailsModal" class="modal" @click.self="closeDetailsModal">
      <div class="modal-content receipt">
        <div class="receipt-header">
          <h2>Eyob Bar & Restaurant</h2>
          <p>Transaction #{{ selectedTransaction?.id }}</p>
          <p>{{ formatDateTime(selectedTransaction?.date) }}</p>
        </div>
        <div class="receipt-items">
          <div v-for="item in selectedTransaction?.items" :key="item.name" class="receipt-item">
            <span>{{ item.name }} x {{ item.quantity }}</span>
            <span>{{ formatCurrency(item.price * item.quantity) }}</span>
          </div>
        </div>
        <div class="receipt-summary">
          <div class="receipt-row">
            <span>Subtotal:</span>
            <span>{{ formatCurrency(selectedTransaction?.subtotal) }}</span>
          </div>
          <div class="receipt-row">
            <span>Tax (15%):</span>
            <span>{{ formatCurrency(selectedTransaction?.tax) }}</span>
          </div>
          <div class="receipt-row total">
            <span>Total:</span>
            <span>{{ formatCurrency(selectedTransaction?.total) }}</span>
          </div>
          <div class="receipt-row">
            <span>Payment:</span>
            <span>{{ selectedTransaction?.paymentMethod }}</span>
          </div>
          <div v-if="selectedTransaction?.change" class="receipt-row">
            <span>Change:</span>
            <span>{{ formatCurrency(selectedTransaction?.change) }}</span>
          </div>
          <div class="receipt-row">
            <span>Coupons Used:</span>
            <span>{{ selectedTransaction?.coupons }}</span>
          </div>
        </div>
        <div class="receipt-footer">
          <p>Thank you for your business!</p>
          <button class="btn-primary" @click="printReceipt(selectedTransaction)">
            <i class="fas fa-print"></i> Print Receipt
          </button>
          <button class="btn-secondary" @click="closeDetailsModal">Close</button>
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
import { useToast } from 'vue-toastification'

export default {
  name: 'CashierTransactions',
  setup() {
    const toast = useToast()
    const searchQuery = ref('')
    const dateFrom = ref('')
    const dateTo = ref('')
    const paymentMethod = ref('')
    const currentPage = ref(1)
    const itemsPerPage = ref(10)
    const showDetailsModal = ref(false)
    const selectedTransaction = ref(null)
    const showToast = ref(false)
    const toastMessage = ref('')
    
    const transactions = ref([
      { 
        id: 1001, 
        date: '2024-03-15T14:30:00', 
        items: [
          { name: 'Beer', quantity: 2, price: 60 },
          { name: 'Shiro', quantity: 1, price: 80 }
        ],
        coupons: 3,
        subtotal: 200,
        tax: 30,
        total: 230,
        paymentMethod: 'Cash',
        change: 20,
        status: 'completed'
      },
      { 
        id: 1002, 
        date: '2024-03-15T13:45:00', 
        items: [
          { name: 'Wine', quantity: 1, price: 150 },
          { name: 'Tibs', quantity: 1, price: 120 }
        ],
        coupons: 2,
        subtotal: 270,
        tax: 40.5,
        total: 310.5,
        paymentMethod: 'TeleBirr',
        change: 0,
        status: 'completed'
      },
      { 
        id: 1003, 
        date: '2024-03-15T12:15:00', 
        items: [
          { name: 'Beer', quantity: 3, price: 60 },
          { name: 'Shiro', quantity: 2, price: 80 }
        ],
        coupons: 5,
        subtotal: 340,
        tax: 51,
        total: 391,
        paymentMethod: 'CBE Birr',
        change: 0,
        status: 'completed'
      },
      { 
        id: 1004, 
        date: '2024-03-14T18:30:00', 
        items: [
          { name: 'Whiskey', quantity: 2, price: 200 },
          { name: 'Cocktail', quantity: 1, price: 180 }
        ],
        coupons: 3,
        subtotal: 580,
        tax: 87,
        total: 667,
        paymentMethod: 'Card',
        change: 0,
        status: 'completed'
      },
      { 
        id: 1005, 
        date: '2024-03-14T12:00:00', 
        items: [
          { name: 'Kitfo', quantity: 1, price: 150 },
          { name: 'Pasta', quantity: 1, price: 100 }
        ],
        coupons: 2,
        subtotal: 250,
        tax: 37.5,
        total: 287.5,
        paymentMethod: 'Cash',
        change: 12.5,
        status: 'completed'
      }
    ])
    
    const totalRevenue = computed(() => {
      return filteredTransactions.value.reduce((sum, t) => sum + t.total, 0)
    })
    
    const totalCoupons = computed(() => {
      return filteredTransactions.value.reduce((sum, t) => sum + t.coupons, 0)
    })
    
    const totalTransactions = computed(() => {
      return filteredTransactions.value.length
    })
    
    const averageTransaction = computed(() => {
      if (totalTransactions.value === 0) return 0
      return totalRevenue.value / totalTransactions.value
    })
    
    const filteredTransactions = computed(() => {
      let filtered = transactions.value
      
      if (searchQuery.value) {
        filtered = filtered.filter(t => 
          t.id.toString().includes(searchQuery.value) ||
          t.items.some(i => i.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
        )
      }
      
      if (dateFrom.value) {
        filtered = filtered.filter(t => t.date >= dateFrom.value)
      }
      
      if (dateTo.value) {
        filtered = filtered.filter(t => t.date <= `${dateTo.value}T23:59:59`)
      }
      
      if (paymentMethod.value) {
        filtered = filtered.filter(t => t.paymentMethod === paymentMethod.value)
      }
      
      return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
    })
    
    const totalPages = computed(() => {
      return Math.ceil(filteredTransactions.value.length / itemsPerPage.value)
    })
    
    const paginatedTransactions = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return filteredTransactions.value.slice(start, end)
    })
    
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB'
      }).format(value)
    }
    
    const formatDateTime = (dateTime) => {
      const date = new Date(dateTime)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
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
    
    const viewDetails = (transaction) => {
      selectedTransaction.value = transaction
      showDetailsModal.value = true
    }
    
    const closeDetailsModal = () => {
      showDetailsModal.value = false
      selectedTransaction.value = null
    }
    
    const printReceipt = (transaction) => {
      selectedTransaction.value = transaction
      showSuccessToast('Receipt sent to printer')
      // Implement actual printing logic
    }
    
    const exportTransactions = () => {
      showSuccessToast('Exporting transactions...')
      // Implement export logic
    }
    
    const printReport = () => {
      window.print()
    }
    
    const resetFilters = () => {
      searchQuery.value = ''
      dateFrom.value = ''
      dateTo.value = ''
      paymentMethod.value = ''
      currentPage.value = 1
    }
    
    const showSuccessToast = (message) => {
      toastMessage.value = message
      showToast.value = true
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    }
    
    onMounted(() => {
      // Fetch transactions from API
      // fetchTransactions()
    })
    
    return {
      searchQuery,
      dateFrom,
      dateTo,
      paymentMethod,
      currentPage,
      transactions: paginatedTransactions,
      totalRevenue,
      totalCoupons,
      totalTransactions,
      averageTransaction,
      totalPages,
      showDetailsModal,
      selectedTransaction,
      showToast,
      toastMessage,
      formatCurrency,
      formatDateTime,
      getPaymentIcon,
      viewDetails,
      closeDetailsModal,
      printReceipt,
      exportTransactions,
      printReport,
      resetFilters
    }
  }
}
</script>

<style scoped>
.transactions {
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
}

.date-range input {
  padding: 10px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 14px;
}

.payment-filter select {
  padding: 10px 24px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  background: white;
  cursor: pointer;
}

.transactions-table-container {
  background: white;
  border-radius: 16px;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
}

.transactions-table th {
  text-align: left;
  padding: 16px;
  background: #F9F7EB;
  color: #332F2E;
  font-weight: 600;
  border-bottom: 1px solid #E5E5E2;
}

.transactions-table td {
  padding: 16px;
  border-bottom: 1px solid #F0F0F0;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
}

.more-items {
  color: #EFCA71;
  font-size: 11px;
}

.total-amount {
  font-weight: 600;
  color: #EFCA71;
}

.payment-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
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

.actions {
  display: flex;
  gap: 8px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid #E5E5E2;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination button:hover:not(:disabled) {
  background: #F9F7EB;
  border-color: #EFCA71;
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

@media (max-width: 768px) {
  .transactions {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .date-range {
    flex-direction: column;
    align-items: stretch;
  }
  
  .transactions-table {
    font-size: 12px;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>