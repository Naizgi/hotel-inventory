<template>
  <div class="users-management">
    <div class="page-header">
      <h1 class="page-title">User Management</h1>
      <div class="header-actions">
        <button class="btn-primary" @click="openUserModal()">
          <i class="fas fa-user-plus"></i> Add New User
        </button>
        <button class="btn-secondary" @click="openWaiterModal()">
          <i class="fas fa-utensils"></i> Add Waiter
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button 
        :class="['tab', { active: activeTab === 'users' }]" 
        @click="activeTab = 'users'"
      >
        <i class="fas fa-users"></i> System Users
      </button>
      <button 
        :class="['tab', { active: activeTab === 'waiters' }]" 
        @click="activeTab = 'waiters'"
      >
        <i class="fas fa-utensils"></i> Waiters
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>

    <div v-else>
      <!-- System Users Section -->
      <div v-if="activeTab === 'users'">
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-info">
              <h3>{{ users.length }}</h3>
              <p>Total Users</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-user-cog"></i>
            </div>
            <div class="stat-info">
              <h3>{{ adminCount }}</h3>
              <p>Admins</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-cash-register"></i>
            </div>
            <div class="stat-info">
              <h3>{{ cashierCount }}</h3>
              <p>Cashiers</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-mug-hot"></i>
            </div>
            <div class="stat-info">
              <h3>{{ baristaCount }}</h3>
              <p>Baristas</p>
            </div>
          </div>
        </div>

        <!-- Search and Filter -->
        <div class="search-filter">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search by name or username..."
            >
          </div>
          <div class="filter-box">
            <select v-model="filterRole">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="cashier">Cashier</option>
              <option value="barista">Barista</option>
            </select>
          </div>
          <div class="filter-box">
            <select v-model="filterStatus">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <!-- Users Table -->
        <div class="table-container">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in filteredUsers" :key="user.id">
                  <td data-label="ID">#{{ user.id }}</td>
                  <td data-label="User">
                    <div class="user-info">
                      <div class="user-avatar" :style="getAvatarStyle(user)">
                        {{ getUserInitials(user) }}
                      </div>
                      <div>
                        <div class="name">{{ user.name }}</div>
                        <div class="email">{{ user.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Username">{{ user.username }}</td>
                  <td data-label="Role">
                    <span :class="['role-badge', user.role]">
                      {{ formatRole(user.role) }}
                    </span>
                  </td>
                  <td data-label="Status">
                    <span :class="['status-badge', user.status || 'active']">
                      {{ user.status || 'active' }}
                    </span>
                  </td>
                  <td data-label="Last Login">{{ formatDate(user.last_login) }}</td>
                  <td data-label="Actions" class="actions">
                    <button class="btn-icon" @click="openUserModal(user)" title="Edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" @click="resetPassword(user)" title="Reset Password">
                      <i class="fas fa-key"></i>
                    </button>
                    <button class="btn-icon danger" @click="confirmDelete(user)" title="Delete">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredUsers.length === 0">
                  <td colspan="7" class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <p>No users found</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Waiters Section -->
      <div v-if="activeTab === 'waiters'">
        <!-- Stats Cards for Waiters -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-utensils"></i>
            </div>
            <div class="stat-info">
              <h3>{{ waiters.length }}</h3>
              <p>Total Waiters</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-user-check"></i>
            </div>
            <div class="stat-info">
              <h3>{{ activeWaitersCount }}</h3>
              <p>Active Waiters</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-ticket-alt"></i>
            </div>
            <div class="stat-info">
              <h3>{{ totalDistributedCoupons }}</h3>
              <p>Total Coupons Distributed</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="stat-info">
              <h3>{{ averageCouponsPerWaiter }}</h3>
              <p>Avg Coupons/Waiter</p>
            </div>
          </div>
        </div>

        <!-- Search and Filter for Waiters -->
        <div class="search-filter">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input 
              type="text" 
              v-model="waiterSearchQuery" 
              placeholder="Search waiters by name..."
            >
          </div>
          <div class="filter-box">
            <select v-model="waiterFilterStatus">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <!-- Waiters Table -->
        <div class="table-container">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Waiter</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Hire Date</th>
                  <th>Status</th>
                  <th>Coupons Distributed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="waiter in filteredWaiters" :key="waiter.id">
                  <td data-label="ID">#{{ waiter.id }}</td>
                  <td data-label="Waiter">
                    <div class="user-info">
                      <div class="waiter-avatar">
                        {{ getInitials(waiter.name) }}
                      </div>
                      <div>
                        <div class="name">{{ waiter.name }}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Phone">{{ waiter.phone || '-' }}</td>
                  <td data-label="Email">{{ waiter.email || '-' }}</td>
                  <td data-label="Hire Date">{{ formatDate(waiter.hire_date) }}</td>
                  <td data-label="Status">
                    <span :class="['status-badge', waiter.is_active ? 'active' : 'inactive']">
                      {{ waiter.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td data-label="Coupons Distributed">
                    <span class="coupon-count">{{ waiter.coupons_distributed || 0 }}</span>
                  </td>
                  <td data-label="Actions" class="actions">
                    <button class="btn-icon" @click="openWaiterModal(waiter)" title="Edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon danger" @click="confirmDeleteWaiter(waiter)" title="Delete">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredWaiters.length === 0">
                  <td colspan="8" class="empty-state">
                    <i class="fas fa-utensils-slash"></i>
                    <p>No waiters found</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- User Modal -->
    <div v-if="showModal" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Edit User' : 'Add New User' }}</h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveUser">
            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" v-model="formData.name" required placeholder="Enter full name">
            </div>
            <div class="form-group">
              <label>Username *</label>
              <input type="text" v-model="formData.username" required placeholder="Enter username">
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input type="email" v-model="formData.email" required placeholder="Enter email address">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Role *</label>
                <select v-model="formData.role" required>
                  <option value="admin">Admin</option>
                  <option value="cashier">Cashier</option>
                  <option value="barista">Barista</option>
                </select>
              </div>
              <div class="form-group">
                <label>Status</label>
                <select v-model="formData.status">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div class="form-group" v-if="!isEditing">
              <label>Password *</label>
              <input type="password" v-model="formData.password" required placeholder="Enter password">
            </div>
            <div class="form-group" v-if="!isEditing">
              <label>Confirm Password *</label>
              <input type="password" v-model="formData.confirmPassword" required placeholder="Confirm password">
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="saving">
                <span v-if="saving">Saving...</span>
                <span v-else>Save User</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Waiter Modal -->
    <div v-if="showWaiterModal" class="modal" @click.self="closeWaiterModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ isEditingWaiter ? 'Edit Waiter' : 'Add New Waiter' }}</h2>
          <button class="close-btn" @click="closeWaiterModal">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveWaiter">
            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" v-model="waiterForm.name" required placeholder="Enter full name">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Phone</label>
                <input type="text" v-model="waiterForm.phone" placeholder="Enter phone number">
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" v-model="waiterForm.email" placeholder="Enter email address">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Hire Date</label>
                <input type="date" v-model="waiterForm.hire_date">
              </div>
              <div class="form-group">
                <label>Status</label>
                <select v-model="waiterForm.is_active">
                  <option :value="true">Active</option>
                  <option :value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Notes</label>
              <textarea v-model="waiterForm.notes" rows="3" placeholder="Additional notes..."></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="closeWaiterModal">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="savingWaiter">
                <span v-if="savingWaiter">Saving...</span>
                <span v-else>Save Waiter</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Password Reset Modal -->
    <div v-if="showPasswordModal" class="modal" @click.self="closePasswordModal">
      <div class="modal-content small">
        <div class="modal-header">
          <h2>Reset Password</h2>
          <button class="close-btn" @click="closePasswordModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>Reset password for <strong>{{ selectedUser?.name }}</strong></p>
          <div class="form-group">
            <label>New Password</label>
            <input type="password" v-model="newPassword" placeholder="Enter new password">
          </div>
          <div class="form-group">
            <label>Confirm Password</label>
            <input type="password" v-model="confirmNewPassword" placeholder="Confirm new password">
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closePasswordModal">Cancel</button>
            <button class="btn-primary" @click="saveNewPassword" :disabled="resettingPassword">
              {{ resettingPassword ? 'Resetting...' : 'Reset Password' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal" @click.self="closeDeleteModal">
      <div class="modal-content small">
        <div class="modal-header">
          <h2>Confirm Delete</h2>
          <button class="close-btn" @click="closeDeleteModal">&times;</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete "{{ userToDelete?.name || waiterToDelete?.name }}"?</p>
          <p class="warning-text">This action cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeDeleteModal">Cancel</button>
            <button class="btn-danger" @click="deleteItem" :disabled="deleting">
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'

export default {
  name: 'AdminUsers',
  setup() {
    const toast = useToast()
    
    // State
    const activeTab = ref('users')
    const loading = ref(true)
    const saving = ref(false)
    const savingWaiter = ref(false)
    const deleting = ref(false)
    const resettingPassword = ref(false)
    
    // Users
    const users = ref([])
    const searchQuery = ref('')
    const filterRole = ref('')
    const filterStatus = ref('')
    
    // Waiters
    const waiters = ref([])
    const waiterSearchQuery = ref('')
    const waiterFilterStatus = ref('')
    
    // Modals
    const showModal = ref(false)
    const showWaiterModal = ref(false)
    const showPasswordModal = ref(false)
    const showDeleteModal = ref(false)
    const isEditing = ref(false)
    const isEditingWaiter = ref(false)
    const selectedUser = ref(null)
    const selectedWaiter = ref(null)
    const userToDelete = ref(null)
    const waiterToDelete = ref(null)
    
    // Form data
    const formData = ref({
      name: '',
      username: '',
      email: '',
      role: 'cashier',
      status: 'active',
      password: '',
      confirmPassword: ''
    })
    
    const waiterForm = ref({
      name: '',
      phone: '',
      email: '',
      hire_date: '',
      is_active: true,
      notes: ''
    })
    
    const newPassword = ref('')
    const confirmNewPassword = ref('')
    
    // Computed for Users
    const adminCount = computed(() => users.value.filter(u => u.role === 'admin').length)
    const cashierCount = computed(() => users.value.filter(u => u.role === 'cashier').length)
    const baristaCount = computed(() => users.value.filter(u => u.role === 'barista').length)
    
    const filteredUsers = computed(() => {
      let filtered = [...users.value]
      if (searchQuery.value) {
        filtered = filtered.filter(u => 
          u.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          u.username?.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }
      if (filterRole.value) filtered = filtered.filter(u => u.role === filterRole.value)
      if (filterStatus.value) filtered = filtered.filter(u => u.status === filterStatus.value)
      return filtered
    })
    
    // Computed for Waiters
    const activeWaitersCount = computed(() => waiters.value.filter(w => w.is_active).length)
    const totalDistributedCoupons = computed(() => 
      waiters.value.reduce((sum, w) => sum + (w.coupons_distributed || 0), 0)
    )
    const averageCouponsPerWaiter = computed(() => 
      waiters.value.length ? Math.round(totalDistributedCoupons.value / waiters.value.length) : 0
    )
    
    const filteredWaiters = computed(() => {
      let filtered = [...waiters.value]
      if (waiterSearchQuery.value) {
        filtered = filtered.filter(w => 
          w.name?.toLowerCase().includes(waiterSearchQuery.value.toLowerCase())
        )
      }
      if (waiterFilterStatus.value) {
        filtered = filtered.filter(w => 
          waiterFilterStatus.value === 'active' ? w.is_active : !w.is_active
        )
      }
      return filtered
    })
    
    // Helper functions
    const formatRole = (role) => role ? role.charAt(0).toUpperCase() + role.slice(1) : ''
    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'
    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??'
    
    const getUserInitials = (user) => getInitials(user.name)
    
    const getAvatarStyle = (user) => {
      const colors = {
        admin: 'linear-gradient(135deg, #EFCA71, #F2E9C6)',
        cashier: 'linear-gradient(135deg, #88B788, #A8E6A8)',
        barista: 'linear-gradient(135deg, #F4A261, #F2E9C6)'
      }
      return { background: colors[user.role] || colors.admin }
    }
    
    const getAuthHeaders = () => {
      const token = localStorage.getItem('authToken')
      return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }
    
    // Fetch functions
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users', { headers: getAuthHeaders() })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        users.value = Array.isArray(data) ? data : (data.users || data.data || [])
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.error('Failed to load users')
        users.value = []
      }
    }
    
    const fetchWaiters = async () => {
      try {
        const response = await fetch('/api/cashier/waiters', { headers: getAuthHeaders() })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        waiters.value = Array.isArray(data) ? data : (data.waiters || data.data || [])
      } catch (error) {
        console.error('Error fetching waiters:', error)
        toast.error('Failed to load waiters')
        waiters.value = []
      }
    }
    
    // User CRUD
    const openUserModal = (user = null) => {
      isEditing.value = !!user
      selectedUser.value = user
      if (user) {
        formData.value = {
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status || 'active',
          password: '',
          confirmPassword: ''
        }
      } else {
        formData.value = {
          name: '', username: '', email: '', role: 'cashier', status: 'active', password: '', confirmPassword: ''
        }
      }
      showModal.value = true
    }
    
    const saveUser = async () => {
      if (!isEditing.value && formData.value.password !== formData.value.confirmPassword) {
        toast.error('Passwords do not match')
        return
      }
      saving.value = true
      try {
        const url = isEditing.value ? `/api/admin/users/${selectedUser.value.id}` : '/api/admin/users'
        const method = isEditing.value ? 'PUT' : 'POST'
        const response = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(formData.value) })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        toast.success(isEditing.value ? 'User updated' : 'User created')
        await fetchUsers()
        closeModal()
      } catch (error) {
        console.error('Error saving user:', error)
        toast.error('Error saving user')
      } finally {
        saving.value = false
      }
    }
    
    // Waiter CRUD
    const openWaiterModal = (waiter = null) => {
      isEditingWaiter.value = !!waiter
      selectedWaiter.value = waiter
      if (waiter) {
        waiterForm.value = {
          name: waiter.name,
          phone: waiter.phone || '',
          email: waiter.email || '',
          hire_date: waiter.hire_date ? waiter.hire_date.split('T')[0] : '',
          is_active: waiter.is_active,
          notes: waiter.notes || ''
        }
      } else {
        waiterForm.value = {
          name: '', phone: '', email: '', hire_date: '', is_active: true, notes: ''
        }
      }
      showWaiterModal.value = true
    }
    
    const saveWaiter = async () => {
      savingWaiter.value = true
      try {
        const url = isEditingWaiter.value ? `/api/cashier/waiters/${selectedWaiter.value.id}` : '/api/cashier/waiters'
        const method = isEditingWaiter.value ? 'PUT' : 'POST'
        const response = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(waiterForm.value) })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        toast.success(isEditingWaiter.value ? 'Waiter updated' : 'Waiter created')
        await fetchWaiters()
        closeWaiterModal()
      } catch (error) {
        console.error('Error saving waiter:', error)
        toast.error('Error saving waiter')
      } finally {
        savingWaiter.value = false
      }
    }
    
    // Password reset
    const resetPassword = (user) => {
      selectedUser.value = user
      newPassword.value = ''
      confirmNewPassword.value = ''
      showPasswordModal.value = true
    }
    
    const saveNewPassword = async () => {
      if (newPassword.value !== confirmNewPassword.value) {
        toast.error('Passwords do not match')
        return
      }
      if (newPassword.value.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }
      resettingPassword.value = true
      try {
        const response = await fetch(`/api/admin/users/${selectedUser.value.id}/password`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ password: newPassword.value })
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        toast.success('Password reset successfully')
        closePasswordModal()
      } catch (error) {
        console.error('Error resetting password:', error)
        toast.error('Error resetting password')
      } finally {
        resettingPassword.value = false
      }
    }
    
    // Delete
    const confirmDelete = (user) => {
      userToDelete.value = user
      waiterToDelete.value = null
      showDeleteModal.value = true
    }
    
    const confirmDeleteWaiter = (waiter) => {
      waiterToDelete.value = waiter
      userToDelete.value = null
      showDeleteModal.value = true
    }
    
    const deleteItem = async () => {
      deleting.value = true
      try {
        if (userToDelete.value) {
          const response = await fetch(`/api/admin/users/${userToDelete.value.id}`, { method: 'DELETE', headers: getAuthHeaders() })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          toast.success('User deleted successfully')
          await fetchUsers()
        } else if (waiterToDelete.value) {
          const response = await fetch(`/api/cashier/waiters/${waiterToDelete.value.id}`, { method: 'DELETE', headers: getAuthHeaders() })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          toast.success('Waiter deleted successfully')
          await fetchWaiters()
        }
        closeDeleteModal()
      } catch (error) {
        console.error('Error deleting:', error)
        toast.error('Error deleting')
      } finally {
        deleting.value = false
      }
    }
    
    // Close modals
    const closeModal = () => { showModal.value = false }
    const closeWaiterModal = () => { showWaiterModal.value = false }
    const closePasswordModal = () => { showPasswordModal.value = false }
    const closeDeleteModal = () => { showDeleteModal.value = false; userToDelete.value = null; waiterToDelete.value = null }
    
    onMounted(async () => {
      loading.value = true
      await Promise.all([fetchUsers(), fetchWaiters()])
      loading.value = false
    })
    
    return {
      activeTab,
      loading,
      saving,
      savingWaiter,
      deleting,
      resettingPassword,
      users,
      waiters,
      searchQuery,
      filterRole,
      filterStatus,
      waiterSearchQuery,
      waiterFilterStatus,
      showModal,
      showWaiterModal,
      showPasswordModal,
      showDeleteModal,
      isEditing,
      isEditingWaiter,
      selectedUser,
      selectedWaiter,
      userToDelete,
      waiterToDelete,
      formData,
      waiterForm,
      newPassword,
      confirmNewPassword,
      adminCount,
      cashierCount,
      baristaCount,
      activeWaitersCount,
      totalDistributedCoupons,
      averageCouponsPerWaiter,
      filteredUsers,
      filteredWaiters,
      formatRole,
      formatDate,
      getInitials,
      getUserInitials,
      getAvatarStyle,
      openUserModal,
      openWaiterModal,
      saveUser,
      saveWaiter,
      resetPassword,
      saveNewPassword,
      confirmDelete,
      confirmDeleteWaiter,
      deleteItem,
      closeModal,
      closeWaiterModal,
      closePasswordModal,
      closeDeleteModal
    }
  }
}
</script>

