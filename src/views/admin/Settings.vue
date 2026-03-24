<template>
  <div class="settings">
    <div class="page-header">
      <h1 class="page-title">System Settings</h1>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading settings...</p>
    </div>

    <div v-else>
      <!-- Settings Tabs -->
      <div class="settings-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="{ active: activeTab === tab.id }"
        >
          <i :class="tab.icon"></i>
          {{ tab.name }}
        </button>
      </div>

      <!-- General Settings -->
      <div v-if="activeTab === 'general'" class="settings-section">
        <div class="settings-card">
          <h3>General Settings</h3>
          <div class="settings-form">
            <div class="form-group">
              <label>System Name</label>
              <input type="text" v-model="settings.system_name" placeholder="System name">
            </div>
            <div class="form-group">
              <label>System Timezone</label>
              <select v-model="settings.timezone">
                <option value="Africa/Addis_Ababa">Africa/Addis_Ababa (GMT+3)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
            <div class="form-group">
              <label>Date Format</label>
              <select v-model="settings.date_format">
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              </select>
            </div>
            <div class="form-group">
              <label>Currency</label>
              <select v-model="settings.currency">
                <option value="ETB">Ethiopian Birr (ETB)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Language</label>
              <select v-model="settings.language">
                <option value="en">English</option>
                <option value="am">Amharic</option>
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" @click="saveSettings" :disabled="isSaving">
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Coupon Settings -->
      <div v-if="activeTab === 'coupon'" class="settings-section">
        <div class="settings-card">
          <h3>Coupon System Settings</h3>
          <div class="settings-form">
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="couponSettings.auto_reset">
                <span>Enable automatic daily coupon reset</span>
              </label>
              <p class="help-text">Automatically reset coupons to default values at midnight</p>
            </div>
            <div class="form-group" v-if="couponSettings.auto_reset">
              <label>Reset Time</label>
              <input type="time" v-model="couponSettings.reset_time">
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="couponSettings.low_stock_alert">
                <span>Enable low stock alerts</span>
              </label>
              <p class="help-text">Get notified when coupon stock falls below threshold</p>
            </div>
            <div class="form-group" v-if="couponSettings.low_stock_alert">
              <label>Alert Threshold (%)</label>
              <input type="number" v-model="couponSettings.alert_threshold" min="0" max="100">
              <p class="help-text">Alert when remaining coupons are below this percentage</p>
            </div>
            <div class="form-group">
              <label>Default Daily Coupon</label>
              <input type="number" v-model="couponSettings.default_coupon" min="0">
              <p class="help-text">Default coupon quantity for new items</p>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" @click="saveCouponSettings" :disabled="isSavingCoupon">
              {{ isSavingCoupon ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Notification Settings -->
      <div v-if="activeTab === 'notifications'" class="settings-section">
        <div class="settings-card">
          <h3>Notification Settings</h3>
          <div class="settings-form">
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="notificationSettings.low_stock_email">
                <span>Email notifications for low stock</span>
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="notificationSettings.daily_report_email">
                <span>Daily report via email</span>
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="notificationSettings.sms_alerts">
                <span>SMS alerts for critical stock</span>
              </label>
            </div>
            <div class="form-group">
              <label>Email Recipients</label>
              <textarea v-model="notificationSettings.email_recipients" rows="3" placeholder="Enter email addresses, one per line"></textarea>
              <p class="help-text">Separate multiple emails with commas or new lines</p>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" @click="saveNotificationSettings" :disabled="isSavingNotifications">
              {{ isSavingNotifications ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Backup Settings -->
      <div v-if="activeTab === 'backup'" class="settings-section">
        <div class="settings-card">
          <h3>Backup Settings</h3>
          <div class="settings-form">
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="backupSettings.auto_backup">
                <span>Enable automatic database backup</span>
              </label>
            </div>
            <div class="form-group" v-if="backupSettings.auto_backup">
              <label>Backup Frequency</label>
              <select v-model="backupSettings.frequency">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div class="form-group" v-if="backupSettings.auto_backup">
              <label>Backup Time</label>
              <input type="time" v-model="backupSettings.backup_time">
            </div>
            <div class="form-group">
              <label>Backup Location</label>
              <select v-model="backupSettings.location">
                <option value="local">Local Storage</option>
                <option value="cloud">Cloud Storage</option>
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-primary" @click="saveBackupSettings" :disabled="isSavingBackup">
              {{ isSavingBackup ? 'Saving...' : 'Save Changes' }}
            </button>
            <button class="btn-secondary" @click="manualBackup" :disabled="isBackingUp">
              <i class="fas" :class="isBackingUp ? 'fa-spinner fa-spin' : 'fa-database'"></i>
              {{ isBackingUp ? 'Backing up...' : 'Run Manual Backup' }}
            </button>
          </div>
        </div>

        <!-- Recent Backups -->
        <div class="settings-card">
          <h3>Recent Backups</h3>
          <div class="backup-list">
            <div v-for="backup in backups" :key="backup.id" class="backup-item">
              <div class="backup-info">
                <i class="fas fa-file-archive"></i>
                <div>
                  <div class="backup-name">{{ backup.name }}</div>
                  <div class="backup-date">{{ formatDate(backup.date) }}</div>
                </div>
              </div>
              <div class="backup-actions">
                <button class="btn-icon" @click="downloadBackup(backup)" title="Download">
                  <i class="fas fa-download"></i>
                </button>
                <button class="btn-icon danger" @click="deleteBackup(backup)" title="Delete">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Info -->
      <div v-if="activeTab === 'system'" class="settings-section">
        <div class="settings-card">
          <h3>System Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Version</label>
              <span>2.0.0</span>
            </div>
            <div class="info-item">
              <label>Build Date</label>
              <span>March 15, 2024</span>
            </div>
            <div class="info-item">
              <label>Database</label>
              <span>PostgreSQL 14</span>
            </div>
            <div class="info-item">
              <label>Server Status</label>
              <span class="status-online">
                <i class="fas fa-circle"></i> Online
              </span>
            </div>
            <div class="info-item">
              <label>Last Backup</label>
              <span>{{ lastBackupDate || 'Not available' }}</span>
            </div>
            <div class="info-item">
              <label>Users Active</label>
              <span>{{ activeUsers || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <div class="settings-card">
          <h3>Cache Management</h3>
          <div class="cache-info">
            <p>Cache Size: <strong>{{ cacheSize || 'N/A' }}</strong></p>
            <button class="btn-secondary" @click="clearCache" :disabled="isClearingCache">
              <i class="fas" :class="isClearingCache ? 'fa-spinner fa-spin' : 'fa-trash'"></i>
              {{ isClearingCache ? 'Clearing...' : 'Clear Cache' }}
            </button>
          </div>
        </div>

        <div class="settings-card danger">
          <h3>Danger Zone</h3>
          <div class="danger-zone">
            <div class="danger-item">
              <div>
                <h4>Reset All Data</h4>
                <p>This will permanently delete all data including items, sales, and users.</p>
              </div>
              <button class="btn-danger" @click="confirmResetData" :disabled="isResetting">
                {{ isResetting ? 'Resetting...' : 'Reset All Data' }}
              </button>
            </div>
            <div class="danger-item">
              <div>
                <h4>Export All Data</h4>
                <p>Export all system data as JSON for backup or migration.</p>
              </div>
              <button class="btn-secondary" @click="exportAllData" :disabled="isExporting">
                <i class="fas" :class="isExporting ? 'fa-spinner fa-spin' : 'fa-download'"></i>
                {{ isExporting ? 'Exporting...' : 'Export Data' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmModal" class="modal" @click.self="closeConfirmModal">
      <div class="modal-content small">
        <div class="modal-header">
          <h2>Confirm Action</h2>
          <button class="close-btn" @click="closeConfirmModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="warning-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p>{{ confirmMessage }}</p>
          <p class="warning-text">This action cannot be undone!</p>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeConfirmModal">Cancel</button>
            <button class="btn-danger" @click="executeConfirmAction">Confirm</button>
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
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'

export default {
  name: 'AdminSettings',
  setup() {
    const toast = useToast()
    const activeTab = ref('general')
    const isLoading = ref(true)
    const isSaving = ref(false)
    const isSavingCoupon = ref(false)
    const isSavingNotifications = ref(false)
    const isSavingBackup = ref(false)
    const isBackingUp = ref(false)
    const isClearingCache = ref(false)
    const isResetting = ref(false)
    const isExporting = ref(false)
    const showConfirmModal = ref(false)
    const confirmMessage = ref('')
    const confirmAction = ref(null)
    const showToast = ref(false)
    const toastMessage = ref('')
    
    const lastBackupDate = ref('')
    const activeUsers = ref(0)
    const cacheSize = ref('0 MB')
    
    const tabs = [
      { id: 'general', name: 'General', icon: 'fas fa-cog' },
      { id: 'coupon', name: 'Coupon Settings', icon: 'fas fa-ticket-alt' },
      { id: 'notifications', name: 'Notifications', icon: 'fas fa-bell' },
      { id: 'backup', name: 'Backup', icon: 'fas fa-database' },
      { id: 'system', name: 'System', icon: 'fas fa-server' }
    ]
    
    const settings = ref({
      system_name: 'Eyob Bar & Restaurant',
      timezone: 'Africa/Addis_Ababa',
      date_format: 'YYYY-MM-DD',
      currency: 'ETB',
      language: 'en'
    })
    
    const couponSettings = ref({
      auto_reset: true,
      reset_time: '00:00',
      low_stock_alert: true,
      alert_threshold: 20,
      default_coupon: 100
    })
    
    const notificationSettings = ref({
      low_stock_email: true,
      daily_report_email: true,
      sms_alerts: false,
      email_recipients: 'admin@example.com\nmanager@example.com'
    })
    
    const backupSettings = ref({
      auto_backup: true,
      frequency: 'daily',
      backup_time: '23:00',
      location: 'local'
    })
    
    const backups = ref([
      { id: 1, name: 'backup_2024_03_14.sql', date: '2024-03-14T23:00:00' },
      { id: 2, name: 'backup_2024_03_13.sql', date: '2024-03-13T23:00:00' },
      { id: 3, name: 'backup_2024_03_12.sql', date: '2024-03-12T23:00:00' }
    ])
    
    const getAuthHeaders = () => {
      const token = localStorage.getItem('authToken')
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
    
    const formatDate = (date) => {
      if (!date) return 'N/A'
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    const showSuccessToast = (message) => {
      toastMessage.value = message
      showToast.value = true
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    }
    
    const fetchSettings = async () => {
      isLoading.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/admin/settings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.status === 401 || response.status === 403) {
          toast.error('Session expired. Please login again.')
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
          return
        }
        
        if (response.ok) {
          const data = await response.json()
          settings.value = { ...settings.value, ...(data.general || {}) }
          couponSettings.value = { ...couponSettings.value, ...(data.coupon || {}) }
          notificationSettings.value = { ...notificationSettings.value, ...(data.notifications || {}) }
          backupSettings.value = { ...backupSettings.value, ...(data.backup || {}) }
          lastBackupDate.value = data.last_backup || '2024-03-14T23:00:00'
          activeUsers.value = data.active_users || 3
          cacheSize.value = data.cache_size || '24.5 MB'
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        // Use default values
      } finally {
        isLoading.value = false
      }
    }
    
    const saveSettings = async () => {
      isSaving.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(settings.value)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        showSuccessToast('Settings saved successfully')
      } catch (error) {
        console.error('Error saving settings:', error)
        toast.error('Error saving settings')
      } finally {
        isSaving.value = false
      }
    }
    
    const saveCouponSettings = async () => {
      isSavingCoupon.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/admin/settings/coupon', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(couponSettings.value)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        showSuccessToast('Coupon settings saved successfully')
      } catch (error) {
        console.error('Error saving coupon settings:', error)
        toast.error('Error saving coupon settings')
      } finally {
        isSavingCoupon.value = false
      }
    }
    
    const saveNotificationSettings = async () => {
      isSavingNotifications.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/admin/settings/notifications', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(notificationSettings.value)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        showSuccessToast('Notification settings saved successfully')
      } catch (error) {
        console.error('Error saving notification settings:', error)
        toast.error('Error saving notification settings')
      } finally {
        isSavingNotifications.value = false
      }
    }
    
    const saveBackupSettings = async () => {
      isSavingBackup.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/admin/settings/backup', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(backupSettings.value)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        showSuccessToast('Backup settings saved successfully')
      } catch (error) {
        console.error('Error saving backup settings:', error)
        toast.error('Error saving backup settings')
      } finally {
        isSavingBackup.value = false
      }
    }
    
    const manualBackup = async () => {
      isBackingUp.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/admin/backup', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const newBackup = await response.json()
        backups.value.unshift(newBackup)
        showSuccessToast('Backup created successfully')
      } catch (error) {
        console.error('Error creating backup:', error)
        toast.error('Error creating backup')
      } finally {
        isBackingUp.value = false
      }
    }
    
    const downloadBackup = (backup) => {
      // Create a blob and trigger download
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = backup.name
      a.click()
      URL.revokeObjectURL(url)
      toast.info(`Downloading ${backup.name}...`)
    }
    
    const deleteBackup = (backup) => {
      confirmAction.value = async () => {
        try {
          const token = localStorage.getItem('authToken')
          const response = await fetch(`/api/admin/backup/${backup.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          
          const index = backups.value.findIndex(b => b.id === backup.id)
          if (index !== -1) {
            backups.value.splice(index, 1)
          }
          showSuccessToast('Backup deleted successfully')
        } catch (error) {
          console.error('Error deleting backup:', error)
          toast.error('Error deleting backup')
        }
      }
      confirmMessage.value = `Are you sure you want to delete backup "${backup.name}"?`
      showConfirmModal.value = true
    }
    
    const clearCache = async () => {
      isClearingCache.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/admin/cache', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        cacheSize.value = '0 MB'
        showSuccessToast('Cache cleared successfully')
      } catch (error) {
        console.error('Error clearing cache:', error)
        toast.error('Error clearing cache')
      } finally {
        isClearingCache.value = false
      }
    }
    
    const exportAllData = async () => {
      isExporting.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/admin/export', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `export_${new Date().toISOString()}.json`
        a.click()
        window.URL.revokeObjectURL(url)
        showSuccessToast('Data exported successfully')
      } catch (error) {
        console.error('Error exporting data:', error)
        toast.error('Error exporting data')
      } finally {
        isExporting.value = false
      }
    }
    
    const resetAllData = async () => {
      isResetting.value = true
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/admin/reset', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        showSuccessToast('Data reset successfully. Please log in again.')
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } catch (error) {
        console.error('Error resetting data:', error)
        toast.error('Error resetting data')
      } finally {
        isResetting.value = false
      }
    }
    
    const confirmResetData = () => {
      confirmMessage.value = 'This will permanently delete ALL data. Are you absolutely sure?'
      confirmAction.value = resetAllData
      showConfirmModal.value = true
    }
    
    const closeConfirmModal = () => {
      showConfirmModal.value = false
      confirmAction.value = null
    }
    
    const executeConfirmAction = () => {
      if (confirmAction.value) {
        confirmAction.value()
      }
      closeConfirmModal()
    }
    
    onMounted(() => {
      fetchSettings()
    })
    
    return {
      activeTab,
      tabs,
      settings,
      couponSettings,
      notificationSettings,
      backupSettings,
      backups,
      isLoading,
      isSaving,
      isSavingCoupon,
      isSavingNotifications,
      isSavingBackup,
      isBackingUp,
      isClearingCache,
      isResetting,
      isExporting,
      showConfirmModal,
      confirmMessage,
      showToast,
      toastMessage,
      lastBackupDate,
      activeUsers,
      cacheSize,
      formatDate,
      saveSettings,
      saveCouponSettings,
      saveNotificationSettings,
      saveBackupSettings,
      manualBackup,
      downloadBackup,
      deleteBackup,
      clearCache,
      exportAllData,
      confirmResetData,
      closeConfirmModal,
      executeConfirmAction
    }
  }
}
</script>

<style scoped>
.settings {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
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

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: white;
  border-radius: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(239, 202, 113, 0.2);
  border-top-color: #EFCA71;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Keep all existing styles from your original CSS */
.settings-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  border-bottom: 1px solid #E5E5E2;
  padding-bottom: 16px;
}

.settings-tabs button {
  padding: 10px 20px;
  border: none;
  background: transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6F6C6D;
}

.settings-tabs button i {
  font-size: 16px;
}

.settings-tabs button.active {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  color: #332F2E;
}

.settings-section {
  max-width: 800px;
}

.settings-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.settings-card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #332F2E;
}

.settings-card.danger {
  border-color: #FFEBEE;
  background: #FFF5F5;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #332F2E;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.checkbox-label input {
  width: auto;
}

.help-text {
  font-size: 12px;
  color: #8C8C90;
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #E5E5E2;
  flex-wrap: wrap;
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
  transition: all 0.3s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: #E5E5E2;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-danger {
  background: #C45A5A;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-danger:hover:not(:disabled) {
  background: #b04a4a;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #F0F0F0;
}

.info-item label {
  font-weight: 500;
  color: #6F6C6D;
}

.info-item span {
  color: #332F2E;
}

.status-online {
  color: #4CAF50;
}

.status-online i {
  font-size: 10px;
  margin-right: 4px;
}

.cache-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.backup-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #F9F7EB;
  border-radius: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.backup-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.backup-info i {
  font-size: 24px;
  color: #EFCA71;
}

.backup-name {
  font-weight: 500;
  color: #332F2E;
}

.backup-date {
  font-size: 12px;
  color: #8C8C90;
}

.backup-actions {
  display: flex;
  gap: 8px;
}

.danger-zone {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.danger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  flex-wrap: wrap;
  gap: 16px;
}

.danger-item h4 {
  margin: 0 0 4px 0;
  color: #C45A5A;
}

.danger-item p {
  margin: 0;
  font-size: 12px;
  color: #8C8C90;
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
  text-align: center;
}

.warning-icon {
  font-size: 48px;
  color: #F57C00;
  margin-bottom: 16px;
}

.warning-text {
  color: #F44336;
  font-size: 12px;
  margin-top: 16px;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
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

.toast.success {
  background: #4CAF50;
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

/* Responsive */
@media (max-width: 768px) {
  .settings {
    padding: 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .settings-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
  }
  
  .danger-item {
    flex-direction: column;
    text-align: center;
  }
  
  .cache-info {
    flex-direction: column;
    text-align: center;
  }
  
  .backup-item {
    flex-direction: column;
    text-align: center;
  }
  
  .backup-info {
    flex-direction: column;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .settings-card {
    padding: 16px;
  }
  
  .btn-primary,
  .btn-secondary,
  .btn-danger {
    padding: 8px 16px;
    font-size: 14px;
  }
}
</style>