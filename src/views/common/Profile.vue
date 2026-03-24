<template>
  <div class="profile-page">
    <div class="page-header">
      <h1 class="page-title">My Profile</h1>
    </div>

    <div class="profile-container">
      <!-- Profile Card -->
      <div class="profile-card">
        <div class="profile-avatar-section">
          <div class="profile-avatar" :style="avatarStyle">
            {{ userInitials }}
          </div>
          <button class="change-avatar-btn" @click="changeAvatar">
            <i class="fas fa-camera"></i>
          </button>
        </div>
        <div class="profile-info-section">
          <div class="info-group">
            <label>Full Name</label>
            <div class="info-value">
              <span v-if="!editMode.name">{{ user?.name || user?.full_name || '-' }}</span>
              <input v-else v-model="formData.name" type="text">
            </div>
          </div>
          <div class="info-group">
            <label>Username</label>
            <div class="info-value">
              <span>{{ user?.username || '-' }}</span>
            </div>
          </div>
          <div class="info-group">
            <label>Email</label>
            <div class="info-value">
              <span v-if="!editMode.email">{{ user?.email || '-' }}</span>
              <input v-else v-model="formData.email" type="email">
            </div>
          </div>
          <div class="info-group">
            <label>Role</label>
            <div class="info-value">
              <span class="role-badge" :class="user?.role">
                {{ formatRole(user?.role) }}
              </span>
            </div>
          </div>
          <div class="info-group">
            <label>Member Since</label>
            <div class="info-value">
              <span>{{ formatDate(user?.created_at) }}</span>
            </div>
          </div>
          <div class="info-group">
            <label>Last Login</label>
            <div class="info-value">
              <span>{{ formatDateTime(user?.last_login) }}</span>
            </div>
          </div>
        </div>
        <div class="profile-actions">
          <button v-if="!editMode.name && !editMode.email" class="btn-primary" @click="enableEdit">
            <i class="fas fa-edit"></i> Edit Profile
          </button>
          <template v-else>
            <button class="btn-primary" @click="saveProfile">
              <i class="fas fa-save"></i> Save Changes
            </button>
            <button class="btn-secondary" @click="cancelEdit">
              <i class="fas fa-times"></i> Cancel
            </button>
          </template>
        </div>
      </div>

      <!-- Change Password Card -->
      <div class="password-card">
        <h3>Change Password</h3>
        <form @submit.prevent="changePassword">
          <div class="form-group">
            <label>Current Password</label>
            <input 
              type="password" 
              v-model="passwordForm.current_password" 
              required
              placeholder="Enter current password"
            >
          </div>
          <div class="form-group">
            <label>New Password</label>
            <input 
              type="password" 
              v-model="passwordForm.new_password" 
              required
              placeholder="Enter new password"
              minlength="6"
            >
          </div>
          <div class="form-group">
            <label>Confirm New Password</label>
            <input 
              type="password" 
              v-model="passwordForm.confirm_password" 
              required
              placeholder="Confirm new password"
            >
          </div>
          <button type="submit" class="btn-primary" :disabled="!isPasswordFormValid">
            Update Password
          </button>
        </form>
      </div>

      <!-- Activity Log -->
      <div class="activity-card">
        <h3>Recent Activity</h3>
        <div class="activity-list">
          <div v-for="activity in activities" :key="activity.id" class="activity-item">
            <div class="activity-icon" :class="activity.type">
              <i :class="getActivityIcon(activity.type)"></i>
            </div>
            <div class="activity-details">
              <div class="activity-description">{{ activity.description }}</div>
              <div class="activity-time">{{ formatRelativeTime(activity.time) }}</div>
            </div>
          </div>
          <div v-if="activities.length === 0" class="no-activities">
            <i class="fas fa-history"></i>
            <p>No recent activity</p>
          </div>
        </div>
      </div>

      <!-- Session Management -->
      <div class="sessions-card">
        <h3>Active Sessions</h3>
        <div class="sessions-list">
          <div v-for="session in activeSessions" :key="session.id" class="session-item">
            <div class="session-info">
              <div class="device-info">
                <i :class="getDeviceIcon(session.device)"></i>
                <span>{{ session.device }}</span>
              </div>
              <div class="location-info">
                <i class="fas fa-map-marker-alt"></i>
                <span>{{ session.location }}</span>
              </div>
              <div class="session-time">
                <i class="fas fa-clock"></i>
                <span>Last active: {{ formatRelativeTime(session.last_active) }}</span>
              </div>
            </div>
            <button v-if="!session.current" class="btn-icon" @click="terminateSession(session)">
              <i class="fas fa-power-off"></i>
            </button>
            <span v-else class="current-badge">Current Session</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Avatar Change Modal -->
    <div v-if="showAvatarModal" class="modal" @click.self="closeAvatarModal">
      <div class="modal-content small">
        <div class="modal-header">
          <h2>Change Avatar</h2>
          <button class="close-btn" @click="closeAvatarModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="avatar-options">
            <div 
              v-for="color in avatarColors" 
              :key="color"
              class="avatar-option"
              :style="{ background: color }"
              @click="selectAvatarColor(color)"
            >
              {{ userInitials }}
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeAvatarModal">Cancel</button>
            <button class="btn-primary" @click="saveAvatarColor">Save</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="showToast" class="toast success">
      <i class="fas fa-check-circle"></i>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../store/auth'
