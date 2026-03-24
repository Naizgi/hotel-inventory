<template>
  <div class="doctor-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="page-title">Doctor Dashboard</h1>
        <p class="page-subtitle">Your Schedule & Patient Management</p>
      </div>
      <div class="header-actions">
        <div class="date-display">
          <i class="fas fa-calendar-alt"></i>
          {{ currentDate }}
        </div>
        <button class="btn btn-outline btn-sm" @click="refreshData" :disabled="loading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-section">
      <div class="error-alert">
        <i class="fas fa-exclamation-triangle"></i>
        <div class="error-content">
          <h4>Failed to load dashboard data</h4>
          <p>{{ error }}</p>
          <button class="btn btn-primary btn-sm" @click="refreshData">
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card glass-card" v-for="stat in doctorStats" :key="stat.id">
        <div class="stat-icon" :class="stat.color">
          <i :class="stat.icon"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ stat.value }}</h3>
          <p class="stat-label">{{ stat.label }}</p>
          <div class="stat-trend" :class="stat.trend" v-if="stat.trendValue">
            <i :class="stat.trendIcon"></i>
            {{ stat.trendValue }}
          </div>
        </div>
        <div v-if="stat.loading" class="stat-loading">
          <div class="loading-spinner-small"></div>
        </div>
        <div class="stat-glow"></div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions-section">
      <h2 class="section-title">Quick Actions</h2>
      <div class="actions-grid">
        <div class="action-card glass-card" v-for="action in doctorActions" :key="action.id" @click="navigateTo(action.route)">
          <div class="action-icon" :class="action.color">
            <i :class="action.icon"></i>
          </div>
          <div class="action-content">
            <h3>{{ action.title }}</h3>
            <p>{{ action.description }}</p>
          </div>
          <div class="action-arrow">
            <i class="fas fa-arrow-right"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Today's Schedule & Recent Patients -->
    <div class="dashboard-content">
      <div class="content-column">
        <!-- Today's Schedule -->
        <div class="glass-card">
          <div class="card-header">
            <h3>Today's Schedule</h3>
            <button class="btn btn-outline btn-sm" @click="refreshData" :disabled="loading">
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
              Refresh
            </button>
          </div>
          <div class="schedule-list">
            <div v-if="!dashboardData.today_schedule && loading" class="loading-schedule">
              <div class="loading-spinner small"></div>
              <p>Loading schedule...</p>
            </div>
            <div v-else-if="!dashboardData.today_schedule || Object.keys(dashboardData.today_schedule || {}).length === 0" class="empty-state">
              <i class="fas fa-calendar-times"></i>
              <p>No appointments scheduled for today</p>
            </div>
            <template v-else>
              <!-- Grouped by hour -->
              <div v-for="(appointments, hour) in dashboardData.today_schedule" :key="hour" class="schedule-hour-group">
                <div class="hour-header">{{ hour }}</div>
                <div v-for="appointment in appointments" :key="appointment.id" class="schedule-item">
                  <div class="appointment-time">
                    {{ formatTime(appointment.appointment_date) }}
                  </div>
                  <div class="appointment-details">
                    <div class="patient-info">
                      <strong>{{ appointment.patient?.name || appointment.patient_name || 'N/A' }}</strong>
                      <span class="patient-id">ID: {{ appointment.patient_id || appointment.patient?.id || 'N/A' }}</span>
                    </div>
                    <div class="appointment-type">
                      <i class="fas fa-stethoscope"></i>
                      {{ appointment.appointment_type || appointment.service_type || 'Consultation' }}
                    </div>
                  </div>
                  <div class="appointment-status" :class="getStatusClass(appointment.status)">
                    {{ formatStatus(appointment.status) }}
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Performance Metrics -->
        <div class="glass-card">
          <div class="card-header">
            <h3>Performance Metrics</h3>
            <button class="btn btn-outline btn-sm" @click="refreshData" :disabled="loading">
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
              Refresh
            </button>
          </div>
          <div class="performance-metrics">
            <div v-if="loading" class="loading-metrics">
              <div class="loading-spinner small"></div>
              <p>Loading metrics...</p>
            </div>
            <template v-else-if="dashboardData.performance_metrics">
              <div class="performance-metric">
                <div class="metric-info">
                  <span class="metric-name">Monthly Completion Rate</span>
                  <span class="metric-value">{{ dashboardData.performance_metrics.current_month?.completion_rate || 0 }}%</span>
                </div>
                <div class="metric-bar">
                  <div class="metric-progress" :style="{ width: (dashboardData.performance_metrics.current_month?.completion_rate || 0) + '%' }" 
                       :class="getMetricStatus(dashboardData.performance_metrics.current_month?.completion_rate || 0)"></div>
                </div>
              </div>
              <div class="performance-metric">
                <div class="metric-info">
                  <span class="metric-name">Appointments Completed</span>
                  <span class="metric-value">{{ dashboardData.performance_metrics.current_month?.completed_appointments || 0 }}/{{ dashboardData.performance_metrics.current_month?.total_appointments || 0 }}</span>
                </div>
                <div class="metric-bar">
                  <div class="metric-progress" :style="{ width: Math.min(100, ((dashboardData.performance_metrics.current_month?.completed_appointments || 0) / (dashboardData.performance_metrics.current_month?.total_appointments || 1)) * 100) + '%' }" 
                       :class="getMetricStatus(((dashboardData.performance_metrics.current_month?.completed_appointments || 0) / (dashboardData.performance_metrics.current_month?.total_appointments || 1)) * 100)"></div>
                </div>
              </div>
              <div class="performance-metric">
                <div class="metric-info">
                  <span class="metric-name">New Patients This Month</span>
                  <span class="metric-value">{{ dashboardData.performance_metrics.current_month?.new_patients || 0 }}</span>
                </div>
                <div class="metric-bar">
                  <div class="metric-progress" :style="{ width: Math.min(100, (dashboardData.performance_metrics.current_month?.new_patients || 0) * 10) + '%' }" 
                       :class="getMetricStatus(Math.min(100, (dashboardData.performance_metrics.current_month?.new_patients || 0) * 10))"></div>
                </div>
              </div>
            </template>
            <div v-else class="empty-state">
              <i class="fas fa-chart-line"></i>
              <p>No performance data available</p>
            </div>
          </div>
        </div>
      </div>

      <div class="content-column">
        <!-- Upcoming Appointments -->
        <div class="glass-card">
          <div class="card-header">
            <h3>Upcoming Appointments</h3>
            <button class="btn btn-outline btn-sm" @click="refreshData" :disabled="loading">
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
              Refresh
            </button>
          </div>
          <div class="appointments-list">
            <div v-if="loading" class="loading-upcoming">
              <div class="loading-spinner small"></div>
              <p>Loading appointments...</p>
            </div>
            <div v-else-if="!dashboardData.upcoming_appointments || dashboardData.upcoming_appointments.length === 0" class="empty-state">
              <i class="fas fa-calendar-plus"></i>
              <p>No upcoming appointments</p>
            </div>
            <div v-else v-for="appointment in dashboardData.upcoming_appointments.slice(0, 6)" :key="appointment.id" class="appointment-item">
              <div class="appointment-date">
                {{ formatAppointmentDate(appointment.appointment_date) }}
              </div>
              <div class="appointment-details">
                <div class="patient-info">
                  <strong>{{ appointment.patient?.name || appointment.patient_name || 'N/A' }}</strong>
                  <span>{{ appointment.appointment_type || appointment.service_type || 'Consultation' }}</span>
                </div>
                <div class="appointment-time">
                  {{ formatTime(appointment.appointment_date) }}
                </div>
              </div>
              <div class="appointment-actions">
                <button class="btn btn-outline btn-sm" @click="viewPatient(appointment.patient_id || appointment.patient?.id)">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Patients -->
        <div class="glass-card">
          <div class="card-header">
            <h3>Recent Patients</h3>
            <button class="btn btn-outline btn-sm" @click="refreshData" :disabled="loading">
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
              Refresh
            </button>
          </div>
          <div class="patients-list">
            <div v-if="loading" class="loading-patients">
              <div class="loading-spinner small"></div>
              <p>Loading patients...</p>
            </div>
            <div v-else-if="!dashboardData.recent_patients || dashboardData.recent_patients.length === 0" class="empty-state">
              <i class="fas fa-user-injured"></i>
              <p>No recent patients</p>
            </div>
            <div v-else v-for="patient in dashboardData.recent_patients.slice(0, 5)" :key="patient.id" class="patient-item">
              <div class="patient-avatar">
                {{ getInitials(patient.name || patient.full_name || patient.patient_name) }}
              </div>
              <div class="patient-details">
                <strong>{{ patient.name || patient.full_name || patient.patient_name || 'N/A' }}</strong>
                <span>Patient ID: {{ patient.id || patient.patient_id || 'N/A' }}</span>
              </div>
              <div class="patient-actions">
                <button class="btn btn-outline btn-sm" @click="viewPatient(patient.id || patient.patient_id)">
                  <i class="fas fa-file-medical"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '../../store/auth'
