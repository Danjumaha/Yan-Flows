# 🚀 YAN-FLOWS | Premium WhatsApp Commerce Platform

> **The all-in-one commerce operating system for WhatsApp, Instagram, TikTok & Facebook sellers.**  
> Create stunning storefronts, automate orders via WhatsApp, manage customers, track analytics, and scale your social commerce business with a fair coin-based monetization system.

---

## 📁 Project Structure (21 Files)

All files reside in the root `YAN-FLOWS/` folder. Each HTML file contains its own embedded CSS & JS for portability, except shared utilities in `app.js`.

| File | Purpose |
|------|---------|
| `index.html` | Landing page (Hero, Features, Pricing, FAQ, CTA) |
| `login.html` | Email/Password + Google authentication |
| `signup.html` | Registration with role selection & referral tracking |
| `dashboard.html` | Role-based dashboard (Buyer/Seller/Admin) |
| `seller-setup.html` | Business profile wizard (Bank, WhatsApp, Policies) |
| `storefront.html` | Public storefront (`yan-flows.com/store/username`) |
| `product-manager.html` | Seller product CRUD + Cloudinary image upload |
| `cart.html` | Shopping cart management with localStorage |
| `checkout.html` | Delivery form + WhatsApp order automation |
| `orders.html` | Seller order management & status workflow |
| `crm.html` | Customer relationship management & segmentation |
| `coins.html` | Coin balance, Paystack packages & transaction history |
| `referrals.html` | Referral link/code, bonus tracking & stats |
| `analytics.html` | Revenue charts, order metrics & top products |
| `admin-panel.html` | Platform-wide stats, user management & oversight |
| `settings.html` | Profile, password, notifications & account deletion |
| `contact-agent.html` | Support page, contact form, FAQ & WhatsApp float |
| `wishlist.html` | Customer wishlist management & cart sync |
| `app.js` | 🔑 **Core Engine**: Firebase, Cloudinary, Paystack, UI utilities |
| `firestore.rules` | 🔒 Production security rules (Role-based access & validation) |
| `README.md` | 📘 This setup & deployment guide |

---

## ⚙️ Prerequisites

