<template>
  <div class="stock-requests">
    <div class="page-header">
      <h1 class="page-title">Stock Requests</h1>
      <div class="header-actions">
        <button class="btn-secondary" @click="refreshRequests">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon pending">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-info">
          <h3>{{ pendingCount }}</h3>
          <p>Pending Requests</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon approved">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-info">
          <h3>{{ approvedCount }}</h3>
          <p>Approved</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon rejected">
          <i class="fas fa-times-circle"></i>
        </div>
        <div class="stat-info">
          <h3>{{ rejectedCount }}</h3>
          <p>Rejected</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-info">
          <h3>{{ totalRequests }}</h3>
          <p>Total Requests</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input
          v-model="searchQuery"
          placeholder="Search by item or requester..."
        />
      </div>
      <select v-model="statusFilter" class="filter-select">
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <select v-model="priorityFilter" class="filter-select">
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
      <input
        type="date"
        v-model="fromDate"
        class="date-input"
        placeholder="From Date"
      />
      <input
        type="date"
        v-model="toDate"
        class="date-input"
        placeholder="To Date"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading requests...</p>
    </div>

    <!-- Requests Table -->
    <div v-else class="requests-table-container">
      <table class="requests-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Item</th>
            <th>Requester</th>
            <th>Quantity</th>
            <th>Priority</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="request in filteredRequests" :key="request.id">
            <td>{{ formatDate(request.created_at) }}</td>
            <td>
              <div class="item-info">
                <div
                  class="item-icon-small"
                  :style="{ background: getItemColor(request.item_id) }"
                >
                  <i :class="getItemIcon(request.item_id)"></i>
                </div>
                <span>{{ request.item_name }}</span>
              </div>
            </td>
            <td>{{ request.requested_by }}</td>
            <td class="quantity-cell">{{ request.requested_quantity }}</td>
            <td>
              <span :class="['priority-badge', request.priority]">{{
                request.priority
              }}</span>
            </td>
            <td class="reason-cell">{{ request.reason || "-" }}</td>
            <td>
              <span :class="['status-badge', request.status]">{{
                request.status
              }}</span>
            </td>
            <td class="actions-cell">
              <template v-if="request.status === 'pending'">
                <button
                  class="btn-approve-sm"
                  @click="openApproveModal(request)"
                  title="Approve"
                >
                  <i class="fas fa-check"></i>
                </button>
                <button
                  class="btn-reject-sm"
                  @click="openRejectModal(request)"
                  title="Reject"
                >
                  <i class="fas fa-times"></i>
                </button>
              </template>
              <button
                class="btn-icon"
                @click="viewDetails(request)"
                title="View Details"
              >
                <i class="fas fa-eye"></i>
              </button>
            </td>
          </tr>
          <tr v-if="filteredRequests.length === 0">
            <td colspan="8" class="empty-state">No stock requests found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Approve Modal -->
    <div
      v-if="showApproveModal"
      class="modal-overlay"
      @click.self="closeModals"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h2>Approve Stock Request</h2>
          <button class="close-btn" @click="closeModals">&times;</button>
        </div>
        <div class="modal-body">
          <div class="selected-item" v-if="selectedRequest">
            <div
              class="item-icon"
              :style="{ background: getItemColor(selectedRequest.item_id) }"
            >
              <i :class="getItemIcon(selectedRequest.item_id)"></i>
            </div>
            <div>
              <div class="item-name">{{ selectedRequest.item_name }}</div>
              <div class="item-detail">
                Requested: {{ selectedRequest.requested_quantity }} units
              </div>
              <div class="item-detail">
                Priority: {{ selectedRequest.priority }}
              </div>
              <div class="item-detail">
                Reason: {{ selectedRequest.reason || "No reason provided" }}
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Available Stock</label>
            <div
              class="stock-info"
              :class="getStockClass(selectedRequest?.item_id)"
            >
              <i class="fas fa-boxes"></i>
              <span
                >{{ getAvailableStock(selectedRequest?.item_id) }} units
                available</span
              >
            </div>
          </div>

          <div class="form-group">
            <label>Transfer Quantity</label>
            <input
              type="number"
              v-model.number="transferQuantity"
              :max="selectedRequest?.requested_quantity"
              min="1"
              placeholder="Enter quantity to transfer"
            />
            <small
              >Maximum allowed:
              {{ selectedRequest?.requested_quantity }} units</small
            >
          </div>

          <div class="form-group">
            <label>Admin Response (Optional)</label>
            <textarea
              v-model="adminResponse"
              rows="3"
              placeholder="Add a response message..."
            ></textarea>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModals">Cancel</button>
            <button
              class="btn-approve"
              @click="approveRequest"
              :disabled="submitting"
            >
              <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
              <span v-else>Approve & Transfer</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Reject Stock Request</h2>
          <button class="close-btn" @click="closeModals">&times;</button>
        </div>
        <div class="modal-body">
          <div class="selected-item" v-if="selectedRequest">
            <div
              class="item-icon"
              :style="{ background: getItemColor(selectedRequest.item_id) }"
            >
              <i :class="getItemIcon(selectedRequest.item_id)"></i>
            </div>
            <div>
              <div class="item-name">{{ selectedRequest.item_name }}</div>
              <div class="item-detail">
                Requested: {{ selectedRequest.requested_quantity }} units
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Reason for Rejection *</label>
            <textarea
              v-model="rejectReason"
              rows="4"
              placeholder="Explain why the request is being rejected..."
            ></textarea>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModals">Cancel</button>
            <button
              class="btn-reject"
              @click="rejectRequest"
              :disabled="submitting || !rejectReason"
            >
              <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
              <span v-else>Reject Request</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div
      v-if="showDetailsModal"
      class="modal-overlay"
      @click.self="closeModals"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h2>Request Details</h2>
          <button class="close-btn" @click="closeModals">&times;</button>
        </div>
        <div class="modal-body">
          <div class="details-card" v-if="selectedRequest">
            <div class="detail-row">
              <label>Request ID:</label>
              <span>#{{ selectedRequest.id }}</span>
            </div>
            <div class="detail-row">
              <label>Date:</label>
              <span>{{ formatDateTime(selectedRequest.created_at) }}</span>
            </div>
            <div class="detail-row">
              <label>Item:</label>
              <div class="item-info">
                <div
                  class="item-icon-small"
                  :style="{ background: getItemColor(selectedRequest.item_id) }"
                >
                  <i :class="getItemIcon(selectedRequest.item_id)"></i>
                </div>
                <span>{{ selectedRequest.item_name }}</span>
              </div>
            </div>
            <div class="detail-row">
              <label>Requested By:</label>
              <span>{{ selectedRequest.requested_by }}</span>
            </div>
            <div class="detail-row">
              <label>Quantity:</label>
              <span class="quantity-highlight">{{
                selectedRequest.requested_quantity
              }}</span>
            </div>
            <div class="detail-row">
              <label>Priority:</label>
              <span :class="['priority-badge', selectedRequest.priority]">{{
                selectedRequest.priority
              }}</span>
            </div>
            <div class="detail-row">
              <label>Reason:</label>
              <p>{{ selectedRequest.reason || "-" }}</p>
            </div>
            <div class="detail-row">
              <label>Status:</label>
              <span :class="['status-badge', selectedRequest.status]">{{
                selectedRequest.status
              }}</span>
            </div>
            <div v-if="selectedRequest.admin_response" class="detail-row">
              <label>Admin Response:</label>
              <p>{{ selectedRequest.admin_response }}</p>
            </div>
            <div v-if="selectedRequest.response_date" class="detail-row">
              <label>Response Date:</label>
              <span>{{ formatDateTime(selectedRequest.response_date) }}</span>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="closeModals">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="toastMessage" class="toast" :class="toastType">
      <i :class="toastIcon"></i>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import api from "../../services/api";