import doctorDashboardService from '../../services/doctorDashboardService'

export default {
  name: 'DoctorDashboard',
  setup() {
    const router = useRouter()
    const toast = useToast()
    const authStore = useAuthStore()
    
    // Consolidated loading state
    const loading = ref(false)
    const error = ref(null)
    
    // Track if data has been loaded to prevent multiple API calls
    const hasDataLoaded = ref(false)
    const isMounted = ref(false)
    
    const currentDate = ref(new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }))

    // Consolidated data structure
    const dashboardData = ref({
      stats: null,
      today_schedule: null,
      upcoming_appointments: [],
      recent_patients: [],
      performance_metrics: null
    })

    const doctorStats = ref([])
    
    // Doctor-specific quick actions
    const doctorActions = [
      {
        id: 1,
        icon: 'fas fa-calendar-plus',
        title: 'Schedule Appointment',
        description: 'Book new patient appointments',
        route: '/doctor/appointments',
        color: 'blue'
      },
      {
        id: 2,
        icon: 'fas fa-file-medical',
        title: 'Medical Records',
        description: 'View and update patient records',
        route: '/doctor/medical-records',
        color: 'green'
      },
      {
        id: 3,
        icon: 'fas fa-prescription',
        title: 'Write Prescription',
        description: 'Create new prescriptions',
        route: '/doctor/prescriptions',
        color: 'purple'
      },
      {
        id: 4,
        icon: 'fas fa-vial',
        title: 'Lab Requests',
        description: 'Order lab tests for patients',
        route: '/doctor/lab-requests',
        color: 'orange'
      }
    ]

    // Initialize with loading states
    const initializeStats = () => {
      doctorStats.value = [
        {
          id: 1,
          icon: 'fas fa-calendar-check',
          label: "Today's Appointments",
          value: '0',
          color: 'blue',
          loading: true
        },
        {
          id: 2,
          icon: 'fas fa-user-injured',
          label: 'Total Patients',
          value: '0',
          color: 'green',
          loading: true
        },
        {
          id: 3,
          icon: 'fas fa-clock',
          label: 'Monthly Consultations',
          value: '0',
          color: 'purple',
          loading: true
        },
        {
          id: 4,
          icon: 'fas fa-prescription',
          label: 'Monthly Prescriptions',
          value: '0',
          color: 'orange',
          loading: true
        },
        {
          id: 5,
          icon: 'fas fa-calendar',
          label: 'Upcoming Appointments',
          value: '0',
          color: 'teal',
          loading: true
        },
        {
          id: 6,
          icon: 'fas fa-vial',
          label: 'Pending Lab Requests',
          value: '0',
          color: 'red',
          loading: true
        }
      ]
    }

    // Single API call to get all doctor dashboard data
    const loadDashboardData = async (forceRefresh = false) => {
      if (hasDataLoaded.value && !forceRefresh) {
        console.log('👨‍⚕️ Doctor Dashboard: Data already loaded, skipping API call...')
        return
      }

      if (loading.value) {
        console.log('⏳ Doctor Dashboard: Already loading, skipping...')
        return
      }

      loading.value = true
      error.value = null

      try {
        console.log('👨‍⚕️ Loading consolidated doctor dashboard data...')
        
        const response = await doctorDashboardService.getDashboardData()
        
        if (response.data.success) {
          dashboardData.value = response.data.data || {}
          updateStatsFromAPI()
          hasDataLoaded.value = true
          console.log('✅ Consolidated doctor dashboard data loaded successfully')
        } else {
          throw new Error(response.data.message || 'Failed to load dashboard data')
        }
        
      } catch (err) {
        console.error('❌ Error loading consolidated dashboard data:', err)
        error.value = 'Failed to load dashboard data. Please try again.'
        
        // Initialize with empty data instead of crashing
        updateStatsFromAPI()
      } finally {
        loading.value = false
      }
    }

    // Update stats from API response
    const updateStatsFromAPI = () => {
      const stats = dashboardData.value.stats || {}
        
      doctorStats.value = [
        {
          id: 1,
          icon: 'fas fa-calendar-check',
          label: "Today's Appointments",
          value: (stats.today_appointments || 0).toString(),
          trend: (stats.today_appointments || 0) > 0 ? 'up' : 'neutral',
          trendIcon: (stats.today_appointments || 0) > 0 ? 'fas fa-arrow-up' : 'fas fa-minus',
          trendValue: (stats.today_appointments || 0) > 0 ? '+3%' : '0%',
          color: 'blue',
          loading: false
        },
        {
          id: 2,
          icon: 'fas fa-user-injured',
          label: 'Total Patients',
          value: (stats.total_patients || 0).toString(),
          trend: (stats.total_patients || 0) > 0 ? 'up' : 'neutral',
          trendIcon: (stats.total_patients || 0) > 0 ? 'fas fa-arrow-up' : 'fas fa-minus',
          trendValue: (stats.total_patients || 0) > 0 ? '+5%' : '0%',
          color: 'green',
          loading: false
        },
        {
          id: 3,
          icon: 'fas fa-clock',
          label: 'Monthly Consultations',
          value: (stats.monthly_consultations || 0).toString(),
          trend: (stats.monthly_consultations || 0) > 0 ? 'up' : 'neutral',
          trendIcon: (stats.monthly_consultations || 0) > 0 ? 'fas fa-arrow-up' : 'fas fa-minus',
          trendValue: (stats.monthly_consultations || 0) > 0 ? '+8%' : '0%',
          color: 'purple',
          loading: false
        },
        {
          id: 4,
          icon: 'fas fa-prescription',
          label: 'Monthly Prescriptions',
          value: (stats.monthly_prescriptions || 0).toString(),
          trend: (stats.monthly_prescriptions || 0) > 0 ? 'up' : 'neutral',
          trendIcon: (stats.monthly_prescriptions || 0) > 0 ? 'fas fa-arrow-up' : 'fas fa-minus',
          trendValue: (stats.monthly_prescriptions || 0) > 0 ? '+12%' : '0%',
          color: 'orange',
          loading: false
        },
        {
          id: 5,
          icon: 'fas fa-calendar',
          label: 'Upcoming Appointments',
          value: (stats.upcoming_appointments || 0).toString(),
          trend: 'neutral',
          trendIcon: 'fas fa-minus',
          trendValue: '0%',
          color: 'teal',
          loading: false
        },
        {
          id: 6,
          icon: 'fas fa-vial',
          label: 'Pending Lab Requests',
          value: (stats.pending_test_requests || 0).toString(),
          trend: 'neutral',
          trendIcon: 'fas fa-minus',
          trendValue: '0%',
          color: 'red',
          loading: false
        }
      ]
    }

    // Helper Methods
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

    const formatAppointmentDate = (dateString) => {
      if (!dateString) return 'N/A'
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          weekday: 'short'
        })
      } catch {
        return dateString
      }
    }

    const formatStatus = (status) => {
      if (!status) return 'Unknown'
      return status.charAt(0).toUpperCase() + status.slice(1)
    }

    const getStatusClass = (status) => {
      const statusMap = {
        'scheduled': 'scheduled',
        'confirmed': 'scheduled',
        'checked_in': 'checked-in',
        'in_progress': 'checked-in',
        'completed': 'completed',
        'cancelled': 'cancelled'
      }
      return statusMap[status] || 'scheduled'
    }

    const getMetricStatus = (percentage) => {
      if (percentage >= 90) return 'excellent'
      if (percentage >= 80) return 'good'
      if (percentage >= 70) return 'average'
      return 'poor'
    }

    const getInitials = (name) => {
      if (!name) return '??'
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    const viewPatient = (patientId) => {
      if (patientId) {
        router.push(`/doctor/patients/${patientId}`)
      } else {
        toast.warning('Patient ID not available')
      }
    }

    const refreshData = async () => {
      console.log('🔄 Manual refresh requested...')
      await loadDashboardData(true) // Force refresh
      toast.success('Dashboard updated successfully')
    }

    const navigateTo = (route) => {
      router.push(route)
    }

    onMounted(() => {
      console.log('👨‍⚕️ DoctorDashboard: Component mounted - loading data once')
      isMounted.value = true
      
      initializeStats()
      
      // Load data only once when component mounts
      loadDashboardData()
    })

    onUnmounted(() => {
      console.log('🔚 DoctorDashboard: Component unmounted')
      isMounted.value = false
    })

    return {
      currentDate,
      loading,
      error,
      dashboardData,
      doctorStats,
      doctorActions,
      navigateTo,
      refreshData,
      formatTime,
      formatAppointmentDate,
      formatStatus,
      getStatusClass,
      getMetricStatus,
      getInitials,
      viewPatient
    }
  }
}
</script>




