/**
 * ==========================================
 * YAN-FLOWS CORE ENGINE (app.js)
 * Centralized utilities, Firebase helpers, 
 * Cloudinary & Paystack integration
 * ==========================================
 */

// ===== 1. FIREBASE CONFIGURATION & INIT =====
const YF_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBJ4t5SDaryYcjIzG737tLPNIwXRnL9Qlc",
  authDomain: "yan-flow.firebaseapp.com",
  projectId: "yan-flow",
  storageBucket: "yan-flow.firebasestorage.app",
  messagingSenderId: "373204559623",
  appId: "1:373204559623:web:56e1c8abf07945c53187a2",
  measurementId: "G-4PC6ENND61"
};

// Initialize Firebase (Compat v10)
firebase.initializeApp(YF_FIREBASE_CONFIG);
const YF_AUTH = firebase.auth();
const YF_DB = firebase.firestore();

// Enable offline persistence for faster dashboard loads
YF_DB.enablePersistence().catch(err => {
  if (err.code === 'failed-precondition') console.warn('Firestore persistence failed-precondition');
  else if (err.code === 'unimplemented') console.warn('Firestore persistence not supported in this browser');
});

// ===== 2. EXTERNAL SERVICE CONFIGS =====
const YF_CLOUDINARY = {
  cloudName: 'dytzpxabq',      // Replace with your Cloudinary cloud name
  uploadPreset: 'Yan-Flow' // Replace with your unsigned upload preset
};

const YF_PAYSTACK_PUBLIC_KEY = 'pk_live_d265096a47801eaa597f27f6674e5a6d051e4959'; // Replace with your Paystack public key

