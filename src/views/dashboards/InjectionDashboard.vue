<template>
  <div class="injection-dashboard">
    <!-- Breadcrumb Navigation -->
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <li class="breadcrumb-item">
          <a href="/dashboard" class="breadcrumb-link">
            <i class="fas fa-home"></i>
            <span>Dashboard</span>
          </a>
        </li>
        <li class="breadcrumb-item">
          <i class="fas fa-chevron-right"></i>
          <span class="breadcrumb-current">Injections</span>
        </li>
      </ol>
    </nav>

    <!-- Quick Action Sidebar -->
    <div class="quick-action-sidebar">
      <button class="quick-action-btn" @click="navigateTo('/injections/new')" title="New Injection">
        <i class="fas fa-syringe"></i>
      </button>
      <button class="quick-action-btn" @click="exportData" title="Export">
        <i class="fas fa-download"></i>
      </button>
      <button class="quick-action-btn" @click="printView" title="Print">
        <i class="fas fa-print"></i>
      </button>
    </div>

    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <i class="fas fa-syringe"></i>
            Injection Dashboard
          </h1>
          <p class="page-subtitle">Welcome back, {{ user?.full_name || user?.name || 'User' }}</p>
        </div>
      </div>
      
      <!-- Header Stats - Real data from API -->
      <div class="header-stats">
        <div class="stat-card" @click="filterByStatus('scheduled')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)">
            <i class="fas fa-calendar-day"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.today || 0 }}</span>
            <span class="stat-label">Injections Today</span>
          </div>
        </div>
        <div class="stat-card" @click="filterByStatus('scheduled')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%)">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.pending || 0 }}</span>
            <span class="stat-label">Pending Administration</span>
          </div>
        </div>
        <div class="stat-card" @click="filterByStatus('administered')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%)">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.completed_today || 0 }}</span>
            <span class="stat-label">Completed Today</span>
          </div>
        </div>
        <div class="stat-card" @click="filterByStock('critical')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%)">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.critical_stock || 0 }}</span>
            <span class="stat-label">Critical Stock</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Today's Injections & Quick Actions -->
      <div class="dashboard-content">
        <!-- Today's Injections -->
        <div class="content-column wide">
          <div class="detail-card">
            <div class="card-header">
              <i class="fas fa-calendar-day"></i>
              <h3>Today's Injection Schedule</h3>
              <div class="header-actions">
                <button class="btn btn-outline btn-sm" @click="navigateTo('/injection-records')">
                  View All Records
                </button>
                <button class="btn-icon subtle" @click="loadTodayInjections" title="Refresh" :disabled="loading">
                  <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
                </button>
              </div>
            </div>
            <div class="card-content">
              <div v-if="loading" class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading injections...</p>
              </div>
              
              <div v-else-if="!todaysInjections || todaysInjections.length === 0" class="empty-state">
                <i class="fas fa-syringe"></i>
                <p>No injections scheduled for today</p>
              </div>
              
              <div v-else class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th @click="sortBy('scheduled_at')" class="sortable">
                        Time
                        <i :class="getSortIcon('scheduled_at')"></i>
                      </th>
                      <th @click="sortBy('patient_name')" class="sortable">
                        Patient
                        <i :class="getSortIcon('patient_name')"></i>
                      </th>
                      <th @click="sortBy('medication_name')" class="sortable">
                        Medication
                        <i :class="getSortIcon('medication_name')"></i>
                      </th>
                      <th @click="sortBy('dosage')" class="sortable">
                        Dose
                        <i :class="getSortIcon('dosage')"></i>
                      </th>
                      <th @click="sortBy('route')" class="sortable">
                        Route
                        <i :class="getSortIcon('route')"></i>
                      </th>
                      <th @click="sortBy('status')" class="sortable">
                        Status
                        <i :class="getSortIcon('status')"></i>
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="injection in paginatedInjections" :key="injection.id" class="table-row-hover">
                      <td>
                        <span class="time-badge">{{ formatTime(injection.scheduled_at) }}</span>
                      </td>
                      <td>
                        <div class="patient-info-cell">
                          <div class="patient-avatar small" :style="getPatientAvatarStyle(injection)">
                            {{ getInitials(getPatientName(injection)) }}
                          </div>
                          <div class="patient-details">
                            <span class="patient-name">{{ getPatientName(injection) }}</span>
                            <span class="patient-id">{{ getPatientId(injection) }}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="medication-info">
                          <span class="medication-name">{{ injection.medication_name }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="dosage-badge">{{ injection.dosage }}</span>
                      </td>
                      <td>
                        <span class="route-badge" :class="injection.route">
                          {{ formatRoute(injection.route) }}
                        </span>
                      </td>
                      <td>
                        <span class="status-badge" :class="injection.status">
                          {{ formatStatus(injection.status) }}
                        </span>
                      </td>
                      <td>
                        <div class="action-buttons">
                          <button v-if="injection.status === 'scheduled'" 
                                  class="btn-icon success" @click="administerInjection(injection)" 
                                  title="Administer">
                            <i class="fas fa-syringe"></i>
                          </button>
                          <button class="btn-icon" @click="viewInjection(injection)" title="View Details">
                            <i class="fas fa-eye"></i>
                          </button>
                          <button v-if="injection.status === 'scheduled'" 
                                  class="btn-icon warning" @click="rescheduleInjection(injection)" 
                                  title="Reschedule">
                            <i class="fas fa-calendar-alt"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Pagination -->
                <div v-if="todaysInjections && todaysInjections.length > 0" class="pagination">
                  <button 
                    class="pagination-btn" 
                    :disabled="currentPage === 1"
                    @click="currentPage--"
                  >
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <span class="pagination-info">
                    Page {{ currentPage }} of {{ totalPages }}
                  </span>
                  <button 
                    class="pagination-btn" 
                    :disabled="currentPage === totalPages"
                    @click="currentPage++"
                  >
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions & Stock Overview -->
        <div class="content-column">
          <!-- Quick Actions -->
          <div class="detail-card">
            <div class="card-header">
              <i class="fas fa-bolt"></i>
              <h3>Quick Actions</h3>
            </div>
            <div class="card-content">
              <div class="actions-grid">
                <button v-for="action in injectionActions" :key="action.id" class="action-btn" @click="navigateTo(action.route)">
                  <div class="action-icon" :class="action.color">
                    <i :class="action.icon"></i>
                  </div>
                  <span>{{ action.title }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Medication Stock -->
          <div class="detail-card">
            <div class="card-header">
              <i class="fas fa-pills"></i>
              <h3>Medication Stock</h3>
              <button class="btn btn-outline btn-sm" @click="navigateTo('/inventory')">
                Manage
              </button>
            </div>
            <div class="card-content">
              <div v-if="stockLoading" class="loading-state small">
                <div class="loading-spinner small"></div>
                <p>Loading stock...</p>
              </div>
              
              <div v-else class="stock-list">
                <div v-for="item in medicationStock" :key="item.id" class="stock-item">
                  <div class="medication-icon">
                    <i class="fas fa-pills"></i>
                  </div>
                  <div class="stock-info">
                    <h4>{{ item.medication }}</h4>
                    <p>Stock: {{ item.current_stock }} {{ item.unit }}</p>
                    <div class="stock-bar">
                      <div class="stock-progress" :style="{ width: item.percentage + '%' }" :class="item.status"></div>
                    </div>
                  </div>
                  <div class="stock-status" :class="item.status">
                    {{ item.status }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Upcoming Injections -->
          <div class="detail-card">
            <div class="card-header">
              <i class="fas fa-clock"></i>
              <h3>Upcoming</h3>
              <span class="header-badge">{{ upcomingCount }}</span>
            </div>
            <div class="card-content">
              <div v-if="upcomingLoading" class="loading-state small">
                <div class="loading-spinner small"></div>
                <p>Loading...</p>
              </div>
              
              <div v-else-if="upcomingInjections.length === 0" class="empty-state small">
                <i class="fas fa-calendar-check"></i>
                <p>No upcoming injections</p>
              </div>
              
              <div v-else class="upcoming-list">
                <div v-for="injection in upcomingInjections.slice(0, 3)" :key="injection.id" class="upcoming-item">
                  <div class="upcoming-time">
                    {{ formatTime(injection.scheduled_at) }}
                  </div>
                  <div class="upcoming-info">
                    <h4>{{ getPatientName(injection) }}</h4>
                    <p>{{ injection.medication_name }} • {{ injection.dosage }}</p>
                  </div>
                  <span class="status-badge small" :class="injection.status">
                    {{ formatStatus(injection.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Administer Injection Modal -->
    <div v-if="showAdministerModal" class="modal-overlay" @click.self="showAdministerModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>
            <i class="fas fa-syringe"></i>
            Administer Injection
          </h3>
          <button class="modal-close" @click="showAdministerModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitAdministration" class="administer-form">
            <div class="injection-summary">
              <div class="summary-item">
                <span class="label">Patient:</span>
                <span class="value">{{ getPatientName(currentInjection) }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Medication:</span>
                <span class="value">{{ currentInjection?.medication_name }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Dosage:</span>
                <span class="value">{{ currentInjection?.dosage }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label required">Administered By</label>
              <select v-model="administerData.administered_by" class="form-select" required>
                <option value="">Select staff...</option>
                <option v-for="staff in staffList" :key="staff.id" :value="staff.id">
                  {{ staff.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label required">Injection Site</label>
              <input type="text" v-model="administerData.injection_site" class="form-input" 
                     placeholder="e.g., Deltoid (Left), Abdomen" required>
            </div>

            <div class="form-group">
              <label class="form-label">Reaction Notes</label>
              <textarea v-model="administerData.reaction_notes" class="form-textarea" 
                        rows="2" placeholder="Document any adverse reactions..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Additional Notes</label>
              <textarea v-model="administerData.notes" class="form-textarea" 
                        rows="2" placeholder="Any additional notes..."></textarea>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-outline" @click="showAdministerModal = false">
                Cancel
              </button>
              <button type="submit" class="btn btn-success" :disabled="administering">
                <i class="fas" :class="administering ? 'fa-spinner fa-spin' : 'fa-check'"></i>
                {{ administering ? 'Administering...' : 'Confirm Administration' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Injection Details Modal -->
    <div v-if="selectedInjection" class="modal-overlay" @click.self="selectedInjection = null">
      <div class="modal-content x-large">
        <div class="modal-header">
          <h3>
            <i class="fas fa-syringe"></i>
            Injection Details
          </h3>
          <div class="modal-actions">
            <button class="btn-icon subtle" @click="printInjection(selectedInjection)" title="Print">
              <i class="fas fa-print"></i>
            </button>
            <button class="modal-close" @click="selectedInjection = null">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="modal-body">
          <div class="injection-details">
            <!-- Injection Header -->
            <div class="injection-header-large">
              <div>
                <h2 class="injection-title">{{ selectedInjection.medication_name }}</h2>
                <p class="injection-meta">Scheduled: {{ formatDateTime(selectedInjection.scheduled_at) }}</p>
              </div>
              <span class="status-badge large" :class="selectedInjection.status">
                {{ formatStatus(selectedInjection.status) }}
              </span>
            </div>

            <!-- Information Grid -->
            <div class="info-grid-2col">
              <!-- Patient Information -->
              <div class="info-card">
                <h5 class="info-title">
                  <i class="fas fa-user"></i>
                  Patient Information
                </h5>
                <div class="info-items">
                  <div class="info-item">
                    <span class="info-label">Name:</span>
                    <span class="info-value">{{ getPatientName(selectedInjection) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Patient ID:</span>
                    <span class="info-value">{{ getPatientId(selectedInjection) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Date of Birth:</span>
                    <span class="info-value">{{ formatDate(getPatientDob(selectedInjection)) || 'N/A' }}</span>
                  </div>
                </div>
              </div>

              <!-- Medication Details -->
              <div class="info-card">
                <h5 class="info-title">
                  <i class="fas fa-pills"></i>
                  Medication Details
                </h5>
                <div class="info-items">
                  <div class="info-item">
                    <span class="info-label">Medication:</span>
                    <span class="info-value">{{ selectedInjection.medication_name }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Dosage:</span>
                    <span class="info-value">{{ selectedInjection.dosage }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Route:</span>
                    <span class="info-value">{{ formatRoute(selectedInjection.route) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Frequency:</span>
                    <span class="info-value">{{ selectedInjection.frequency || 'Single dose' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Administration Details -->
            <div v-if="selectedInjection.administered_at" class="administration-section">
              <h5 class="section-title">
                <i class="fas fa-clock"></i>
                Administration Details
              </h5>
              <div class="administration-grid">
                <div class="detail-item">
                  <span class="detail-label">Administered By:</span>
                  <span class="detail-value">{{ selectedInjection.administered_by_name || 'N/A' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Administered At:</span>
                  <span class="detail-value">{{ formatDateTime(selectedInjection.administered_at) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Injection Site:</span>
                  <span class="detail-value">{{ selectedInjection.injection_site || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <!-- Reaction Notes -->
            <div v-if="selectedInjection.reaction_notes" class="reaction-section">
              <h5 class="section-title reaction">
                <i class="fas fa-exclamation-triangle"></i>
                Reaction Notes
              </h5>
              <div class="reaction-content">
                {{ selectedInjection.reaction_notes }}
              </div>
            </div>

            <!-- Notes -->
            <div v-if="selectedInjection.notes" class="notes-section">
              <h5 class="section-title">
                <i class="fas fa-sticky-note"></i>
                Notes
              </h5>
              <div class="notes-content">
                {{ selectedInjection.notes }}
              </div>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="modal-actions">
            <button v-if="selectedInjection.status === 'scheduled'" 
                    class="btn btn-success btn-with-icon" @click="administerInjection(selectedInjection)">
              <i class="fas fa-syringe"></i>
              <span>Administer</span>
            </button>
            <button class="btn btn-primary btn-with-icon" @click="printInjection(selectedInjection)">
              <i class="fas fa-print"></i>
              <span>Print Record</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="showSuccessToast" class="toast success">
      <i class="fas fa-check-circle"></i>
      <div class="toast-content">
        <strong>Success</strong>
        <p>{{ successMessage }}</p>
      </div>
    </div>

    <!-- Error Toast -->
    <div v-if="showErrorToast" class="toast error">
      <i class="fas fa-exclamation-circle"></i>
      <div class="toast-content">
        <strong>{{ errorTitle || 'Error' }}</strong>
        <p>{{ errorMessage }}</p>
        <small v-if="errorDetails">{{ errorDetails }}</small>
      </div>
      <button class="toast-close" @click="showErrorToast = false">
        <i class="fas fa-times"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../store/auth'
import injectionService from '../../services/injectionService'

export default {
  name: 'InjectionDashboard',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const user = authStore.user

    // State
    const loading = ref(false)
    const stockLoading = ref(false)
    const upcomingLoading = ref(false)
    const administering = ref(false)
    const showAdministerModal = ref(false)
    const selectedInjection = ref(null)
    const currentInjection = ref(null)
    const sortField = ref('scheduled_at')
    const sortOrder = ref('asc')
    const currentPage = ref(1)
    const itemsPerPage = ref(5)

    // Data
    const todaysInjections = ref([])
    const upcomingInjections = ref([])
    const medicationStock = ref([])
    const staffList = ref([])
    const stats = ref({
      today: 0,
      pending: 0,
      completed_today: 0,
      critical_stock: 0
    })

    // Administer form
    const administerData = ref({
      administered_by: '',
      injection_site: '',
      reaction_notes: '',
      notes: ''
    })

    // Toast states
    const showSuccessToast = ref(false)
    const showErrorToast = ref(false)
    const successMessage = ref('')
    const errorTitle = ref('')
    const errorMessage = ref('')
    const errorDetails = ref('')

    // Computed
    const currentDate = computed(() => {
      return new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    })

    const filteredInjections = computed(() => {
      let filtered = [...todaysInjections.value]

      // Apply sorting
      filtered.sort((a, b) => {
        let aVal = a[sortField.value]
        let bVal = b[sortField.value]

        if (sortField.value === 'patient_name') {
          aVal = getPatientName(a)
          bVal = getPatientName(b)
        }

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        if (sortOrder.value === 'asc') {
          return aVal > bVal ? 1 : -1
        } else {
          return aVal < bVal ? 1 : -1
        }
      })

      return filtered
    })

    const paginatedInjections = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return filteredInjections.value.slice(start, end)
    })

    const totalPages = computed(() => {
      return Math.ceil(filteredInjections.value.length / itemsPerPage.value)
    })

    const upcomingCount = computed(() => {
      return upcomingInjections.value.length
    })

    const injectionActions = ref([
      {
        id: 1,
        icon: 'fas fa-syringe',
        title: 'Injection Records',
        route: '/injection-records',
        color: 'blue'
      },
      {
        id: 2,
        icon: 'fas fa-capsules',
        title: 'Medication Stock',
        route: '/inventory',
        color: 'green'
      },
      {
        id: 3,
        icon: 'fas fa-file-medical',
        title: 'Patient Records',
        route: '/patient-records',
        color: 'purple'
      },
      {
        id: 4,
        icon: 'fas fa-chart-line',
        title: 'Reports',
        route: '/injection-reports',
        color: 'orange'
      }
    ])

    // Helper Methods
    const showSuccess = (message) => {
      successMessage.value = message
      showSuccessToast.value = true
      setTimeout(() => {
        showSuccessToast.value = false
      }, 3000)
    }

    const showError = (message, details = null, title = 'Error') => {
      errorTitle.value = title
      errorMessage.value = message
      errorDetails.value = details
      showErrorToast.value = true
      setTimeout(() => {
        showErrorToast.value = false
      }, 5000)
    }

    const getInitials = (name) => {
      if (!name) return '??'
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    const getPatientName = (item) => {
      if (!item) return 'Unknown'
      return item.patient?.patient_name || 
             item.patient_name || 
             'Unknown'
    }

    const getPatientId = (item) => {
      if (!item) return 'N/A'
      return item.patient?.patient_code || 
             item.patient?.id || 
             item.patient_id || 
             'N/A'
    }

    const getPatientDob = (item) => {
      if (!item) return null
      return item.patient?.date_of_birth || 
             item.patient_dob
    }

    const getPatientAvatarStyle = (item) => {
      const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
      ]
      const name = getPatientName(item)
      const index = (name || '').length % colors.length
      return { background: colors[index] }
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      } catch {
        return dateString
      }
    }

    const formatTime = (dateString) => {
      if (!dateString) return 'N/A'
      try {
        const date = new Date(dateString)
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })
      } catch {
        return dateString
      }
    }

    const formatDateTime = (dateString) => {
      if (!dateString) return 'N/A'
      try {
        const date = new Date(dateString)
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch {
        return dateString
      }
    }

    const formatRoute = (route) => {
      if (!route) return 'N/A'
      const map = {
        'intramuscular': 'IM',
        'subcutaneous': 'SC',
        'intravenous': 'IV',
        'intradermal': 'ID'
      }
      return map[route] || route
    }

    const formatStatus = (status) => {
      if (!status) return 'Unknown'
      const map = {
        'scheduled': 'Scheduled',
        'administered': 'Administered',
        'missed': 'Missed',
        'cancelled': 'Cancelled'
      }
      return map[status] || status
    }

    const getSortIcon = (field) => {
      if (sortField.value !== field) return 'fas fa-sort'
      return sortOrder.value === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
    }

    const sortBy = (field) => {
      if (sortField.value === field) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortField.value = field
        sortOrder.value = 'asc'
      }
    }

    const filterByStatus = (status) => {
      router.push(`/injection-records?status=${status}`)
    }

    const filterByStock = (level) => {
      router.push(`/inventory?stock=${level}`)
    }

    // Data Loading
    const loadAllData = async () => {
      loading.value = true
      upcomingLoading.value = true
      stockLoading.value = true
      try {
        await Promise.all([
          loadTodayInjections(),
          loadUpcomingInjections(),
          loadStockData(),
          loadStatistics(),
          loadStaffList()
        ])
      } catch (error) {
        console.error('Error loading data:', error)
        showError('Failed to load dashboard data')
      } finally {
        loading.value = false
        upcomingLoading.value = false
        stockLoading.value = false
      }
    }

    const loadTodayInjections = async () => {
      try {
        const response = await injectionService.getTodayInjections()
        if (response.data && response.data.success) {
          const data = response.data.data || []
          todaysInjections.value = Array.isArray(data) ? data : []
        }
      } catch (error) {
        console.error('Error loading today injections:', error)
        todaysInjections.value = []
      }
    }

    const loadUpcomingInjections = async () => {
      try {
        const response = await injectionService.getUpcomingInjections()
        if (response.data && response.data.success) {
          const data = response.data.data || []
          upcomingInjections.value = Array.isArray(data) ? data : []
        }
      } catch (error) {
        console.error('Error loading upcoming injections:', error)
        upcomingInjections.value = []
      }
    }

    const loadStockData = async () => {
      try {
        // This would come from an inventory service
        // For now, using mock data
        medicationStock.value = [
          {
            id: 1,
            medication: 'Insulin Glargine',
            current_stock: 45,
            unit: 'vials',
            percentage: 75,
            status: 'good'
          },
          {
            id: 2,
            medication: 'Heparin',
            current_stock: 12,
            unit: 'vials',
            percentage: 30,
            status: 'low'
          },
          {
            id: 3,
            medication: 'Vitamin B12',
            current_stock: 8,
            unit: 'vials',
            percentage: 20,
            status: 'critical'
          },
          {
            id: 4,
            medication: 'Penicillin G',
            current_stock: 25,
            unit: 'vials',
            percentage: 62,
            status: 'good'
          }
        ]

        // Update critical stock count
        stats.value.critical_stock = medicationStock.value.filter(
          item => item.status === 'critical' || item.status === 'low'
        ).length
      } catch (error) {
        console.error('Error loading stock data:', error)
        medicationStock.value = []
      }
    }

    const loadStatistics = async () => {
      try {
        const response = await injectionService.getStatistics()
        if (response.data && response.data.success) {
          const data = response.data.data || {}
          stats.value = {
            ...stats.value,
            today: data.today?.total || todaysInjections.value.length,
            pending: data.today?.scheduled || todaysInjections.value.filter(i => i.status === 'scheduled').length,
            completed_today: data.today?.administered || todaysInjections.value.filter(i => i.status === 'administered').length
          }
        } else {
          // Fallback to calculated stats
          stats.value = {
            ...stats.value,
            today: todaysInjections.value.length,
            pending: todaysInjections.value.filter(i => i.status === 'scheduled').length,
            completed_today: todaysInjections.value.filter(i => i.status === 'administered').length
          }
        }
      } catch (error) {
        console.error('Error loading statistics:', error)
      }
    }

    const loadStaffList = async () => {
      // Mock staff data
      staffList.value = [
        { id: 1, name: 'Nurse Sarah Johnson' },
        { id: 2, name: 'Nurse Michael Chen' },
        { id: 3, name: 'Nurse Emily Rodriguez' },
        { id: 4, name: 'Dr. James Wilson' }
      ]
    }

    // Actions
    const administerInjection = (injection) => {
      currentInjection.value = injection
      administerData.value = {
        administered_by: user?.id || '',
        injection_site: '',
        reaction_notes: '',
        notes: ''
      }
      showAdministerModal.value = true
    }

    const submitAdministration = async () => {
      if (!administerData.value.administered_by) {
        showError('Please select who administered the injection')
        return
      }

      if (!administerData.value.injection_site) {
        showError('Please specify the injection site')
        return
      }

      administering.value = true
      try {
        const response = await injectionService.administerInjection(
          currentInjection.value.id,
          administerData.value
        )

        if (response.data && response.data.success) {
          showSuccess('Injection administered successfully')
          showAdministerModal.value = false
          await loadAllData()
        }
      } catch (error) {
        console.error('Error administering injection:', error)
        showError('Failed to administer injection', error.response?.data?.message)
      } finally {
        administering.value = false
      }
    }

    const viewInjection = (injection) => {
      selectedInjection.value = injection
    }

    const rescheduleInjection = (injection) => {
      showSuccess('Reschedule feature coming soon')
    }

    const printInjection = (injection) => {
      showSuccess('Print feature coming soon')
    }

    const exportData = () => {
      showSuccess('Export feature coming soon')
    }

    const printView = () => {
      window.print()
    }

    const navigateTo = (route) => {
      router.push(route)
    }

    // Lifecycle
    onMounted(() => {
      loadAllData()
    })

    return {
      // User
      user,
      
      // State
      loading,
      stockLoading,
      upcomingLoading,
      administering,
      showAdministerModal,
      selectedInjection,
      currentInjection,
      sortField,
      sortOrder,
      currentPage,
      itemsPerPage,
      todaysInjections,
      upcomingInjections,
      medicationStock,
      staffList,
      stats,
      administerData,
      
      // Toast
      showSuccessToast,
      showErrorToast,
      successMessage,
      errorTitle,
      errorMessage,
      errorDetails,
      
      // Computed
      currentDate,
      filteredInjections,
      paginatedInjections,
      totalPages,
      upcomingCount,
      injectionActions,
      
      // Methods
      getInitials,
      getPatientName,
      getPatientId,
      getPatientDob,
      getPatientAvatarStyle,
      formatDate,
      formatTime,
      formatDateTime,
      formatRoute,
      formatStatus,
      getSortIcon,
      sortBy,
      filterByStatus,
      filterByStock,
      loadTodayInjections,
      administerInjection,
      submitAdministration,
      viewInjection,
      rescheduleInjection,
      printInjection,
      exportData,
      printView,
      navigateTo,
      showSuccess,
      showError
    }
  }
}
</script>



<style scoped>
.injection-dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

/* Breadcrumb Navigation */
.breadcrumb-nav {
  padding: 1rem 2rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--card-border);
  margin-bottom: 1rem;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
  gap: 0.5rem;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.breadcrumb-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: var(--primary);
}

.breadcrumb-current {
  color: var(--text-light);
  font-weight: 500;
}

/* Quick Action Sidebar */
.quick-action-sidebar {
  position: fixed;
  right: 2rem;
  bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 100;
}

.quick-action-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary);
  border: none;
  color: var(--secondary);
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 255, 196, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-action-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 255, 196, 0.4);
}

.quick-action-btn:active {
  transform: translateY(0) scale(0.95);
}

/* Page Header */
.page-header {
  padding: 2rem;
}

.header-content {
  margin-bottom: 2rem;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-light);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-title i {
  color: var(--primary);
}

.page-subtitle {
  color: var(--text-muted);
  font-size: 1.1rem;
  margin: 0;
}

/* Header Stats */
.header-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--card-border);
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-light);
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 600;
}

/* Main Content */
.main-content {
  padding: 0 2rem 2rem;
}

/* Dashboard Content */
.dashboard-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.content-column.wide {
  grid-column: span 2;
}

/* Detail Cards */
.detail-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--card-border);
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
}

.detail-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--card-border);
}

.card-header h3 {
  margin: 0;
  color: var(--text-light);
  font-size: 1.2rem;
  font-weight: 600;
  flex: 1;
}

.card-header i {
  color: var(--primary);
  font-size: 1.1rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.header-badge {
  background: rgba(0, 255, 196, 0.1);
  color: var(--primary);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.card-content {
  padding: 1.5rem;
}

/* Table Styles */
.table-container {
  overflow-x: auto;
  border-radius: 8px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  text-align: left;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--card-border);
}

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.data-table th.sortable:hover {
  color: var(--primary);
}

.data-table td {
  padding: 1rem;
  color: var(--text-light);
  border-bottom: 1px solid var(--card-border);
}

.table-row-hover:hover {
  background: rgba(255, 255, 255, 0.02);
}

/* Patient Info Cell */
.patient-info-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.patient-avatar.small {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.patient-details {
  display: flex;
  flex-direction: column;
}

.patient-name {
  font-weight: 600;
  color: var(--text-light);
  font-size: 0.9rem;
}

.patient-id {
  font-size: 0.7rem;
  color: var(--text-muted);
}

/* Time Badge */
.time-badge {
  font-weight: 600;
  color: var(--primary);
  background: rgba(0, 255, 196, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

/* Medication Info */
.medication-info {
  display: flex;
  flex-direction: column;
}

.medication-name {
  font-weight: 500;
  color: var(--text-light);
}

/* Dosage Badge */
.dosage-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

/* Route Badge */
.route-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.route-badge.intramuscular {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.route-badge.subcutaneous {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.route-badge.intravenous {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.scheduled {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-badge.administered {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-badge.missed {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-badge.cancelled {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.status-badge.small {
  padding: 0.15rem 0.5rem;
  font-size: 0.6rem;
}

.status-badge.large {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.btn-icon {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid var(--card-border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-light);
  border-color: var(--primary);
}

.btn-icon.success:hover {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
  border-color: var(--success);
}

.btn-icon.warning:hover {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
  border-color: var(--warning);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--card-border);
}

.pagination-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: var(--bg-primary);
  color: var(--text-light);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.pagination-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-info {
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Actions Grid */
.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  color: var(--text-light);
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--primary);
  transform: translateY(-2px);
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.action-icon.blue {
  background: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
}

.action-icon.green {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
}

.action-icon.purple {
  background: rgba(139, 92, 246, 0.1);
  color: #8B5CF6;
}

.action-icon.orange {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
}

.action-btn span {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-light);
  text-align: center;
}

/* Stock List */
.stock-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stock-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid var(--card-border);
  transition: all 0.3s ease;
}

.stock-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.medication-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(0, 255, 196, 0.1);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.stock-info {
  flex: 1;
}

.stock-info h4 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 0.25rem;
}

.stock-info p {
  color: var(--text-muted);
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.stock-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.stock-progress {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.stock-progress.good {
  background: var(--success);
}

.stock-progress.low {
  background: var(--warning);
}

.stock-progress.critical {
  background: var(--danger);
}

.stock-status {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
}

.stock-status.good {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.stock-status.low {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.stock-status.critical {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* Upcoming List */
.upcoming-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.upcoming-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  border: 1px solid var(--card-border);
}

.upcoming-time {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary);
  min-width: 70px;
}

.upcoming-info {
  flex: 1;
}

.upcoming-info h4 {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 0.15rem;
}

.upcoming-info p {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Loading States */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-muted);
}

.loading-state.small {
  padding: 1.5rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-spinner.small {
  width: 24px;
  height: 24px;
  border-width: 2px;
  margin-bottom: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty States */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
}

.empty-state i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.3;
}

.empty-state.small {
  padding: 1rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 24px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--card-border);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.modal-content.x-large {
  max-width: 1000px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--card-border);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-light);
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-header h3 i {
  color: var(--primary);
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.modal-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-light);
}

.modal-body {
  padding: 2rem;
}

/* Injection Summary */
.injection-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid var(--card-border);
  margin-bottom: 1.5rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-item .label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.summary-item .value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-light);
}

/* Form Styles */
.administer-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-light);
  font-weight: 500;
  font-size: 0.9rem;
}

.form-label.required::after {
  content: ' *';
  color: var(--danger);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  color: var(--text-light);
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 255, 196, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--card-border);
}

/* Injection Details */
.injection-details {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.injection-header-large {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--card-border);
  flex-wrap: wrap;
  gap: 1rem;
}

.injection-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.25rem;
}

.injection-meta {
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Info Grid */
.info-grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

@media (max-width: 768px) {
  .info-grid-2col {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.info-card {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--card-border);
}

.info-title {
  color: var(--primary);
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.info-value {
  color: var(--text-light);
  font-weight: 500;
}

/* Section Title */
.section-title {
  color: var(--primary);
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title.reaction {
  color: var(--danger);
}

/* Administration Grid */
.administration-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  background: rgba(255, 255, 255, 0.02);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--card-border);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.detail-value {
  color: var(--text-light);
  font-weight: 500;
}

/* Reaction Section */
.reaction-section {
  margin: 1rem 0;
}

.reaction-content {
  background: rgba(239, 68, 68, 0.05);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--danger);
  color: var(--text-light);
  line-height: 1.6;
}

/* Notes Section */
.notes-section {
  margin: 1rem 0;
}

.notes-content {
  background: rgba(255, 255, 255, 0.02);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  color: var(--text-light);
  line-height: 1.6;
  white-space: pre-wrap;
}

/* Modal Actions */
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 2rem;
  border-top: 1px solid var(--card-border);
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .modal-actions {
    flex-direction: column;
  }
  
  .modal-actions .btn {
    width: 100%;
  }
}

/* Button Styles */
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary);
  color: var(--secondary);
}

.btn-primary:hover:not(:disabled) {
  background: #00e6b8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 196, 0.3);
}

.btn-success {
  background: var(--success);
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #16a34a;
  transform: translateY(-2px);
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--card-border);
  color: var(--text-light);
}

.btn-outline:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-2px);
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.btn-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

/* Toast Notifications */
.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 2rem;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
  font-weight: 500;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 2000;
  animation: slideUp 0.3s ease;
}

.toast.success {
  background: var(--success);
}

.toast.error {
  background: var(--danger);
}

.toast i {
  font-size: 1.2rem;
}

.toast-close {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  margin-left: 0.5rem;
}

.toast-close:hover {
  opacity: 1;
}

.toast-content {
  display: flex;
  flex-direction: column;
}

.toast-content small {
  font-size: 0.8rem;
  opacity: 0.9;
  margin-top: 0.25rem;
}

/* Print Styles */
@media print {
  .quick-action-sidebar,
  .breadcrumb-nav,
  .filters-card,
  .btn,
  .modal-overlay {
    display: none !important;
  }
  
  .injection-dashboard {
    background: white;
    color: black;
  }
  
  .stat-card,
  .detail-card {
    break-inside: avoid;
    border: 1px solid #ccc;
    box-shadow: none;
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .header-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .dashboard-content {
    grid-template-columns: 1fr;
  }
  
  .content-column.wide {
    grid-column: span 1;
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .breadcrumb-nav {
    padding: 0.75rem 1rem;
  }
  
  .page-header {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .page-subtitle {
    font-size: 0.9rem;
  }
  
  .main-content {
    padding: 0 1rem 1rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .injection-summary {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .btn {
    width: 100%;
  }
  
  .administration-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-header,
  .modal-body {
    padding: 1rem;
  }
  
  .injection-header-large {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .info-grid-2col {
    grid-template-columns: 1fr;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .modal-actions .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .header-stats {
    grid-template-columns: 1fr;
  }
  
  .stock-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .upcoming-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .patient-info-cell {
    flex-wrap: wrap;
  }
}
</style>