<template>
  <div class="lab-dashboard">
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
          <span class="breadcrumb-current">Laboratory</span>
        </li>
      </ol>
    </nav>

    <!-- Quick Action Sidebar -->
    <div class="quick-action-sidebar">
      <button class="quick-action-btn" @click="navigateTo('/lab/test-requests/new')" title="New Test Request">
        <i class="fas fa-vial"></i>
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
            <i class="fas fa-flask"></i>
            Laboratory Dashboard
          </h1>
          <p class="page-subtitle">Welcome back, {{ user?.full_name || user?.name }}</p>
        </div>
      </div>
      
      <!-- Header Stats -->
      <div class="header-stats">
        <div class="stat-card" @click="filterByStatus('pending')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%)">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ labStats.pending || 0 }}</span>
            <span class="stat-label">Pending Tests</span>
          </div>
        </div>
        <div class="stat-card" @click="filterByPriority('urgent')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%)">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ labStats.urgent || 0 }}</span>
            <span class="stat-label">Urgent Requests</span>
          </div>
        </div>
        <div class="stat-card" @click="filterByStatus('in_progress')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)">
            <i class="fas fa-hourglass-half"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ labStats.in_progress || 0 }}</span>
            <span class="stat-label">In Progress</span>
          </div>
        </div>
        <div class="stat-card" @click="filterByStatus('completed')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%)">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ labStats.completed_today || 0 }}</span>
            <span class="stat-label">Completed Today</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Pending Tests & Recent Results -->
      <div class="dashboard-content">
        <!-- Pending Test Requests -->
        <div class="content-column wide">
          <div class="detail-card">
            <div class="card-header">
              <i class="fas fa-vials"></i>
              <h3>Pending Test Requests</h3>
              <div class="header-actions">
                <div class="filter-group">
                  <select v-model="statusFilter" class="filter-select" @change="filterTests">
                    <option value="all">All Tests</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <button class="btn btn-outline btn-sm" @click="navigateTo('/lab/test-requests')">
                  View All
                </button>
              </div>
            </div>
            <div class="card-content">
              <div v-if="testsLoading" class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading tests...</p>
              </div>
              
              <div v-else-if="!pendingTests || pendingTests.length === 0" class="empty-state">
                <i class="fas fa-vial"></i>
                <p>No pending test requests</p>
              </div>
              
              <div v-else class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th @click="sortBy('id')" class="sortable">
                        Request ID
                        <i :class="getSortIcon('id')"></i>
                      </th>
                      <th @click="sortBy('patient_name')" class="sortable">
                        Patient
                        <i :class="getSortIcon('patient_name')"></i>
                      </th>
                      <th @click="sortBy('test_name')" class="sortable">
                        Test Name
                        <i :class="getSortIcon('test_name')"></i>
                      </th>
                      <th @click="sortBy('created_at')" class="sortable">
                        Requested
                        <i :class="getSortIcon('created_at')"></i>
                      </th>
                      <th @click="sortBy('priority')" class="sortable">
                        Priority
                        <i :class="getSortIcon('priority')"></i>
                      </th>
                      <th @click="sortBy('status')" class="sortable">
                        Status
                        <i :class="getSortIcon('status')"></i>
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="test in paginatedTests" :key="test.id" class="table-row-hover">
                      <td>
                        <code class="test-id">REQ-{{ String(test.id).padStart(6, '0') }}</code>
                      </td>
                      <td>
                        <div class="patient-info-cell">
                          <div class="patient-avatar small" :style="getPatientAvatarStyle(test)">
                            {{ getInitials(getPatientName(test)) }}
                          </div>
                          <div class="patient-details">
                            <span class="patient-name">{{ getPatientName(test) }}</span>
                            <span class="patient-id">{{ getPatientId(test) }}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="test-name">{{ test.test_name }}</span>
                      </td>
                      <td>
                        <span class="requested-time">{{ formatTimeAgo(test.created_at) }}</span>
                      </td>
                      <td>
                        <span class="priority-badge" :class="test.priority || 'normal'">
                          {{ formatPriority(test.priority) }}
                        </span>
                      </td>
                      <td>
                        <span class="status-badge" :class="test.status">
                          {{ formatStatus(test.status) }}
                        </span>
                      </td>
                      <td>
                        <div class="action-buttons">
                          <button v-if="test.status === 'pending'" 
                                  class="btn-icon success" @click="startTest(test)" 
                                  title="Start Test">
                            <i class="fas fa-play-circle"></i>
                          </button>
                          <button v-if="test.status === 'in_progress'" 
                                  class="btn-icon primary" @click="completeTest(test)" 
                                  title="Complete Test">
                            <i class="fas fa-check-circle"></i>
                          </button>
                          <button class="btn-icon" @click="viewTest(test)" title="View Details">
                            <i class="fas fa-eye"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Pagination -->
                <div v-if="pendingTests && pendingTests.length > 0" class="pagination">
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

        <!-- Quick Actions & Urgent Requests -->
        <div class="content-column">
          <!-- Quick Actions -->
          <div class="detail-card">
            <div class="card-header">
              <i class="fas fa-bolt"></i>
              <h3>Quick Actions</h3>
            </div>
            <div class="card-content">
              <div class="actions-grid">
                <button v-for="action in labActions" :key="action.id" class="action-btn" @click="navigateTo(action.route)">
                  <div class="action-icon" :class="action.color">
                    <i :class="action.icon"></i>
                  </div>
                  <span>{{ action.title }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Urgent Test Requests -->
          <div class="detail-card">
            <div class="card-header">
              <i class="fas fa-exclamation-triangle"></i>
              <h3>Urgent Requests</h3>
              <span class="header-badge warning">{{ urgentRequests.length }}</span>
            </div>
            <div class="card-content">
              <div v-if="urgentLoading" class="loading-state small">
                <div class="loading-spinner small"></div>
                <p>Loading...</p>
              </div>
              
              <div v-else-if="urgentRequests.length === 0" class="empty-state small">
                <i class="fas fa-check-circle"></i>
                <p>No urgent requests</p>
              </div>
              
              <div v-else class="urgent-list">
                <div v-for="request in urgentRequests" :key="request.id" class="urgent-item">
                  <div class="urgent-header">
                    <span class="patient-name">{{ getPatientName(request) }}</span>
                    <span class="priority-badge urgent">Urgent</span>
                  </div>
                  <div class="urgent-details">
                    <p class="test-name">{{ request.test_name }}</p>
                    <span class="request-time">{{ formatTimeAgo(request.created_at) }}</span>
                  </div>
                  <button class="btn btn-primary btn-sm" @click="startTest(request)">
                    Start Now
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Today's Tests Summary -->
          <div class="detail-card">
            <div class="card-header">
              <i class="fas fa-calendar-day"></i>
              <h3>Today's Summary</h3>
            </div>
            <div class="card-content">
              <div class="summary-stats">
                <div class="summary-stat">
                  <span class="stat-value">{{ todayStats.total || 0 }}</span>
                  <span class="stat-label">Total Requests</span>
                </div>
                <div class="summary-stat">
                  <span class="stat-value">{{ todayStats.completed || 0 }}</span>
                  <span class="stat-label">Completed</span>
                </div>
                <div class="summary-stat">
                  <span class="stat-value">{{ todayStats.pending || 0 }}</span>
                  <span class="stat-label">Pending</span>
                </div>
              </div>
              <div class="progress-section">
                <div class="progress-label">
                  <span>Completion Rate</span>
                  <span>{{ completionRate }}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: completionRate + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Laboratory Statistics -->
          <div class="detail-card">
            <div class="card-header">
              <i class="fas fa-chart-pie"></i>
              <h3>Lab Statistics</h3>
            </div>
            <div class="card-content">
              <div class="lab-statistics">
                <div class="stat-row">
                  <span class="stat-label">Average Turnaround:</span>
                  <span class="stat-value">{{ labStats.avg_turnaround || '24' }} hours</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">Today's Tests:</span>
                  <span class="stat-value">{{ todayStats.total || 0 }}</span>
                </div>
                <div class="stat-row">
                  <span class="stat-label">Completion Rate:</span>
                  <span class="stat-value">{{ completionRate }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Test Details Modal -->
    <div v-if="selectedTest" class="modal-overlay" @click.self="selectedTest = null">
      <div class="modal-content x-large">
        <div class="modal-header">
          <h3>
            <i class="fas fa-flask"></i>
            Test Request Details - REQ-{{ String(selectedTest.id).padStart(6, '0') }}
          </h3>
          <div class="modal-actions">
            <button class="btn-icon subtle" @click="printTest(selectedTest)" title="Print">
              <i class="fas fa-print"></i>
            </button>
            <button class="modal-close" @click="selectedTest = null">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="modal-body">
          <div class="test-overview">
            <!-- Test Header -->
            <div class="test-header-large">
              <div class="header-left">
                <h2 class="test-title">{{ selectedTest.test_name }}</h2>
                <div class="test-meta">Requested: {{ formatDateTime(selectedTest.created_at) }}</div>
              </div>
              <div class="header-right">
                <span class="priority-badge large" :class="selectedTest.priority || 'normal'">
                  {{ formatPriority(selectedTest.priority) }}
                </span>
                <span class="status-badge large" :class="selectedTest.status">
                  {{ formatStatus(selectedTest.status) }}
                </span>
              </div>
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
                    <span class="info-value">{{ getPatientName(selectedTest) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Patient ID:</span>
                    <span class="info-value">{{ getPatientId(selectedTest) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Date of Birth:</span>
                    <span class="info-value">{{ formatDate(selectedTest.patient?.date_of_birth) || 'N/A' }}</span>
                  </div>
                </div>
              </div>

              <!-- Request Information -->
              <div class="info-card">
                <h5 class="info-title">
                  <i class="fas fa-stethoscope"></i>
                  Request Information
                </h5>
                <div class="info-items">
                  <div class="info-item">
                    <span class="info-label">Requested By:</span>
                    <span class="info-value">Dr. {{ selectedTest.doctor?.full_name || selectedTest.doctor_name }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Requested Date:</span>
                    <span class="info-value">{{ formatDate(selectedTest.created_at) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Priority:</span>
                    <span class="info-value">
                      <span class="priority-badge" :class="selectedTest.priority || 'normal'">
                        {{ formatPriority(selectedTest.priority) }}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Test Results (if completed) -->
            <div v-if="selectedTest.results" class="results-section">
              <h5 class="section-title">
                <i class="fas fa-chart-bar"></i>
                Test Results
              </h5>
              <div class="results-content">
                <pre>{{ selectedTest.results }}</pre>
              </div>
            </div>

            <!-- Clinical Notes -->
            <div v-if="selectedTest.notes" class="notes-section">
              <h5 class="section-title">
                <i class="fas fa-sticky-note"></i>
                Clinical Notes
              </h5>
              <div class="notes-content">
                {{ selectedTest.notes }}
              </div>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="modal-actions">
            <button v-if="selectedTest.status === 'pending'" 
                    class="btn btn-success btn-with-icon" @click="startTest(selectedTest)">
              <i class="fas fa-play-circle"></i>
              <span>Start Test</span>
            </button>
            <button v-if="selectedTest.status === 'in_progress'" 
                    class="btn btn-primary btn-with-icon" @click="completeTest(selectedTest)">
              <i class="fas fa-check-circle"></i>
              <span>Complete Test</span>
            </button>
            <button class="btn btn-outline btn-with-icon" @click="printTest(selectedTest)">
              <i class="fas fa-print"></i>
              <span>Print Request</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Complete Test Modal -->
    <div v-if="showCompleteModal" class="modal-overlay" @click.self="showCompleteModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>
            <i class="fas fa-check-circle"></i>
            Complete Test
          </h3>
          <button class="modal-close" @click="showCompleteModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitResults" class="results-form">
            <div class="form-group">
              <label class="form-label required">Test Results</label>
              <textarea v-model="testResults.results" class="form-textarea" 
                        rows="6" placeholder="Enter test results..." required></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Additional Notes</label>
              <textarea v-model="testResults.notes" class="form-textarea" 
                        rows="3" placeholder="Any additional notes..."></textarea>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-outline" @click="showCompleteModal = false">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                <i class="fas" :class="submitting ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                {{ submitting ? 'Saving...' : 'Complete Test' }}
              </button>
            </div>
          </form>
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
import labService from '../../services/labService'

export default {
  name: 'LabDashboard',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const user = authStore.user

    // State
    const testsLoading = ref(false)
    const urgentLoading = ref(false)
    const submitting = ref(false)
    const statusFilter = ref('all')
    const sortField = ref('created_at')
    const sortOrder = ref('desc')
    const currentPage = ref(1)
    const itemsPerPage = ref(10)
    const selectedTest = ref(null)
    const showCompleteModal = ref(false)
    const currentTestForCompletion = ref(null)
    const testResults = ref({
      results: '',
      notes: ''
    })

    // Data
    const pendingTests = ref([])
    const urgentRequests = ref([])
    const todayTests = ref([])
    const labStats = ref({
      pending: 0,
      urgent: 0,
      in_progress: 0,
      completed_today: 0,
      avg_turnaround: 24
    })

    // Toast states
    const showSuccessToast = ref(false)
    const showErrorToast = ref(false)
    const successMessage = ref('')
    const errorTitle = ref('')
    const errorMessage = ref('')
    const errorDetails = ref('')

    // Computed
    const todayStats = computed(() => {
      const tests = Array.isArray(todayTests.value) ? todayTests.value : []
      return {
        total: tests.length,
        completed: tests.filter(t => t.status === 'completed').length,
        pending: tests.filter(t => t.status === 'pending' || t.status === 'in_progress').length
      }
    })

    const filteredTests = computed(() => {
      let filtered = Array.isArray(pendingTests.value) ? [...pendingTests.value] : []

      if (statusFilter.value !== 'all') {
        filtered = filtered.filter(test => test && test.status === statusFilter.value)
      }

      // Apply sorting
      filtered.sort((a, b) => {
        if (!a || !b) return 0
        
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

    const paginatedTests = computed(() => {
      const filtered = filteredTests.value
      if (!Array.isArray(filtered) || filtered.length === 0) return []
      
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return filtered.slice(start, end)
    })

    const totalPages = computed(() => {
      const filtered = filteredTests.value
      if (!Array.isArray(filtered) || filtered.length === 0) return 1
      return Math.ceil(filtered.length / itemsPerPage.value)
    })

    const completionRate = computed(() => {
      if (todayStats.value.total === 0) return 0
      return Math.round((todayStats.value.completed / todayStats.value.total) * 100)
    })

    const labActions = ref([
      {
        id: 1,
        icon: 'fas fa-vial',
        title: 'All Requests',
        route: '/lab/test-requests',
        color: 'blue'
      },
      {
        id: 2,
        icon: 'fas fa-hourglass-half',
        title: 'Pending',
        route: '/lab/test-requests?status=pending',
        color: 'orange'
      },
      {
        id: 3,
        icon: 'fas fa-chart-line',
        title: 'Statistics',
        route: '/lab/statistics',
        color: 'purple'
      },
      {
        id: 4,
        icon: 'fas fa-history',
        title: 'Completed',
        route: '/lab/test-requests?status=completed',
        color: 'green'
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

    const formatTimeAgo = (dateString) => {
      if (!dateString) return 'N/A'
      try {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins} min ago`
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
      } catch {
        return dateString
      }
    }

    const formatPriority = (priority) => {
      if (!priority) return 'Normal'
      const map = {
        'urgent': 'Urgent',
        'high': 'High',
        'normal': 'Normal',
        'low': 'Low'
      }
      return map[priority] || priority
    }

    const formatStatus = (status) => {
      if (!status) return 'Unknown'
      const map = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed',
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
      statusFilter.value = status
    }

    const filterByPriority = (priority) => {
      if (priority === 'urgent') {
        router.push('/lab/test-requests?priority=urgent')
      }
    }

    const filterTests = () => {
      currentPage.value = 1
    }

    // Data Loading
    const loadAllData = async () => {
      testsLoading.value = true
      urgentLoading.value = true
      try {
        await Promise.all([
          loadPendingTests(),
          loadUrgentRequests(),
          loadTodayTests(),
          loadStatistics()
        ])
      } catch (error) {
        console.error('Error loading data:', error)
        showError('Failed to load laboratory data')
      } finally {
        testsLoading.value = false
        urgentLoading.value = false
      }
    }

    const loadPendingTests = async () => {
      try {
        // Get pending test requests
        const response = await labService.getPendingTestRequests()
        if (response.data && response.data.success) {
          const data = response.data.data || []
          pendingTests.value = Array.isArray(data) ? data : []
          
          // Update stats
          labStats.value.pending = pendingTests.value.filter(t => t.status === 'pending').length
          labStats.value.in_progress = pendingTests.value.filter(t => t.status === 'in_progress').length
        }
      } catch (error) {
        console.error('Error loading pending tests:', error)
        pendingTests.value = []
      }
    }

    const loadUrgentRequests = async () => {
      try {
        const response = await labService.getUrgentTestRequests()
        if (response.data && response.data.success) {
          const data = response.data.data || []
          urgentRequests.value = Array.isArray(data) ? data : []
          labStats.value.urgent = urgentRequests.value.length
        }
      } catch (error) {
        console.error('Error loading urgent requests:', error)
        urgentRequests.value = []
      }
    }

    const loadTodayTests = async () => {
      try {
        const response = await labService.getTodayTests()
        if (response.data && response.data.success) {
          const data = response.data.data || []
          todayTests.value = Array.isArray(data) ? data : []
          labStats.value.completed_today = todayTests.value.filter(t => t.status === 'completed').length
        }
      } catch (error) {
        console.error('Error loading today tests:', error)
        todayTests.value = []
      }
    }

    const loadStatistics = async () => {
      try {
        const response = await labService.getTestRequestStatistics()
        if (response.data && response.data.success) {
          const stats = response.data.data || {}
          labStats.value = {
            ...labStats.value,
            ...stats
          }
        }
      } catch (error) {
        console.error('Error loading statistics:', error)
      }
    }

    // Actions
    const startTest = (test) => {
      test.status = 'in_progress'
      showSuccess(`Test started: ${test.test_name}`)
      loadPendingTests() // Refresh the list
    }

    const completeTest = (test) => {
      currentTestForCompletion.value = test
      testResults.value = {
        results: '',
        notes: ''
      }
      showCompleteModal.value = true
    }

    const submitResults = async () => {
      if (!testResults.value.results.trim()) {
        showError('Please enter test results')
        return
      }

      submitting.value = true
      try {
        const response = await labService.completeTestRequest(
          currentTestForCompletion.value.id, 
          {
            results: testResults.value.results,
            notes: testResults.value.notes
          }
        )

        if (response.data && response.data.success) {
          showSuccess('Test completed successfully')
          showCompleteModal.value = false
          await loadAllData() // Refresh all data
        }
      } catch (error) {
        console.error('Error completing test:', error)
        showError('Failed to complete test', error.response?.data?.message)
      } finally {
        submitting.value = false
      }
    }

    const viewTest = (test) => {
      selectedTest.value = test
    }

    const printTest = (test) => {
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
      user,
      testsLoading,
      urgentLoading,
      submitting,
      statusFilter,
      sortField,
      sortOrder,
      currentPage,
      itemsPerPage,
      selectedTest,
      showCompleteModal,
      testResults,
      pendingTests,
      urgentRequests,
      labStats,
      paginatedTests,
      totalPages,
      completionRate,
      todayStats,
      labActions,
      
      // Toast
      showSuccessToast,
      showErrorToast,
      successMessage,
      errorTitle,
      errorMessage,
      errorDetails,
      
      // Methods
      getInitials,
      getPatientName,
      getPatientId,
      getPatientAvatarStyle,
      formatDate,
      formatDateTime,
      formatTimeAgo,
      formatPriority,
      formatStatus,
      getSortIcon,
      sortBy,
      filterByStatus,
      filterByPriority,
      filterTests,
      startTest,
      completeTest,
      submitResults,
      viewTest,
      printTest,
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
/* All the CSS from the previous version remains exactly the same */
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

.header-badge.warning {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.card-content {
  padding: 1.5rem;
}

/* Filter Group */
.filter-group {
  min-width: 150px;
}

.filter-select {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  color: var(--text-light);
  font-size: 0.9rem;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 12px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary);
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

/* Test ID */
.test-id {
  background: rgba(0, 255, 196, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  color: var(--primary);
  font-size: 0.8rem;
}

/* Test Type */
.test-name {
  font-weight: 500;
  color: var(--text-light);
}

/* Priority Badge */
.priority-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-badge.urgent,
.priority-badge.high {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.priority-badge.normal {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.priority-badge.low {
  background: rgba(107, 114, 128, 0.1);
  color: #6B7280;
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.priority-badge.large {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
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

.status-badge.pending {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.status-badge.in_progress {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.status-badge.completed {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-badge.large {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

/* Requested Time */
.requested-time {
  color: var(--text-muted);
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

.btn-icon.primary:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-color: #3b82f6;
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

.action-icon.orange {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
}

.action-icon.purple {
  background: rgba(139, 92, 246, 0.1);
  color: #8B5CF6;
}

.action-icon.green {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
}

.action-btn span {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-light);
  text-align: center;
}

/* Urgent List */
.urgent-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.urgent-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
}

.urgent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.urgent-header .patient-name {
  font-weight: 600;
  color: var(--text-light);
}

.urgent-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-name {
  color: var(--text-light);
  font-size: 0.9rem;
}

.request-time {
  font-size: 0.7rem;
  color: var(--text-muted);
}

/* Summary Stats */
.summary-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-stat {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid var(--card-border);
}

.summary-stat .stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.25rem;
}

.summary-stat .stat-label {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.progress-section {
  margin-top: 1rem;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-light);
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, var(--primary), #3b82f6);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Lab Statistics */
.lab-statistics {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-row .stat-label {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.stat-row .stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-light);
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

.empty-state.small i {
  font-size: 1.5rem;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
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

.modal-content.large {
  max-width: 800px;
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

/* Test Overview */
.test-overview {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.test-header-large {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--card-border);
  flex-wrap: wrap;
  gap: 1rem;
}

.test-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.25rem;
}

.test-meta {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
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

/* Results Section */
.results-section,
.notes-section {
  margin: 1rem 0;
}

.results-content {
  background: rgba(255, 255, 255, 0.02);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  color: var(--text-light);
  font-family: monospace;
  white-space: pre-wrap;
  line-height: 1.6;
}

.notes-content {
  background: rgba(255, 255, 255, 0.02);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  color: var(--text-light);
  line-height: 1.6;
}

/* Form Styles */
.results-form {
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

.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  color: var(--text-light);
  font-size: 0.95rem;
  transition: all 0.2s ease;
  resize: vertical;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 255, 196, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--card-border);
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
  .card-header,
  .btn,
  .modal-overlay {
    display: none !important;
  }
  
  .lab-dashboard {
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
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-header,
  .modal-body {
    padding: 1rem;
  }
  
  .test-header-large {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-start;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .header-stats {
    grid-template-columns: 1fr;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .modal-actions .btn {
    width: 100%;
  }
  
  .patient-info-cell {
    flex-wrap: wrap;
  }
}
</style>