<style scoped>
.users-management {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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

/* Tabs */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #E5E5E2;
}

.tab {
  padding: 12px 24px;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 600;
  color: #8C8C90;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
}

.tab:hover {
  color: #EFCA71;
}

.tab.active {
  color: #EFCA71;
  border-bottom-color: #EFCA71;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #332F2E;
}

.stat-info h3 {
  font-size: 24px;
  font-weight: 700;
  color: #332F2E;
  margin: 0;
}

.stat-info p {
  color: #8C8C90;
  margin: 0;
  font-size: 14px;
}

/* Search and Filter */
.search-filter {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  position: relative;
  min-width: 200px;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #8C8C90;
}

.search-box input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 14px;
}

.filter-box select {
  padding: 10px 24px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  background: white;
  cursor: pointer;
}

/* Table Styles */
.table-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.data-table th {
  text-align: left;
  padding: 16px;
  background: #F9F7EB;
  color: #332F2E;
  font-weight: 600;
  border-bottom: 1px solid #E5E5E2;
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid #F0F0F0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar, .waiter-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #332F2E;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  flex-shrink: 0;
}

.name {
  font-weight: 600;
  color: #332F2E;
}

.email {
  font-size: 12px;
  color: #8C8C90;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.role-badge.admin { background: #FFF3E0; color: #F57C00; }
.role-badge.cashier { background: #E3F2FD; color: #1976D2; }
.role-badge.barista { background: #E8F5E9; color: #4CAF50; }

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.status-badge.active { background: #E8F5E9; color: #4CAF50; }
.status-badge.inactive { background: #FFEBEE; color: #F44336; }

.coupon-count {
  font-weight: 600;
  color: #EFCA71;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #E5E5E2;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  background: #F9F7EB;
  border-color: #EFCA71;
}

.btn-icon.danger:hover {
  background: #FFEBEE;
  border-color: #F44336;
  color: #F44336;
}

.btn-primary {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  color: #332F2E;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 202, 113, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #F5F5F5;
  border: 1px solid #E5E5E2;
  padding: 10px 20px;
  border-radius: 8px;
  color: #6F6C6D;
  cursor: pointer;
}

.btn-danger {
  background: #C45A5A;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 48px !important;
  color: #8C8C90;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E5E5E2;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #332F2E;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #8C8C90;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #332F2E;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.warning-text {
  color: #C45A5A;
  font-size: 12px;
  margin-top: 8px;
}

/* Responsive */
@media (max-width: 768px) {
  .users-management { padding: 16px; }
  .page-title { font-size: 24px; }
  .stats-grid { grid-template-columns: 1fr; gap: 12px; }
  .search-filter { flex-direction: column; }
  .filter-box select { width: 100%; }
  .form-row { grid-template-columns: 1fr; }
  .tabs { flex-wrap: wrap; }
  .tab { flex: 1; text-align: center; }
}
</style>