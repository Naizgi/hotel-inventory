<template>
  <div class="unauthorized-page">
    <div class="content">
      <div class="icon">
        <i class="fas fa-lock"></i>
      </div>
      <h1>Access Denied</h1>
      <p>You don't have permission to access this page.</p>
      <p class="message">{{ message }}</p>
      <div class="actions">
        <button class="btn-primary" @click="goBack">
          <i class="fas fa-arrow-left"></i> Go Back
        </button>
        <button class="btn-secondary" @click="goToDashboard">
          <i class="fas fa-home"></i> Go to Dashboard
        </button>
        <button v-if="authStore.isAuthenticated" class="btn-secondary" @click="logout">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'

export default {
  name: 'Unauthorized',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const message = 'The page you are trying to access requires higher privileges.'
    
    const goBack = () => {
      router.back()
    }
    
    const goToDashboard = () => {
      const role = authStore.user?.role
      const dashboardRoutes = {
        admin: '/admin/dashboard',
        cashier: '/cashier/dashboard',
        barista: '/barista/dashboard'
      }
      const route = dashboardRoutes[role] || '/login'
      router.push(route)
    }
    
    const logout = async () => {
      await authStore.logout()
      router.push('/login')
    }
    
    return {
      authStore,
      message,
      goBack,
      goToDashboard,
      logout
    }
  }
}
</script>

<style scoped>
.unauthorized-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F9F7EB 0%, #FFFFFF 100%);
  padding: 24px;
}

.content {
  text-align: center;
  max-width: 500px;
  background: white;
  padding: 48px;
  border-radius: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.icon {
  font-size: 80px;
  color: #EFCA71;
  margin-bottom: 24px;
}

.icon i {
  animation: shake 0.5s ease-in-out;
}

h1 {
  font-size: 32px;
  font-weight: 700;
  color: #332F2E;
  margin: 0 0 16px 0;
}

p {
  color: #6F6C6D;
  margin: 0 0 8px 0;
  font-size: 16px;
}

.message {
  color: #8C8C90;
  font-size: 14px;
  margin-bottom: 32px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
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
  padding: 12px 24px;
  border-radius: 12px;
  color: #6F6C6D;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #E5E5E2;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

@media (max-width: 768px) {
  .content {
    padding: 32px 24px;
  }
  
  h1 {
    font-size: 24px;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>