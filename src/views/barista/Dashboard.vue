<template>
  <div class="barista-dashboard">
    <div class="page-header">
      <h1 class="page-title">Barista Dashboard</h1>
      <div class="date-info">
        <i class="fas fa-calendar"></i>
        <span>{{ currentDate }}</span>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-ticket-alt"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalCoupons }}</h3>
          <p>Total Coupons Available</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-hand-holding-heart"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalDistributed }}</h3>
          <p>Distributed Today</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-clipboard-list"></i>
        </div>
        <div class="stat-info">
          <h3>{{ pendingRequests }}</h3>
          <p>Pending Requests</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-info">
          <h3>{{ utilizationRate }}%</h3>
          <p>Utilization Rate</p>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h3>Quick Actions</h3>
      <div class="actions-grid">
        <router-link to="/barista/distribute" class="action-card">
          <div class="action-icon">
            <i class="fas fa-hand-holding-heart"></i>
          </div>
          <span>Distribute Coupons</span>
        </router-link>
        <router-link to="/barista/request-stock" class="action-card">
          <div class="action-icon">
            <i class="fas fa-truck"></i>
          </div>
          <span>Request Stock</span>
        </router-link>
        <router-link to="/barista/inventory" class="action-card">
          <div class="action-icon">
            <i class="fas fa-boxes"></i>
          </div>
          <span>View Inventory</span>
        </router-link>
        <router-link to="/barista/track-coupons" class="action-card">
          <div class="action-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <span>Track Coupons</span>
        </router-link>
      </div>
    </div>

    <!-- Recent Distributions -->
    <div class="section-card">
      <div class="section-header">
        <h3>Recent Distributions</h3>
        <router-link to="/barista/track-coupons" class="view-all">View All</router-link>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Item</th>
              <th>Quantity</th>
              <th>Waiter</th>
              <th>Status</th></tr>
             </thead>
          <tbody>
            <tr v-for="dist in recentDistributions" :key="dist.id">
              <td>{{ formatTime(dist.distributed_at || dist.created_at) }}</td>
              <td>
                <div class="item-info">
                  <div class="item-icon-small" :style="{ background: dist.color || '#EFCA71' }">
                    <i :class="dist.icon || 'fas fa-cube'"></i>
                  </div>
                  <span>{{ dist.item_name }}</span>
                </div>
              </td>
              <td class="quantity-cell">{{ dist.quantity }}</td>
              <td>{{ dist.assigned_to || dist.waiter_name }}</td>
              <td>
                <span :class="['status-badge', dist.status || 'active']">
                  {{ dist.status || 'Active' }}
                </span>
              </td>
            </tr>
            <tr v-if="recentDistributions.length === 0">
              <td colspan="5" class="empty-state">No recent distributions</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import api from '../../services/api';
export default {
  name: 'BaristaDashboard',
  setup() {
    const inventory = ref([])
    const distributions = ref([])
    const stockRequests = ref([])
    const itemDetails = ref({})

    const currentDate = computed(() => {
      return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    })

    const totalCoupons = computed(() => {
      return inventory.value.reduce((sum, item) => sum + (item.remaining_coupon || 0), 0)
    })

    const totalDistributed = computed(() => {
      const today = new Date().toISOString().split('T')[0]
      return distributions.value
        .filter(d => d.distributed_at?.startsWith(today) || d.created_at?.startsWith(today))
        .reduce((sum, d) => sum + (d.quantity || 0), 0)
    })

    const pendingRequests = computed(() => {
      return stockRequests.value.filter(r => r.status === 'pending').length
    })

    const utilizationRate = computed(() => {
      const totalInitial = inventory.value.reduce((sum, item) => sum + (item.initial_coupon || 0), 0)
      const totalRemaining = totalCoupons.value
      if (totalInitial === 0) return 0
      return Math.round(((totalInitial - totalRemaining) / totalInitial) * 100)
    })

    const recentDistributions = computed(() => {
      return distributions.value.slice(0, 5)
    })

    const getAuthHeaders = () => {
      const token = localStorage.getItem('authToken')
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }

    const formatTime = (dateTime) => {
      if (!dateTime) return '-'
      try {
        const date = new Date(dateTime)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } catch (e) {
        return '-'
      }
    }

    const fetchInventory = async () => {
      try {
        const response = await api.get('/barista/inventory')
        if (response.status === 200) {
          const data = await response.data
          inventory.value = Array.isArray(data) ? data : []
        }
      } catch (error) {
        console.error('Error fetching inventory:', error)
      }
    }

    const fetchDistributions = async () => {
      try {
        const response = await api.get('/barista/distributions')
         
        if (response.status === 200) {
          const data = await response.data
          distributions.value = Array.isArray(data) ? data : []
          
          // Get item details for icons
          const itemsResponse = await api.get('/barista/items')
          if (itemsResponse.status === 200) {
            const items = await itemsResponse.data
            items.forEach(item => {
              itemDetails.value[item.id] = {
                icon: item.icon,
                color: item.color
              }
            })
          }
        }
      } catch (error) {
        console.error('Error fetching distributions:', error)
      }
    }

    const fetchStockRequests = async () => {
      try {
        const response = await api.get('/barista/stock-requests')
        if (response.status === 200) {
          const data = await response.data
          stockRequests.value = Array.isArray(data) ? data : []
        }
      } catch (error) {
        console.error('Error fetching stock requests:', error)
      }
    }

    onMounted(async () => {
      await Promise.all([
        fetchInventory(),
        fetchDistributions(),
        fetchStockRequests()
      ])
    })

    return {
      currentDate,
      totalCoupons,
      totalDistributed,
      pendingRequests,
      utilizationRate,
      recentDistributions,
      formatTime
    }
  }
}
</script>

<style scoped>
.barista-dashboard {
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

.date-info {
  background: #F9F7EB;
  padding: 8px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #332F2E;
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

.quick-actions {
  margin-bottom: 24px;
}

.quick-actions h3 {
  font-size: 18px;
  font-weight: 600;
  color: #332F2E;
  margin-bottom: 16px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  text-decoration: none;
  transition: all 0.3s ease;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.action-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.action-icon i {
  font-size: 24px;
  color: #332F2E;
}

.action-card span {
  color: #332F2E;
  font-weight: 500;
}

.section-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #332F2E;
}

.view-all {
  color: #EFCA71;
  text-decoration: none;
  font-size: 14px;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  text-align: left;
  padding: 12px;
  background: #F9F7EB;
  font-weight: 600;
  color: #332F2E;
  border-bottom: 1px solid #E5E5E2;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #F0F0F0;
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
}

.quantity-cell {
  font-weight: 600;
  color: #EFCA71;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge.active {
  background: #E3F2FD;
  color: #1976D2;
}

.status-badge.used {
  background: #E8F5E9;
  color: #4CAF50;
}

.empty-state {
  text-align: center;
  padding: 40px !important;
  color: #8C8C90;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .barista-dashboard {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>