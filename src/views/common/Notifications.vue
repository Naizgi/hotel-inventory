<template>
  <div class="notifications-page">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">Notifications</h1>
      <div class="header-actions">
        <button class="btn-secondary" @click="markAllAsRead" v-if="unreadCount > 0">
          <i class="fas fa-check-double"></i> Mark All as Read
        </button>
        <button class="btn-secondary" @click="clearAll" v-if="notifications.length > 0">
          <i class="fas fa-trash"></i> Clear All
        </button>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="notification-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="{ active: activeTab === tab.id }"
      >
        {{ tab.name }}
        <span v-if="tab.id === 'unread' && unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading notifications...</p>
    </div>

    <!-- Notifications List -->
    <div v-else class="notifications-list">
      <div v-if="filteredNotifications.length === 0" class="empty-state">
        <i class="fas fa-bell-slash"></i>
        <p>No notifications to display</p>
      </div>
      
      <div 
        v-for="notification in filteredNotifications" 
        :key="notification.id"
        class="notification-item"
        :class="{ unread: !notification.read, [notification.type]: true }"
        @click="handleNotificationClick(notification)"
      >
        <div class="notification-icon">
          <i :class="getNotificationIcon(notification.type)"></i>
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-message">{{ notification.message }}</div>
          <div class="notification-time">{{ formatRelativeTime(notification.created_at) }}</div>
        </div>
        <div class="notification-actions">
          <button v-if="notification.link" class="action-btn" @click.stop="handleAction(notification)">
            View Details
          </button>
          <button class="close-btn" @click.stop="dismissNotification(notification)">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import api from '../../services/api';
export default {
  name: 'Notifications',
  setup() {
    const router = useRouter()
    const toast = useToast()
    
    // State
    const activeTab = ref('all')
    const loading = ref(true)
    const notifications = ref([])
    let refreshInterval = null
    
    const tabs = [
      { id: 'all', name: 'All' },
      { id: 'unread', name: 'Unread' },
      { id: 'low_stock', name: 'Low Stock' },
      { id: 'stock_request', name: 'Requests' },
      { id: 'distribution', name: 'Distributions' }
    ]
    
    const unreadCount = computed(() => {
      return notifications.value.filter(n => !n.read).length
    })
    
    const filteredNotifications = computed(() => {
      let filtered = notifications.value
      
      if (activeTab.value === 'unread') {
        filtered = filtered.filter(n => !n.read)
      } else if (activeTab.value !== 'all') {
        filtered = filtered.filter(n => n.type === activeTab.value)
      }
      
      return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    })
    
    const getAuthHeaders = () => {
      const token = localStorage.getItem('authToken')
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
    
    const getNotificationIcon = (type) => {
      const icons = {
        'low_stock': 'fas fa-exclamation-triangle',
        'stock_request': 'fas fa-clipboard-list',
        'stock_approved': 'fas fa-check-circle',
        'stock_rejected': 'fas fa-times-circle',
        'sale': 'fas fa-chart-line',
        'distribution': 'fas fa-hand-holding-heart',
        'system': 'fas fa-server',
        'coupon': 'fas fa-ticket-alt'
      }
      return icons[type] || 'fas fa-bell'
    }
    
    const formatRelativeTime = (dateTime) => {
      if (!dateTime) return ''
      try {
        const now = new Date()
        const date = new Date(dateTime)
        const diff = now - date
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        
        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
        if (days === 1) return 'Yesterday'
        if (days < 7) return `${days} days ago`
        return date.toLocaleDateString()
      } catch (e) {
        return ''
      }
    }
    
    const loadDemoNotifications = () => {
      notifications.value = [
        {
          id: 1,
          type: 'system',
          title: 'Welcome',
          message: 'Welcome to Eyob Bar & Restaurant Notification System',
          created_at: new Date().toISOString(),
          read: false,
          link: '/dashboard'
        }
      ]
    }
    
    const fetchNotifications = async () => {
      loading.value = true
      try {
        const token = localStorage.getItem('authToken')
        
        if (!token) {
          console.log('No token found')
          loadDemoNotifications()
          loading.value = false
          return
        }
        
        console.log('Fetching notifications...')
        const response = await api.get('/notifications/', {
          headers: getAuthHeaders()
        })
        
        console.log('Response status:', response.status)
        
        if (response.status === 401 || response.status === 403) {
          console.log('Not authenticated, using demo data')
          loadDemoNotifications()
          loading.value = false
          return
        }
        
        if (response.ok) {
          const data = await response.json()
          console.log('Notifications data:', data)
          notifications.value = Array.isArray(data) ? data : (data.notifications || data)
          if (notifications.value.length === 0) {
            loadDemoNotifications()
          }
        } else {
          console.error('Failed to fetch notifications:', response.status)
          loadDemoNotifications()
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
        loadDemoNotifications()
      } finally {
        loading.value = false
      }
    }
    
    const markAsRead = (notification) => {
      notification.read = true
    }
    
    const markAllAsRead = () => {
      notifications.value.forEach(n => n.read = true)
      toast.success('All notifications marked as read')
    }
    
    const dismissNotification = (notification) => {
      const index = notifications.value.findIndex(n => n.id === notification.id)
      if (index !== -1) {
        notifications.value.splice(index, 1)
      }
      toast.success('Notification dismissed')
    }
    
    const clearAll = () => {
      notifications.value = []
      toast.success('All notifications cleared')
    }
    
    const handleNotificationClick = (notification) => {
      markAsRead(notification)
      
      if (notification.link) {
        router.push(notification.link)
      }
    }
    
    const handleAction = (notification) => {
      if (notification.link) {
        router.push(notification.link)
      }
    }
    
    const startAutoRefresh = () => {
      refreshInterval = setInterval(() => {
        fetchNotifications()
      }, 30000)
    }
    
    onMounted(() => {
      console.log('Notifications component mounted')
      fetchNotifications()
      startAutoRefresh()
    })
    
    onUnmounted(() => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    })
    
    return {
      activeTab,
      tabs,
      notifications,
      unreadCount,
      filteredNotifications,
      loading,
      getNotificationIcon,
      formatRelativeTime,
      markAsRead,
      markAllAsRead,
      dismissNotification,
      clearAll,
      handleNotificationClick,
      handleAction
    }
  }
}
</script>

<style scoped>
.notifications-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
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

.btn-secondary {
  background: #F5F5F5;
  border: 1px solid #E5E5E2;
  padding: 10px 20px;
  border-radius: 8px;
  color: #6F6C6D;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-secondary:hover {
  background: #E5E5E2;
  border-color: #EFCA71;
}

.notification-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #E5E5E2;
  padding-bottom: 12px;
  flex-wrap: wrap;
}

