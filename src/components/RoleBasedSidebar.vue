<template>
  <aside class="sidebar" :class="{ 
    'sidebar-collapsed': collapsed && !isMobile, 
    'sidebar-expanded': !collapsed && !isMobile,
    'sidebar-open': mobileOpen 
  }">
    <!-- Mobile Overlay -->
    <div class="mobile-overlay" v-if="mobileOpen && isMobile" @click="closeMobileMenu"></div>

    <!-- Sidebar Content -->
    <div class="sidebar-container" :class="{ 'mobile-open': mobileOpen && isMobile }">
      <!-- Header with Logo and Toggle -->
      <div class="sidebar-header">
        <div class="logo-section" :class="{ 'collapsed': collapsed && !isMobile }">
          <div class="logo-wrapper">
            <i class="fas fa-mug-hot"></i>
          </div>
          <div class="logo-text" v-if="!collapsed || (isMobile && mobileOpen)">
            <h1 class="logo-title">Eyob Bar & Restaurant</h1>
            <p class="logo-subtitle">Coupon Management System</p>
          </div>
        </div>

        <!-- Desktop Collapse Button -->
        <button class="collapse-btn desktop-only" @click="toggleSidebar" v-if="!isMobile">
          <i class="fas" :class="collapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
        </button>
      </div>

      <!-- User Profile -->
      <div class="user-section" :class="{ 'collapsed': collapsed && !isMobile }">
        <div class="profile-avatar" :style="avatarStyle" @click="toggleMobileMenu">
          {{ userInitials }}
        </div>
        <div class="profile-info" v-if="!collapsed || (isMobile && mobileOpen)">
          <h3 class="profile-name">{{ user?.name || user?.username || 'Guest User' }}</h3>
          <p class="profile-role">{{ formatRole(user?.role) }}</p>
          <div class="profile-status">
            <span class="status-dot"></span>
            <span class="status-text">Online</span>
          </div>
        </div>
      </div>

      <!-- Navigation Menu -->
      <nav class="nav-menu" :class="{ 'collapsed': collapsed && !isMobile }">
        <!-- Main Menu -->
        <div class="menu-group">
          <div class="menu-label" v-if="!collapsed || (isMobile && mobileOpen)">MAIN</div>
          <router-link :to="getDashboardRoute()" class="menu-item" active-class="active" @click="closeMobileMenu">
            <div class="item-icon">
              <i class="fas fa-chart-pie"></i>
            </div>
            <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Dashboard</span>
          </router-link>
          
          <router-link to="/coupons/daily" class="menu-item" active-class="active" @click="closeMobileMenu">
            <div class="item-icon">
              <i class="fas fa-ticket-alt"></i>
              <span class="notification-badge" v-if="lowCouponItems > 0">{{ lowCouponItems }}</span>
            </div>
            <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Daily Coupons</span>
          </router-link>
        </div>

        <!-- Admin Menu -->
        <template v-if="isAdmin">
          <div class="menu-group">
            <div class="menu-label" v-if="!collapsed || (isMobile && mobileOpen)">ADMIN</div>
            
            <router-link to="/admin/items" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-utensils"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Items & Menu</span>
            </router-link>
            
            <router-link to="/admin/stock" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-boxes"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Stock Management</span>
            </router-link>
            
            <router-link to="/admin/inventory" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-warehouse"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Admin Inventory</span>
            </router-link>
            
            <router-link to="/admin/purchases" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-shopping-cart"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Purchases</span>
            </router-link>
            
            <router-link to="/admin/stock-requests" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-clipboard-list"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Stock Requests</span>
            </router-link>
            
            <router-link to="/admin/coupons/setup" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-sliders-h"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Coupon Setup</span>
            </router-link>
            
            <router-link to="/admin/coupons/reset" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-sync-alt"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Reset Coupons</span>
            </router-link>
            
            <router-link to="/admin/reports" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-chart-bar"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Reports</span>
            </router-link>
            
            <router-link to="/admin/users" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-users-cog"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Users</span>
            </router-link>
            
            <router-link to="/admin/settings" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-cog"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Settings</span>
            </router-link>
          </div>
        </template>

        <!-- Cashier Menu -->
        <template v-if="isCashier">
          <div class="menu-group">
            <div class="menu-label" v-if="!collapsed || (isMobile && mobileOpen)">CASHIER</div>
            
            <router-link to="/cashier/pos" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-cash-register"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Point of Sale</span>
            </router-link>
            
            <router-link to="/cashier/coupons/remaining" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-chart-line"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Remaining Coupons</span>
            </router-link>
            
            <router-link to="/cashier/transactions" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-exchange-alt"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Transactions</span>
            </router-link>
          </div>
        </template>

        <!-- Barista Menu -->
        <template v-if="isBarista">
          <div class="menu-group">
            <div class="menu-label" v-if="!collapsed || (isMobile && mobileOpen)">BARISTA</div>
            
            <router-link to="/barista/dashboard" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-chart-line"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Dashboard</span>
            </router-link>
            
            <router-link to="/barista/inventory" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-boxes"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Barista Inventory</span>
            </router-link>
            
            <router-link to="/barista/distribute" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-hand-holding-heart"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Distribute Coupons</span>
            </router-link>
            
            <router-link to="/barista/request-stock" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-truck"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Request Stock</span>
            </router-link>
            
            <router-link to="/barista/track-coupons" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-clipboard-list"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Track Coupons</span>
            </router-link>
            
            <router-link to="/barista/stock-requests" class="menu-item" active-class="active" @click="closeMobileMenu">
              <div class="item-icon"><i class="fas fa-history"></i></div>
              <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">My Requests</span>
            </router-link>
          </div>
        </template>

        <!-- Reports Section -->
        <div class="menu-group" v-if="canViewReports">
          <div class="menu-label" v-if="!collapsed || (isMobile && mobileOpen)">REPORTS</div>
          
          <router-link to="/reports/daily" class="menu-item" active-class="active" @click="closeMobileMenu">
            <div class="item-icon"><i class="fas fa-calendar-day"></i></div>
            <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Daily Report</span>
          </router-link>
          
          <router-link to="/reports/fast-moving" class="menu-item" active-class="active" @click="closeMobileMenu">
            <div class="item-icon"><i class="fas fa-rocket"></i></div>
            <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Fast Moving</span>
          </router-link>
          
          <router-link to="/reports/coupon-usage" class="menu-item" active-class="active" @click="closeMobileMenu">
            <div class="item-icon"><i class="fas fa-chart-line"></i></div>
            <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Coupon Usage</span>
          </router-link>
          
          <router-link to="/reports/stock-movements" class="menu-item" active-class="active" @click="closeMobileMenu">
            <div class="item-icon"><i class="fas fa-exchange-alt"></i></div>
            <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Stock Movements</span>
          </router-link>
        </div>

        <!-- Account Menu -->
        <div class="menu-group">
          <div class="menu-label" v-if="!collapsed || (isMobile && mobileOpen)">ACCOUNT</div>
          
          <router-link to="/profile" class="menu-item" active-class="active" @click="closeMobileMenu">
            <div class="item-icon"><i class="fas fa-user-circle"></i></div>
            <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Profile</span>
          </router-link>
          
          <router-link to="/notifications" class="menu-item" active-class="active" @click="closeMobileMenu">
            <div class="item-icon">
              <i class="fas fa-bell"></i>
              <span class="notification-badge" v-if="unreadNotifications > 0">{{ unreadNotifications > 99 ? '99+' : unreadNotifications }}</span>
            </div>
            <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Notifications</span>
          </router-link>
          
          <a href="#" class="menu-item" @click.prevent="logout">
            <div class="item-icon"><i class="fas fa-sign-out-alt"></i></div>
            <span class="item-text" v-if="!collapsed || (isMobile && mobileOpen)">Logout</span>
          </a>
        </div>
      </nav>

      <!-- Version Info -->
      <div class="version-info" :class="{ 'collapsed': collapsed && !isMobile }">
        <div class="version-badge" v-if="!collapsed || (isMobile && mobileOpen)">
          <i class="fas fa-code-branch"></i>
          <span>Version 2.0.0</span>
        </div>
        <span v-else>v2.0</span>
      </div>
    </div>

    <!-- Mobile Burger Button -->
    <button class="mobile-burger-btn" @click="toggleMobileMenu" :class="{ 'active': mobileOpen }">
      <span></span>
      <span></span>
      <span></span>
    </button>
  </aside>
