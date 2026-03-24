<template>
  <div class="login-page">
    <!-- Animated Background -->
    <div class="animated-bg">
      <div class="gradient-sphere sphere-1"></div>
      <div class="gradient-sphere sphere-2"></div>
      <div class="gradient-sphere sphere-3"></div>
      <div class="gradient-sphere sphere-4"></div>
      <div class="grid-overlay"></div>
    </div>

    <!-- Main Container -->
    <div class="login-container">
      <!-- Left Panel - Brand & Stats -->
      <div class="brand-panel glass-card" :class="{ 'hide-on-mobile': isMobile }">
        <div class="brand-content">
          <!-- Logo Section -->
          <div class="logo-section">
            <div class="logo-wrapper">
              <div class="logo-icon">
                <svg viewBox="0 0 60 60" width="60" height="60">
                  <defs>
                    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#8B5CF6" />
                      <stop offset="100%" style="stop-color:#6D28D9" />
                    </linearGradient>
                  </defs>
                  <rect width="60" height="60" rx="12" fill="url(#logoGrad)" />
                  <path d="M15 30 L25 20 L35 30 L45 20 L35 40 L25 40 L15 30" fill="white" opacity="0.9" />
                </svg>
              </div>
              <div class="logo-text">
                <h1>Eyob Grocery</h1>
                <span>Inventory Management</span>
              </div>
            </div>
            <div class="brand-tagline">
              <h2>Smart Inventory,<br>Smarter Business</h2>
              <p>Real-time tracking · AI predictions · Smart alerts</p>
            </div>
          </div>

          <!-- Stats Cards -->
          <div class="stats-grid">
            <div class="stat-card" v-for="stat in stats" :key="stat.id">
              <div class="stat-icon" :style="{ background: stat.gradient }">
                <i :class="stat.icon"></i>
              </div>
              <div class="stat-details">
                <span class="stat-value">{{ stat.value }}</span>
                <span class="stat-label">{{ stat.label }}</span>
              </div>
              <div class="stat-trend" :class="stat.trendClass">
                <i :class="stat.trendIcon"></i>
                {{ stat.trend }}
              </div>
            </div>
          </div>

          <!-- Feature Highlights -->
          <div class="features-section">
            <div class="feature-item" v-for="feature in features" :key="feature.id">
              <div class="feature-icon" :style="{ background: feature.gradient }">
                <i :class="feature.icon"></i>
              </div>
              <div class="feature-content">
                <h4>{{ feature.title }}</h4>
                <p>{{ feature.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel - Login Form -->
      <div class="login-panel glass-card">
        <div class="login-card">
          <!-- Mobile Logo -->
          <div class="mobile-logo" v-if="isMobile">
            <div class="mobile-logo-icon">
              <svg viewBox="0 0 60 60" width="50" height="50">
                <rect width="60" height="60" rx="12" fill="url(#mobileLogoGrad)" />
                <path d="M15 30 L25 20 L35 30 L45 20 L35 40 L25 40 L15 30" fill="white" opacity="0.9" />
                <defs>
                  <linearGradient id="mobileLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#8B5CF6" />
                    <stop offset="100%" style="stop-color:#6D28D9" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h2>Eyob Grocery</h2>
            <p>Inventory Management System</p>
          </div>

          <!-- Header -->
          <div class="login-header">
            <h3>Welcome Back</h3>
            <p>Enter your credentials to access your account</p>
          </div>

          <!-- Login Form -->
          <form @submit.prevent="handleLogin" class="login-form">
            <!-- Error Alert -->
            <transition name="slide-down">
              <div v-if="error" class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i>
                <span>{{ error }}</span>
              </div>
            </transition>

            <!-- Success Alert -->
            <transition name="slide-down">
              <div v-if="successMessage" class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                <span>{{ successMessage }}</span>
              </div>
            </transition>

            <!-- Username Field -->
            <div class="input-group">
              <label for="username" class="input-label">
                <i class="fas fa-user"></i>
                <span>Username</span>
              </label>
              <input
                id="username"
                type="text"
                v-model="credentials.username"
                @focus="usernameFocused = true"
                @blur="usernameFocused = false"
                required
                class="input-field"
                :class="{ 'focused': usernameFocused || credentials.username }"
                placeholder="Enter your username"
                autocomplete="username"
              />
            </div>

            <!-- Password Field -->
            <div class="input-group">
              <label for="password" class="input-label">
                <i class="fas fa-lock"></i>
                <span>Password</span>
              </label>
              <div class="password-input-wrapper">
                <input
                  id="password"
                  :type="showPassword ? 'text' : 'password'"
                  v-model="credentials.password"
                  @focus="passwordFocused = true"
                  @blur="passwordFocused = false"
                  required
                  class="input-field"
                  :class="{ 'focused': passwordFocused || credentials.password }"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                />
                <button type="button" class="password-toggle" @click="togglePassword">
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
            </div>

            <!-- Form Options -->
            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" v-model="rememberMe" />
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">Remember me</span>
              </label>
              <a href="#" class="forgot-link" @click.prevent="handleForgotPassword">Forgot password?</a>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="btn-login" :disabled="loading">
              <span v-if="loading" class="spinner"></span>
              <span v-else>
                <i class="fas fa-sign-in-alt"></i>
                Sign In
              </span>
            </button>

            <!-- Demo Accounts -->
            <div class="demo-section">
              <div class="demo-header" @click="showDemos = !showDemos">
                <span>Quick Demo Access</span>
                <i class="fas fa-chevron-down" :class="{ 'rotated': showDemos }"></i>
              </div>
              <transition name="slide">
                <div class="demo-grid" v-show="showDemos">
                  <button
                    v-for="account in demoAccounts"
                    :key="account.role"
                    class="demo-btn"
                    @click="loginAsDemo(account)"
                    :style="{ borderColor: account.color }"
                  >
                    <i :class="account.icon" :style="{ color: account.color }"></i>
                    <span>{{ account.role }}</span>
                    <small>{{ account.username }}</small>
                  </button>
                </div>
              </transition>
            </div>
          </form>

          <!-- Footer -->
          <div class="login-footer">
            <div class="security-badge">
              <i class="fas fa-shield-alt"></i>
              <span>256-bit SSL</span>
            </div>
            <div class="security-badge">
              <i class="fas fa-clock"></i>
              <span>Session: 30min</span>
            </div>
            <div class="security-badge">
              <i class="fas fa-globe"></i>
              <span>v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../store/auth'
import AuthService from '../services/auth.service'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()

    const credentials = ref({ username: '', password: '' })
    const loading = ref(false)
    const error = ref('')
    const successMessage = ref('')
    const showPassword = ref(false)
    const rememberMe = ref(false)
    const showDemos = ref(false)
    const usernameFocused = ref(false)
    const passwordFocused = ref(false)
    const isMobile = ref(window.innerWidth <= 768)

    const handleResize = () => {
      isMobile.value = window.innerWidth <= 768
    }

    const stats = ref([
      { 
        id: 1, 
        icon: 'fas fa-box', 
        value: '15.2K', 
        label: 'Products',
        gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
        trend: '+12.5%',
        trendIcon: 'fas fa-arrow-up',
        trendClass: 'trend-up'
      },
      { 
        id: 2, 
        icon: 'fas fa-truck', 
        value: '240', 
        label: 'Suppliers',
        gradient: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
        trend: '+5.2%',
        trendIcon: 'fas fa-arrow-up',
        trendClass: 'trend-up'
      },
      { 
        id: 3, 
        icon: 'fas fa-chart-line', 
        value: '89%', 
        label: 'Fill Rate',
        gradient: 'linear-gradient(135deg, #C084FC, #9333EA)',
        trend: '-2.1%',
        trendIcon: 'fas fa-arrow-down',
        trendClass: 'trend-down'
      },
      { 
        id: 4, 
        icon: 'fas fa-clock', 
        value: '2.4h', 
        label: 'Turnover',
        gradient: 'linear-gradient(135deg, #E879F9, #C026D3)',
        trend: '+8.3%',
        trendIcon: 'fas fa-arrow-up',
        trendClass: 'trend-up'
      }
    ])

    const features = ref([
      {
        id: 1,
        icon: 'fas fa-chart-pie',
        title: 'Real-time Analytics',
        description: 'Live inventory tracking with insights',
        gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
      },
      {
        id: 2,
        icon: 'fas fa-bell',
        title: 'Smart Alerts',
        description: 'Get notified about low stock',
        gradient: 'linear-gradient(135deg, #A78BFA, #7C3AED)'
      },
      {
        id: 3,
        icon: 'fas fa-robot',
        title: 'AI Predictions',
        description: 'Forecast demand accurately',
        gradient: 'linear-gradient(135deg, #C084FC, #9333EA)'
      }
    ])

    const demoAccounts = ref([
      { 
        role: 'Admin', 
        username: 'admin', 
        password: 'admin123',
        icon: 'fas fa-crown',
        color: '#8B5CF6',
        route: '/admin/dashboard'
      },
      { 
        role: 'Cashier', 
        username: 'cashier', 
        password: 'cashier123',
        icon: 'fas fa-cash-register',
        color: '#10B981',
        route: '/cashier/dashboard'
      },
      { 
        role: 'Barista', 
        username: 'barista', 
        password: 'barista123',
        icon: 'fas fa-coffee',
        color: '#EF4444',
        route: '/barista/dashboard'
      }
    ])

    const handleLogin = async () => {
      if (!credentials.value.username || !credentials.value.password) {
        error.value = 'Please enter both username and password'
        setTimeout(() => error.value = '', 3000)
        return
      }

      loading.value = true
      error.value = ''

      try {
        // Login with credentials - this will automatically fetch user data
        const userData = await AuthService.login(credentials.value)
        
        console.log('✅ Login successful', userData)
        
        // Store in auth store
        authStore.setAuth(localStorage.getItem('authToken'), userData)
        
        // Handle remember me
        if (rememberMe.value) {
          localStorage.setItem('rememberMe', 'true')
          AuthService.saveUsername(credentials.value.username)
        } else {
          localStorage.removeItem('rememberMe')
          localStorage.removeItem('savedUsername')
        }
        
        successMessage.value = `Welcome back, ${userData.name || userData.username}!`
        setTimeout(() => successMessage.value = '', 2000)
        
        // Determine redirect based on user role
        let redirectRoute = '/'
        switch (userData.role) {
          case 'admin':
            redirectRoute = '/admin/dashboard'
            break
          case 'cashier':
            redirectRoute = '/cashier/dashboard'
            break
          case 'barista':
            redirectRoute = '/barista/dashboard'
            break
          default:
            redirectRoute = '/'
        }
        
        // Check for redirect parameter
        const redirect = route.query.redirect
        if (redirect) {
          redirectRoute = redirect
        }
        
        // Small delay for success message
        setTimeout(() => {
          router.push(redirectRoute)
        }, 500)
        
      } catch (err) {
        console.error('Login error:', err)
        error.value = err.detail || err.message || 'Invalid username or password'
        setTimeout(() => error.value = '', 3000)
      } finally {
        loading.value = false
      }
    }

    const loginAsDemo = async (account) => {
      credentials.value.username = account.username
      credentials.value.password = account.password
      await handleLogin()
    }

    const togglePassword = () => {
      showPassword.value = !showPassword.value
    }

    const handleForgotPassword = () => {
      error.value = 'Please contact your administrator to reset your password'
      setTimeout(() => error.value = '', 3000)
    }

    onMounted(async () => {
      window.addEventListener('resize', handleResize)
      await authStore.initializeAuth()
      
      // If already authenticated, redirect to appropriate dashboard
      if (authStore.isAuthenticated && route.path === '/login') {
        const routes = {
          admin: '/admin/dashboard',
          cashier: '/cashier/dashboard',
          barista: '/barista/dashboard'
        }
        const redirectRoute = routes[authStore.userRole] || '/'
        await router.push(redirectRoute)
      }
      
      // Check for remembered username
      const remembered = localStorage.getItem('rememberMe')
      if (remembered === 'true') {
        const savedUsername = AuthService.getSavedUsername()
        if (savedUsername) {
          credentials.value.username = savedUsername
          rememberMe.value = true
        }
      }
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    return {
      credentials,
      loading,
      error,
      successMessage,
      showPassword,
      rememberMe,
      showDemos,
      usernameFocused,
      passwordFocused,
      isMobile,
      stats,
      features,
      demoAccounts,
      handleLogin,
      loginAsDemo,
      togglePassword,
      handleForgotPassword
    }
  }
}
</script>



<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  position: relative;
  overflow-x: hidden;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Animated Background */
.animated-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.gradient-sphere {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s ease-in-out infinite;
}

.sphere-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  top: -100px;
  left: -100px;
}

.sphere-2 {
  width: 450px;
  height: 450px;
  background: linear-gradient(135deg, #A78BFA, #7C3AED);
  bottom: -50px;
  right: -50px;
  animation-delay: 5s;
}

.sphere-3 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #C084FC, #9333EA);
  top: 50%;
  left: 30%;
  animation-delay: 10s;
}

.sphere-4 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #E879F9, #C026D3);
  bottom: 20%;
  right: 20%;
  animation-delay: 15s;
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}

