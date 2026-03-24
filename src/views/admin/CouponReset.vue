<template>
  <div class="coupon-reset">
    <div class="page-header">
      <h1 class="page-title">Daily Coupon Reset</h1>
    </div>

    <!-- Current Day Info -->
    <div class="day-info">
      <div class="info-card">
        <i class="fas fa-calendar-day"></i>
        <div class="info-content">
          <h3>{{ currentDate }}</h3>
          <p>{{ currentDay }}</p>
        </div>
      </div>
      <div class="info-card">
        <i class="fas fa-clock"></i>
        <div class="info-content">
          <h3>{{ currentTime }}</h3>
          <p>Last reset: {{ lastResetTime }}</p>
        </div>
      </div>
    </div>

    <!-- Reset Status -->
    <div class="reset-status" :class="resetStatus.class">
      <i :class="resetStatus.icon"></i>
      <div class="reset-status-content">
        <h3>{{ resetStatus.title }}</h3>
        <p>{{ resetStatus.message }}</p>
      </div>
      <button v-if="!resetStatus.isReset" class="btn-primary" @click="showResetConfirmation">
        Reset Coupons Now
      </button>
    </div>

    <!-- Reset Configuration -->
    <div class="config-card">
      <h3>Reset Configuration</h3>
      <div class="config-options">
        <label class="checkbox-label">
          <input type="checkbox" v-model="autoReset">
          <span>Enable automatic daily reset at midnight</span>
        </label>
        <div v-if="autoReset" class="time-selector">
          <label>Reset Time:</label>
          <input type="time" v-model="resetTime">
        </div>
      </div>
    </div>

    <!-- Items Reset Preview -->
    <div class="preview-card">
      <h3>Today's Coupon Status</h3>
      <div class="preview-stats">
        <div class="stat">
          <span>Total Items</span>
          <strong>{{ items.length }}</strong>
        </div>
        <div class="stat">
          <span>Coupons Used Today</span>
          <strong>{{ totalCouponsUsed }}</strong>
        </div>
        <div class="stat">
          <span>Coupons Remaining</span>
          <strong>{{ totalCouponsRemaining }}</strong>
        </div>
        <div class="stat">
          <span>Coupons to Reset</span>
          <strong>{{ totalCouponsToReset }}</strong>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="items-table-container">
      <div class="table-responsive">
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Default</th>
              <th>Sold</th>
              <th>Remaining</th>
              <th>Reset To</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td data-label="Item">
                <div class="item-info">
                  <div class="item-icon" :style="{ background: item.color }">
                    <i :class="item.icon"></i>
                  </div>
                  <span>{{ item.name }}</span>
                </div>
              </td>
              <td data-label="Category">
                <span :class="['category-badge', item.category]">
                  {{ item.category }}
                </span>
              </td>
              <td data-label="Default" class="coupon-value">{{ item.default_coupon }}</td>
              <td data-label="Sold" class="sold-value">{{ item.sold || 0 }}</td>
              <td data-label="Remaining">
                <span :class="['remaining-badge', getRemainingClass(item.remaining, item.default_coupon)]">
                  {{ item.remaining }}
                </span>
              </td>
              <td data-label="Reset To" class="reset-value">
                <i class="fas fa-arrow-right"></i>
                <strong>{{ item.default_coupon }}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <div v-if="showResetModal" class="modal" @click.self="closeResetModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Confirm Coupon Reset</h2>
          <button class="close-btn" @click="closeResetModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="warning-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p>This will reset all coupons to their default values for the next day.</p>
          <div class="reset-summary">
            <p><strong>{{ totalCouponsUsed }}</strong> coupons were used today</p>
            <p><strong>{{ totalCouponsRemaining }}</strong> coupons remaining</p>
            <p><strong>{{ totalCouponsToReset }}</strong> coupons will be reset</p>
          </div>
          <p class="warning-text">This action cannot be undone. Make sure you've recorded all end-of-day data.</p>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeResetModal">Cancel</button>
            <button class="btn-primary" @click="resetCoupons">Confirm Reset</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSuccessModal" class="modal" @click.self="closeSuccessModal">
      <div class="modal-content small">
        <div class="modal-header">
          <h2>Reset Successful</h2>
          <button class="close-btn" @click="closeSuccessModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="success-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <p>Coupons have been successfully reset for the new day.</p>
          <div class="modal-actions">
            <button class="btn-primary" @click="closeSuccessModal">Done</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useToast } from 'vue-toastification'