.notification-tabs button {
  padding: 8px 20px;
  background: none;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #6F6C6D;
  font-size: 14px;
  font-weight: 500;
  position: relative;
}

.notification-tabs button.active {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  color: #332F2E;
}

.badge {
  background: #C45A5A;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 10px;
  margin-left: 6px;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #8C8C90;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(239, 202, 113, 0.2);
  border-top-color: #EFCA71;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #8C8C90;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  border: 1px solid #E5E5E2;
  transition: all 0.3s ease;
  cursor: pointer;
}

.notification-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.notification-item.unread {
  background: #FFF9E6;
  border-left: 4px solid #EFCA71;
}

.notification-icon {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.notification-item.low_stock .notification-icon {
  background: #FFEBEE;
  color: #F44336;
}

.notification-item.stock_request .notification-icon,
.notification-item.stock_approved .notification-icon,
.notification-item.stock_rejected .notification-icon {
  background: #FFF3E0;
  color: #F57C00;
}

.notification-item.distribution .notification-icon {
  background: #F3E5F5;
  color: #7B1FA2;
}

.notification-item.system .notification-icon {
  background: #E3F2FD;
  color: #1976D2;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  color: #332F2E;
  margin-bottom: 4px;
  font-size: 15px;
}

.notification-message {
  color: #6F6C6D;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.notification-time {
  font-size: 12px;
  color: #8C8C90;
}

.notification-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #332F2E;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.close-btn {
  background: none;
  border: none;
  color: #8C8C90;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #F5F5F5;
  color: #C45A5A;
}

@media (max-width: 768px) {
  .notifications-page {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: flex-start;
  }
  
  .notification-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
  }
  
  .notification-tabs button {
    white-space: nowrap;
  }
  
  .notification-item {
    flex-wrap: wrap;
    padding: 16px;
  }
  
  .notification-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
  }
}
</style>