<style scoped>
/* Your CSS styles remain exactly the same */

.schedule-hour-group {
  margin-bottom: 1rem;
}

.hour-header {
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 0.5rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid var(--card-border);
}

.loading-metrics {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-muted);
}

.metric-progress.excellent {
  background: var(--success);
}

.metric-progress.good {
  background: var(--warning);
}

.metric-progress.average {
  background: #ffa500;
}

.metric-progress.poor {
  background: var(--danger);
}


.loading-metrics {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-muted);
}

.metric-progress.excellent {
  background: var(--success);
}

.metric-progress.good {
  background: var(--warning);
}

.metric-progress.average {
  background: #ffa500;
}

.metric-progress.poor {
  background: var(--danger);
}


.admin-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.header-content .page-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: var(--gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: var(--text-muted);
  font-size: 1.1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  color: var(--text-light);
  font-weight: 500;
}

.date-display i {
  color: var(--primary);
}

/* Error State */
.error-section {
  margin-bottom: 2rem;
}

.error-alert {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: var(--danger);
}

.error-alert i {
  font-size: 1.5rem;
  margin-top: 0.25rem;
}

.error-content h4 {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.error-content p {
  margin: 0 0 1rem 0;
  opacity: 0.9;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border-color: var(--primary);
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

.stat-icon.blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.green {
  background: linear-gradient(135deg, #00FFC4 0%, #00B4A0 100%);
}

.stat-icon.purple {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-light);
  margin-bottom: 0.25rem;
}

.stat-label {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.stat-trend.up {
  color: var(--success);
}

.stat-trend.down {
  color: var(--danger);
}

.stat-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-left: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.stat-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 196, 0.1), transparent);
  transition: left 0.5s;
}

