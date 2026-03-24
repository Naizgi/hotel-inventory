<template>
  <div class="page-container">
    <div class="page-header">
      <h2>📦 Lab Inventory</h2>
      <p>Manage laboratory supplies and equipment</p>
    </div>
    
    <div class="content-section">
      <div class="inventory-stats">
        <div class="stat-card">
          <h3>Total Items</h3>
          <p class="stat-number">156</p>
        </div>
        <div class="stat-card">
          <h3>Low Stock</h3>
          <p class="stat-number warning">12</p>
        </div>
        <div class="stat-card">
          <h3>Out of Stock</h3>
          <p class="stat-number danger">3</p>
        </div>
      </div>

      <div class="inventory-table">
        <div class="table-actions">
          <button class="btn-primary">
            <i class="fas fa-plus"></i>
            Add Item
          </button>
          <button class="btn-secondary">
            <i class="fas fa-download"></i>
            Export
          </button>
        </div>

        <div class="table-container">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Minimum Stock</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in inventory" :key="item.id">
                <td>{{ item.name }}</td>
                <td>{{ item.category }}</td>
                <td>{{ item.currentStock }}</td>
                <td>{{ item.minStock }}</td>
                <td>
                  <span class="status" :class="getStatusClass(item)">
                    {{ getStatus(item) }}
                  </span>
                </td>
                <td>{{ item.lastUpdated }}</td>
                <td class="actions">
                  <button class="btn-edit">Edit</button>
                  <button class="btn-restock">Restock</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LabInventory',
  data() {
    return {
      inventory: [
        {
          id: 1,
          name: 'Blood Collection Tubes',
          category: 'Consumables',
          currentStock: 45,
          minStock: 50,
          lastUpdated: '2024-01-14'
        },
        {
          id: 2,
          name: 'Glucose Test Strips',
          category: 'Test Kits',
          currentStock: 120,
          minStock: 100,
          lastUpdated: '2024-01-15'
        },
        {
          id: 3,
          name: 'Urine Test Cups',
          category: 'Consumables',
          currentStock: 8,
          minStock: 30,
          lastUpdated: '2024-01-15'
        },
        {
          id: 4,
          name: 'Centrifuge Tubes',
          category: 'Glassware',
          currentStock: 0,
          minStock: 20,
          lastUpdated: '2024-01-13'
        }
      ]
    }
  },
  methods: {
    getStatus(item) {
      if (item.currentStock === 0) return 'Out of Stock'
      if (item.currentStock <= item.minStock) return 'Low Stock'
      return 'In Stock'
    },
    getStatusClass(item) {
      if (item.currentStock === 0) return 'out-of-stock'
      if (item.currentStock <= item.minStock) return 'low-stock'
      return 'in-stock'
    }
  }
}
</script>

<style scoped>
.page-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header h2 {
  color: #2c3e50;
  margin-bottom: 8px;
}

.page-header p {
  color: #7f8c8d;
  margin-bottom: 2rem;
}

.inventory-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card h3 {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
}

.stat-number.warning {
  color: #f39c12;
}

.stat-number.danger {
  color: #e74c3c;
}

.table-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.table-container {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
}

.inventory-table th,
.inventory-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ecf0f1;
}

.inventory-table th {
  background: #34495e;
  color: white;
  font-weight: bold;
}

.inventory-table tr:hover {
  background: #f8f9fa;
}

.status {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
}

.status.in-stock {
  background: #d4edda;
  color: #155724;
}

.status.low-stock {
  background: #fff3cd;
  color: #856404;
}

.status.out-of-stock {
  background: #f8d7da;
  color: #721c24;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit, .btn-restock {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
}

.btn-edit {
  background: #3498db;
  color: white;
}

.btn-restock {
  background: #27ae60;
  color: white;
}
</style>