<template>
  <div class="splash-screen" :class="{ 'splash-hidden': !visible }">
    <div class="splash-content">
      
      <!-- Logo Section -->
      <div class="logo-container card">
        <div class="logo-icon">
          <svg viewBox="0 0 60 60" width="80" height="80">
            <defs>
              <linearGradient id="splashLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#EFCA71" />
                <stop offset="100%" style="stop-color:#F2E9C6" />
              </linearGradient>
            </defs>
            <rect width="60" height="60" rx="12" fill="url(#splashLogoGrad)" />
            <!-- Inventory box icon -->
            <rect x="15" y="20" width="30" height="20" rx="2" fill="white" opacity="0.9" />
            <rect x="20" y="25" width="8" height="10" rx="1" fill="#332F2E" opacity="0.8" />
            <rect x="32" y="25" width="8" height="10" rx="1" fill="#332F2E" opacity="0.8" />
            <path d="M15 40 L30 45 L45 40" fill="white" opacity="0.9" />
          </svg>
        </div>

        <div class="logo-text">
          <h1 class="logo-title">Eyob Grocery</h1>
          <p class="logo-subtitle">Inventory Management System</p>
        </div>
      </div>

      <!-- Inventory Progress Bar -->
      <div class="inventory-loader card">
        <div class="inventory-shelf">
          <div class="shelf-label">Stock Loading</div>
          <div class="shelf-progress">
            <div 
              class="shelf-fill" 
              :style="{ width: progress + '%' }"
            >
              <div class="stock-items">
                <span v-for="n in 10" :key="n" class="stock-item"></span>
              </div>
            </div>
          </div>
          <span class="progress-text">{{ Math.floor(progress) }}%</span>
        </div>

        <div class="inventory-counter">
          <div class="counter-item">
            <i class="fas fa-box"></i>
            <span>Products: 1,248</span>
          </div>
          <div class="counter-item">
            <i class="fas fa-warehouse"></i>
            <span>Categories: 24</span>
          </div>
          <div class="counter-item">
            <i class="fas fa-chart-line"></i>
            <span>Low Stock: 8</span>
          </div>
        </div>
      </div>

      <!-- Status Messages - Inventory Themed -->
      <div class="status-messages card">
        <transition-group name="slide" tag="div" class="messages-container">
          <div v-for="(msg, index) in visibleMessages" :key="msg.id" class="status-message">
            <i :class="msg.icon"></i>
            <span>{{ msg.text }}</span>
          </div>
        </transition-group>
      </div>

      <!-- Warehouse Background Elements -->
      <div class="splash-background">
        <div class="warehouse-shelves">
          <div class="shelf-row" v-for="row in 3" :key="row">
            <div class="shelf-unit" v-for="unit in 6" :key="unit"></div>
          </div>
        </div>
        <div class="forklift">
          <div class="forklift-body"></div>
          <div class="forklift-mast"></div>
          <div class="forklift-forks"></div>
        </div>
        <div class="warehouse-grid"></div>
      </div>

      <!-- Version -->
      <div class="version-badge card">
        <i class="fas fa-code-branch"></i>
        <span>v2.0.0</span>
        <i class="fas fa-box-open"></i>
      </div>

    </div>   
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

const visible = ref(true)
const progress = ref(0)
const visibleMessages = ref([])

const statusMessages = ref([
  { id: 1, text: "Scanning inventory...", icon: "fas fa-barcode", duration: 1500 },
  { id: 2, text: "Counting stock levels", icon: "fas fa-calculator", duration: 1800 },
  { id: 3, text: "Verifying warehouse data", icon: "fas fa-warehouse", duration: 1600 },
  { id: 4, text: "Loading product database", icon: "fas fa-database", duration: 1700 },
  { id: 5, text: "Checking low stock alerts", icon: "fas fa-exclamation-triangle", duration: 1400 },
  { id: 6, text: "Preparing dashboard", icon: "fas fa-chart-pie", duration: 1500 },
  { id: 7, text: "System ready", icon: "fas fa-check-circle", duration: 1200 }
])

