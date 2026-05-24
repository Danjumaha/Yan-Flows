// ============================================
// YAN-FLOWS CORE ENGINE v2.0 - FIXED VERSION
// ============================================

// ===== FIREBASE CONFIGURATION =====
const firebaseConfig = {
  apiKey: "AIzaSyBJ4t5SDaryYcjIzG737tLPNIwXRnL9Qlc",
  authDomain: "yan-flow.firebaseapp.com",
  projectId: "yan-flow",
  storageBucket: "yan-flow.firebasestorage.app",
  messagingSenderId: "373204559623",
  appId: "1:373204559623:web:56e1c8abf07945c53187a2",
  measurementId: "G-4PC6ENND61"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Enable persistence
db.enablePersistence().catch(err => {
  console.log('Persistence:', err.code);
});

// ===== ADMIN CONFIGURATION =====
const ADMIN_EMAILS = [
  "admin@yanflows.com",
  "youremail@gmail.com",
  "support@yanflows.com"
];

// ===== GLOBAL UTILITIES =====
const YF = {

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },

  // Get user data from Firestore
  async getUserData(uid) {
    try {
      const doc = await db.collection('users').doc(uid).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('Get user data error:', error);
      return null;
    }
  },

  // Generate referral code
  generateReferralCode(name) {
    const cleanName = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${cleanName}${random}`;
  },

  // Get referral from URL
  getReferralFromURL() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('ref')?.toUpperCase() || '';
    } catch {
      return '';
    }
  },

  // Validate email
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
  },

  // Validate Nigerian phone
  isValidPhone(phone) {
    const clean = phone.replace(/\D/g, '');
    return /^0\d{10}$/.test(clean) || /^234\d{10}$/.test(clean);
  },

  // Password strength
  getPasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    const score = Object.values(checks).filter(Boolean).length;

    return {
      score,
      label: ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][Math.min(score, 4)],
      color: ['#FF6B6B', '#FFD93D', '#FFA726', '#4ECDC4', '#2ECC71'][Math.min(score, 4)],
      checks
    };
  },

  // Show toast
  showToast(message, type = 'success', duration = 4000) {
    document.querySelectorAll('.yf-toast').forEach(t => t.remove());

    const iconMap = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `yf-toast yf-toast--${type}`;
    toast.innerHTML = `
      <i class="fas ${iconMap[type] || 'fa-info-circle'}"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Show loading
  showLoading(message = 'Processing...') {
    this.hideLoading();
    const overlay = document.createElement('div');
    overlay.className = 'yf-loading';
    overlay.id = 'yfLoading';
    overlay.innerHTML = `
      <div class="yf-loading__spinner"></div>
      <p>${message}</p>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  },

  // Hide loading
  hideLoading() {
    const overlay = document.getElementById('yfLoading');
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = '';
    }
  },

  // Redirect after login (ONLY called after successful login/signup)
  redirectAfterLogin(user) {
    const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase());
    const target = isAdmin ? 'admin-panel.html' : 'dashboard.html';
    const separator = target.includes('?') ? '&' : '?';
    window.location.href = `${target}${separator}uid=${user.uid}`;
  },

  // Format currency
  formatCurrency(amount) {
    return '₦' + Number(amount).toLocaleString('en-NG');
  },

  // Format date
  formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  },

  // Sanitize input
  sanitizeInput(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>]/g, '').trim();
  },

  // Logout function
  async logout() {
    try {
      await auth.signOut();
      console.log('✅ Logged out');
      window.location.href = 'login.html';
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

};

// ===== AUTH PROTECTION FOR DASHBOARD ONLY =====
// This runs ONLY on protected pages (dashboard, profile, etc.)
// It does NOT run on login.html or signup.html
function protectPage() {
  const currentPage = window.location.pathname.split('/').pop().split('?')[0].toLowerCase();
  const publicPages = ['index.html', 'signup.html', 'login.html', 'forgot-password.html', ''];

  // Skip protection for public pages
  if (publicPages.includes(currentPage)) {
    console.log('📄 Public page:', currentPage, '- No protection needed');
    return;
  }

  // Protect protected pages
  console.log('🔒 Protected page:', currentPage, '- Checking auth...');

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      console.log('❌ Not logged in - Redirecting to login');
      YF.showToast('Please sign in to continue', 'info');
      window.location.href = 'login.html';
      return;
    }

    // User is logged in, check if they have Firestore data
    const userData = await YF.getUserData(user.uid);
    if (!userData) {
      console.log('⚠️ No user data - Redirecting to complete profile');
      window.location.href = 'complete-profile.html';
      return;
    }

    console.log('✅ Auth verified for:', user.email);
  });
}

// Initialize protection on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', protectPage);
} else {
  protectPage();
}

// ===== ERROR HANDLING =====
window.addEventListener('error', (e) => {
  console.error('Global error:', e.message);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
});

// ===== DEBUG INFO =====
console.log('✅ YAN-FLOWS Core Engine v2.0 Loaded');
console.log('🔥 Firebase:', firebase.apps.length > 0 ? 'Connected' : 'Failed');
console.log('🌐 Page:', window.location.pathname);
