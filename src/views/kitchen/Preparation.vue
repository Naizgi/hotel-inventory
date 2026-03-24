<template>
  <div class="lab-results">
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
          <span class="breadcrumb-current">Test Results</span>
        </li>
      </ol>
    </nav>

    <!-- Quick Action Sidebar -->
    <div class="quick-action-sidebar">
      <button class="quick-action-btn" @click="exportResults" title="Export">
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
            <i class="fas fa-chart-bar"></i>
            Lab Results
          </h1>
          <p class="page-subtitle">View and manage laboratory test results</p>
        </div>
      </div>
      
      <!-- Header Stats -->
      <div class="header-stats">
        <div class="stat-card" @click="filterByStatus('all')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)">
            <i class="fas fa-flask"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.total || 0 }}</span>
            <span class="stat-label">Total Results</span>
          </div>
        </div>
        <div class="stat-card" @click="filterByStatus('completed')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%)">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.completed || 0 }}</span>
            <span class="stat-label">Completed</span>
          </div>
        </div>
        <div class="stat-card" @click="filterByStatus('pending')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%)">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.pending || 0 }}</span>
            <span class="stat-label">Pending</span>
          </div>
        </div>
        <div class="stat-card" @click="filterByStatus('abnormal')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%)">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.abnormal || 0 }}</span>
            <span class="stat-label">Abnormal</span>
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
          <button class="btn-icon subtle" @click="loadResults" title="Refresh" :disabled="loading">
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
                placeholder="Search by patient name or test type..." 
                class="search-input"
                @input="debouncedSearch"
              >
            </div>
            <div class="filter-group">
              <select v-model="filters.status" @change="applyFilters" class="filter-select">
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="abnormal">Abnormal</option>
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
            <div class="filter-group">
              <select v-model="filters.test_type" @change="applyFilters" class="filter-select">
                <option value="all">All Tests</option>
                <option v-for="type in testTypes" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Table -->
      <div class="detail-card">
        <div class="card-header">
          <i class="fas fa-list"></i>
          <h3>Test Results</h3>
          <div class="header-actions">
            <span class="header-badge">{{ totalResults }} results</span>
          </div>
        </div>
        <div class="card-content">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading test results...</p>
          </div>
          
          <div v-else-if="!results || results.length === 0" class="empty-state">
            <i class="fas fa-flask"></i>
            <p>No test results found</p>
          </div>
          
          <div v-else class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th @click="sortBy('id')" class="sortable">
                    Result ID
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
                  <th @click="sortBy('requested_by')" class="sortable">
                    Requested By
                    <i :class="getSortIcon('requested_by')"></i>
                  </th>
                  <th @click="sortBy('requested_date')" class="sortable">
                    Requested
                    <i :class="getSortIcon('requested_date')"></i>
                  </th>
                  <th @click="sortBy('completed_date')" class="sortable">
                    Completed
                    <i :class="getSortIcon('completed_date')"></i>
                  </th>
                  <th @click="sortBy('status')" class="sortable">
                    Status
                    <i :class="getSortIcon('status')"></i>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="result in paginatedResults" :key="result.id" class="table-row-hover">
                  <td>
                    <code class="result-id">RES-{{ String(result.id).padStart(6, '0') }}</code>
                  </td>
                  <td>
                    <div class="patient-info-cell">
                      <div class="patient-avatar small" :style="getPatientAvatarStyle(result)">
                        {{ getInitials(getPatientName(result)) }}
                      </div>
                      <div class="patient-details">
                        <span class="patient-name">{{ getPatientName(result) }}</span>
                        <span class="patient-id">{{ getPatientId(result) }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="test-name">{{ result.test_name }}</span>
                  </td>
                  <td>
                    <span class="doctor-name">Dr. {{ getDoctorName(result) }}</span>
                  </td>
                  <td>
                    <span class="requested-date">{{ formatDate(result.created_at) }}</span>
                  </td>
                  <td>
                    <span class="completed-date">{{ formatDate(result.completed_at) || 'N/A' }}</span>
                  </td>
                  <td>
                    <span class="status-badge" :class="getResultStatus(result)">
                      {{ formatStatus(getResultStatus(result)) }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="btn-icon" @click="viewResult(result)" title="View Details">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button class="btn-icon" @click="downloadResult(result)" title="Download PDF">
                        <i class="fas fa-download"></i>
                      </button>
                      <button class="btn-icon" @click="printResult(result)" title="Print">
                        <i class="fas fa-print"></i>
                      </button>
                      <button v-if="isAbnormal(result)" class="btn-icon warning" @click="flagAbnormal(result)" title="Flag as Abnormal">
                        <i class="fas fa-exclamation-triangle"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
            <div v-if="results && results.length > 0" class="pagination">
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

    <!-- Result Details Modal -->
    <div v-if="selectedResult" class="modal-overlay" @click.self="selectedResult = null">
      <div class="modal-content x-large">
        <div class="modal-header">
          <h3>
            <i class="fas fa-chart-bar"></i>
            Test Result Details - RES-{{ String(selectedResult.id).padStart(6, '0') }}
          </h3>
          <div class="modal-actions">
            <button class="btn-icon subtle" @click="downloadResult(selectedResult)" title="Download">
              <i class="fas fa-download"></i>
            </button>
            <button class="btn-icon subtle" @click="printResult(selectedResult)" title="Print">
              <i class="fas fa-print"></i>
            </button>
            <button class="modal-close" @click="selectedResult = null">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="modal-body">
          <div class="result-overview">
            <!-- Result Header -->
            <div class="result-header-large">
              <div class="header-left">
                <h2 class="result-title">{{ selectedResult.test_name }}</h2>
                <div class="result-meta">
                  Requested: {{ formatDateTime(selectedResult.created_at) }}
                  <span v-if="selectedResult.completed_at"> | Completed: {{ formatDateTime(selectedResult.completed_at) }}</span>
                </div>
              </div>
              <div class="header-right">
                <span class="status-badge large" :class="getResultStatus(selectedResult)">
                  {{ formatStatus(getResultStatus(selectedResult)) }}
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
                    <span class="info-value">{{ getPatientName(selectedResult) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Patient ID:</span>
                    <span class="info-value">{{ getPatientId(selectedResult) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Date of Birth:</span>
                    <span class="info-value">{{ formatDate(selectedResult.patient?.date_of_birth) || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Gender:</span>
                    <span class="info-value">{{ selectedResult.patient?.gender || 'N/A' }}</span>
                  </div>
                </div>
              </div>

              <!-- Test Information -->
              <div class="info-card">
                <h5 class="info-title">
                  <i class="fas fa-stethoscope"></i>
                  Test Information
                </h5>
                <div class="info-items">
                  <div class="info-item">
                    <span class="info-label">Requested By:</span>
                    <span class="info-value">Dr. {{ getDoctorName(selectedResult) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Requested Date:</span>
                    <span class="info-value">{{ formatDate(selectedResult.created_at) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Completed Date:</span>
                    <span class="info-value">{{ formatDate(selectedResult.completed_at) || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Performed By:</span>
                    <span class="info-value">{{ selectedResult.performed_by || 'N/A' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Test Results -->
            <div class="results-section">
              <h5 class="section-title">
                <i class="fas fa-chart-bar"></i>
                Test Results
              </h5>
              <div class="results-table-detailed">
                <table class="results-data-table">
                  <thead>
                    <tr>
                      <th>Parameter</th>
                      <th>Result</th>
                      <th>Unit</th>
                      <th>Reference Range</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(result, index) in selectedResult.results" :key="index"
                        :class="{ 'abnormal-row': result.status === 'abnormal' }">
                      <td><strong>{{ result.parameter }}</strong></td>
                      <td :class="getResultValueClass(result)">{{ result.value }}</td>
                      <td>{{ result.unit }}</td>
                      <td>{{ result.reference_range }}</td>
                      <td>
                        <span class="status-badge small" :class="result.status || 'normal'">
                          {{ result.status || 'Normal' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Clinical Notes -->
            <div v-if="selectedResult.notes" class="notes-section">
              <h5 class="section-title">
                <i class="fas fa-sticky-note"></i>
                Clinical Notes
              </h5>
              <div class="notes-content">
                {{ selectedResult.notes }}
              </div>
            </div>

            <!-- Interpretation -->
            <div v-if="selectedResult.interpretation" class="interpretation-section">
              <h5 class="section-title">
                <i class="fas fa-comment-medical"></i>
                Interpretation
              </h5>
              <div class="interpretation-content">
                {{ selectedResult.interpretation }}
              </div>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="modal-actions">
            <button class="btn btn-primary btn-with-icon" @click="downloadResult(selectedResult)">
              <i class="fas fa-download"></i>
              <span>Download PDF</span>
            </button>
            <button class="btn btn-outline btn-with-icon" @click="printResult(selectedResult)">
              <i class="fas fa-print"></i>
              <span>Print Result</span>
            </button>
            <button v-if="!isAbnormal(selectedResult)" 
                    class="btn btn-warning btn-with-icon" @click="flagAbnormal(selectedResult)">
              <i class="fas fa-exclamation-triangle"></i>
              <span>Flag as Abnormal</span>
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
import labService from '../../services/labService'

export default {
  name: 'LabResults',
  setup() {
    // State
    const loading = ref(false)
    const filters = ref({
      search: '',
      status: 'all',
      date_range: 'all',
      test_type: 'all'
    })
    
    // Sorting and Pagination
    const sortField = ref('completed_date')
    const sortOrder = ref('desc')
    const currentPage = ref(1)
    const itemsPerPage = ref(10)

    // Data
    const results = ref([])
    const stats = ref({
      total: 0,
      completed: 0,
      pending: 0,
      abnormal: 0
    })
    const selectedResult = ref(null)
    const testTypes = ref([])

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
    const totalResults = computed(() => {
      return results.value.length || 0
    })

    const filteredResults = computed(() => {
      let filtered = Array.isArray(results.value) ? [...results.value] : []

      // Apply search filter
      if (filters.value.search) {
        const search = filters.value.search.toLowerCase()
        filtered = filtered.filter(result => 
          (getPatientName(result).toLowerCase().includes(search)) ||
          (result.test_name?.toLowerCase() || '').includes(search) ||
          (result.test_type?.toLowerCase() || '').includes(search)
        )
      }

      // Apply status filter
      if (filters.value.status !== 'all') {
        filtered = filtered.filter(result => {
          const status = getResultStatus(result)
          if (filters.value.status === 'abnormal') {
            return status === 'abnormal'
          }
          return result.status === filters.value.status
        })
      }

      // Apply test type filter
      if (filters.value.test_type !== 'all') {
        filtered = filtered.filter(result => 
          result.test_name === filters.value.test_type || 
          result.test_type === filters.value.test_type
        )
      }

      // Apply date range filter
      if (filters.value.date_range !== 'all') {
        const today = new Date()
        const startDate = new Date()
        
        switch (filters.value.date_range) {
          case 'today':
            startDate.setHours(0, 0, 0, 0)
            filtered = filtered.filter(result => new Date(result.completed_at || result.created_at) >= startDate)
            break
          case 'week':
            startDate.setDate(today.getDate() - 7)
            filtered = filtered.filter(result => new Date(result.completed_at || result.created_at) >= startDate)
            break
          case 'month':
            startDate.setMonth(today.getMonth() - 1)
            filtered = filtered.filter(result => new Date(result.completed_at || result.created_at) >= startDate)
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
        } else if (sortField.value === 'requested_by') {
          aVal = getDoctorName(a)
          bVal = getDoctorName(b)
        } else if (sortField.value === 'requested_date') {
          aVal = a.created_at
          bVal = b.created_at
        } else if (sortField.value === 'completed_date') {
          aVal = a.completed_at || a.created_at
          bVal = b.completed_at || b.created_at
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

    const paginatedResults = computed(() => {
      const filtered = filteredResults.value
      if (!Array.isArray(filtered) || filtered.length === 0) return []
      
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return filtered.slice(start, end)
    })

    const totalPages = computed(() => {
      const filtered = filteredResults.value
      if (!Array.isArray(filtered) || filtered.length === 0) return 1
      return Math.ceil(filtered.length / itemsPerPage.value)
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

    const formatStatus = (status) => {
      if (!status) return 'Unknown'
      const map = {
        'completed': 'Completed',
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'abnormal': 'Abnormal',
        'normal': 'Normal',
        'high': 'High',
        'low': 'Low'
      }
      return map[status] || status
    }

    const getResultStatus = (result) => {
      if (result.result_status) return result.result_status
      if (result.status === 'completed' && result.results) {
        // Check if any results are abnormal
        const hasAbnormal = result.results.some(r => r.status === 'abnormal' || r.status === 'high' || r.status === 'low')
        return hasAbnormal ? 'abnormal' : 'completed'
      }
      return result.status || 'pending'
    }

    const getResultValueClass = (result) => {
      if (result.status === 'abnormal' || result.status === 'high' || result.status === 'low') {
        return 'abnormal-value'
      }
      return 'normal-value'
    }

    const isAbnormal = (result) => {
      return getResultStatus(result) === 'abnormal'
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
    const loadResults = async () => {
      loading.value = true
      try {
        const response = await labService.getLabRecords()
        if (response.data && response.data.success) {
          const data = response.data.data || []
          results.value = Array.isArray(data) ? data : []
          
          // Extract unique test types
          const types = new Set()
          results.value.forEach(r => {
            if (r.test_name) types.add(r.test_name)
            if (r.test_type) types.add(r.test_type)
          })
          testTypes.value = Array.from(types)
          
          // Update stats
          stats.value = {
            total: results.value.length,
            completed: results.value.filter(r => r.status === 'completed').length,
            pending: results.value.filter(r => r.status === 'pending' || r.status === 'in_progress').length,
            abnormal: results.value.filter(r => {
              if (r.result_status === 'abnormal') return true
              if (r.results) {
                return r.results.some(res => res.status === 'abnormal' || res.status === 'high' || res.status === 'low')
              }
              return false
            }).length
          }
        }
      } catch (error) {
        console.error('Error loading results:', error)
        showError('Failed to load test results')
      } finally {
        loading.value = false
      }
    }

    // Actions
    const viewResult = (result) => {
      selectedResult.value = result
    }

    const downloadResult = (result) => {
      showSuccess('Download feature coming soon')
    }

    const printResult = (result) => {
      showSuccess('Print feature coming soon')
    }

    const flagAbnormal = (result) => {
      showSuccess('Result flagged as abnormal')
    }

    const exportResults = () => {
      showSuccess('Export feature coming soon')
    }

    const printView = () => {
      window.print()
    }

    // Lifecycle
    onMounted(() => {
      loadResults()
    })

    return {
      // State
      loading,
      filters,
      sortField,
      sortOrder,
      currentPage,
      itemsPerPage,
      results,
      stats,
      selectedResult,
      testTypes,
      
      // Toast
      showSuccessToast,
      showErrorToast,
      successMessage,
      errorTitle,
      errorMessage,
      errorDetails,
      
      // Computed
      totalResults,
      filteredResults,
      paginatedResults,
      totalPages,
      
      // Methods
      getInitials,
      getPatientName,
      getPatientId,
      getDoctorName,
      getPatientAvatarStyle,
      formatDate,
      formatDateTime,
      formatStatus,
      getResultStatus,
      getResultValueClass,
      isAbnormal,
      getSortIcon,
      sortBy,
      filterByStatus,
      applyFilters,
      debouncedSearch,
      loadResults,
      viewResult,
      downloadResult,
      printResult,
      flagAbnormal,
      exportResults,
      printView,
      showSuccess,
      showError
    }
  }
}
</script>

<style scoped>
.lab-results {
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

/* Result ID */
.result-id {
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

/* Dates */
.requested-date,
.completed-date {
  color: var(--text-muted);
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

.status-badge.completed {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
  border: 1px solid rgba(34, 197, 94, 0.3);
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

.status-badge.abnormal,
.status-badge.high,
.status-badge.low {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.status-badge.normal {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-badge.large {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.status-badge.small {
  padding: 0.15rem 0.5rem;
  font-size: 0.6rem;
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

.btn-icon.warning:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  border-color: var(--danger);
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

@keyframes spin {
  to { transform: rotate(360deg); }
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

/* Result Overview */
.result-overview {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.result-header-large {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--card-border);
  flex-wrap: wrap;
  gap: 1rem;
}

.result-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.25rem;
}

.result-meta {
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

/* Results Table Detailed */
.results-section {
  margin: 1rem 0;
}

.results-data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  overflow: hidden;
}

.results-data-table th {
  text-align: left;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.8rem;
  border-bottom: 1px solid var(--card-border);
}

.results-data-table td {
  padding: 0.75rem;
  color: var(--text-light);
  border-bottom: 1px solid var(--card-border);
}

.results-data-table tr:last-child td {
  border-bottom: none;
}

.abnormal-row {
  background: rgba(239, 68, 68, 0.05);
}

.abnormal-value {
  color: var(--danger);
  font-weight: 600;
}

.normal-value {
  color: var(--success);
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

/* Notes Section */
.notes-section,
.interpretation-section {
  margin: 1rem 0;
}

.notes-content,
.interpretation-content {
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

.btn-warning {
  background: var(--warning);
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #ea580c;
  transform: translateY(-2px);
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
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-header,
  .modal-body {
    padding: 1rem;
  }
  
  .result-header-large {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-start;
  }
  
  .info-grid-2col {
    grid-template-columns: 1fr;
  }
  
  .results-data-table {
    font-size: 0.8rem;
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
  
  .results-data-table {
    display: block;
    overflow-x: auto;
  }
}
</style>