.stat-card:hover .stat-glow {
  left: 100%;
}

/* Quick Actions */
.quick-actions-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 1rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.action-card {
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.action-card:hover {
  transform: translateY(-3px);
  border-color: var(--primary);
  box-shadow: 0 8px 25px rgba(0, 255, 196, 0.15);
}

.action-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.action-icon.blue {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.action-icon.green {
  background: rgba(0, 255, 196, 0.1);
  color: var(--primary);
}

.action-icon.purple {
  background: rgba(240, 147, 251, 0.1);
  color: #f093fb;
}

.action-icon.orange {
  background: rgba(255, 154, 158, 0.1);
  color: #ff9a9e;
}

.action-content {
  flex: 1;
}

.action-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 0.25rem;
}

.action-content p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.action-arrow {
  color: var(--primary);
  transition: transform 0.3s ease;
}

.action-card:hover .action-arrow {
  transform: translateX(5px);
}

/* Dashboard Content */
.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.content-column .glass-card {
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-light);
}

.health-status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.health-status.healthy {
  background: rgba(0, 200, 150, 0.1);
  color: var(--success);
  border: 1px solid rgba(0, 200, 150, 0.2);
}

.health-status.unknown {
  background: rgba(107, 114, 128, 0.1);
  color: var(--text-muted);
  border: 1px solid rgba(107, 114, 128, 0.2);
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.activity-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-icon.success {
  background: rgba(0, 200, 150, 0.1);
  color: var(--success);
}

.activity-icon.info {
  background: rgba(0, 150, 255, 0.1);
  color: #0096ff;
}

.activity-icon.warning {
  background: rgba(255, 159, 67, 0.1);
  color: var(--warning);
}

.activity-details {
  flex: 1;
}

.activity-text {
  color: var(--text-light);
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.activity-time {
  color: var(--text-muted);
  font-size: 0.8rem;
}

/* Financial Overview */
.financial-overview {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.financial-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

.financial-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-light);
}

.financial-value {
  font-weight: 600;
  color: var(--text-light);
}

.text-green { color: var(--success); }
.text-blue { color: #667eea; }
.text-purple { color: #9b59b6; }

/* Appointments Overview */
.appointments-overview {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.appointment-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}

.appointment-time {
  font-size: 0.8rem;
  color: var(--text-muted);
  min-width: 60px;
}

.appointment-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.appointment-details strong {
  font-size: 0.9rem;
  color: var(--text-light);
}

.appointment-details span {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.appointment-status {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.appointment-status.scheduled {
  background: rgba(255, 159, 67, 0.1);
  color: var(--warning);
}

.appointment-status.checked-in {
  background: rgba(0, 200, 150, 0.1);
  color: var(--success);
}

.appointment-status.completed {
  background: rgba(107, 114, 128, 0.1);
  color: var(--text-muted);
}

.appointment-status.cancelled {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

/* Health Metrics */
.health-metrics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.health-metric {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-name {
  color: var(--text-light);
  font-size: 0.9rem;
}

.metric-value {
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
}

.metric-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.metric-progress {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.metric-progress.healthy {
  background: var(--success);
}

.metric-progress.warning {
  background: var(--warning);
}

.metric-progress.critical {
  background: var(--danger);
}

/* Loading States */
.loading-activities,
.loading-financial,
.loading-appointments {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-muted);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
  margin-bottom: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-muted);
  text-align: center;
}

.empty-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

@media (max-width: 1024px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .admin-dashboard {
    padding: 16px;
  }
}
</style>