let progressInterval
let messageIndex = 0
let messageInterval

const showNextMessage = () => {
  if (messageIndex < statusMessages.value.length) {
    const msg = statusMessages.value[messageIndex]
    visibleMessages.value.push({ ...msg, id: Date.now() + msg.id })
    
    setTimeout(() => {
      visibleMessages.value = visibleMessages.value.filter(m => m.id !== msg.id)
    }, msg.duration)
    
    messageIndex++
  }
}

onMounted(async () => {
  const splashStart = Date.now()
  const MIN_SPLASH_TIME = 5000

  // Progress animation - smooth like inventory loading
  progressInterval = setInterval(() => {
    if (progress.value < 90) {
      // Slower, more deliberate progress
      progress.value += Math.random() * 3
    }
  }, 150)

  // Show status messages
  showNextMessage()
  messageInterval = setInterval(showNextMessage, 1300)

  try {
    if (!authStore.isInitialized) {
      await authStore.initializeAuth()
    }

    await new Promise(resolve => setTimeout(resolve, 800))

    let route = '/login'

    if (authStore.isAuthenticated && authStore.userRole) {
      progress.value = 100
      route = getDashboardRoute(authStore.userRole)
    } else {
      progress.value = 100
      route = '/login'
    }

    // Ensure splash shows for at least MIN_SPLASH_TIME
    const elapsed = Date.now() - splashStart
    const remaining = MIN_SPLASH_TIME - elapsed

    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining))
    }

    // Fade out
    visible.value = false
    clearInterval(progressInterval)
    clearInterval(messageInterval)

    setTimeout(() => {
      router.replace(route)
    }, 500)

  } catch (error) {
    console.error("Splash error:", error)
    router.replace('/login')
  }
})

onUnmounted(() => {
  if (progressInterval) clearInterval(progressInterval)
  if (messageInterval) clearInterval(messageInterval)
})

const getDashboardRoute = (role) => {
  const routes = {
    admin: '/admin/dashboard',
    manager: '/manager/dashboard',
    staff: '/staff/dashboard',
    warehouse: '/warehouse/dashboard',
    purchasing: '/purchasing/dashboard',
    auditor: '/auditor/dashboard'
  }
  return routes[role] || '/login'
}
</script>

<style scoped>
/* ===============================
   INVENTORY SYSTEM SPLASH THEME - PREMIUM GOLD
   =============================== */

/* Root Variables */
:root {
    --gold-primary: #EFCA71;
    --gold-light: #F2E9C6;
    --gold-dark: #E5B95C;
    --bg-dark: #332F2E;
    --bg-light: #F9F7EB;
    --text-primary: #332F2E;
    --text-secondary: #6F6C6D;
    --text-muted: #8C8C90;
    --border-light: #E5E5E2;
    --success-green: #88B788;
    --warning-gold: #EFCA71;
    --danger-red: #C45A5A;
}

/* Main Layout */
.splash-screen {
  position: fixed;
  inset: 0;
  background: var(--bg-light);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition: opacity 0.5s ease, visibility 0.5s ease;
  font-family: 'Inter', sans-serif;
}

.splash-hidden {
  opacity: 0;
  visibility: hidden;
}

.splash-content {
  text-align: center;
  position: relative;
  z-index: 2;
  max-width: 600px;
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Card Component */
.card {
  background: #FFFFFF;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(239, 202, 113, 0.15);
  padding: 20px;
  transition: all 0.3s ease;
}

/* Logo Section */
.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  animation: slideDown 0.8s ease;
}

.logo-icon {
  filter: drop-shadow(0 4px 12px rgba(239, 202, 113, 0.3));
}

.logo-text {
  text-align: left;
}

.logo-title {
  font-size: 2.8rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 0.25rem;
}

.logo-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
  letter-spacing: 1px;
}

/* Inventory Loader */
.inventory-loader {
  padding: 24px 20px;
  animation: fadeIn 1s ease 0.3s both;
}

.inventory-shelf {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.shelf-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  min-width: 80px;
  text-align: left;
}

