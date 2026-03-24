<template>
  <header class="main-header">
    <div class="header-content">
      <div class="logo-section" @click="goToDashboard">
       
       
      </div>

      <div class="header-right">
        <!-- Notifications -->
        <div class="notifications-dropdown" @click.stop="toggleNotifications">
          <button class="notification-btn">
            <i class="fas fa-bell"></i>
            <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </button>
          
          <div v-if="showNotifications" class="dropdown-menu" @click.stop>
            <div class="dropdown-header">
              <h3>Notifications</h3>
              <button v-if="unreadCount > 0" class="mark-read-btn" @click="markAllAsRead">Mark all as read</button>
            </div>
            <div class="dropdown-content">
              <div v-for="notification in notifications" :key="notification.id" 
                   :class="['notification-item', { unread: !notification.read }]"
                   @click="handleNotificationClick(notification)">
                <div class="notification-icon" :class="notification.type">
                  <i :class="getNotificationIcon(notification.type)"></i>
                </div>
                <div class="notification-content">
                  <div class="notification-title">{{ notification.title }}</div>
                  <div class="notification-message">{{ notification.message }}</div>
                  <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
                </div>
                <button v-if="!notification.read" class="mark-read-icon" @click.stop="markAsRead(notification.id)">
                  <i class="fas fa-check-circle"></i>
                </button>
              </div>
              <div v-if="notifications.length === 0" class="empty-notifications">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications</p>
              </div>
            </div>
          </div>
        </div>

        <!-- User Info -->
        <div class="user-info">
          <span class="user-name">{{ userName }}</span>
          <span class="user-role">{{ formatRole(userRole) }}</span>
        </div>

        <!-- Logout Button -->
        <button class="logout-btn" @click="handleLogout">
          <i class="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