export default {
  name: "StockRequests",
  setup() {
    const toast = useToast();

    // State
    const loading = ref(true);
    const submitting = ref(false);
    const searchQuery = ref("");
    const statusFilter = ref("");
    const priorityFilter = ref("");
    const fromDate = ref("");
    const toDate = ref("");
    const requests = ref([]);
    const itemDetails = ref({});
    const adminInventory = ref([]);

    // Modal state
    const showApproveModal = ref(false);
    const showRejectModal = ref(false);
    const showDetailsModal = ref(false);
    const selectedRequest = ref(null);
    const transferQuantity = ref(1);
    const adminResponse = ref("");
    const rejectReason = ref("");

    // Toast state
    const toastMessage = ref("");
    const toastType = ref("success");

    const toastIcon = computed(() => {
      return toastType.value === "success"
        ? "fas fa-check-circle"
        : "fas fa-exclamation-circle";
    });

    const pendingCount = computed(
      () => requests.value.filter((r) => r.status === "pending").length,
    );
    const approvedCount = computed(
      () => requests.value.filter((r) => r.status === "approved").length,
    );
    const rejectedCount = computed(
      () => requests.value.filter((r) => r.status === "rejected").length,
    );
    const totalRequests = computed(() => requests.value.length);

    const filteredRequests = computed(() => {
      let filtered = requests.value;

      if (searchQuery.value) {
        filtered = filtered.filter(
          (r) =>
            r.item_name
              ?.toLowerCase()
              .includes(searchQuery.value.toLowerCase()) ||
            r.requested_by
              ?.toLowerCase()
              .includes(searchQuery.value.toLowerCase()),
        );
      }

      if (statusFilter.value) {
        filtered = filtered.filter((r) => r.status === statusFilter.value);
      }

      if (priorityFilter.value) {
        filtered = filtered.filter((r) => r.priority === priorityFilter.value);
      }

      if (fromDate.value) {
        filtered = filtered.filter((r) => r.created_at >= fromDate.value);
      }

      if (toDate.value) {
        filtered = filtered.filter((r) => r.created_at <= toDate.value);
      }

      return filtered;
    });

    const getAuthHeaders = () => {
      const token = localStorage.getItem("authToken");
      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
    };

    const showToastMessage = (message, type = "success") => {
      toastMessage.value = message;
      toastType.value = type;
      setTimeout(() => {
        toastMessage.value = "";
      }, 3000);
    };

    const formatDate = (dateTime) => {
      if (!dateTime) return "-";
      const date = new Date(dateTime);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    const formatDateTime = (dateTime) => {
      if (!dateTime) return "-";
      const date = new Date(dateTime);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const getItemColor = (itemId) => {
      return itemDetails.value[itemId]?.color || "#EFCA71";
    };

    const getItemIcon = (itemId) => {
      return itemDetails.value[itemId]?.icon || "fas fa-cube";
    };

    const getAvailableStock = (itemId) => {
      const item = adminInventory.value.find((i) => i.item_id === itemId);
      return item?.quantity || 0;
    };

    const getStockClass = (itemId) => {
      const stock = getAvailableStock(itemId);
      if (stock <= 10) return "critical";
      if (stock <= 30) return "low";
      return "adequate";
    };

    const fetchRequests = async () => {
      try {
        const response = await api.get("/admin/stock-requests");
        if (response.status == 200) {
          const data = await response.data;
          requests.value = Array.isArray(data) ? data : [];
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
        showToastMessage("Failed to load requests", "error");
      }
    };

    const fetchItemDetails = async () => {
      try {
        const response = await api.get("/admin/items");
        if (response.status == 200) {
          const data = await response.data;
          const items = Array.isArray(data) ? data : [];
          items.forEach((item) => {
            itemDetails.value[item.id] = {
              icon: item.icon,
              color: item.color,
            };
          });
        }
      } catch (error) {
        console.error("Error fetching item details:", error);
      }
    };

    const fetchAdminInventory = async () => {
      try {
        const response = await api.get("/admin/admin-inventory");
        if (response.status == 200) {
          const data = await response.data;
          adminInventory.value = Array.isArray(data) ? data : [];
        }
      } catch (error) {
        console.error("Error fetching admin inventory:", error);
      }
    };

    const refreshRequests = async () => {
      await Promise.all([fetchRequests(), fetchAdminInventory()]);
      showToastMessage("Requests refreshed");
    };

    const openApproveModal = (request) => {
      selectedRequest.value = request;
      transferQuantity.value = request.requested_quantity;
      adminResponse.value = "";
      showApproveModal.value = true;
    };

    const openRejectModal = (request) => {
      selectedRequest.value = request;
      rejectReason.value = "";
      showRejectModal.value = true;
    };

    const viewDetails = (request) => {
      selectedRequest.value = request;
      showDetailsModal.value = true;
    };

    const approveRequest = async () => {
      if (!transferQuantity.value || transferQuantity.value <= 0) {
        showToastMessage("Please enter a valid quantity", "error");
        return;
      }

      submitting.value = true;
      try {
        const response = await api.put(
          `/admin/stock-requests/${selectedRequest.value.id}/approve`,
          {
            admin_response: adminResponse.value,
            transfer_quantity: transferQuantity.value,
          },
        );

        if (response.status == 200) {
          const result = await response.data;
          showToastMessage(
            result.message || "Stock request approved successfully",
          );
          closeModals();
          refreshRequests();
        } else {
          const error = await response.data;
          showToastMessage(
            error.detail || "Failed to approve request",
            "error",
          );
        }
      } catch (error) {
        console.error("Error approving request:", error);
        showToastMessage("Failed to approve request", "error");
      } finally {
        submitting.value = false;
      }
    };

    const rejectRequest = async () => {
      if (!rejectReason.value.trim()) {
        showToastMessage("Please provide a reason for rejection", "error");
        return;
      }

      submitting.value = true;
      try {
        const response = await api.put(
          `/admin/stock-requests/${selectedRequest.value.id}/reject`,
          {
            admin_response: rejectReason.value,
          },
        );

        if (response.status == 200) {
          const result = await response.data;
          showToastMessage(result.message || "Stock request rejected");
          closeModals();
          refreshRequests();
        } else {
          const error = await response.data;
          showToastMessage(error.detail || "Failed to reject request", "error");
        }
      } catch (error) {
        console.error("Error rejecting request:", error);
        showToastMessage("Failed to reject request", "error");
      } finally {
        submitting.value = false;
      }
    };

    const closeModals = () => {
      showApproveModal.value = false;
      showRejectModal.value = false;
      showDetailsModal.value = false;
      selectedRequest.value = null;
    };

    onMounted(async () => {
      loading.value = true;
      await Promise.all([
        fetchRequests(),
        fetchItemDetails(),
        fetchAdminInventory(),
      ]);
      loading.value = false;
    });

    return {
      loading,
      submitting,
      searchQuery,
      statusFilter,
      priorityFilter,
      fromDate,
      toDate,
      requests,
      pendingCount,
      approvedCount,
      rejectedCount,
      totalRequests,
      filteredRequests,
      showApproveModal,
      showRejectModal,
      showDetailsModal,
      selectedRequest,
      transferQuantity,
      adminResponse,
      rejectReason,
      toastMessage,
      toastType,
      toastIcon,
      formatDate,
      formatDateTime,
      getItemColor,
      getItemIcon,
      getAvailableStock,
      getStockClass,
      refreshRequests,
      openApproveModal,
      openRejectModal,
      viewDetails,
      approveRequest,
      rejectRequest,
      closeModals,
    };
  },
};
</script>

<style scoped>
/* Add styles similar to previous components */
.stock-requests {
  padding: 24px;
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
  color: #332f2e;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.pending {
  background: #fff3e0;
  color: #f57c00;
}

.stat-icon.approved {
  background: #e8f5e9;
  color: #4caf50;
}

.stat-icon.rejected {
  background: #ffebee;
  color: #f44336;
}

.stat-icon.total {
  background: #e3f2fd;
  color: #1976d2;
}

.stat-info h3 {
  font-size: 24px;
  font-weight: 700;
  color: #332f2e;
  margin: 0;
}

.stat-info p {
  color: #8c8c90;
  margin: 0;
  font-size: 14px;
}

.filters {
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
  color: #8c8c90;
}

.search-box input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #e5e5e2;
  border-radius: 8px;
  font-size: 14px;
}

.filter-select,
.date-input {
  padding: 10px 16px;
  border: 1px solid #e5e5e2;
  border-radius: 8px;
  background: white;
  cursor: pointer;
}

.requests-table-container {
  background: white;
  border-radius: 16px;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.requests-table {
  width: 100%;
  border-collapse: collapse;
}

.requests-table th {
  text-align: left;
  padding: 16px;
  background: #f9f7eb;
  color: #332f2e;
  font-weight: 600;
  border-bottom: 1px solid #e5e5e2;
}

.requests-table td {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-icon-small {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.quantity-cell {
  font-weight: 600;
  color: #efca71;
}

.reason-cell {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.priority-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.priority-badge.low {
  background: #e8f5e9;
  color: #4caf50;
}

.priority-badge.medium {
  background: #fff3e0;
  color: #f57c00;
}

.priority-badge.high {
  background: #ffebee;
  color: #f44336;
}

.priority-badge.urgent {
  background: #ff5252;
  color: white;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background: #fff3e0;
  color: #f57c00;
}

.status-badge.approved {
  background: #e8f5e9;
  color: #4caf50;
}

.status-badge.rejected {
  background: #ffebee;
  color: #f44336;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.btn-approve-sm {
  background: #4caf50;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-approve-sm:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.btn-reject-sm {
  background: #f44336;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-reject-sm:hover {
  background: #da190b;
  transform: translateY(-1px);
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e5e5e2;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-icon:hover {
  background: #f9f7eb;
  border-color: #efca71;
}

.btn-secondary {
  background: #f5f5f5;
  border: 1px solid #e5e5e2;
  padding: 10px 20px;
  border-radius: 8px;
  color: #6f6c6d;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #e5e5e2;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(239, 202, 113, 0.2);
  border-top-color: #efca71;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px !important;
  color: #8c8c90;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e5e2;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #332f2e;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #8c8c90;
}

.modal-body {
  padding: 24px;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9f7eb;
  border-radius: 12px;
  margin-bottom: 20px;
}

.item-name {
  font-weight: 600;
  color: #332f2e;
  margin-bottom: 4px;
}

.item-detail {
  font-size: 12px;
  color: #8c8c90;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #332f2e;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e5e2;
  border-radius: 8px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
}

.form-group small {
  font-size: 12px;
  color: #8c8c90;
  margin-top: 4px;
  display: block;
}

.stock-info {
  padding: 10px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.stock-info.adequate {
  background: #e8f5e9;
  color: #4caf50;
}

.stock-info.low {
  background: #fff3e0;
  color: #f57c00;
}

.stock-info.critical {
  background: #ffebee;
  color: #f44336;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-approve {
  background: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-approve:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-1px);
}

.btn-reject {
  background: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-reject:hover:not(:disabled) {
  background: #da190b;
  transform: translateY(-1px);
}

.details-card {
  background: #f9f7eb;
  border-radius: 12px;
  padding: 16px;
}

.detail-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #e5e5e2;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row label {
  width: 110px;
  font-weight: 600;
  color: #332f2e;
  font-size: 14px;
}

.detail-row span,
.detail-row p {
  flex: 1;
  color: #6f6c6d;
  margin: 0;
}

.quantity-highlight {
  font-weight: 600;
  color: #efca71;
}

.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 3000;
  animation: slideIn 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast.success {
  background: #88b788;
  color: white;
}

.toast.error {
  background: #c45a5a;
  color: white;
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

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stock-requests {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .filters {
    flex-direction: column;
  }

  .search-box input {
    width: 100%;
  }

  .filter-select,
  .date-input {
    width: 100%;
  }

  .modal-content {
    margin: 16px;
  }
}
</style>
