<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <h2>🏥 Hospital Management</h2>
    </div>
    
    <div class="navbar-menu">
      <div class="navbar-start">
        <router-link to="/" class="nav-link">Dashboard</router-link>
        <router-link to="/patients" class="nav-link">Patients</router-link>
        <router-link to="/appointments" class="nav-link">Appointments</router-link>
        <router-link v-if="isAdmin" to="/users" class="nav-link">Users</router-link>
      </div>
      
      <div class="navbar-end">
        <div class="user-info">
          <span class="user-name">{{ user?.full_name }}</span>
          <span class="user-role">{{ user?.role }}</span>
          <button @click="logout" class="btn btn-outline btn-sm">Logout</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { useAuthStore } from '../store/auth'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'Navbar',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()

    const user = computed(() => authStore.user)
    const isAdmin = computed(() => authStore.isAdmin)

    const logout = async () => {
      await authStore.logout()
      router.push('/login')
    }

    return {
      user,
      isAdmin,
      logout
    }
  }
}
</script>

<style scoped>
.navbar {
  background: white;
  border-bottom: 1px solid var(--border-color);
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.navbar-brand h2 {
  color: var(--primary-color);
  font-size: 1.5rem;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 30px;
}

.navbar-start {
  display: flex;
  gap: 20px;
}

.nav-link {
  text-decoration: none;
  color: var(--text-dark);
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.nav-link:hover {
  background-color: var(--light-bg);
  color: var(--primary-color);
}

.nav-link.router-link-active {
  background-color: var(--primary-color);
  color: white;
}

.navbar-end {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-name {
  font-weight: 500;
}

.user-role {
  background: var(--light-bg);
  color: var(--text-light);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: capitalize;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}
</style>