</template>

<script>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import api from '../services/api'
export default {
  name: 'BarRestaurantSidebar',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const collapsed = ref(false)
    const mobileOpen = ref(false)
    const isMobile = ref(window.innerWidth <= 1024)
    const unreadNotifications = ref(0)
    const lowCouponItems = ref(0)
    let refreshInterval = null

    const user = computed(() => authStore.user)
    const isAdmin = computed(() => authStore.user?.role === 'admin')
    const isCashier = computed(() => authStore.user?.role === 'cashier')
    const isBarista = computed(() => authStore.user?.role === 'barista')
    const canViewReports = computed(() => isAdmin.value || isCashier.value)

    const getDashboardRoute = () => {
      const role = authStore.user?.role
      const routes = {
        admin: '/admin/dashboard',
        cashier: '/cashier/dashboard',
        barista: '/barista/dashboard'
      }
      return routes[role] || '/'
    }

    const userInitials = computed(() => {
      if (!user.value?.name && !user.value?.username) return 'GU'
      if (user.value?.name) {
        return user.value.name
          .split(' ')
          .map(name => name[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      }
      return user.value?.username?.substring(0, 2).toUpperCase() || 'US'
    })

    const avatarStyle = computed(() => ({
      background: `linear-gradient(135deg, #EFCA71, #F2E9C6)`
    }))

    const getAuthHeaders = () => {
      const token = localStorage.getItem('authToken')
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }

    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) return

        const response = await api.get('/notifications/unread-count', {
          headers: getAuthHeaders()
        })

        if (response.ok) {
          const data = await response.json()
          unreadNotifications.value = data.count || 0
        } else {
          unreadNotifications.value = 2
        }
      } catch (error) {
        console.error('Error fetching unread count:', error)
        unreadNotifications.value = 2
      }
    }

    const fetchLowStockCount = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) return

        const response = await api.get('/barista/inventory')

        if (response.ok) {
          const data = await response.json()
          const items = Array.isArray(data) ? data : (data.items || data)
          const lowStock = items.filter(item => {
            const ratio = (item.remaining_coupon || 0) / (item.initial_coupon || 100)
            return ratio < 0.3
          })
          lowCouponItems.value = lowStock.length
        } else {
          lowCouponItems.value = 3
        }
      } catch (error) {
        console.error('Error fetching low stock count:', error)
        lowCouponItems.value = 3
      }
    }

    const toggleSidebar = () => {
      collapsed.value = !collapsed.value
    }

    const toggleMobileMenu = () => {
      mobileOpen.value = !mobileOpen.value
      if (mobileOpen.value) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    }

    const closeMobileMenu = () => {
      mobileOpen.value = false
      document.body.style.overflow = ''
    }

    const logout = async () => {
      await authStore.logout()
      router.push('/login')
    }

    const formatRole = (role) => {
      if (!role) return ''
      return role.charAt(0).toUpperCase() + role.slice(1)
    }

    const handleResize = () => {
      isMobile.value = window.innerWidth <= 1024
      if (!isMobile.value && mobileOpen.value) {
        closeMobileMenu()
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape' && mobileOpen.value) {
        closeMobileMenu()
      }
    }

    const startAutoRefresh = () => {
      refreshInterval = setInterval(() => {
        fetchUnreadCount()
        if (isBarista.value) {
          fetchLowStockCount()
        }
      }, 30000)
    }

    onMounted(() => {
      window.addEventListener('resize', handleResize)
      document.addEventListener('keydown', handleEscape)
      
      const savedState = localStorage.getItem('sidebar_collapsed')
      if (savedState !== null && !isMobile.value) {
        collapsed.value = JSON.parse(savedState)
      }
      
      fetchUnreadCount()
      if (isBarista.value) {
        fetchLowStockCount()
      }
      startAutoRefresh()
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    })

    watch(collapsed, (val) => {
      if (!isMobile.value) {
        localStorage.setItem('sidebar_collapsed', JSON.stringify(val))
      }
    })

    return {
      user,
      isAdmin,
      isCashier,
      isBarista,
      canViewReports,
      userInitials,
      avatarStyle,
      unreadNotifications,
      lowCouponItems,
      collapsed,
      mobileOpen,
      isMobile,
      toggleSidebar,
      toggleMobileMenu,
      closeMobileMenu,
      logout,
      formatRole,
      getDashboardRoute
    }
  }
}
</script>





