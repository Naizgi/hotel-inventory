<template>
  <div class="stock-movements">
    <div class="page-header">
      <h1 class="page-title">Stock Movements Report</h1>
      <div class="header-actions">
        <button class="btn-secondary" @click="exportReport">
          <i class="fas fa-download"></i> Export CSV
        </button>
        <button class="btn-primary" @click="refreshReport">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon total-in">
          <i class="fas fa-arrow-down"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalIn }}</h3>
          <p>Total Stock In</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total-out">
          <i class="fas fa-arrow-up"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalOut }}</h3>
          <p>Total Stock Out</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon net-change">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-info">
          <h3 :class="{ positive: netChange > 0, negative: netChange < 0 }">
            {{ netChange > 0 ? '+' : '' }}{{ netChange }}
          </h3>
          <p>Net Change</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total-movements">
          <i class="fas fa-exchange-alt"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalMovements }}</h3>
          <p>Total Movements</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filters">
        <div class="filter-group">
          <label>Date Range</label>
          <div class="date-range">
            <input type="date" v-model="fromDate" class="date-input">
            <span>to</span>
            <input type="date" v-model="toDate" class="date-input">
          </div>
        </div>
        <div class="filter-group">
          <label>Movement Type</label>
          <select v-model="movementTypeFilter" class="filter-select">
            <option value="">All Types</option>
            <option value="purchase">Purchase</option>
            <option value="transfer_out">Transfer Out</option>
            <option value="transfer_in">Transfer In</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Item</label>
          <select v-model="itemFilter" class="filter-select">
            <option value="">All Items</option>
            <option v-for="item in items" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label>Search</label>
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input v-model="searchQuery" placeholder="Search notes...">
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading movements...</p>
    </div>

    <!-- Movements Table -->
    <div v-else class="movements-table-container">
      <table class="movements-table">
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Item</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Source</th>
            <th>Destination</th>
            <th>Performed By</th>
            <th>Reference ID</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="movement in filteredMovements" :key="movement.id">
            <td class="date-cell">{{ formatDateTime(movement.created_at) }}</td>
            <td>
              <div class="item-info">
                <div class="item-icon-small" :style="{ background: getItemColor(movement.item_id) }">
                  <i :class="getItemIcon(movement.item_id)"></i>
                </div>
                <span>{{ movement.item_name }}</span>
              </div>
            </td>
            <td>
              <span :class="['movement-badge', movement.movement_type]">
                {{ formatMovementType(movement.movement_type) }}
              </span>
            </td>
            <td :class="{ 'positive': movement.quantity > 0, 'negative': movement.quantity < 0 }">
              {{ movement.quantity > 0 ? '+' : '' }}{{ movement.quantity }}
            </td>
            <td>{{ movement.source || '-' }}</td>
            <td>{{ movement.destination || '-' }}</td>
            <td>{{ movement.performed_by }}</td>
            <td class="reference-cell">{{ movement.reference_id || '-' }}</td>
            <td class="notes-cell" :title="movement.notes">{{ movement.notes || '-' }}</td>
          </tr>
          <tr v-if="filteredMovements.length === 0">
            <td colspan="9" class="empty-state">No stock movements found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="page-btn" @click="currentPage = 1" :disabled="currentPage === 1">
        <i class="fas fa-angle-double-left"></i>
      </button>
      <button class="page-btn" @click="currentPage--" :disabled="currentPage === 1">
        <i class="fas fa-angle-left"></i>
      </button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button class="page-btn" @click="currentPage++" :disabled="currentPage === totalPages">
        <i class="fas fa-angle-right"></i>
      </button>
      <button class="page-btn" @click="currentPage = totalPages" :disabled="currentPage === totalPages">
        <i class="fas fa-angle-double-right"></i>
      </button>
    </div>

    <!-- Toast Notification -->
    <div v-if="toastMessage" class="toast" :class="toastType">
      <i :class="toastIcon"></i>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'StockMovementsReport',
  setup() {
    // State
    const loading = ref(true)
    const movements = ref([])
    const items = ref([])
    const itemDetails = ref({})
    const fromDate = ref('')
    const toDate = ref('')
    const movementTypeFilter = ref('')
    const itemFilter = ref('')
    const searchQuery = ref('')
    const currentPage = ref(1)
    const itemsPerPage = 50
    
    // Toast state
    const toastMessage = ref('')
    const toastType = ref('success')
    
    const toastIcon = computed(() => {
      return toastType.value === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'
    })
    
    // Computed stats
    const totalIn = computed(() => {
      return movements.value
        .filter(m => m.quantity > 0)
        .reduce((sum, m) => sum + m.quantity, 0)
    })
    
    const totalOut = computed(() => {
      return movements.value
        .filter(m => m.quantity < 0)
        .reduce((sum, m) => sum + Math.abs(m.quantity), 0)
    })
    
    const netChange = computed(() => totalIn.value - totalOut.value)
    
    const totalMovements = computed(() => movements.value.length)
    
    // Filtered movements
    const filteredMovementsRaw = computed(() => {
      let filtered = movements.value
      
      if (fromDate.value) {
        filtered = filtered.filter(m => m.created_at >= fromDate.value)
      }
      
      if (toDate.value) {
        filtered = filtered.filter(m => m.created_at <= toDate.value)
      }
      
      if (movementTypeFilter.value) {
        filtered = filtered.filter(m => m.movement_type === movementTypeFilter.value)
      }
      
      if (itemFilter.value) {
        filtered = filtered.filter(m => m.item_id === parseInt(itemFilter.value))
      }
      
      if (searchQuery.value) {
        filtered = filtered.filter(m => 
          m.notes?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          m.item_name?.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }
      
      return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    })
    
    // Pagination
    const totalPages = computed(() => Math.ceil(filteredMovementsRaw.value.length / itemsPerPage))
    
    const filteredMovements = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredMovementsRaw.value.slice(start, end)
    })
    
    const getAuthHeaders = () => {
      const token = localStorage.getItem('authToken')
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
    
    const showToastMessage = (message, type = 'success') => {
      toastMessage.value = message
      toastType.value = type
      setTimeout(() => {
        toastMessage.value = ''
      }, 3000)
    }
    
    const formatDateTime = (dateTime) => {
      if (!dateTime) return '-'
      const date = new Date(dateTime)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    const formatMovementType = (type) => {
      const types = {
        purchase: 'Purchase',
        transfer_out: 'Transfer Out',
        transfer_in: 'Transfer In',
        adjustment: 'Adjustment',
        waste: 'Waste',
        sale: 'Sale'
      }
      return types[type] || type
    }
    
    const getItemColor = (itemId) => {
      return itemDetails.value[itemId]?.color || '#EFCA71'
    }
    
    const getItemIcon = (itemId) => {
      return itemDetails.value[itemId]?.icon || 'fas fa-cube'
    }
    
    const fetchMovements = async () => {
      try {
        let url = '/api/admin/stock-movements?limit=1000'
        if (fromDate.value) url += `&from_date=${fromDate.value}`
        if (toDate.value) url += `&to_date=${toDate.value}`
        if (itemFilter.value) url += `&item_id=${itemFilter.value}`
        if (movementTypeFilter.value) url += `&movement_type=${movementTypeFilter.value}`
        
        const response = await fetch(url, {
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const data = await response.json()
          movements.value = Array.isArray(data) ? data : []
        }
      } catch (error) {
        console.error('Error fetching movements:', error)
        showToastMessage('Failed to load stock movements', 'error')
      }
    }
    
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/admin/items', {
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const data = await response.json()
          items.value = Array.isArray(data) ? data : []
          items.value.forEach(item => {
            itemDetails.value[item.id] = {
              icon: item.icon,
              color: item.color
            }
          })
        }
      } catch (error) {
        console.error('Error fetching items:', error)
      }
    }
    
    const refreshReport = async () => {
      loading.value = true
      await Promise.all([fetchMovements(), fetchItems()])
      loading.value = false
      currentPage.value = 1
      showToastMessage('Report refreshed')
    }
    
    const exportReport = () => {
      try {
        const data = filteredMovementsRaw.value.map(m => ({
          'Date': formatDateTime(m.created_at),
          'Item': m.item_name,
          'Type': formatMovementType(m.movement_type),
          'Quantity': m.quantity,
          'Source': m.source || '',
          'Destination': m.destination || '',
          'Performed By': m.performed_by,
          'Reference ID': m.reference_id || '',
          'Notes': m.notes || ''
        }))
        
        const headers = Object.keys(data[0] || {})
        const csvRows = []
        
        csvRows.push(headers.join(','))
        
        for (const row of data) {
          const values = headers.map(header => {
            const value = row[header]?.toString() || ''
            return `"${value.replace(/"/g, '""')}"`
          })
          csvRows.push(values.join(','))
        }
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `stock_movements_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        showToastMessage('Report exported successfully')
      } catch (error) {
        console.error('Error exporting report:', error)
        showToastMessage('Failed to export report', 'error')
      }
    }
    
    // Watch for filter changes
    const applyFilters = () => {
      currentPage.value = 1
      fetchMovements()
    }
    
    onMounted(async () => {
      loading.value = true
      await Promise.all([fetchMovements(), fetchItems()])
      loading.value = false
    })
    
    return {
      loading,
      movements,
      items,
      fromDate,
      toDate,
      movementTypeFilter,
      itemFilter,
      searchQuery,
      currentPage,
      totalPages,
      totalIn,
      totalOut,
      netChange,
      totalMovements,
      filteredMovements,
      toastMessage,
      toastType,
      toastIcon,
      formatDateTime,
      formatMovementType,
      getItemColor,
      getItemIcon,
      refreshReport,
      exportReport,
      applyFilters
    }
  }
}
</script>

<style scoped>
.stock-movements {
  padding: 24px;
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

.header-actions {
  display: flex;
  gap: 12px;
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

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 202, 113, 0.3);
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
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
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.total-in {
  background: #E8F5E9;
  color: #4CAF50;
}

.stat-icon.total-out {
  background: #FFEBEE;
  color: #F44336;
}

.stat-icon.net-change {
  background: #E3F2FD;
  color: #1976D2;
}

.stat-icon.total-movements {
  background: #FFF3E0;
  color: #F57C00;
}

.stat-info h3 {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.stat-info h3.positive {
  color: #4CAF50;
}

.stat-info h3.negative {
  color: #F44336;
}

.stat-info p {
  color: #8C8C90;
  margin: 0;
  font-size: 14px;
}

.filters-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.filters {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 600;
  color: #6F6C6D;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-input, .filter-select {
  padding: 8px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 14px;
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
  font-size: 14px;
}

.search-box input {
  padding: 8px 12px 8px 36px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  width: 200px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
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

.movements-table-container {
  background: white;
  border-radius: 16px;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.movements-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.movements-table th {
  text-align: left;
  padding: 14px 12px;
  background: #F9F7EB;
  color: #332F2E;
  font-weight: 600;
  font-size: 13px;
  border-bottom: 1px solid #E5E5E2;
}

.movements-table td {
  padding: 12px;
  border-bottom: 1px solid #F0F0F0;
  font-size: 13px;
}

.date-cell {
  white-space: nowrap;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 8px;
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

.movement-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-block;
}

.movement-badge.purchase {
  background: #E8F5E9;
  color: #4CAF50;
}

.movement-badge.transfer_out {
  background: #FFEBEE;
  color: #F44336;
}

.movement-badge.transfer_in {
  background: #E3F2FD;
  color: #1976D2;
}

.movement-badge.adjustment {
  background: #FFF3E0;
  color: #F57C00;
}

.positive {
  color: #4CAF50;
  font-weight: 600;
}

.negative {
  color: #F44336;
  font-weight: 600;
}

.reference-cell, .notes-cell {
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  text-align: center;
  padding: 60px !important;
  color: #8C8C90;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  padding: 16px;
}

.page-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #E5E5E2;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover:not(:disabled) {
  background: #F9F7EB;
  border-color: #EFCA71;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #6F6C6D;
}

.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 3000;
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

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-range {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box input {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .stock-movements {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .date-input, .filter-select {
    width: 100%;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
}
</style>