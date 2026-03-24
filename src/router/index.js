import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../components/SplashScreen.vue'),
    meta: { public: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { public: true, requiresGuest: true }
  },

  // ==============================
  // ADMIN DASHBOARD
  // ==============================
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboardHome',
        component: () => import('../views/dashboards/AdminDashboard.vue'),
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: 'items',
        name: 'AdminItems',
        component: () => import('../views/admin/Items.vue'),
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: 'coupons/setup',
        name: 'AdminCouponSetup',
        component: () => import('../views/admin/CouponSetup.vue'),
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: 'coupons/reset',
        name: 'AdminCouponReset',
        component: () => import('../views/admin/CouponReset.vue'),
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: 'purchases',
        name: 'AdminPurchases',
        component: () => import('../views/admin/Purchases.vue'),
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: 'reports',
        name: 'AdminReports',
        component: () => import('../views/admin/Reports.vue'),
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/admin/Users.vue'),
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('../views/admin/Settings.vue'),
        meta: { requiresAuth: true, role: 'admin' }
      },
      // Admin Inventory Management Routes
      {
        path: 'stock',
        name: 'AdminStock',
        component: () => import('../views/admin/StockManagement.vue'),
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: 'inventory',
        name: 'AdminInventory',
        component: () => import('../views/admin/AdminInventory.vue'),
        meta: { requiresAuth: true, role: 'admin' }
      },
      {
        path: 'stock-requests',
        name: 'AdminStockRequests',
        component: () => import('../views/admin/StockRequests.vue'),
        meta: { requiresAuth: true, role: 'admin' }
      }
    ]
  },

  // ==============================
  // CASHIER DASHBOARD
  // ==============================
  {
    path: '/cashier',
    name: 'CashierDashboard',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/cashier/dashboard',
    meta: { requiresAuth: true, role: 'cashier' },
    children: [
      {
        path: 'dashboard',
        name: 'CashierDashboardHome',
        component: () => import('../views/dashboards/CashierDashboard.vue'),
        meta: { requiresAuth: true, role: 'cashier' }
      },
      {
        path: 'pos',
        name: 'CashierPOS',
        component: () => import('../views/cashier/Sales.vue'),
        meta: { requiresAuth: true, role: 'cashier' }
      },
      {
        path: 'coupons/remaining',
        name: 'CashierRemainingCoupons',
        component: () => import('../views/cashier/RemainingCoupons.vue'),
        meta: { requiresAuth: true, role: 'cashier' }
      },
      {
        path: 'transactions',
        name: 'CashierTransactions',
        component: () => import('../views/cashier/Transactions.vue'),
        meta: { requiresAuth: true, role: 'cashier' }
      },
      {
        path: 'sales-history',
        name: 'CashierSalesHistory',
        component: () => import('../views/cashier/SalesHistory.vue'),
        meta: { requiresAuth: true, role: 'cashier' }
      }
    ]
  },

  // ==============================
  // BARISTA DASHBOARD
  // ==============================
  {
    path: '/barista',
    name: 'BaristaDashboard',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/barista/dashboard',
    meta: { requiresAuth: true, role: 'barista' },
    children: [
      {
        path: 'dashboard',
        name: 'BaristaDashboardHome',
        component: () => import('../views/barista/Dashboard.vue'),
        meta: { requiresAuth: true, role: 'barista' }
      },
      {
        path: 'inventory',
        name: 'BaristaInventory',
        component: () => import('../views/barista/Inventory.vue'),
        meta: { requiresAuth: true, role: 'barista' }
      },
      {
        path: 'distribute',
        name: 'BaristaDistributeCoupons',
        component: () => import('../views/barista/DistributeCoupons.vue'),
        meta: { requiresAuth: true, role: 'barista' }
      },
      {
        path: 'request-stock',
        name: 'BaristaRequestStock',
        component: () => import('../views/barista/RequestStock.vue'),
        meta: { requiresAuth: true, role: 'barista' }
      },
      {
        path: 'track-coupons',
        name: 'BaristaTrackCoupons',
        component: () => import('../views/barista/TrackCoupons.vue'),
        meta: { requiresAuth: true, role: 'barista' }
      },
      {
        path: 'stock-requests',
        name: 'BaristaStockRequests',
        component: () => import('../views/barista/StockRequestHistory.vue'),
        meta: { requiresAuth: true, role: 'barista' }
      }
    ]
  },

  // ==============================
  // COUPON & REPORTS (Shared Routes)
  // ==============================
  {
    path: '/coupons',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'daily',
        name: 'DailyCoupons',
        component: () => import('../views/common/DailyCoupons.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/reports',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'daily',
        name: 'DailyReport',
        component: () => import('../views/reports/DailyReport.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'fast-moving',
        name: 'FastMovingItems',
        component: () => import('../views/reports/FastMovingItems.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'slow-moving',
        name: 'SlowMovingItems',
        component: () => import('../views/reports/SlowMovingItems.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'coupon-usage',
        name: 'CouponUsageReport',
        component: () => import('../views/reports/CouponUsageReport.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'revenue',
        name: 'RevenueSummary',
        component: () => import('../views/reports/RevenueSummary.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'stock-movements',
        name: 'StockMovementsReport',
        component: () => import('../views/reports/StockMovements.vue'),
        meta: { requiresAuth: true, role: 'admin' }
      }
    ]
  },

  // ==============================
  // COMMON PAGES
  // ==============================
  {
    path: '/profile',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { 
        path: '', 
        name: 'Profile', 
        component: () => import('../views/common/Profile.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/notifications',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { 
        path: '', 
        name: 'Notifications', 
        component: () => import('../views/common/Notifications.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },

  // ==============================
  // ERROR & UNAUTHORIZED
  // ==============================
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('../views/common/Unauthorized.vue'),
    meta: { public: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/common/NotFound.vue'),
    meta: { public: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Helper function to get dashboard route by role
const getDashboardRoute = (role) => {
  const map = {
    admin: '/admin/dashboard',
    cashier: '/cashier/dashboard',
    barista: '/barista/dashboard'
  }
  return map[role] || '/login'
}

// Helper function to check if user has required role
const hasRequiredRole = (userRole, requiredRole) => {
  if (!requiredRole) return true
  // Admin can access all routes
  if (userRole === 'admin') return true
  return userRole === requiredRole
}

// ==========================================
// ENHANCED ROUTER GUARD WITH API INTEGRATION
// ==========================================
router.beforeEach(async (to, from, next) => {
  console.log('🔄 Navigation:', from.path, '→', to.path)

  const authStore = useAuthStore()

  // Initialize auth store if not initialized
  if (!authStore.isInitialized) {
    console.log('🕒 Router: Initializing auth store...')
    try {
      await authStore.initializeAuth()
      console.log('✅ Router: Auth store initialized')
    } catch (error) {
      console.error('❌ Router: Auth initialization failed:', error)
    }
  }

  const { isAuthenticated, userRole, user } = authStore
  console.log('🔐 Auth State:', { isAuthenticated, userRole, user: user?.username, to: to.path })

  // ==========================================
  // PUBLIC ROUTES
  // ==========================================
  if (to.meta.public) {
    console.log('🌐 Public route access:', to.path)
    
    // If authenticated user tries to access login or home, redirect to dashboard
    if (to.meta.requiresGuest && isAuthenticated) {
      const dashboardRoute = getDashboardRoute(userRole)
      console.log('📍 Router: Redirecting authenticated user to:', dashboardRoute)
      return next(dashboardRoute)
    }
    
    return next()
  }

  // ==========================================
  // PROTECTED ROUTES
  // ==========================================
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('🚫 Router: Not authenticated - redirecting to login')
    sessionStorage.setItem('redirectAfterLogin', to.fullPath)
    return next('/login')
  }

  // ==========================================
  // ROLE-BASED ACCESS CONTROL
  // ==========================================
  
  // Check if route requires a specific role
  const requiredRole = to.meta.role
  
  if (requiredRole && !hasRequiredRole(userRole, requiredRole)) {
    console.log('👮 Router: Role mismatch:', {
      required: requiredRole,
      current: userRole,
      path: to.path
    })
    return next('/unauthorized')
  }

  // Check if user is trying to access a dashboard that doesn't match their role
  const isRoleSpecificRoute = to.path.includes('/admin/') || 
                               to.path.includes('/cashier/') || 
                               to.path.includes('/barista/')
  
  if (isRoleSpecificRoute) {
    const expectedRole = to.path.split('/')[1]
    if (expectedRole !== userRole && userRole !== 'admin') {
      console.log('🔄 Router: Redirecting to correct dashboard')
      const correctDashboard = getDashboardRoute(userRole)
      return next(correctDashboard)
    }
  }

  console.log('✅ Router: Access granted:', to.path)
  next()
})

router.onError((error) => {
  console.error('Router error:', error)
})

router.afterEach((to) => {
  const title = to.meta?.title || 'Eyob Bar & Restaurant'
  document.title = `${title} | Management System`
})

export default router