<style scoped>
/* Keep all your existing styles - they remain the same */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 9999;
}

.sidebar-container {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 280px;
  background: #FFFFFF;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  border-right: 1px solid rgba(239, 202, 113, 0.15);
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10000;
}

@media (min-width: 1025px) {
  .sidebar-collapsed .sidebar-container {
    width: 80px;
  }
}

@media (max-width: 1024px) {
  .sidebar-container {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar-container.mobile-open {
    transform: translateX(0);
  }
}

.mobile-burger-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  z-index: 10001;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(239, 202, 113, 0.2);
  transition: all 0.3s ease;
}

@media (min-width: 1025px) {
  .mobile-burger-btn {
    display: none;
  }
}

.mobile-burger-btn span {
  width: 24px;
  height: 2px;
  background: #332F2E;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.mobile-burger-btn.active span:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.mobile-burger-btn.active span:nth-child(2) {
  opacity: 0;
}

.mobile-burger-btn.active span:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.sidebar-header {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(239, 202, 113, 0.15);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.logo-section.collapsed {
  justify-content: center;
  width: 100%;
}

.logo-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-wrapper i {
  font-size: 20px;
  color: #332F2E;
}

.logo-title {
  font-size: 1rem;
  font-weight: 700;
  color: #332F2E;
  margin: 0 0 2px;
  line-height: 1.2;
}

.logo-subtitle {
  font-size: 0.6rem;
  color: #EFCA71;
  margin: 0;
}

.collapse-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #F9F7EB;
  border: 1px solid rgba(239, 202, 113, 0.3);
  color: #6F6C6D;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.collapse-btn:hover {
  background: #EFCA71;
  color: #332F2E;
  border-color: #EFCA71;
}

