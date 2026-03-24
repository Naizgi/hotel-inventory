<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* ==============================================
   PREMIUM WARM GOLD GRADIENT GLOBAL STYLES
   Extracted from UI design - Modern SaaS Dashboard
   ============================================== */

:root {
  /* Main Background Colors - Premium Soft Neutrals */
  --bg-primary: #F9F7EB;        /* Main background - creamy white */
  --bg-secondary: #E5E5E2;      /* Secondary background - soft grey */
  --bg-tertiary: #F2E9C6;       /* Warm gradient surface - subtle gold */
  --bg-card: #FFFFFF;            /* Card background - pure white */
  
  /* Primary Accent - Warm Gold Gradient */
  --gold-light: #F2E9C6;         /* Light gold */
  --gold-medium: #EFCA71;        /* Medium gold */
  --gold-deep: #E5B95C;          /* Deep gold */
  
  /* Primary Gradients - Luxury Gold */
  --gradient-primary: linear-gradient(135deg, #EFCA71, #F2E9C6);
  --gradient-secondary: linear-gradient(135deg, #F2E9C6, #EFCA71);
  --gradient-tertiary: linear-gradient(135deg, #EFCA71, #E5B95C, #F2E9C6);
  --gradient-luxury: linear-gradient(135deg, #F9F7EB 0%, #F2E9C6 60%, #EFCA71 100%);
  
  /* Dark UI Elements - Premium Dark Neutrals */
  --dark-primary: #332F2E;        /* Main dark - almost black */
  --dark-secondary: #6F6C6D;      /* Secondary dark - warm grey */
  
  /* Neutral UI Colors */
  --neutral-border: #A8ACB4;       /* UI border / icons */
  --neutral-muted: #8C8C90;        /* Secondary text / muted elements */
  --neutral-light: #D9D9D9;        /* Light borders */
  
  /* Text Colors */
  --text-primary: #332F2E;         /* Primary text - dark */
  --text-secondary: #6F6C6D;        /* Secondary text */
  --text-muted: #8C8C90;            /* Muted text */
  --text-light: #FFFFFF;            /* White text for dark backgrounds */
  
  /* Status Colors - Refined for premium feel */
  --success: #88B788;               /* Soft green */
  --warning: #EFCA71;                /* Gold warning */
  --danger: #C45A5A;                 /* Muted red */
  --info: #8BA5B8;                   /* Soft blue */
  
  /* Status Gradients */
  --gradient-success: linear-gradient(135deg, #88B788, #6D9E6D);
  --gradient-warning: linear-gradient(135deg, #EFCA71, #E5B95C);
  --gradient-danger: linear-gradient(135deg, #C45A5A, #B04A4A);
  
  /* Glass Effects - Premium soft shadows */
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(239, 202, 113, 0.2);
  --glass-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  --glass-blur: 10px;
  
  /* Input Colors */
  --input-bg: #FFFFFF;
  --input-border: #E5E5E2;
  --input-focus: #EFCA71;
  --input-placeholder: #8C8C90;
  
  /* Card Colors */
  --card-bg: #FFFFFF;
  --card-border: rgba(239, 202, 113, 0.15);
  --card-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  
  /* Shadows - Premium soft shadows */
  --shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 20px 40px rgba(0, 0, 0, 0.12);
  --shadow-gold: 0 8px 24px rgba(239, 202, 113, 0.15);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  overflow-x: hidden;
  min-height: 100vh;
  position: relative;
}

/* Premium Soft Gradient Background */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 30%, rgba(239, 202, 113, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(242, 233, 198, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(239, 202, 113, 0.02) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
  animation: softShift 20s ease-in-out infinite;
}

@keyframes softShift {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

/* Custom scrollbar - Premium Gold Theme */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: var(--gradient-primary);
  border-radius: 10px;
  opacity: 0.8;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--gradient-tertiary);
}

/* Premium Card Component - Exactly as extracted from UI */
.card {
  background: var(--bg-card);
  border-radius: 20px;
  box-shadow: var(--card-shadow);
  padding: 24px;
  transition: all 0.3s ease;
  border: 1px solid var(--card-border);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: rgba(239, 202, 113, 0.3);
}

/* Glass Card - Premium translucency */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 24px;
  box-shadow: var(--glass-shadow);
}

/* Luxury Gradient Surface - From the UI */
.luxury-surface {
  background: var(--gradient-luxury);
  border-radius: 20px;
  padding: 24px;
}

/* Button Styles - Premium Gold */
.btn {
  padding: 14px 28px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: var(--gradient-primary);
  color: var(--dark-primary);
  box-shadow: var(--shadow-gold);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(239, 202, 113, 0.3);
}

.btn-secondary {
  background: var(--dark-primary);
  color: var(--text-light);
  box-shadow: var(--shadow-sm);
}

.btn-secondary:hover {
  background: var(--dark-secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--gold-medium);
  color: var(--dark-primary);
}

.btn-outline:hover {
  background: rgba(239, 202, 113, 0.1);
  transform: translateY(-2px);
  border-color: var(--gold-deep);
}

.btn-sm {
  padding: 10px 20px;
  font-size: 12px;
}

.btn-lg {
  padding: 16px 32px;
  font-size: 16px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Form Styles - Premium Clean */
.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 14px 18px;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 12px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--gold-medium);
  box-shadow: 0 0 0 3px rgba(239, 202, 113, 0.1);
}

.form-control::placeholder {
  color: var(--input-placeholder);
}

/* Form Group with Gold Accent */
.form-group:focus-within .form-label {
  color: var(--gold-deep);
}

/* Alert Styles - Premium Soft */
.alert {
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid transparent;
  position: relative;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
}

.alert-success {
  background: rgba(136, 183, 136, 0.1);
  color: var(--success);
  border-color: rgba(136, 183, 136, 0.2);
}

.alert-error {
  background: rgba(196, 90, 90, 0.1);
  color: var(--danger);
  border-color: rgba(196, 90, 90, 0.2);
}

.alert-warning {
  background: rgba(239, 202, 113, 0.1);
  color: var(--gold-deep);
  border-color: rgba(239, 202, 113, 0.2);
}

.alert-info {
  background: rgba(139, 165, 184, 0.1);
  color: var(--info);
  border-color: rgba(139, 165, 184, 0.2);
}

/* Loading Spinner - Gold Theme */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--neutral-light);
  border-top-color: var(--gold-medium);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner-sm {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

/* Table Styles - Premium Clean */
.table-container {
  overflow-x: auto;
  border-radius: 16px;
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--neutral-light);
}

.table {
  width: 100%;
  border-collapse: collapse;
  color: var(--text-primary);
}

.table th {
  text-align: left;
  padding: 16px 20px;
  background: var(--bg-secondary);
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--neutral-light);
}

.table td {
  padding: 14px 20px;
  border-bottom: 1px solid var(--neutral-light);
  color: var(--text-primary);
}

.table tr:hover td {
  background: rgba(239, 202, 113, 0.05);
}

.table tr:last-child td {
  border-bottom: none;
}

/* Badge Styles - Premium */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--neutral-light);
}

.badge-primary {
  background: var(--gradient-primary);
  color: var(--dark-primary);
  border: none;
}

.badge-success {
  background: var(--success);
  color: white;
  border: none;
}

.badge-warning {
  background: var(--warning);
  color: var(--dark-primary);
  border: none;
}

.badge-danger {
  background: var(--danger);
  color: white;
  border: none;
}

/* Grid System */
.grid {
  display: grid;
  gap: 24px;
}

.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

/* Utilities */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-muted { color: var(--text-muted); }
.text-gold { color: var(--gold-medium); }
.text-success { color: var(--success); }
.text-warning { color: var(--warning); }
.text-danger { color: var(--danger); }

/* Background Utilities */
.bg-primary { background: var(--bg-primary); }
.bg-secondary { background: var(--bg-secondary); }
.bg-card { background: var(--bg-card); }
.bg-gold-light { background: var(--gold-light); }
.bg-gold-gradient { background: var(--gradient-primary); }

/* Margin Utilities */
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-4 { margin-top: 1rem; }
.mt-5 { margin-top: 1.5rem; }
.mt-6 { margin-top: 2rem; }
.mt-8 { margin-top: 2.5rem; }
.mt-10 { margin-top: 3rem; }

.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-5 { margin-bottom: 1.5rem; }
.mb-6 { margin-bottom: 2rem; }
.mb-8 { margin-bottom: 2.5rem; }
.mb-10 { margin-bottom: 3rem; }

.ml-1 { margin-left: 0.25rem; }
.ml-2 { margin-left: 0.5rem; }
.ml-3 { margin-left: 0.75rem; }
.ml-4 { margin-left: 1rem; }
.ml-5 { margin-left: 1.5rem; }

.mr-1 { margin-right: 0.25rem; }
.mr-2 { margin-right: 0.5rem; }
.mr-3 { margin-right: 0.75rem; }
.mr-4 { margin-right: 1rem; }
.mr-5 { margin-right: 1.5rem; }

/* Padding Utilities */
.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.p-5 { padding: 1.5rem; }
.p-6 { padding: 2rem; }
.p-8 { padding: 2.5rem; }
.p-10 { padding: 3rem; }

/* Flex Utilities */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }
.flex-wrap { flex-wrap: wrap; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.gap-5 { gap: 1.5rem; }
.gap-6 { gap: 2rem; }

/* Width Utilities */
.w-full { width: 100%; }
.w-auto { width: auto; }
.w-50 { width: 50%; }
.max-w-sm { max-width: 24rem; }
.max-w-md { max-width: 28rem; }
.max-w-lg { max-width: 32rem; }
.max-w-xl { max-width: 36rem; }
.max-w-2xl { max-width: 42rem; }
.max-w-3xl { max-width: 48rem; }
.max-w-4xl { max-width: 56rem; }
.max-w-5xl { max-width: 64rem; }
.max-w-6xl { max-width: 72rem; }
.max-w-7xl { max-width: 80rem; }

/* Animations */
@keyframes fadeIn {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes slideInLeft {
  from { 
    opacity: 0; 
    transform: translateX(-30px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
}

@keyframes slideInRight {
  from { 
    opacity: 0; 
    transform: translateX(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateX(0); 
  }
}

@keyframes slideInUp {
  from { 
    opacity: 0; 
    transform: translateY(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes spin {
  to { 
    transform: rotate(360deg); 
  }
}

@keyframes goldPulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(239, 202, 113, 0.1);
  }
  50% {
    box-shadow: 0 4px 20px rgba(239, 202, 113, 0.3);
  }
}

/* Animation Classes */
.fade-in {
  animation: fadeIn 0.6s ease-out;
}

.slide-in-left {
  animation: slideInLeft 0.6s ease-out;
}

.slide-in-right {
  animation: slideInRight 0.6s ease-out;
}

.slide-in-up {
  animation: slideInUp 0.6s ease-out;
}

.gold-pulse {
  animation: goldPulse 2s ease-in-out infinite;
}

/* Divider - Premium */
.divider {
  height: 1px;
  background: linear-gradient(90deg, 
    transparent, 
    var(--gold-light), 
    var(--gold-medium), 
    var(--gold-light), 
    transparent
  );
  margin: 24px 0;
}

/* Gradient Text */
.gradient-text {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
  font-weight: 600;
}

/* Premium Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--neutral-light);
}

.card-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

.card-body {
  color: var(--text-secondary);
}

/* Tooltip - Premium */
.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 12px;
  background: var(--dark-primary);
  color: white;
  border-radius: 8px;
  font-size: 0.8rem;
  white-space: nowrap;
  box-shadow: var(--shadow-sm);
  pointer-events: none;
  z-index: 1000;
}

/* Loading Skeleton - Premium */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--neutral-light) 50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { 
    background-position: -200% 0; 
  }
  100% { 
    background-position: 200% 0; 
  }
}

/* Responsive Design */
@media (max-width: 1280px) {
  .grid-cols-4 { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 1024px) {
  .grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
  .grid-cols-3 { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .grid-cols-2, .grid-cols-3, .grid-cols-4 {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .table-container {
    border-radius: 12px;
  }
  
  .table th,
  .table td {
    padding: 12px 16px;
  }
}

@media (max-width: 480px) {
  .card {
    padding: 20px;
  }
  
  .form-control {
    padding: 12px 14px;
  }
  
  .btn {
    padding: 12px 20px;
  }
  
  .table th,
  .table td {
    padding: 10px 12px;
    font-size: 0.85rem;
  }
}

/* Print Styles */
@media print {
  body {
    background: white;
    color: black;
  }
  
  .card {
    background: white;
    border: 1px solid #ddd;
    box-shadow: none;
  }
  
  .btn {
    display: none;
  }
  
  .no-print {
    display: none;
  }
}

/* Progress Bar - Gold Gradient */
.progress {
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Stats Card - Premium */
.stat-card {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--card-border);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--gold-light);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-icon {
  color: var(--gold-medium);
  font-size: 2rem;
  opacity: 0.8;
}
</style>