/* Glass Card */
.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
}

/* Main Container */
.login-container {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  z-index: 1;
  gap: 2rem;
  align-items: center;
}

/* Left Panel */
.brand-panel {
  padding: 2rem;
  animation: slideInLeft 0.8s ease-out;
}

.brand-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.logo-icon {
  filter: drop-shadow(0 4px 12px rgba(139, 92, 246, 0.3));
  animation: pulse 3s ease-in-out infinite;
}

.logo-text h1 {
  font-size: 1.8rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 0.25rem;
}

.logo-text span {
  font-size: 0.85rem;
  color: #6B7280;
}

.brand-tagline h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1F2937;
  line-height: 1.2;
  margin-bottom: 0.75rem;
}

.brand-tagline p {
  color: #6B7280;
  font-size: 0.9rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-card {
  padding: 1rem;
  border-radius: 16px;
  background: white;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  border: 1px solid rgba(139, 92, 246, 0.15);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1F2937;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.7rem;
  color: #6B7280;
}

.stat-trend {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.65rem;
  padding: 0.2rem 0.4rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 0.2rem;
  font-weight: 600;
}

/* Features Section */
.features-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 16px;
  background: white;
  border: 1px solid rgba(139, 92, 246, 0.15);
  transition: transform 0.3s ease;
}