.user-section {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(239, 202, 113, 0.15);
  transition: all 0.3s ease;
}

.user-section.collapsed {
  justify-content: center;
  padding: 20px 0;
}

.profile-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: #332F2E;
  flex-shrink: 0;
  cursor: pointer;
}

@media (min-width: 1025px) {
  .profile-avatar {
    cursor: default;
  }
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #332F2E;
  margin: 0 0 2px;
}

.profile-role {
  font-size: 0.7rem;
  color: #EFCA71;
  margin: 0 0 4px;
}

.profile-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #88B788;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-text {
  font-size: 0.65rem;
  color: #88B788;
}

.nav-menu {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
  scrollbar-width: thin;
}

.nav-menu::-webkit-scrollbar {
  width: 4px;
}

.nav-menu::-webkit-scrollbar-track {
  background: #F9F7EB;
}

.nav-menu::-webkit-scrollbar-thumb {
  background: #EFCA71;
  border-radius: 4px;
}

.menu-group {
  margin-bottom: 20px;
}

.menu-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #8C8C90;
  padding: 0 20px 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  color: #6F6C6D;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.menu-item:hover {
  background: #F9F7EB;
  color: #332F2E;
}

.menu-item.active {
  background: linear-gradient(90deg, rgba(239, 202, 113, 0.1), transparent);
  color: #332F2E;
  border-right: 3px solid #EFCA71;
}

.item-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  position: relative;
  flex-shrink: 0;
}

.item-icon i {
  font-size: 1rem;
}

.item-text {
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
}

.notification-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #C45A5A;
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  font-size: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  padding: 0 4px;
}

.version-info {
  padding: 16px 20px;
  text-align: center;
  border-top: 1px solid rgba(239, 202, 113, 0.15);
  font-size: 0.7rem;
  color: #8C8C90;
}

.version-info.collapsed {
  padding: 16px 0;
}

.version-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #EFCA71;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@media (max-width: 1024px) {
  .sidebar-container {
    width: 280px;
  }
}

@media (max-width: 480px) {
  .sidebar-container {
    width: 100%;
    max-width: 320px;
  }
}

@media (max-height: 600px) and (orientation: landscape) {
  .nav-menu {
    max-height: calc(100vh - 200px);
  }
}
</style>