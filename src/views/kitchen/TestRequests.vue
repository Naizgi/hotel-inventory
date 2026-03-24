<template>
  <div class="test-requests">
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
          <a href="/lab" class="breadcrumb-link">
            <span>Laboratory</span>
          </a>
        </li>
        <li class="breadcrumb-item">
          <i class="fas fa-chevron-right"></i>
          <span class="breadcrumb-current">Test Requests</span>
        </li>
      </ol>
    </nav>

    <!-- Quick Action Sidebar -->
    <div class="quick-action-sidebar">
      <button class="quick-action-btn" @click="showNewRequestModal = true" title="New Test Request">
        <i class="fas fa-vial"></i>
      </button>
      <button class="quick-action-btn" @click="exportRequests" title="Export">
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
            Test Requests
          </h1>
          <p class="page-subtitle">Manage laboratory test requests from doctors</p>
        </div>
      </div>
      
      <!-- Header Stats -->
      <div class="header-stats">
        <div class="stat-card" @click="filterByStatus('pending')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%)">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.pending || 0 }}</span>
            <span class="stat-label">Pending Tests</span>
          </div>
        </div>
        <div class="stat-card" @click="filterByStatus('completed')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%)">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.completed_today || 0 }}</span>
            <span class="stat-label">Completed Today</span>
          </div>
        </div>
        <div class="stat-card" @click="filterByPriority('urgent')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%)">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.urgent || 0 }}</span>
            <span class="stat-label">Urgent Tests</span>
          </div>
        </div>
        <div class="stat-card" @click="filterByStatus('in_progress')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)">
            <i class="fas fa-hourglass-half"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.in_progress || 0 }}</span>
            <span class="stat-label">In Progress</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Search and Filters Card -->
      <div class="detail-card filters-card">
        <div class="card-header">
          <i class="fas fa-filter"></i>
          <h3>Search & Filters</h3>
          <button class="btn-icon subtle" @click="loadRequests" title="Refresh" :disabled="loading">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          </button>
        </div>
        <div class="card-content">
          <div class="filters-grid">
            <div class="search-box">
              <i class="fas fa-search search-icon"></i>
              <input 
                v-model="filters.search" 
                type="text" 
                placeholder="Search by patient, test, or doctor..." 
                class="search-input"
                @input="debouncedSearch"
              >
            </div>
            <div class="filter-group">
              <select v-model="filters.status" @change="applyFilters" class="filter-select">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div class="filter-group">
              <select v-model="filters.priority" @change="applyFilters" class="filter-select">
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div class="filter-group">
              <select v-model="filters.date_range" @change="applyFilters" class="filter-select">
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Test Requests Table -->
      <div class="detail-card">
        <div class="card-header">
          <i class="fas fa-list"></i>
          <h3>Test Requests</h3>
          <div class="header-actions">
            <span class="header-badge">{{ totalRequests }} total</span>
            <button class="btn btn-primary btn-sm" @click="showNewRequestModal = true">
              <i class="fas fa-plus"></i>
              New Request
            </button>
          </div>
        </div>
        <div class="card-content">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading test requests...</p>
          </div>
          
          <div v-else-if="!requests || requests.length === 0" class="empty-state">
            <i class="fas fa-flask"></i>
            <p>No test requests found</p>
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
                  <th @click="sortBy('doctor_name')" class="sortable">
                    Requested By
                    <i :class="getSortIcon('doctor_name')"></i>
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
                <tr v-for="request in paginatedRequests" :key="request.id" class="table-row-hover">
                  <td>
                    <code class="request-id">REQ-{{ String(request.id).padStart(6, '0') }}</code>
                  </td>
                  <td>
                    <div class="patient-info-cell">
                      <div class="patient-avatar small" :style="getPatientAvatarStyle(request)">
                        {{ getInitials(getPatientName(request)) }}
                      </div>
                      <div class="patient-details">
                        <span class="patient-name">{{ getPatientName(request) }}</span>
                        <span class="patient-id">{{ getPatientId(request) }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="test-name">{{ request.test_name }}</span>
                  </td>
                  <td>
                    <span class="doctor-name">Dr. {{ getDoctorName(request) }}</span>
                  </td>
                  <td>
                    <span class="requested-time">{{ formatTimeAgo(request.created_at) }}</span>
                  </td>
                  <td>
                    <span class="priority-badge" :class="request.priority || 'normal'">
                      {{ formatPriority(request.priority) }}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" :class="request.status">
                      {{ formatStatus(request.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button v-if="request.status === 'pending'" 
                              class="btn-icon success" @click="startTest(request)" 
                              title="Start Test">
                        <i class="fas fa-play-circle"></i>
                      </button>
                      <button v-if="request.status === 'in_progress'" 
                              class="btn-icon primary" @click="completeTest(request)" 
                              title="Complete Test">
                        <i class="fas fa-check-circle"></i>
                      </button>
                      <button class="btn-icon" @click="viewRequest(request)" title="View Details">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button class="btn-icon" @click="printRequest(request)" title="Print">
                        <i class="fas fa-print"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
            <div v-if="requests && requests.length > 0" class="pagination">
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

    <!-- New Test Request Modal -->
    <div v-if="showNewRequestModal" class="modal-overlay" @click.self="showNewRequestModal = false">
      <div class="modal-content large">
        <div class="modal-header">
          <h3>
            <i class="fas fa-vial"></i>
            New Test Request
          </h3>
          <button class="modal-close" @click="showNewRequestModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createRequest" class="request-form">
            <!-- Patient Selection -->
            <div class="form-group" v-if="!selectedPatient">
              <label class="form-label required">Patient</label>
              <div class="search-patient">
                <i class="fas fa-search input-icon"></i>
                <input 
                  type="text" 
                  v-model="patientSearchQuery" 
                  placeholder="Search patient by name, phone, or ID..." 
                  class="form-input"
                  @input="debouncedSearchPatients"
                />
              </div>
              
              <div v-if="searchingPatients" class="loading-small">
                <div class="loading-spinner small"></div>
                Searching patients...
              </div>
              
              <div v-if="searchedPatients.length > 0" class="patient-results">
                <div 
                  v-for="patient in searchedPatients" 
                  :key="patient.id"
                  class="patient-result-item"
                  @click="selectPatient(patient)"
                >
                  <div class="patient-avatar small" :style="getAvatarStyle(patient)">
                    {{ getInitials(patient.patient_name || patient.name) }}
                  </div>
                  <div class="patient-info">
                    <strong>{{ patient.patient_name || patient.name }}</strong>
                    <div class="patient-meta">
                      <span><i class="fas fa-id-card"></i> {{ patient.patient_code || patient.id }}</span>
                      <span><i class="fas fa-phone"></i> {{ formatPhoneNumber(patient.contact_number || patient.phone) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Selected Patient Display -->
            <div v-if="selectedPatient" class="selected-patient-badge">
              <div class="badge-content">
                <i class="fas fa-user"></i>
                <span>Patient: <strong>{{ selectedPatient.patient_name || selectedPatient.name }}</strong></span>
              </div>
              <button type="button" class="btn-icon subtle small" @click="clearSelectedPatient" title="Change Patient">
                <i class="fas fa-times"></i>
              </button>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">Test Name</label>
                <input type="text" v-model="newRequest.test_name" class="form-input" placeholder="e.g., Complete Blood Count" required>
              </div>
              <div class="form-group">
                <label class="form-label required">Priority</label>
                <select v-model="newRequest.priority" class="form-select" required>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Clinical Notes</label>
              <textarea v-model="newRequest.notes" class="form-textarea" 
                        rows="4" placeholder="Enter any clinical notes or specific instructions..."></textarea>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-outline" @click="showNewRequestModal = false">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="!isRequestValid || creating">
                <i class="fas" :class="creating ? 'fa-spinner fa-spin' : 'fa-save'"></i>
                {{ creating ? 'Creating...' : 'Create Request' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Test Details Modal -->
    <div v-if="selectedRequest" class="modal-overlay" @click.self="selectedRequest = null">
      <div class="modal-content x-large">
        <div class="modal-header">
          <h3>
            <i class="fas fa-flask"></i>
            Test Request Details - REQ-{{ String(selectedRequest.id).padStart(6, '0') }}
          </h3>
          <div class="modal-actions">
            <button class="btn-icon subtle" @click="printRequest(selectedRequest)" title="Print">
              <i class="fas fa-print"></i>
            </button>
            <button class="modal-close" @click="selectedRequest = null">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="modal-body">
          <div class="test-overview">
            <!-- Test Header -->
            <div class="test-header-large">
              <div class="header-left">
                <h2 class="test-title">{{ selectedRequest.test_name }}</h2>
                <div class="test-meta">Requested: {{ formatDateTime(selectedRequest.created_at) }}</div>
              </div>
              <div class="header-right">
                <span class="priority-badge large" :class="selectedRequest.priority || 'normal'">
                  {{ formatPriority(selectedRequest.priority) }}
                </span>
                <span class="status-badge large" :class="selectedRequest.status">
                  {{ formatStatus(selectedRequest.status) }}
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
                    <span class="info-value">{{ getPatientName(selectedRequest) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Patient ID:</span>
                    <span class="info-value">{{ getPatientId(selectedRequest) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Date of Birth:</span>
                    <span class="info-value">{{ formatDate(selectedRequest.patient?.date_of_birth) || 'N/A' }}</span>
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
                    <span class="info-value">Dr. {{ getDoctorName(selectedRequest) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Requested Date:</span>
                    <span class="info-value">{{ formatDate(selectedRequest.created_at) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Priority:</span>
                    <span class="info-value">
                      <span class="priority-badge" :class="selectedRequest.priority || 'normal'">
                        {{ formatPriority(selectedRequest.priority) }}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Test Results (if completed) -->
            <div v-if="selectedRequest.results" class="results-section">
              <h5 class="section-title">
                <i class="fas fa-chart-bar"></i>
                Test Results
              </h5>
              <div class="results-content">
                <pre>{{ selectedRequest.results }}</pre>
              </div>
            </div>

            <!-- Clinical Notes -->
            <div v-if="selectedRequest.notes" class="notes-section">
              <h5 class="section-title">
                <i class="fas fa-sticky-note"></i>
                Clinical Notes
              </h5>
              <div class="notes-content">
                {{ selectedRequest.notes }}
              </div>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="modal-actions">
            <button v-if="selectedRequest.status === 'pending'" 
                    class="btn btn-success btn-with-icon" @click="startTest(selectedRequest)">
              <i class="fas fa-play-circle"></i>
              <span>Start Test</span>
            </button>
            <button v-if="selectedRequest.status === 'in_progress'" 
                    class="btn btn-primary btn-with-icon" @click="completeTest(selectedRequest)">
              <i class="fas fa-check-circle"></i>
              <span>Complete Test</span>
            </button>
            <button class="btn btn-outline btn-with-icon" @click="printRequest(selectedRequest)">
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
import labService from '../../services/labService'
import patientService from '../../services/patientService'
import { useAuthStore } from '../../store/auth'

export default {
  name: 'TestRequests',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const user = authStore.user

    // State
    const loading = ref(false)
    const creating = ref(false)
    const submitting = ref(false)
    const searchingPatients = ref(false)
    const showNewRequestModal = ref(false)
    const showCompleteModal = ref(false)
    const selectedRequest = ref(null)
    const currentRequestForCompletion = ref(null)
    const testResults = ref({
      results: '',
      notes: ''
    })
    
    // Filters
    const filters = ref({
      search: '',
      status: 'all',
      priority: 'all',
      date_range: 'all'
    })
    
    // Sorting and Pagination
    const sortField = ref('created_at')
    const sortOrder = ref('desc')
    const currentPage = ref(1)
    const itemsPerPage = ref(10)

    // Data
    const requests = ref([])
    const stats = ref({
      pending: 0,
      completed_today: 0,
      urgent: 0,
      in_progress: 0
    })

    // Patient search
    const searchedPatients = ref([])
    const selectedPatient = ref(null)
    const patientSearchQuery = ref('')

    // New request form
    const newRequest = ref({
      patient_id: '',
      test_name: '',
      priority: 'normal',
      notes: ''
    })

    // Toast states
    const showSuccessToast = ref(false)
    const showErrorToast = ref(false)
    const successMessage = ref('')
    const errorTitle = ref('')
    const errorMessage = ref('')
    const errorDetails = ref('')

    // Debounce timeout
    let searchTimeout = null

    // Computed
    const totalRequests = computed(() => {
      return requests.value.length || 0
    })

    const filteredRequests = computed(() => {
      let filtered = Array.isArray(requests.value) ? [...requests.value] : []

      // Apply search filter
      if (filters.value.search) {
        const search = filters.value.search.toLowerCase()
        filtered = filtered.filter(req => 
          (req.patient?.patient_name?.toLowerCase() || '').includes(search) ||
          (req.test_name?.toLowerCase() || '').includes(search) ||
          (req.doctor?.name?.toLowerCase() || '').includes(search)
        )
      }

      // Apply status filter
      if (filters.value.status !== 'all') {
        filtered = filtered.filter(req => req.status === filters.value.status)
      }

      // Apply priority filter
      if (filters.value.priority !== 'all') {
        filtered = filtered.filter(req => req.priority === filters.value.priority)
      }

      // Apply date range filter
      if (filters.value.date_range !== 'all') {
        const today = new Date()
        const startDate = new Date()
        
        switch (filters.value.date_range) {
          case 'today':
            startDate.setHours(0, 0, 0, 0)
            filtered = filtered.filter(req => new Date(req.created_at) >= startDate)
            break
          case 'week':
            startDate.setDate(today.getDate() - 7)
            filtered = filtered.filter(req => new Date(req.created_at) >= startDate)
            break
          case 'month':
            startDate.setMonth(today.getMonth() - 1)
            filtered = filtered.filter(req => new Date(req.created_at) >= startDate)
            break
        }
      }

      // Apply sorting
      filtered.sort((a, b) => {
        if (!a || !b) return 0
        
        let aVal = a[sortField.value]
        let bVal = b[sortField.value]

        if (sortField.value === 'patient_name') {
          aVal = getPatientName(a)
          bVal = getPatientName(b)
        } else if (sortField.value === 'doctor_name') {
          aVal = getDoctorName(a)
          bVal = getDoctorName(b)
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

    const paginatedRequests = computed(() => {
      const filtered = filteredRequests.value
      if (!Array.isArray(filtered) || filtered.length === 0) return []
      
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return filtered.slice(start, end)
    })

    const totalPages = computed(() => {
      const filtered = filteredRequests.value
      if (!Array.isArray(filtered) || filtered.length === 0) return 1
      return Math.ceil(filtered.length / itemsPerPage.value)
    })

    const isRequestValid = computed(() => {
      return newRequest.value.patient_id && 
             newRequest.value.test_name
    })

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

    const getDoctorName = (item) => {
      if (!item) return 'Unknown'
      return item.doctor?.full_name || 
             item.doctor?.name || 
             item.doctor_name || 
             'Unknown'
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

    const getAvatarStyle = (patient) => {
      const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
      ]
      const index = (patient?.id || '').toString().length % colors.length
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

    const formatPhoneNumber = (phone) => {
      if (!phone) return null
      const cleaned = phone.toString().replace(/\D/g, '')
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
      }
      if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
      }
      return phone
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
      filters.value.status = status
      applyFilters()
    }

    const filterByPriority = (priority) => {
      filters.value.priority = priority
      applyFilters()
    }

    const applyFilters = () => {
      currentPage.value = 1
    }

    const debouncedSearch = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        applyFilters()
      }, 300)
    }

    // Data Loading
    const loadRequests = async () => {
      loading.value = true
      try {
        const response = await labService.getTestRequests()
        if (response.data && response.data.success) {
          const data = response.data.data || []
          requests.value = Array.isArray(data) ? data : []
          
          // Update stats
          stats.value = {
            pending: requests.value.filter(r => r.status === 'pending').length,
            in_progress: requests.value.filter(r => r.status === 'in_progress').length,
            completed_today: requests.value.filter(r => {
              if (r.status !== 'completed') return false
              const today = new Date().toDateString()
              const completedDate = new Date(r.updated_at).toDateString()
              return completedDate === today
            }).length,
            urgent: requests.value.filter(r => r.priority === 'urgent' && r.status !== 'completed').length
          }
        }
      } catch (error) {
        console.error('Error loading requests:', error)
        showError('Failed to load test requests')
      } finally {
        loading.value = false
      }
    }

    // Patient Search
    const debouncedSearchPatients = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        searchPatients()
      }, 500)
    }

    const searchPatients = async () => {
      if (!patientSearchQuery.value.trim()) {
        searchedPatients.value = []
        return
      }

      searchingPatients.value = true
      try {
        const response = await patientService.searchPatients(patientSearchQuery.value)
        if (response.data && response.data.success) {
          const data = response.data.data || []
          searchedPatients.value = Array.isArray(data) ? data : []
        }
      } catch (error) {
        console.error('Error searching patients:', error)
      } finally {
        searchingPatients.value = false
      }
    }

    const selectPatient = (patient) => {
      selectedPatient.value = patient
      newRequest.value.patient_id = patient.id
      searchedPatients.value = []
      patientSearchQuery.value = `${patient.patient_name || patient.name} (${patient.patient_code || patient.id})`
    }

    const clearSelectedPatient = () => {
      selectedPatient.value = null
      newRequest.value.patient_id = ''
      patientSearchQuery.value = ''
      searchedPatients.value = []
    }

    // Request Actions
    const createRequest = async () => {
      if (!isRequestValid.value) {
        showError('Please fill in all required fields')
        return
      }

      creating.value = true
      try {
        const requestData = {
          patient_id: parseInt(newRequest.value.patient_id),
          test_name: newRequest.value.test_name,
          priority: newRequest.value.priority,
          notes: newRequest.value.notes || null
        }

        const response = await labService.createTestRequest(requestData)
        
        if (response.data && response.data.success) {
          showSuccess('Test request created successfully')
          showNewRequestModal.value = false
          resetNewRequestForm()
          await loadRequests()
        }
      } catch (error) {
        console.error('Error creating request:', error)
        showError('Failed to create test request', error.response?.data?.message)
      } finally {
        creating.value = false
      }
    }

    const startTest = (request) => {
      request.status = 'in_progress'
      showSuccess(`Test started: ${request.test_name}`)
    }

    const completeTest = (request) => {
      currentRequestForCompletion.value = request
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
          currentRequestForCompletion.value.id, 
          {
            results: testResults.value.results,
            notes: testResults.value.notes
          }
        )

        if (response.data && response.data.success) {
          showSuccess('Test completed successfully')
          showCompleteModal.value = false
          await loadRequests()
        }
      } catch (error) {
        console.error('Error completing test:', error)
        showError('Failed to complete test', error.response?.data?.message)
      } finally {
        submitting.value = false
      }
    }

    const viewRequest = (request) => {
      selectedRequest.value = request
    }

    const printRequest = (request) => {
      showSuccess('Print feature coming soon')
    }

    const exportRequests = () => {
      showSuccess('Export feature coming soon')
    }

    const printView = () => {
      window.print()
    }

    const resetNewRequestForm = () => {
      newRequest.value = {
        patient_id: '',
        test_name: '',
        priority: 'normal',
        notes: ''
      }
      selectedPatient.value = null
      patientSearchQuery.value = ''
    }

    // Lifecycle
    onMounted(() => {
      loadRequests()
    })

    return {
      // State
      loading,
      creating,
      submitting,
      searchingPatients,
      showNewRequestModal,
      showCompleteModal,
      selectedRequest,
      testResults,
      filters,
      sortField,
      sortOrder,
      currentPage,
      itemsPerPage,
      requests,
      stats,
      searchedPatients,
      selectedPatient,
      patientSearchQuery,
      newRequest,
      
      // Toast
      showSuccessToast,
      showErrorToast,
      successMessage,
      errorTitle,
      errorMessage,
      errorDetails,
      
      // Computed
      totalRequests,
      filteredRequests,
      paginatedRequests,
      totalPages,
      isRequestValid,
      
      // Methods
      getInitials,
      getPatientName,
      getPatientId,
      getDoctorName,
      getPatientAvatarStyle,
      getAvatarStyle,
      formatDate,
      formatDateTime,
      formatTimeAgo,
      formatPriority,
      formatStatus,
      formatPhoneNumber,
      getSortIcon,
      sortBy,
      filterByStatus,
      filterByPriority,
      applyFilters,
      debouncedSearch,
      loadRequests,
      debouncedSearchPatients,
      searchPatients,
      selectPatient,
      clearSelectedPatient,
      createRequest,
      startTest,
      completeTest,
      submitResults,
      viewRequest,
      printRequest,
      exportRequests,
      printView,
      showSuccess,
      showError
    }
  }
}
</script>

<style scoped>
/* All the CSS from the previous version with the new design language */
.test-requests {
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

/* Filters Grid */
.filters-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem;
  align-items: center;
}

@media (max-width: 1024px) {
  .filters-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box .search-icon {
  position: absolute;
  left: 1rem;
  color: var(--text-muted);
  font-size: 1rem;
}

.search-box .search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  background: var(--bg-primary);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  color: var(--text-light);
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.search-box .search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 255, 196, 0.1);
}

.filter-group {
  width: 100%;
}

.filter-select {
  width: 100%;
  padding: 0.75rem 2rem 0.75rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  color: var(--text-light);
  font-size: 0.95rem;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 14px;
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

/* Request ID */
.request-id {
  background: rgba(0, 255, 196, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  color: var(--primary);
  font-size: 0.8rem;
}

/* Test Name */
.test-name {
  font-weight: 500;
  color: var(--text-light);
}

/* Doctor Name */
.doctor-name {
  color: var(--text-light);
  font-size: 0.9rem;
}

/* Requested Time */
.requested-time {
  color: var(--text-muted);
  font-size: 0.9rem;
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

/* Loading States */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-muted);
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
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-small {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Empty States */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.3;
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

/* Form Styles */
.request-form,
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--card-border);
}

/* Search Patient */
.search-patient {
  position: relative;
  display: flex;
  align-items: center;
}

.search-patient .input-icon {
  position: absolute;
  left: 1rem;
  color: var(--text-muted);
  font-size: 1rem;
}

.search-patient .form-input {
  padding-left: 3rem;
  flex: 1;
}

.patient-results {
  margin-top: 0.5rem;
  border: 1px solid var(--card-border);
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  background: var(--bg-secondary);
}

.patient-result-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--card-border);
}

.patient-result-item:last-child {
  border-bottom: none;
}

.patient-result-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.patient-avatar.small {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
}

.patient-info {
  flex: 1;
  font-size: 0.9rem;
}

.patient-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.patient-meta i {
  margin-right: 0.15rem;
  font-size: 0.6rem;
}

.selected-patient-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(0, 255, 196, 0.1);
  border: 1px solid var(--primary);
  border-radius: 8px;
  color: var(--text-light);
}

.badge-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge-content i {
  color: var(--primary);
}

.btn-icon.small {
  width: 24px;
  height: 24px;
  font-size: 0.8rem;
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

/* Responsive Design */
@media (max-width: 1024px) {
  .header-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filters-grid {
    grid-template-columns: 1fr 1fr;
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
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-group {
    width: 100%;
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
  
  .patient-info-cell {
    flex-wrap: wrap;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .patient-meta {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>