.feature-item:hover {
  transform: translateX(5px);
}

.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
}

.feature-content h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 0.25rem;
}

.feature-content p {
  font-size: 0.75rem;
  color: #6B7280;
}

/* Right Panel - Login */
.login-panel {
  padding: 2rem;
  animation: slideInRight 0.8s ease-out;
}

/* Mobile Logo */
.mobile-logo {
  text-align: center;
  margin-bottom: 2rem;
  display: none;
}

.mobile-logo-icon {
  margin-bottom: 1rem;
  display: inline-block;
}

.mobile-logo h2 {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 0.25rem;
}

.mobile-logo p {
  font-size: 0.8rem;
  color: #6B7280;
}

.login-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.login-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: #6B7280;
  font-size: 0.85rem;
}

/* Form Styles */
.input-group {
  margin-bottom: 1.25rem;
}

.input-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}

.input-label i {
  margin-right: 0.5rem;
  color: #8B5CF6;
}

.input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  font-size: 0.95rem;
  background: white;
  transition: all 0.3s ease;
  color: #111827;
  font-weight: 500;
}

.input-field:focus {
  outline: none;
  border-color: #8B5CF6;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
}

.input-field.focused {
  border-color: #8B5CF6;
}

.input-field::placeholder {
  color: #9CA3AF;
  font-weight: 400;
}