import { useToast } from 'vue-toastification'

export default {
  name: 'Profile',
  setup() {
    const authStore = useAuthStore()
    const toast = useToast()
    const editMode = ref({ name: false, email: false })
    const showAvatarModal = ref(false)
    const showToast = ref(false)
    const toastMessage = ref('')
    const selectedAvatarColor = ref('')
    
    const formData = ref({
      name: '',
      email: ''
    })
    
    const passwordForm = ref({
      current_password: '',
      new_password: '',
      confirm_password: ''
    })
    
    const user = computed(() => authStore.user)
    
    const userInitials = computed(() => {
      if (!user.value?.name && !user.value?.full_name && !user.value?.username) return 'GU'
      const name = user.value?.name || user.value?.full_name
      if (name) {
        return name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      }
      return user.value?.username?.substring(0, 2).toUpperCase() || 'US'
    })
    
    const avatarStyle = computed(() => ({
      background: selectedAvatarColor.value || `linear-gradient(135deg, #EFCA71, #F2E9C6)`
    }))
    
    const avatarColors = [
      'linear-gradient(135deg, #EFCA71, #F2E9C6)',
      'linear-gradient(135deg, #F4A261, #F2E9C6)',
      'linear-gradient(135deg, #E9C46A, #F2E9C6)',
      'linear-gradient(135deg, #2A9D8F, #88B788)',
      'linear-gradient(135deg, #E76F51, #F4A261)',
      'linear-gradient(135deg, #9C6B42, #E9C46A)'
    ]
    
    const isPasswordFormValid = computed(() => {
      return passwordForm.value.current_password && 
             passwordForm.value.new_password && 
             passwordForm.value.confirm_password &&
             passwordForm.value.new_password === passwordForm.value.confirm_password &&
             passwordForm.value.new_password.length >= 6
    })
    
    const activities = ref([
      { id: 1, type: 'login', description: 'Logged in from web browser', time: new Date(Date.now() - 1000 * 60 * 30) },
      { id: 2, type: 'sale', description: 'Processed a sale of 3 items', time: new Date(Date.now() - 1000 * 60 * 60 * 2) },
      { id: 3, type: 'coupon', description: 'Distributed 10 coupons', time: new Date(Date.now() - 1000 * 60 * 60 * 5) }
    ])
    
    const activeSessions = ref([
      { id: 1, device: 'Chrome on Windows', location: 'Addis Ababa, Ethiopia', last_active: new Date(), current: true },
      { id: 2, device: 'Safari on iPhone', location: 'Addis Ababa, Ethiopia', last_active: new Date(Date.now() - 1000 * 60 * 60 * 24), current: false }
    ])
    
    const formatRole = (role) => {
      if (!role) return ''
      return role.charAt(0).toUpperCase() + role.slice(1)
    }
    
    const formatDate = (date) => {
      if (!date) return 'N/A'
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    
    const formatDateTime = (date) => {
      if (!date) return 'N/A'
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    const formatRelativeTime = (date) => {
      const now = new Date()
      const diff = now - new Date(date)
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)
      
      if (minutes < 1) return 'Just now'
      if (minutes < 60) return `${minutes} minutes ago`
      if (hours < 24) return `${hours} hours ago`
      return `${days} days ago`
    }
    
    const getActivityIcon = (type) => {
      const icons = {
        login: 'fas fa-sign-in-alt',
        sale: 'fas fa-shopping-cart',
        coupon: 'fas fa-ticket-alt',
        logout: 'fas fa-sign-out-alt',
        update: 'fas fa-user-edit'
      }
      return icons[type] || 'fas fa-circle'
    }
    
    const getDeviceIcon = (device) => {
      if (device.toLowerCase().includes('windows')) return 'fab fa-windows'
      if (device.toLowerCase().includes('mac')) return 'fab fa-apple'
      if (device.toLowerCase().includes('iphone')) return 'fab fa-apple'
      if (device.toLowerCase().includes('android')) return 'fab fa-android'
      return 'fas fa-laptop'
    }
    
    const enableEdit = () => {
      formData.value.name = user.value?.name || user.value?.full_name || ''
      formData.value.email = user.value?.email || ''
      editMode.value = { name: true, email: true }
    }
    
    const cancelEdit = () => {
      editMode.value = { name: false, email: false }
    }
    
    const saveProfile = async () => {
      try {
        // API call to update profile
        // await fetch('/api/profile', {
        //   method: 'PUT',
        //   body: JSON.stringify(formData.value)
        // })
        
        // Update local user data
        if (authStore.user) {
          authStore.user.name = formData.value.name
          authStore.user.email = formData.value.email
        }
        
        showSuccessToast('Profile updated successfully')
        cancelEdit()
      } catch (error) {
        console.error('Error updating profile:', error)
        toast.error('Error updating profile')
      }
    }
    
    const changePassword = async () => {
      if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
        toast.error('New passwords do not match')
        return
      }
      
      try {
        // API call to change password
        // await fetch('/api/profile/password', {
        //   method: 'PUT',
        //   body: JSON.stringify({
        //     current_password: passwordForm.value.current_password,
        //     new_password: passwordForm.value.new_password
        //   })
        // })
        
        showSuccessToast('Password changed successfully')
        passwordForm.value = {
          current_password: '',
          new_password: '',
          confirm_password: ''
        }
      } catch (error) {
        console.error('Error changing password:', error)
        toast.error('Error changing password')
      }
    }
    
    const changeAvatar = () => {
      showAvatarModal.value = true
    }
    
    const selectAvatarColor = (color) => {
      selectedAvatarColor.value = color
    }
    
    const saveAvatarColor = () => {
      localStorage.setItem('avatar_color', selectedAvatarColor.value)
      showSuccessToast('Avatar updated successfully')
      closeAvatarModal()
    }
    
    const closeAvatarModal = () => {
      showAvatarModal.value = false
    }
    
    const terminateSession = async (session) => {
      try {
        // API call to terminate session
        // await fetch(`/api/sessions/${session.id}/terminate`, { method: 'POST' })
        
        const index = activeSessions.value.findIndex(s => s.id === session.id)
        if (index !== -1) {
          activeSessions.value.splice(index, 1)
        }
        
        showSuccessToast('Session terminated successfully')
      } catch (error) {
        console.error('Error terminating session:', error)
        toast.error('Error terminating session')
      }
    }
    
    const showSuccessToast = (message) => {
      toastMessage.value = message
      showToast.value = true
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    }
    
    onMounted(() => {
      const savedColor = localStorage.getItem('avatar_color')
      if (savedColor) {
        selectedAvatarColor.value = savedColor
      }
    })
    
    return {
      user,
      editMode,
      formData,
      passwordForm,
      showAvatarModal,
      showToast,
      toastMessage,
      userInitials,
      avatarStyle,
      avatarColors,
      activities,
      activeSessions,
      isPasswordFormValid,
      formatRole,
      formatDate,
      formatDateTime,
      formatRelativeTime,
      getActivityIcon,
      getDeviceIcon,
      enableEdit,
      cancelEdit,
      saveProfile,
      changePassword,
      changeAvatar,
      selectAvatarColor,
      saveAvatarColor,
      closeAvatarModal,
      terminateSession
    }
  }
}
</script>

