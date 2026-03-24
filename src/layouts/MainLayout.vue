<template>
  <div class="main-layout">
    <!-- Header Component -->
    <Header />
    
    <div class="layout-container">
      <!-- Sidebar -->
      <RoleBasedSidebar v-if="showSidebar && isAuthenticated" />
      
      <!-- Main Content Area -->
      <main class="main-content" :class="{ 
        'with-sidebar': showSidebar && isAuthenticated,
        'without-sidebar': !showSidebar || !isAuthenticated 
      }">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="$route.path" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import Header from './Header.vue'
import RoleBasedSidebar from '../components/RoleBasedSidebar.vue'

export default {
  name: 'MainLayout',
  components: {
    Header,
    RoleBasedSidebar
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    
    const showSidebar = ref(true)
    
    const isAuthenticated = computed(() => authStore.isAuthenticated)
    const userRole = computed(() => authStore.userRole)
    const user = computed(() => authStore.user)

    // Watch for route changes to debug navigation
    watch(() => route.path, (newPath, oldPath) => {
      console.log('🔄 Route changed:', oldPath, '→', newPath)
      console.log('📱 Current route:', newPath)
      console.log('🔐 Auth state:', { 
        isAuthenticated: isAuthenticated.value, 
        userRole: userRole.value 
      })
    })

    // Hide sidebar on login page
    watch(() => route.path, (path) => {
      if (path === '/login' || path === '/') {
        showSidebar.value = false
      } else {
        showSidebar.value = true
      }
    }, { immediate: true })

    onMounted(() => {
      console.log('🏠 MainLayout mounted')
      console.log('📍 Current route:', route.path)
      console.log('🔐 Auth state:', { 
        isAuthenticated: isAuthenticated.value, 
        userRole: userRole.value,
        userName: authStore.userName
      })
      
      // Force a small delay to ensure DOM is ready
      setTimeout(() => {
        console.log('📦 Main content container:', document.querySelector('.main-content'))
      }, 100)
    })

    return {
      showSidebar,
      isAuthenticated,
      userRole,
      user
    }
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F9F7EB;
  position: relative;
  width: 100%;
  overflow-x: hidden;
}

.layout-container {
  display: flex;
  flex: 1;
  margin-top: 70px; /* Header height */
  min-height: calc(100vh - 70px);
  position: relative;
  width: 100%;
}

.main-content {
  flex: 1;
  padding: 24px;
  background: #F9F7EB;
  min-height: calc(100vh - 70px);
  overflow-y: auto;
  transition: all 0.3s ease;
  position: relative;
}

.main-content.with-sidebar {
  margin-left: 280px;
  width: calc(100% - 280px);
}

.main-content.without-sidebar {
  margin-left: 0;
  width: 100%;
}

/* Custom scrollbar */
.main-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: #E5E5E2;
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb {
  background: #EFCA71;
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: #E5C55E;
}

/* Transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive design */
@media (max-width: 1024px) {
  .main-content.with-sidebar {
    margin-left: 80px;
    width: calc(100% - 80px);
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .layout-container {
    flex-direction: column;
  }
  
  .main-content.with-sidebar {
    margin-left: 0;
    width: 100%;
    padding: 16px;
  }
  
  .main-content {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 12px;
  }
}
</style>