.shelf-progress {
  flex: 1;
  height: 40px;
  background: #F9F7EB;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 1px solid var(--border-light);
}

.shelf-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-primary), var(--gold-light));
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stock-items {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
}

.stock-item {
  width: 8px;
  height: 24px;
  background: rgba(51, 47, 46, 0.3);
  border-radius: 2px;
  animation: stockPulse 1.5s ease-in-out infinite;
}

.stock-item:nth-child(even) {
  height: 16px;
  margin-top: 8px;
}

@keyframes stockPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

.progress-text {
  color: var(--text-primary);
  font-weight: 600;
  min-width: 45px;
  font-size: 1.1rem;
}

/* Inventory Counter */
.inventory-counter {
  display: flex;
  justify-content: space-around;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}

.counter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.counter-item i {
  color: var(--gold-primary);
  font-size: 1rem;
}

/* Status Messages */
.status-messages {
  padding: 16px;
  min-height: 80px;
}

.messages-container {
  position: relative;
  height: 50px;
}

.status-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-primary);
  padding: 12px 24px;
  background: #F9F7EB;
  border-radius: 40px;
  border: 1px solid var(--border-light);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.status-message i {
  color: var(--gold-primary);
}

/* Warehouse Background */
.splash-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 1;
  pointer-events: none;
}

.warehouse-shelves {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 8px;
  padding: 20px;
  opacity: 0.1;
}

.shelf-row {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.shelf-unit {
  width: 60px;
  height: 40px;
  background: var(--text-primary);
  border-radius: 4px;
  animation: shelfSlide 3s ease-in-out infinite;
  opacity: 0.3;
}

.shelf-unit:nth-child(even) {
  animation-delay: 0.5s;
}

@keyframes shelfSlide {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.forklift {
  position: absolute;
  bottom: 50px;
  left: -100px;
  animation: forkliftMove 15s linear infinite;
  opacity: 0.15;
}

.forklift-body {
  width: 80px;
  height: 40px;
  background: var(--text-primary);
  border-radius: 8px 8px 0 0;
  position: relative;
}

.forklift-body::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 10px;
  width: 30px;
  height: 15px;
  background: var(--text-primary);
  border-radius: 4px;
}

.forklift-mast {
  position: absolute;
  top: -30px;
  right: 0;
  width: 15px;
  height: 50px;
  background: var(--text-primary);
}

.forklift-forks {
  position: absolute;
  bottom: -10px;
  right: -10px;
  width: 30px;
  height: 10px;
  background: var(--text-primary);
}

@keyframes forkliftMove {
  from { left: -100px; }
  to { left: 100%; }
}

.warehouse-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(239, 202, 113, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(239, 202, 113, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.3;
  animation: gridPulse 4s ease-in-out infinite;
}

@keyframes gridPulse {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.4; }
}

/* Version Badge */
.version-badge {
  position: absolute;
  bottom: -70px;
  left: 50%;
  transform: translateX(-50%);
  color: var(--text-secondary);
  font-size: 0.9rem;
  padding: 8px 20px;
  white-space: nowrap;
  animation: fadeIn 1s ease 1s both;
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-badge i {
  color: var(--gold-primary);
}

/* Animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide Transitions for Messages */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.slide-move {
  transition: transform 0.4s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .logo-container {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .logo-text {
    text-align: center;
  }
  
  .logo-title {
    font-size: 2.2rem;
  }
  
  .inventory-shelf {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .shelf-label {
    text-align: center;
  }
  
  .inventory-counter {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .version-badge {
    bottom: -60px;
  }
}

@media (max-width: 480px) {
  .logo-title {
    font-size: 1.8rem;
  }
  
  .logo-subtitle {
    font-size: 0.8rem;
  }
  
  .shelf-progress {
    height: 30px;
  }
  
  .stock-item {
    width: 6px;
    height: 18px;
  }
  
  .stock-item:nth-child(even) {
    height: 12px;
  }
  
  .card {
    padding: 15px;
  }
}
</style>