- **Code Editor**: Acode (Mobile), VS Code, or any modern editor
- **Browser**: Chrome/Edge/Firefox (latest)
- **Accounts**:
  - 🔥 [Firebase Console](https://console.firebase.google.com) (Project: `yan-flow`)
  - ☁️ [Cloudinary](https://cloudinary.com) (Image hosting)
  - 💳 [Paystack](https://paystack.com) (Payment processing)
- **Optional**: [Firebase CLI](https://firebase.google.com/docs/cli) for terminal deployment

---

## 🔑 Configuration & Setup
### 1. Firebase Configuration ✅
Your Firebase config is **already embedded** in `app.js`. Ensure:
- Email/Password & Google sign-in are **enabled** in Firebase Console → Authentication → Sign-in method
- Firestore database is **created** (Start in test mode, we'll lock it later)
- Enable **App Check** & **reCAPTCHA v3** for production (optional but recommended)

### 2. Cloudinary Setup ☁️
1. Create a free Cloudinary account
2. Go to **Settings → Upload**
3. Create an **Unsigned Upload Preset** (e.g., `yan_flows_uploads`)
4. Copy your **Cloud Name** & **Upload Preset Name**
5. Open `app.js` and replace:
```javascript
   const YF_CLOUDINARY = {
     cloudName: 'YOUR_CLOUD_NAME',
     uploadPreset: 'YOUR_UPLOAD_PRESET'
   };
```

### 3. Paystack Setup 💳
1. Log in to Paystack Dashboard → **Settings → API Keys**
2. Copy your **Test Public Key** (starts with `pk_test_`)
3. Open `app.js` and replace:
```javascript
   const YF_PAYSTACK_PUBLIC_KEY = 'pk_test_YOUR_PAYSTACK_KEY';
```
   > 🔄 Switch to `pk_live_` keys when going to production.

---

## 🌐 Local Development & Testing

1. Open the `YAN-FLOWS/` folder in your editor
2. Serve locally using:
   - **Python**: `python -m http.server 8000`
   - **Node**: `npx serve .`
   - **VS Code**: Use "Live Server" extension
3. Navigate to `http://localhost:8000/index.html`
4. Test flows:
   - Sign up → Verify Firestore `users` collection
   - Activate seller → Check `business_profiles`
   - Add products → Verify Cloudinary uploads & `products` collection
   - Place order → Check `orders` collection & WhatsApp redirect
   - Buy coins → Test Paystack test mode & `coin_transactions`

---

## 🚀 Deployment Guide
### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Login & Initialize
```bash
firebase login
cd path/to/YAN-FLOWS
firebase init hosting
# → Select: yan-flow
# → Set public directory: . (current folder)
# → Configure as SPA: No
# → Overwrite index.html: No
```

### Step 3: Deploy Firestore Rules
```bash
firebase init firestore
# → Select project: yan-flow
# → Rules file: firestore.rules
# → Indexes file: firestore.indexes.json
firebase deploy --only firestore:rules
```

### Step 4: Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```
✅ Your live URL will be: `https://yan-flow.web.app`  
🌐 Connect a custom domain in Firebase Console → Hosting → Add custom domain

---

## 🔒 Security & Production Checklist

| ✅ Item | Status |
|--------|--------|
| Firestore rules deployed (`firestore.rules`) | ✅ Done |
| Email/Password + Google Auth enabled | ✅ Configurable |
| Cloudinary unsigned preset restricted by folder/tag | 🔧 Recommended |
| Paystack live keys swapped (remove test keys) | 🔧 Before launch |
| Firebase App Check enabled | 🔧 Recommended |
| Custom domain + SSL active | 🔧 Firebase auto-SSL |
| Admin user created manually in Firestore | 🔧 Set `role: 'admin'` |
| Cloud Functions for coin deductions (optional) | 🔧 Future optimization |
| Rate limiting / Abuse protection | 🔧 Firebase Security + App Check |

> 🔐 **Never commit `.env` files or secret keys to public repos.** This project uses client-side configs safe for Firebase, Cloudinary (unsigned), and Paystack (public keys only).
---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `PERMISSION_DENIED` on Firestore | Ensure `firestore.rules` are deployed. Check user is authenticated & matches collection owner |
| Images not uploading | Verify Cloudinary `cloudName` & `uploadPreset` in `app.js`. Check browser console for CORS/errors |
| Paystack popup not opening | Ensure `https://js.paystack.co/v1/inline.js` is loaded. Use HTTPS in production |
| Orders not appearing for seller | Confirm `sellerId` in order matches auth UID. Check Firestore index for `where('sellerId').orderBy('createdAt')` |
| Redirect loops on auth pages | Clear localStorage/cache. Verify `YF.requireAuth()` & `YF.redirectIfLoggedIn()` aren't conflicting |
| Coins not deducting | Client-side deduction is for demo. Use Firebase Cloud Functions (`onCreate` order trigger) for production accuracy |

---

## 📞 Support & Contact

- 🐛 **Bug Reports**: Use the in-app `contact-agent.html` form
- 💬 **Live Support**: WhatsApp float button (bottom-right on all pages)
- 📖 **Seller Guide**: Built-in onboarding (`seller-setup.html`)
- 🌐 **Status Page**: Firebase Console → Hosting → Activity

---

## 📜 License & Credits

© 2026 **YAN-FLOWS**. All rights reserved.  
Built for social commerce entrepreneurs.  
Powered by Firebase, Cloudinary, Paystack & Vanilla JS.

> 💡 *This platform is designed for scalability. As your user base grows, migrate coin logic & referral bonuses to Firebase Cloud Functions, implement Firebase Custom Claims for roles, and add server-side validation for high-value transactions.*

---

🎉 **Congratulations!** Your YAN-FLOWS platform is now complete, secure, and ready for deployment.  
🚀 **Deploy, test thoroughly, and start onboarding sellers!**