// ===== 3. GLOBAL NAMESPACE (window.YF) =====
window.YF = {
  auth: YF_AUTH,
  db: YF_DB,
  
  // ========================================
  // 🔐 AUTHENTICATION HELPERS
  // ========================================
  
  /**
   * Check if user is authenticated. Redirect to login if not.
   * @param {string} redirectUrl - URL to redirect if not logged in (default: login.html)   */
  requireAuth(redirectUrl = 'login.html') {
    YF_AUTH.onAuthStateChanged(user => {
      if (!user) {
        window.location.replace(redirectUrl);
      }
    });
  },

  /**
   * Redirect logged-in users away from auth pages
   * @param {string} targetUrl - Where to send authenticated users (default: dashboard.html)
   */
  redirectIfLoggedIn(targetUrl = 'dashboard.html') {
    YF_AUTH.onAuthStateChanged(user => {
      if (user) {
        window.location.replace(targetUrl);
      }
    });
  },

  /**
   * Secure logout handler
   */
  logout() {
    YF_AUTH.signOut()
      .then(() => {
        window.location.replace('index.html');
      })
      .catch(err => {
        console.error('Logout failed:', err);
        YF.ui.toast('Logout failed. Please try again.', 'error');
      });
  },

  // ========================================
  //  FIRESTORE DATA HELPERS
  // ========================================
  
  /**
   * Fetch current user document from Firestore
   * @returns {Promise<Object>} User data or null
   */
  async getUserData() {
    const user = YF_AUTH.currentUser;
    if (!user) return null;
    
    try {
      const doc = await YF_DB.collection('users').doc(user.uid).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;    } catch (err) {
      console.error('getUserData error:', err);
      return null;
    }
  },

  /**
   * Update user coins balance (increment/decrement)
   * @param {string} uid - User ID
   * @param {number} amount - Positive to add, negative to deduct
   * @returns {Promise<void>}
   */
  async updateCoins(uid, amount) {
    try {
      await YF_DB.collection('users').doc(uid).update({
        coins: firebase.firestore.FieldValue.increment(amount)
      });
      return true;
    } catch (err) {
      console.error('updateCoins error:', err);
      throw new Error('Failed to update coin balance.');
    }
  },

  /**
   * Create a new order document
   * @param {Object} orderData - Order payload
   * @returns {Promise<string>} New order document ID
   */
  async createOrder(orderData) {
    try {
      const orderRef = await YF_DB.collection('orders').add({
        ...orderData,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update seller coin balance (-1 per order)
      if (orderData.sellerId) {
        await this.updateCoins(orderData.sellerId, -1);
      }
      
      return orderRef.id;
    } catch (err) {
      console.error('createOrder error:', err);
      throw new Error('Order submission failed. Check your connection.');
    }
  },
  /**
   * Fetch orders for a specific seller
   * @param {string} sellerId - Seller UID
   * @returns {Promise<Array>} Array of order objects
   */
  async getOrdersBySeller(sellerId) {
    try {
      const snapshot = await YF_DB.collection('orders')
        .where('sellerId', '==', sellerId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('getOrdersBySeller error:', err);
      return [];
    }
  },

  /**
   * Update order status
   * @param {string} orderId - Order document ID
   * @param {string} newStatus - New status string
   * @returns {Promise<void>}
   */
  async updateOrderStatus(orderId, newStatus) {
    try {
      await YF_DB.collection('orders').doc(orderId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (err) {
      console.error('updateOrderStatus error:', err);
      throw new Error('Failed to update order status.');
    }
  },

  /**
   * Add product to Firestore
   * @param {Object} productData - Product payload
   * @returns {Promise<string>} New product document ID
   */
  async addProduct(productData) {
    try {
      const docRef = await YF_DB.collection('products').add({
        ...productData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        inStock: true
      });      return docRef.id;
    } catch (err) {
      console.error('addProduct error:', err);
      throw new Error('Product upload failed.');
    }
  },

  // ========================================
  // ☁️ CLOUDINARY UPLOAD WRAPPER
  // ========================================
  
  /**
   * Upload image to Cloudinary
   * @param {File} file - Image file from input
   * @returns {Promise<string>} Secure URL of uploaded image
   */
  async uploadImage(file) {
    if (!file) throw new Error('No file selected.');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', YF_CLOUDINARY.uploadPreset);
    formData.append('cloud_name', YF_CLOUDINARY.cloudName);
    
    try {
      YF.ui.toast('Uploading image...', 'info');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${YF_CLOUDINARY.cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Cloudinary upload failed.');
      
      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      throw new Error('Image upload failed. Check your Cloudinary config.');
    }
  },

  // ========================================
  // 💳 PAYSTACK PAYMENT HANDLER
  // ========================================
  
  /**
   * Initialize Paystack payment
   * @param {number} amount - Amount in Kobo (100 = 10000 kobo)
   * @param {string} email - Customer email
   * @param {Object} metadata - Extra data (userId, packageType, coins)   * @param {Function} onSuccess - Callback after successful payment
   * @param {Function} onClose - Callback when popup closes
   */
  pay(amount, email, metadata, onSuccess, onClose) {
    if (typeof PaystackPop === 'undefined') {
      throw new Error('Paystack SDK not loaded. Include <script src="https://js.paystack.co/v1/inline.js"></script>');
    }
    
    const handler = PaystackPop.setup({
      key: YF_PAYSTACK_PUBLIC_KEY,
      email: email,
      amount: amount * 100, // Convert Naira to Kobo
      currency: 'NGN',
      ref: `YF_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      metadata: metadata,
      callback: function(response) {
        YF.ui.toast('Payment successful! 💰', 'success');
        if (onSuccess) onSuccess(response);
      },
      onClose: function() {
        if (onClose) onClose();
      }
    });
    
    handler.openIframe();
  },

  // ========================================
  // 🎨 UI & FORMATTING UTILITIES
  // ========================================
  
  ui: {
    /**
     * Show toast notification
     * @param {string} message - Notification text
     * @param {string} type - 'success', 'error', 'info', 'warning'
     * @param {number} duration - Auto-close time in ms
     */
    toast(message, type = 'info', duration = 4000) {
      // Create container if it doesn't exist
      let container = document.getElementById('yf-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'yf-toast-container';
        container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(container);
      }

      const colors = {
        success: '#4ECDC4',        error: '#FF6B6B',
        warning: '#FFD93D',
        info: '#1B3A5F'
      };

      const toast = document.createElement('div');
      toast.style.cssText = `
        background:#fff;padding:1rem 1.25rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);
        display:flex;align-items:center;gap:0.75rem;min-width:280px;transform:translateX(120%);
        transition:transform 0.3s ease;border-left:4px solid ${colors[type] || colors.info};
        font-family:Inter,sans-serif;font-size:0.95rem;color:#1B3A5F;
      `;
      toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}" style="color:${colors[type]};font-size:1.25rem;"></i><span>${message}</span>`;
      
      container.appendChild(toast);
      requestAnimationFrame(() => toast.style.transform = 'translateX(0)');
      
      setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },

    /**
     * Format number to Nigerian Naira
     */
    formatNaira(amount) {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
      }).format(amount);
    },

    /**
     * Format Firestore timestamp to readable date
     */
    formatDate(timestamp) {
      if (!timestamp) return 'N/A';
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-NG', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    },

    /**
     * Copy text to clipboard
     */
    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {        YF.ui.toast('Copied to clipboard!', 'success', 2000);
      }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        YF.ui.toast('Copied!', 'success', 2000);
      });
    }
  }
};

// ===== 4. GLOBAL ERROR HANDLER =====
window.addEventListener('unhandledrejection', event => {
  console.error(' Unhandled Promise Rejection:', event.reason);
  YF.ui.toast('Something went wrong. Please refresh the page.', 'error');
});

// ===== 5. INITIALIZATION LOG =====
console.log('✅ YAN-FLOWS Core Engine Loaded');
console.log('🔥 Firebase Auth & Firestore Ready');
console.log('️ Cloudinary Wrapper Active');
console.log('💳 Paystack Handler Initialized');
console.log('📦 window.YF namespace available globally');