<style scoped>
.profile-page {
  padding: 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #332F2E;
  margin: 0;
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

.profile-card,
.password-card,
.activity-card,
.sessions-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 24px;
  border: 1px solid rgba(239, 202, 113, 0.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.profile-card {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.profile-avatar-section {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 32px;
  color: #332F2E;
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
}

.change-avatar-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: white;
  border: 1px solid #E5E5E2;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.change-avatar-btn:hover {
  background: #F9F7EB;
  border-color: #EFCA71;
}

.profile-info-section {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-group label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #8C8C90;
}

.info-value {
  font-size: 16px;
  color: #332F2E;
  font-weight: 500;
}

.info-value input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 14px;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.role-badge.admin {
  background: #FFF3E0;
  color: #F57C00;
}

.role-badge.cashier {
  background: #E3F2FD;
  color: #1976D2;
}

.role-badge.barista {
  background: #E8F5E9;
  color: #4CAF50;
}

.profile-actions {
  width: 100%;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #E5E5E2;
}

.password-card h3,
.activity-card h3,
.sessions-card h3 {
  margin: 0 0 24px 0;
  font-size: 18px;
  color: #332F2E;
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

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 14px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #F9F7EB;
  border-radius: 12px;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.activity-icon.login {
  background: #4CAF50;
}

.activity-icon.sale {
  background: #EFCA71;
  color: #332F2E;
}

.activity-icon.coupon {
  background: #F57C00;
}

.activity-details {
  flex: 1;
}

.activity-description {
  font-weight: 500;
  color: #332F2E;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: #8C8C90;
}

.no-activities {
  text-align: center;
  padding: 40px;
  color: #8C8C90;
}

.no-activities i {
  font-size: 48px;
  margin-bottom: 16px;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #F9F7EB;
  border-radius: 12px;
  flex-wrap: wrap;
  gap: 16px;
}

.session-info {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  flex: 1;
}

.device-info,
.location-info,
.session-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6F6C6D;
}

.device-info i,
.location-info i,
.session-time i {
  color: #EFCA71;
}

.current-badge {
  padding: 4px 12px;
  background: #E8F5E9;
  color: #4CAF50;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 202, 113, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  border: 1px solid #E5E5E2;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  background: #F9F7EB;
  border-color: #EFCA71;
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
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
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

.avatar-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.avatar-option {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 24px;
  color: #332F2E;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 auto;
}

.avatar-option:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #4CAF50;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 2000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .profile-page {
    padding: 16px;
  }
  
  .profile-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .profile-info-section {
    grid-template-columns: 1fr;
  }
  
  .session-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .session-item {
    flex-direction: column;
    text-align: center;
  }
  
  .avatar-options {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>