.password-input-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  transition: color 0.3s ease;
  font-size: 1rem;
}

.password-toggle:hover {
  color: #8B5CF6;
}

/* Form Options */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: #6B7280;
}

.checkbox-label input {
  display: none;
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  border: 2px solid #E5E7EB;
  border-radius: 4px;
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-label input:checked + .checkbox-custom {
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  border-color: transparent;
}

.checkbox-label input:checked + .checkbox-custom::after {
  content: "";
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.forgot-link {
  color: #8B5CF6;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  transition: color 0.3s ease;
}

.forgot-link:hover {
  color: #6D28D9;
  text-decoration: underline;
}

/* Login Button */
.btn-login {
  width: 100%;
  padding: 0.75rem;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  color: white;
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  transition: all 0.3s ease;
  margin-bottom: 1.25rem;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Demo Section */
.demo-section {
  border-top: 1px solid rgba(139, 92, 246, 0.2);
  padding-top: 1.25rem;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem 0;
  color: #6B7280;
  font-size: 0.85rem;
  font-weight: 500;
}

.demo-header i {
  transition: transform 0.3s ease;
}

.demo-header i.rotated {
  transform: rotate(180deg);
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-top: 1rem;
}

.demo-btn {
  padding: 0.6rem;
  border: 2px solid #E5E7EB;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.3s ease;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1F2937;
}

.demo-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.demo-btn i {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.demo-btn small {
  font-size: 0.65rem;
  color: #9CA3AF;
  font-weight: 400;
}

/* Alerts */
.alert {
  padding: 0.75rem 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  animation: slideDown 0.3s ease-out;
}

.alert-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #EF4444;
  color: #EF4444;
}

.alert-success {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid #10B981;
  color: #10B981;
}

/* Login Footer */
.login-footer {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding-top: 1.25rem;
  margin-top: 1.25rem;
  border-top: 1px solid rgba(139, 92, 246, 0.2);
  flex-wrap: wrap;
}

.security-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: #9CA3AF;
}

.security-badge i {
  color: #8B5CF6;
  font-size: 0.8rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .login-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 1.5rem;
  }
  
  .brand-panel {
    order: 2;
  }
  
  .login-panel {
    order: 1;
  }
  
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .login-container {
    padding: 1rem;
  }
  
  .brand-panel {
    display: none;
  }
  
  .brand-panel.hide-on-mobile {
    display: none;
  }
  
  .mobile-logo {
    display: block;
  }
  
  .login-panel {
    padding: 1.5rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .demo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .login-footer {
    gap: 0.75rem;
  }
}

@media (max-width: 480px) {
  .login-panel {
    padding: 1.25rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .demo-grid {
    grid-template-columns: 1fr;
  }
  
  .form-options {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .login-footer {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .input-field {
    padding: 0.6rem 0.875rem;
    font-size: 0.9rem;
  }
  
  .btn-login {
    padding: 0.6rem;
    font-size: 0.9rem;
  }
}

/* Animations */
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-30px, 30px) scale(0.9); }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
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

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
  max-height: 300px;
  overflow: hidden;
}

.slide-enter-from, .slide-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>