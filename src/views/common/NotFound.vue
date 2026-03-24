<template>
  <div class="not-found-page">
    <div class="content">
      <div class="icon">
        <i class="fas fa-compass"></i>
      </div>
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you are looking for doesn't exist or has been moved.</p>
      <div class="actions">
        <button class="btn-primary" @click="goBack">
          <i class="fas fa-arrow-left"></i> Go Back
        </button>
        <button class="btn-secondary" @click="goHome">
          <i class="fas fa-home"></i> Go to Home
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  name: 'NotFound',
  setup() {
    const router = useRouter()
    
    const goBack = () => {
      router.back()
    }
    
    const goHome = () => {
      router.push('/')
    }
    
    return {
      goBack,
      goHome
    }
  }
}
</script>

<style scoped>
.not-found-page {
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
  animation: spin 1s ease-in-out;
}

h1 {
  font-size: 72px;
  font-weight: 800;
  color: #332F2E;
  margin: 0;
  line-height: 1;
}

h2 {
  font-size: 24px;
  font-weight: 600;
  color: #332F2E;
  margin: 16px 0;
}

p {
  color: #6F6C6D;
  margin: 0 0 32px 0;
  font-size: 16px;
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

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .content {
    padding: 32px 24px;
  }
  
  h1 {
    font-size: 56px;
  }
  
  h2 {
    font-size: 20px;
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