export default {
  name: 'AdminCouponReset',
  setup() {
    const toast = useToast()
    const items = ref([])
    const autoReset = ref(true)
    const resetTime = ref('00:00')
    const lastResetTime = ref('Yesterday 23:59')
    const showResetModal = ref(false)
    const showSuccessModal = ref(false)
    const currentTimeValue = ref('')
    
    let timer = null
    let timeInterval = null

    const currentDate = computed(() => {
      return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    })

    const currentDay = computed(() => {
      const date = new Date()
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return days[date.getDay()]
    })

    const currentTime = computed(() => {
      return currentTimeValue.value
    })

    const updateCurrentTime = () => {
      currentTimeValue.value = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    const totalCouponsUsed = computed(() => {
      return items.value.reduce((sum, item) => sum + (item.sold || 0), 0)
    })

    const totalCouponsRemaining = computed(() => {
      return items.value.reduce((sum, item) => sum + (item.remaining || 0), 0)
    })

    const totalCouponsToReset = computed(() => {
      return items.value.reduce((sum, item) => sum + (item.default_coupon - (item.remaining || 0)), 0)
    })

    const resetStatus = computed(() => {
      const hasResetToday = localStorage.getItem('coupon_reset_today') === currentDate.value
      
      if (hasResetToday) {
        return {
          class: 'reset-done',
          icon: 'fas fa-check-circle',
          title: 'Reset Completed',
          message: 'Coupons have been reset for today',
          isReset: true
        }
      }
      
      return {
        class: 'reset-pending',
        icon: 'fas fa-clock',
        title: 'Reset Pending',
        message: 'Coupons need to be reset for the new day',
        isReset: false
      }
    })

    const getRemainingClass = (remaining, total) => {
      if (!remaining) return 'critical'
      const percentage = (remaining / total) * 100
      if (percentage <= 20) return 'critical'
      if (percentage <= 50) return 'warning'
      return 'normal'
    }

    const fetchItems = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch('/api/admin/items', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        
        const today = new Date().toISOString().split('T')[0]
        const usageResponse = await fetch(`/api/admin/daily-coupons?date=${today}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const usageData = await usageResponse.json()
        
        items.value = data.map(item => {
          const todayData = usageData.find(u => u.item_id === item.id)
          return {
            ...item,
            sold: todayData?.sold_quantity || 0,
            remaining: todayData?.remaining_coupon || item.default_coupon
          }
        })
      } catch (error) {
        console.error('Error fetching items:', error)
        items.value = [
          { id: 1, name: 'Beer', category: 'drink', default_coupon: 100, sold: 45, remaining: 55, icon: 'fas fa-beer', color: '#F4A261' },
          { id: 2, name: 'Wine', category: 'drink', default_coupon: 50, sold: 20, remaining: 30, icon: 'fas fa-wine-bottle', color: '#9C6B42' },
          { id: 3, name: 'Shiro', category: 'food', default_coupon: 80, sold: 65, remaining: 15, icon: 'fas fa-utensils', color: '#E9C46A' }
        ]
      }
    }

    const showResetConfirmation = () => {
      showResetModal.value = true
    }

    const closeResetModal = () => {
      showResetModal.value = false
    }

    const closeSuccessModal = () => {
      showSuccessModal.value = false
      fetchItems()
    }

    const resetCoupons = async () => {
      try {
        const token = localStorage.getItem('authToken')
        await fetch('/api/admin/coupons/reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        
        localStorage.setItem('coupon_reset_today', currentDate.value)
        lastResetTime.value = currentTime.value
        
        closeResetModal()
        showSuccessModal.value = true
        toast.success('Coupons reset successfully')
      } catch (error) {
        console.error('Error resetting coupons:', error)
        toast.error('Error resetting coupons')
      }
    }

    const checkAutoReset = () => {
      if (!autoReset.value) return
      
      const now = new Date()
      const [hours, minutes] = resetTime.value.split(':')
      const resetHour = parseInt(hours)
      const resetMinute = parseInt(minutes)
      
      if (now.getHours() === resetHour && now.getMinutes() === resetMinute) {
        const lastReset = localStorage.getItem('coupon_reset_today')
        if (lastReset !== currentDate.value) {
          resetCoupons()
        }
      }
    }

    onMounted(() => {
      fetchItems()
      updateCurrentTime()
      timeInterval = setInterval(updateCurrentTime, 1000)
      timer = setInterval(checkAutoReset, 60000)
    })

    onUnmounted(() => {
      if (timer) clearInterval(timer)
      if (timeInterval) clearInterval(timeInterval)
    })

    return {
      items,
      autoReset,
      resetTime,
      lastResetTime,
      showResetModal,
      showSuccessModal,
      currentDate,
      currentDay,
      currentTime,
      totalCouponsUsed,
      totalCouponsRemaining,
      totalCouponsToReset,
      resetStatus,
      getRemainingClass,
      showResetConfirmation,
      closeResetModal,
      closeSuccessModal,
      resetCoupons
    }
  }
}
</script>

<style scoped>
.coupon-reset {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #332F2E;
  margin: 0;
}

/* Day Info - Responsive Grid */
.day-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.info-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.info-card i {
  font-size: 32px;
  color: #EFCA71;
}

.info-content h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #332F2E;
}

.info-content p {
  margin: 0;
  color: #8C8C90;
  font-size: 14px;
}

/* Reset Status */
.reset-status {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-left: 4px solid;
  flex-wrap: wrap;
}

.reset-status-content {
  flex: 1;
}

.reset-status i {
  font-size: 32px;
}

.reset-status h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
}

.reset-status p {
  margin: 0;
  font-size: 14px;
}

.reset-status.reset-pending {
  border-left-color: #F57C00;
  background: #FFF3E0;
}

.reset-status.reset-pending i {
  color: #F57C00;
}

.reset-status.reset-pending h3 {
  color: #F57C00;
}

.reset-status.reset-done {
  border-left-color: #4CAF50;
  background: #E8F5E9;
}

.reset-status.reset-done i {
  color: #4CAF50;
}

.reset-status.reset-done h3 {
  color: #4CAF50;
}

/* Config Card */
.config-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.config-card h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #332F2E;
}

.config-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.time-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 30px;
  flex-wrap: wrap;
}

.time-selector label {
  color: #6F6C6D;
}

.time-selector input {
  padding: 8px 12px;
  border: 1px solid #E5E5E2;
  border-radius: 8px;
}

/* Preview Card */
.preview-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid rgba(239, 202, 113, 0.15);
}

.preview-card h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #332F2E;
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat {
  background: #F9F7EB;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
}

.stat span {
  display: block;
  color: #8C8C90;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat strong {
  font-size: 24px;
  color: #EFCA71;
}

/* Table Styles - Responsive */
.items-table-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.items-table th {
  text-align: left;
  padding: 16px;
  background: #F9F7EB;
  color: #332F2E;
  font-weight: 600;
  border-bottom: 1px solid #E5E5E2;
}

.items-table td {
  padding: 16px;
  border-bottom: 1px solid #F0F0F0;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.category-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.category-badge.drink {
  background: #E3F2FD;
  color: #1976D2;
}

.category-badge.food {
  background: #FFF3E0;
  color: #F57C00;
}

.coupon-value,
.sold-value {
  font-weight: 600;
}

.reset-value {
  color: #4CAF50;
  white-space: nowrap;
}

.reset-value i {
  margin-right: 8px;
}

.remaining-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.remaining-badge.normal {
  background: #E8F5E9;
  color: #4CAF50;
}

.remaining-badge.warning {
  background: #FFF3E0;
  color: #F57C00;
}

.remaining-badge.critical {
  background: #FFEBEE;
  color: #F44336;
}

/* Buttons */
.btn-primary {
  background: linear-gradient(135deg, #EFCA71, #F2E9C6);
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  color: #332F2E;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 202, 113, 0.3);
}

.btn-secondary {
  background: #F5F5F5;
  border: 1px solid #E5E5E2;
  padding: 10px 20px;
  border-radius: 8px;
  color: #6F6C6D;
  cursor: pointer;
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
  text-align: center;
}

.warning-icon,
.success-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.warning-icon i {
  color: #F57C00;
}

.success-icon i {
  color: #4CAF50;
}

.reset-summary {
  background: #F9F7EB;
  padding: 16px;
  border-radius: 12px;
  margin: 20px 0;
  text-align: left;
}

.reset-summary p {
  margin: 8px 0;
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
  flex-wrap: wrap;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .coupon-reset {
    padding: 16px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .day-info {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .info-card {
    padding: 16px;
  }
  
  .info-card i {
    font-size: 24px;
  }
  
  .info-content h3 {
    font-size: 16px;
  }
  
  .reset-status {
    flex-direction: column;
    text-align: center;
  }
  
  .reset-status i {
    font-size: 24px;
  }
  
  .preview-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .stat {
    padding: 12px;
  }
  
  .stat strong {
    font-size: 20px;
  }
  
  .stat span {
    font-size: 12px;
  }
  
  .time-selector {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .modal-content {
    margin: 16px;
  }
  
  .modal-header h2 {
    font-size: 18px;
  }
  
  .modal-body {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .preview-stats {
    grid-template-columns: 1fr;
  }
  
  .reset-summary p {
    font-size: 14px;
  }
  
  .btn-primary,
  .btn-secondary {
    padding: 8px 16px;
    font-size: 14px;
  }
  
  .items-table td {
    padding: 12px;
  }
  
  .item-info span {
    font-size: 14px;
  }
}

/* Tablet Landscape */
@media (min-width: 769px) and (max-width: 1024px) {
  .preview-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>