export default {
  name: 'Header',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    // State
    const showNotifications = ref(false)
    const notifications = ref([])
    let refreshInterval = null
    
    // Computed
    const userName = computed(() => authStore.userName || authStore.user?.name || 'User')
    const userRole = computed(() => authStore.userRole || authStore.user?.role || 'guest')
    const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
    
    // Methods
    const goToDashboard = () => {
      const role = userRole.value
      if (role === 'admin') {
        router.push('/admin/dashboard')
      } else if (role === 'cashier') {
        router.push('/cashier/dashboard')
      } else if (role === 'barista') {
        router.push('/barista/dashboard')
      }
    }
    
    const formatRole = (role) => {
      const roleMap = {
        admin: 'Administrator',
        cashier: 'Cashier',
        barista: 'Barista'
      }
      return roleMap[role] || role || 'User'
    }
    
    const formatTime = (dateTime) => {
      if (!dateTime) return ''
      try {
        const date = new Date(dateTime)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)
        
        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins} min ago`
        if (diffHours < 24) return `${diffHours} hour ago`
        if (diffDays < 7) return `${diffDays} day ago`
        return date.toLocaleDateString()
      } catch (e) {
        return ''
      }
    }
    
    const getNotificationIcon = (type) => {
      const icons = {
        stock_request: 'fas fa-truck',
        stock_approved: 'fas fa-check-circle',
        stock_rejected: 'fas fa-times-circle',
        low_stock: 'fas fa-exclamation-triangle',
        distribution: 'fas fa-hand-holding-heart',
        sale: 'fas fa-shopping-cart',
        system: 'fas fa-server'
      }
      return icons[type] || 'fas fa-bell'
    }
    
    const loadDemoNotifications = () => {
      notifications.value = [
        {
          id: 1,
          type: 'system',
          title: 'Welcome',
          message: `Welcome to Eyob Bar & Restaurant, ${userName.value}!`,
          created_at: new Date().toISOString(),
          read: false,
          link: '/dashboard'
        }
      ]
    }
    
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          loadDemoNotifications()
          return
        }
        
        const response = await fetch('/api/notifications/?limit=5', {
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          notifications.value = Array.isArray(data) ? data : (data.notifications || data)
          if (notifications.value.length === 0) {
            loadDemoNotifications()
          }
        } else {
          console.log('API returned', response.status, '- using demo notifications')
          loadDemoNotifications()
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
        loadDemoNotifications()
      }
    }
    
    const markAsRead = async (notificationId) => {
      try {
        const token = localStorage.getItem('authToken')
        await fetch(`/api/notifications/${notificationId}/read`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const notification = notifications.value.find(n => n.id === notificationId)
        if (notification) notification.read = true
      } catch (error) {
        console.error('Error marking notification as read:', error)
        const notification = notifications.value.find(n => n.id === notificationId)
        if (notification) notification.read = true
      }
    }
    
    const markAllAsRead = async () => {
      try {
        const token = localStorage.getItem('authToken')
        await fetch('/api/notifications/read-all', {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        notifications.value.forEach(n => n.read = true)
      } catch (error) {
        console.error('Error marking all as read:', error)
        notifications.value.forEach(n => n.read = true)
      }
    }
    
    const handleNotificationClick = (notification) => {
      if (!notification.read) {
        markAsRead(notification.id)
      }
      
      if (notification.link) {
        router.push(notification.link)
      }
      
      showNotifications.value = false
    }
    
    const toggleNotifications = () => {
      showNotifications.value = !showNotifications.value
      if (showNotifications.value) {
        fetchNotifications()
      }
    }
    
    const handleLogout = async () => {
      try {
        await authStore.logout()
        router.push('/login')
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    
    // Close notifications when clicking outside
    const handleClickOutside = (event) => {
      if (showNotifications.value && !event.target.closest('.notifications-dropdown')) {
        showNotifications.value = false
      }
    }
    
    onMounted(() => {
      fetchNotifications()
      document.addEventListener('click', handleClickOutside)
      refreshInterval = setInterval(fetchNotifications, 30000)
    })
    
    onUnmounted(() => {
      if (refreshInterval) clearInterval(refreshInterval)
      document.removeEventListener('click', handleClickOutside)
    })
    
    return {
      userName,
      userRole,
      showNotifications,
      notifications,
      unreadCount,
      goToDashboard,
      formatRole,
      formatTime,
      getNotificationIcon,
      toggleNotifications,
      handleLogout,
      handleNotificationClick,
      markAsRead,
      markAllAsRead
    }
  }
}
</script>

<style scoped>
/* Keep your existing styles - they remain the same */
.main-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: linear-gradient(135deg, #2C3E50, #1a2a3a);
  color: white;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 24px;
  max-width: 100%;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon i {
  font-size: 22px;
  color: #2C3E50;
}

.hospital-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: 1px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Notifications */
.notifications-dropdown {
  position: relative;
}

.notification-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.notification-btn i {
  font-size: 20px;
  color: #F9F7EB;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #EFCA71;
  color: #2C3E50;
  font-size: 11px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.dropdown-menu {
  position: absolute;
  top: 55px;
  right: 0;
  width: 380px;
  max-height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  z-index: 1001;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #F9F7EB;
  border-bottom: 1px solid #E5E5E2;
}

.dropdown-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #332F2E;
}

.mark-read-btn {
  background: none;
  border: none;
  color: #EFCA71;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.3s;
}

.mark-read-btn:hover {
  color: #332F2E;
}

.dropdown-content {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #F0F0F0;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.notification-item:hover {
  background: #F9F7EB;
}

.notification-item.unread {
  background: #FFF9E6;
}

.notification-item.unread:hover {
  background: #FFF3E0;
}

.notification-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon.stock_request {
  background: #E3F2FD;
  color: #1976D2;
}

.notification-icon.stock_approved {
  background: #E8F5E9;
  color: #4CAF50;
}

.notification-icon.stock_rejected {
  background: #FFEBEE;
  color: #F44336;
}

.notification-icon.low_stock {
  background: #FFF3E0;
  color: #F57C00;
}

.notification-icon.distribution {
  background: #F3E5F5;
  color: #7B1FA2;
}

.notification-icon.sale {
  background: #E0F7FA;
  color: #0097A7;
}

.notification-icon.system {
  background: #E3F2FD;
  color: #1976D2;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  color: #332F2E;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 13px;
  color: #6F6C6D;
  margin-bottom: 4px;
  line-height: 1.4;
}

.notification-time {
  font-size: 11px;
  color: #8C8C90;
}

.mark-read-icon {
  background: none;
  border: none;
  color: #88B788;
  cursor: pointer;
  padding: 4px;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.mark-read-icon:hover {
  opacity: 1;
}

.empty-notifications {
  text-align: center;
  padding: 40px 20px;
  color: #8C8C90;
}

.empty-notifications i {
  font-size: 48px;
  margin-bottom: 12px;
  display: block;
}

.empty-notifications p {
  margin: 0;
  font-size: 14px;
}

/* User Info */
.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  color: #F9F7EB;
}

.user-role {
  font-size: 11px;
  opacity: 0.7;
  color: #F9F7EB;
}

/* Logout Button */
.logout-btn {
  background: rgba(231, 76, 60, 0.9);
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logout-btn:hover {
  background: #c0392b;
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }
  
  .hospital-name {
    font-size: 1.1rem;
  }
  
  .logo-icon {
    width: 32px;
    height: 32px;
  }
  
  .logo-icon i {
    font-size: 18px;
  }
  
  .user-info {
    display: none;
  }
  
  .logout-btn span {
    display: none;
  }
  
  .logout-btn {
    padding: 8px 12px;
  }
  
  .dropdown-menu {
    width: 320px;
    right: -60px;
  }
}

@media (max-width: 480px) {
  .dropdown-menu {
    width: 280px;
    right: -80px;
  }
  
  .notification-item {
    padding: 12px 16px;
  }
}
</style>