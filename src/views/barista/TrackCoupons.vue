<template>
  <div class="track-coupons">
    <!-- Page Header -->
    <div class="page-header card">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <span class="title-gradient">Track</span>
            <span class="title-management">Issued Coupons</span>
          </h1>
          <p class="page-subtitle">Monitor distributed coupons and track usage by waiters</p>
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
            <span class="stat-value">{{ stats.totalIssued || 0 }}</span>
            <span class="stat-label">Total Issued Today</span>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-chart-line"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalUsed || 0 }}</span>
            <span class="stat-label">Coupons Used</span>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-hourglass-half"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalRemaining || 0 }}</span>
            <span class="stat-label">Remaining</span>
          </div>
        </div>

        <div class="stat-card card">
          <div class="stat-icon-wrapper">
            <div class="stat-icon">
              <i class="fas fa-users"></i>
            </div>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalWaiters || 0 }}</span>
            <span class="stat-label">Active Waiters</span>
          </div>
        </div>
      </div>

      <!-- Waiter Distribution Summary -->
      <div class="section-card card">
        <div class="section-header">
          <h3>Distribution by Waiter</h3>
          <span class="section-subtitle">Coupon usage per waiter</span>
        </div>
        <div class="waiters-grid">
          <div v-for="waiter in waiterStats" :key="waiter.id" class="waiter-card">
            <div class="waiter-avatar">
              {{ getInitials(waiter.name) }}
            </div>
            <div class="waiter-info">
              <div class="waiter-name">{{ waiter.name }}</div>
              <div class="waiter-stats">
                <span class="issued">Issued: {{ waiter.issued || 0 }}</span>
                <span class="used">Used: {{ waiter.used || 0 }}</span>
                <span class="remaining">Left: {{ waiter.remaining || 0 }}</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ 
                    width: getUsagePercentage(waiter.used || 0, waiter.issued || 0) + '%',
                    background: getProgressColor(waiter.used || 0, waiter.issued || 0)
                  }"
                ></div>
              </div>
            </div>
          </div>
          <div v-if="waiterStats.length === 0" class="empty-state-full">
            <i class="fas fa-users-slash"></i>
            <p>No waiter distribution data available</p>
          </div>
        </div>
      </div>

      <!-- Distribution Details -->
      <div class="section-card card">
        <div class="section-header">
          <h3>Distribution Details</h3>
          <div class="filters">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Search by item or waiter..."
              >
            </div>
            <select v-model="filterStatus" class="filter-select">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
        <div class="table-container">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Waiter</th>
                  <th>Status</th>
                  <th>Used At</th>
                  <th>Actions</th></tr>
                 </thead>
              <tbody>
                <tr v-for="dist in filteredDistributions" :key="dist.id">
                  <td data-label="Time">{{ formatTime(dist.created_at) }}</td>
                  <td data-label="Item">
                    <div class="item-info">
                      <div class="item-icon-small" :style="{ background: dist.color || '#EFCA71' }">
                        <i :class="dist.icon || 'fas fa-cube'"></i>
                      </div>
                      <span>{{ dist.item_name || 'Unknown' }}</span>
                    </div>
                  </td>
                  <td data-label="Quantity" class="quantity-cell">{{ dist.quantity || 0 }}</td>
                  <td data-label="Waiter">{{ dist.assigned_to || '-' }}</td>
                  <td data-label="Status">
                    <span :class="['status-badge', dist.status || 'active']">
                      {{ dist.status || 'active' }}
                    </span>
                  </td>
                  <td data-label="Used At">{{ dist.used_at ? formatTime(dist.used_at) : '-' }}</td>
                  <td data-label="Actions" class="actions-cell">
                    <button v-if="dist.status === 'active'" class="btn-icon" @click="markAsUsed(dist)" title="Mark as Used">
                      <i class="fas fa-check-circle"></i>
                    </button>
                    <button class="btn-icon" @click="viewDetails(dist)" title="View Details">
                      <i class="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredDistributions.length === 0">
                  <td colspan="7" class="empty-state">No distributions found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Item-wise Distribution -->
      <div class="section-card card">
        <div class="section-header">
          <h3>Distribution by Item</h3>
          <span class="section-subtitle">Coupon usage per item</span>
        </div>
        <div class="items-chart">
          <div v-for="item in itemStats" :key="item.id" class="item-stat">
            <div class="item-header">
              <div class="item-info">
                <div class="item-icon-small" :style="{ background: item.color || '#EFCA71' }">
                  <i :class="item.icon || 'fas fa-cube'"></i>
                </div>
                <span class="item-name">{{ item.name }}</span>
              </div>
              <span class="item-total">{{ item.issued || 0 }} issued</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ 
                  width: getUsagePercentage(item.used || 0, item.issued || 0) + '%',
                  background: getProgressColor(item.used || 0, item.issued || 0)
                }"
              ></div>
            </div>
            <div class="item-stats">
              <span>Used: {{ item.used || 0 }}</span>
              <span>Remaining: {{ item.remaining || 0 }}</span>
              <span>Utilization: {{ getUsagePercentage(item.used || 0, item.issued || 0) }}%</span>
            </div>
          </div>
          <div v-if="itemStats.length === 0" class="empty-state-full">
            <i class="fas fa-box-open"></i>
            <p>No item distribution data available</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="closeDetailsModal">
      <div class="modal-content card" @click.stop>
        <div class="modal-header">
          <h2>Distribution Details</h2>
          <button class="close-btn" @click="closeDetailsModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="details-card" v-if="selectedDistribution">
            <div class="detail-row">
              <label>Item:</label>
              <div class="item-info">
                <div class="item-icon-small" :style="{ background: selectedDistribution.color || '#EFCA71' }">
                  <i :class="selectedDistribution.icon || 'fas fa-cube'"></i>
                </div>
                <span>{{ selectedDistribution.item_name || 'Unknown' }}</span>
              </div>
            </div>
            <div class="detail-row">
              <label>Quantity:</label>
              <span class="quantity-highlight">{{ selectedDistribution.quantity || 0 }}</span>
            </div>
            <div class="detail-row">
              <label>Waiter:</label>
              <span>{{ selectedDistribution.assigned_to || '-' }}</span>
            </div>
            <div class="detail-row">
              <label>Status:</label>
              <span :class="['status-badge', selectedDistribution.status || 'active']">
                {{ selectedDistribution.status || 'active' }}
              </span>
            </div>
            <div class="detail-row">
              <label>Distributed At:</label>
              <span>{{ formatDateTime(selectedDistribution.created_at) }}</span>
            </div>
            <div class="detail-row" v-if="selectedDistribution.used_at">
              <label>Used At:</label>
              <span>{{ formatDateTime(selectedDistribution.used_at) }}</span>
            </div>
            <div class="detail-row">
              <label>Notes:</label>
              <p>{{ selectedDistribution.notes || '-' }}</p>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-outline" @click="closeDetailsModal">Close</button>
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
  name: 'BaristaTrackCoupons',
  setup() {
    const router = useRouter()
    
    // State
    const isLoading = ref(true)
    const isUpdating = ref(false)
    const searchQuery = ref('')
    const filterStatus = ref('')
    const showDetailsModal = ref(false)
    const selectedDistribution = ref(null)
    const toastMessage = ref('')
    const toastType = ref('success')
    
    const distributions = ref([])
    
    const stats = ref({
      totalIssued: 0,
      totalUsed: 0,
      totalRemaining: 0,
      totalWaiters: 0
    })

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

    const waiterStats = computed(() => {
      const statsMap = {}
      distributions.value.forEach(dist => {
        if (!dist.assigned_to) return
        if (!statsMap[dist.assigned_to]) {
          statsMap[dist.assigned_to] = {
            id: dist.assigned_to.replace(/\s/g, '_'),
            name: dist.assigned_to,
            issued: 0,
            used: 0,
            remaining: 0
          }
        }
        const quantity = dist.quantity || 0
        statsMap[dist.assigned_to].issued += quantity
        if (dist.status === 'used') {
          statsMap[dist.assigned_to].used += quantity
        } else if (dist.status === 'active') {
          statsMap[dist.assigned_to].remaining += quantity
        }
      })
      return Object.values(statsMap)
    })
    
    const itemStats = computed(() => {
      const statsMap = {}
      distributions.value.forEach(dist => {
        if (!dist.item_name) return
        if (!statsMap[dist.item_name]) {
          statsMap[dist.item_name] = {
            id: dist.item_name,
            name: dist.item_name,
            icon: dist.icon,
            color: dist.color,
            issued: 0,
            used: 0,
            remaining: 0
          }
        }
        const quantity = dist.quantity || 0
        statsMap[dist.item_name].issued += quantity
        if (dist.status === 'used') {
          statsMap[dist.item_name].used += quantity
        } else if (dist.status === 'active') {
          statsMap[dist.item_name].remaining += quantity
        }
      })
      return Object.values(statsMap)
    })
    
    const filteredDistributions = computed(() => {
      let filtered = [...distributions.value]
      
      if (searchQuery.value) {
        filtered = filtered.filter(d => 
          d.item_name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          d.assigned_to?.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }
      
      if (filterStatus.value) {
        filtered = filtered.filter(d => d.status === filterStatus.value)
      }
      
      return filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
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
      if (!name) return 'U'
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    
    const getUsagePercentage = (used, total) => {
      if (!total || total === 0) return 0
      return Math.round((used / total) * 100)
    }
    
    const getProgressColor = (used, total) => {
      if (!total || total === 0) return '#88B788'
      const percentage = (used / total) * 100
      if (percentage >= 90) return '#C45A5A'
      if (percentage >= 70) return '#F57C00'
      return '#88B788'
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
    
    const formatDateTime = (dateTime) => {
      if (!dateTime) return '-'
      try {
        const date = new Date(dateTime)
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (e) {
        return '-'
      }
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
    
    // Fetch distributions from barista endpoint
    const response = await api.get('/barista/distributions')
    
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
    
    const data = await response.data
    console.log('Fetched distributions:', data) // Debug log
    
    // Map the data to match the component's expected structure
    distributions.value = Array.isArray(data) ? data.map(dist => ({
      id: dist.id,
      created_at: dist.created_at,
      item_name: dist.item_name,
      quantity: dist.quantity,
      assigned_to: dist.assigned_to,
      status: dist.status,
      used_at: dist.used_at,
      notes: dist.notes,
      icon: dist.icon,
      color: dist.color
    })) : []
    
    // Calculate stats with safe defaults
    stats.value.totalIssued = distributions.value.reduce((sum, d) => sum + (d.quantity || 0), 0)
    stats.value.totalUsed = distributions.value
      .filter(d => d.status === 'used' || d.status === 'partially_used')
      .reduce((sum, d) => sum + (d.used_quantity || d.quantity || 0), 0)
    stats.value.totalRemaining = distributions.value
      .filter(d => d.status === 'active' || d.status === 'partially_used')
      .reduce((sum, d) => sum + (d.remaining_quantity || 0), 0)
    stats.value.totalWaiters = new Set(distributions.value.map(d => d.assigned_to).filter(Boolean)).size
    
    console.log('Stats calculated:', stats.value) // Debug log
    
  } catch (error) {
    console.error('Error fetching distributions:', error)
    showToast('Failed to load data. Using demo data.', 'error')
    loadDemoData()
  } finally {
    isLoading.value = false
  }
}

    const loadDemoData = () => {
      distributions.value = [
        { 
          id: 1, 
          created_at: new Date().toISOString(), 
          item_name: 'Beer', 
          quantity: 10, 
          assigned_to: 'Abebe Bekele', 
          status: 'active',
          used_at: null,
          notes: 'For table 5',
          icon: 'fas fa-beer',
          color: '#F4A261'
        },
        { 
          id: 2, 
          created_at: new Date(Date.now() - 3600000).toISOString(), 
          item_name: 'Wine', 
          quantity: 5, 
          assigned_to: 'Almaz Tadese', 
          status: 'used',
          used_at: new Date(Date.now() - 1800000).toISOString(),
          notes: '',
          icon: 'fas fa-wine-bottle',
          color: '#9C6B42'
        },
        { 
          id: 3, 
          created_at: new Date(Date.now() - 7200000).toISOString(), 
          item_name: 'Cocktail', 
          quantity: 8, 
          assigned_to: 'Chala Desta', 
          status: 'active',
          used_at: null,
          notes: 'Special order',
          icon: 'fas fa-cocktail',
          color: '#2A9D8F'
        }
      ]
      
      stats.value = {
        totalIssued: 23,
        totalUsed: 5,
        totalRemaining: 18,
        totalWaiters: 3
      }
    }
    
    const markAsUsed = async (distribution) => {
      if (isUpdating.value) return
      
      isUpdating.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await api.put(`/barista/distributions/${distribution.id}/use`)
        
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
        
        // Update local data
        distribution.status = 'used'
        distribution.used_at = new Date().toISOString()
        
        // Update stats
        stats.value.totalUsed += distribution.quantity || 0
        stats.value.totalRemaining -= distribution.quantity || 0
        
        showToast(`${distribution.quantity || 0} coupons for ${distribution.item_name || 'item'} marked as used`, 'success')
      } catch (error) {
        console.error('Error marking as used:', error)
        showToast(error.message || 'Error updating status', 'error')
      } finally {
        isUpdating.value = false
      }
    }
    
    const viewDetails = (distribution) => {
      selectedDistribution.value = distribution
      showDetailsModal.value = true
    }
    
    const closeDetailsModal = () => {
      showDetailsModal.value = false
      selectedDistribution.value = null
    }
    
    onMounted(() => {
      fetchData()
    })
    
    return {
      isLoading,
      isUpdating,
      searchQuery,
      filterStatus,
      showDetailsModal,
      selectedDistribution,
      toastMessage,
      toastType,
      toastIcon,
      distributions,
      stats,
      waiterStats,
      itemStats,
      currentDate,
      filteredDistributions,
      getInitials,
      getUsagePercentage,
      getProgressColor,
      formatTime,
      formatDateTime,
      markAsUsed,
      viewDetails,
      closeDetailsModal
    }
  }
}
</script>

<style scoped>
/* Keep all your existing styles - they remain the same */
.track-coupons {
  padding: 30px;
  min-height: 100vh;
  background: #F9F7EB;
  color: #332F2E;
}

/* ... (all your existing styles remain exactly the same) ... */

/* ==============================================
   TRACK COUPONS - MATCHING ADMIN STYLES
   ============================================== */

.track-coupons {
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

/* Section Card */
.section-card {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  color: #332F2E;
}

.section-subtitle {
  font-size: 0.85rem;
  color: #6F6C6D;
}

/* Waiters Grid */
.waiters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.waiter-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F9F7EB;
  border-radius: 16px;
  border: 1px solid rgba(239, 202, 113, 0.15);
  transition: transform 0.3s ease;
}

.waiter-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.waiter-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: #332F2E;
  flex-shrink: 0;
}

.waiter-info {
  flex: 1;
}

.waiter-name {
  font-weight: 600;
  color: #332F2E;
  margin-bottom: 4px;
}

.waiter-stats {
  display: flex;
  gap: 12px;
  font-size: 0.7rem;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.issued {
  color: #88B788;
}

.used {
  color: #EFCA71;
}

.remaining {
  color: #F57C00;
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
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Filters */
.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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
  font-size: 0.9rem;
}

.search-box input {
  padding: 8px 12px 8px 36px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 0.9rem;
  width: 200px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  background: white;
  cursor: pointer;
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
  min-width: 800px;
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

.item-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-icon-small {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.quantity-cell {
  font-weight: 600;
  color: #EFCA71;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-block;
}

.status-badge.active {
  background: #E3F2FD;
  color: #1976D2;
}

.status-badge.used {
  background: #E8F5E9;
  color: #4CAF50;
}

.status-badge.expired {
  background: #FFEBEE;
  color: #F44336;
}

.actions-cell {
  display: flex;
  gap: 8px;
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

/* Items Chart */
.items-chart {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.item-stat {
  padding: 16px;
  background: #F9F7EB;
  border-radius: 12px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
}

.item-name {
  font-weight: 600;
  color: #332F2E;
}

.item-total {
  font-size: 0.75rem;
  color: #6F6C6D;
}

.item-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.7rem;
  color: #6F6C6D;
  flex-wrap: wrap;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px !important;
  color: #8C8C90;
}

.empty-state-full {
  text-align: center;
  padding: 60px;
  color: #8C8C90;
}

.empty-state-full i {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
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
  max-width: 500px;
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

.details-card {
  background: #F9F7EB;
  border-radius: 12px;
  padding: 16px;
}

.detail-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #E5E5E2;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row label {
  width: 110px;
  font-weight: 600;
  color: #332F2E;
  font-size: 0.9rem;
}

.detail-row span,
.detail-row p {
  flex: 1;
  color: #6F6C6D;
  margin: 0;
}

.quantity-highlight {
  font-weight: 600;
  color: #EFCA71;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
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

.btn-outline {
  background: transparent;
  border: 1px solid #E5E5E2;
  color: #332F2E;
}

.btn-outline:hover {
  background: #F9F7EB;
  border-color: #EFCA71;
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
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .track-coupons {
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
  
  .waiters-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filters {
    width: 100%;
    flex-direction: column;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .filter-select {
    width: 100%;
  }
  
  .detail-row {
    flex-direction: column;
  }
  
  .detail-row label {
    margin-bottom: 4px;
  }
  
  .modal-content {
    margin: 16px;
  }
}

@media (max-width: 480px) {
  .track-coupons {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-info {
    justify-content: center;
  }
  
  .waiter-stats {
    justify-content: space-between;
  }
  
  .item-stats {
    flex-direction: column;
    gap: 4px;
  }
}
</style>