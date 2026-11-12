# RMS — Premium Indian Restaurant Management System

An elite, modern, elegant, fully responsive Restaurant Management System and fine dining guest portal built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, **Framer Motion (`motion/react`)**, and **lucide-react**, integrating directly with FastAPI multi-tenant backend services and Keycloak identity authentication.

---

## 1. Visual Identity & Premium Indian Fine Dining Design System

The platform design celebrates rich Indian royal gastronomy, dum handi craftsmanship, and regional heritage across a luxury dual-theme interface.

### Palette & Materials
- **Dark Theme (Royal Luxury Dark):**
  - Warm Black Backgrounds: `#0c0b0a`
  - Champagne Gold Accents: `#d4a853` (Hover: `#e3bb72`)
  - Cream-White Editorial Typography: `#f5f0e8`
  - Dark Glass-Effect Surfaces: `rgba(21, 19, 16, 0.75)` with backdrop blur
  - Subtle Gold Borders: `#302a21`
- **Light Theme (Warm Ivory):**
  - Warm Ivory Canvas: `#faf7f2`
  - Soft Alabaster Cards & Surfaces: `#ffffff`
  - Charcoal Typography: `#1c1915`
  - Warm Beige Borders: `#e5dec9`
  - Champagne Gold Accents: `#b88728`
- **Semantic Accents:** Indian Saffron & Sage (`#6e9b78`) for success, Terracotta Rose (`#c66b63`) for danger

### Typography
- **Headings & Editorial Quotes:** *Cormorant Garamond* (Italics & Roman)
- **Interface, Numbers & Buttons:** *Inter*

### Currency & Locale
- Currency: Indian Rupee (`₹` INR) formatted via `en-IN`
- Dates: `en-IN` formatted timestamps

---

## 2. Core Architecture & Portal Segregation

The frontend implements two distinct experiences within a unified luxury design system:

### A. Public & Customer Experience (`/`, `/explore`, `/customer/*`)
1. **Landing Page (`/`):**
   - Full-screen cinematic hero with warm ambient lighting.
   - Editorial headline: *"Exceptional Dining. Extraordinary Experiences."*
   - Philosophy & manifesto section: *"Where Every Meal Becomes a Memory."*
   - Restaurant discovery cards with dynamic ratings, location tags, and menu exploration.
   - Experiences showcase: *Exceptional Dining*, *Curated Menus*, *Memorable Experiences*.
   - Fine dining footer with destinations across Kolkata, New Delhi, Mumbai, and Bengaluru.
2. **Restaurant & Menu Browsing (`/explore`, `/explore/:id`, `/customer/explore`):**
   - Search by brand, city, or cuisine (Bengali Cuisine & Biryani, North Indian & Mughlai, South Indian & Coastal, Royal Thali).
   - Branch selection (Kolkata Park Street, New Delhi Connaught Place, Mumbai Bandra West, Bengaluru Indiranagar).
   - Dish cards with dietary tags, signature badges, descriptions, and "Add to Cart".
3. **Dining Cart & Authoritative Backend Ordering (`/customer/cart`):**
   - Single-branch validation.
   - Quantity controls and service instructions (table number, spice level, kasundi/chutney requests).
   - Authoritative GST (CGST 2.5% + SGST 2.5%) and pricing calculated via backend Order API.
4. **My Orders & Kitchen Tracking (`/customer/orders`):**
   - Live preparation status tracking: `PLACED`, `CONFIRMED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`.
   - Order cancellation modal for eligible orders.
5. **My Bills & Tax Invoicing (`/customer/bills`):**
   - Full GST breakdown with itemized CGST and SGST percentages.
   - Exportable PDF receipt preview.
6. **Customer Concierge Profile (`/customer/profile`):**
   - View profile and loyalty tier (`RMS Privilege Member`, `Platinum Club`).
   - Edit personal details (name, phone, address, city, dining preferences).
   - Upload, change, or remove profile portrait.

---

### B. Tenant Admin Management Experience (`/admin/*`)
1. **Overview Dashboard (`/admin`):**
   - Greeting: *"Good Morning, Welcome Back."*
   - 5 Key KPI cards: Total Restaurants, Total Branches, Total Orders, Total Revenue (₹), Total Customers.
   - Revenue trajectory bar analytics (₹ values) and order status distribution.
   - Recent authorized orders table.
2. **Restaurant Management (`/admin/restaurants`):**
   - View, create, edit, and delete restaurants under tenant.
   - Dependent branch safeguards.
3. **Branch Management (`/admin/branches`):**
   - Filter by restaurant brand.
   - Manage location, capacity, opening hours, contact details (+91 format).
4. **Menu Management (`/admin/menus`):**
   - Manage menus by branch.
   - Create, edit, and delete dishes with Indian Rupee (₹) pricing.
   - Toggle availability (`Available` vs `Unavailable`).
   - Manage regional categories: Starters, North Indian, South Indian, Bengali Cuisine, Mughlai, Biryani, Tandoor, Street Food, Vegetarian, Non-Vegetarian, Desserts, Beverages.
5. **Order Management (`/admin/orders`):**
   - Live kitchen ticket management.
   - Filter by branch or order status.
   - Update order status and payment status.
   - Instant invoice generation from orders.
6. **Bill & Invoicing Management (`/admin/bills`):**
   - View all bills, GST breakdown, and payment status (UPI / CARD / CASH).
   - Generate formal invoices with discount options.
   - Cancel eligible bills.
7. **Tax Configuration (`/admin/taxes`):**
   - Dedicated tax configuration screen.
   - Displays live active tax percentage from MongoDB (default 5.0% GST).
   - Create, edit, activate/deactivate tax rules.
   - Complete regulatory history and audit trail.
   - **Strict Rule:** Never hardcodes tax percentages; always utilizes backend values.
8. **Customer Management (`/admin/customers`):**
   - Guest profiles, loyalty tiers, total spend (₹), and contact records.
   - Keycloak invitation dispatch modal.
9. **Settings & IAM Architecture (`/admin/settings`):**
   - Tenant organization name (`RMS Hospitality Group`) and description.
   - Keycloak realm configuration (`rms-realm`) and token scope indicators.

---

## 3. Dual Role Selection & Keycloak RBAC Flow (`/login`)

When accessing the portal, users first select their intended portal experience:
- **"I'm a Customer"** (`/customer`)
  - Demo: `aarav.sharma@gmail.com` / `customer123`
- **"I'm a Restaurant Owner"** (`/admin`)
  - Demo: `owner@rms.com` / `admin123`
  - Manager: `manager@rms.com` / `admin123`

### Security Verification
The selection alone does **not** grant roles. The frontend verifies actual Keycloak JWT roles returned upon authentication:
- Customers require valid dining account authorization.
- Admin portal access strictly requires `OWNER`, `MANAGER`, `TENANT_ADMIN`, or `SUPER_ADMIN` roles.
- Customer-only accounts attempting to access `/admin` receive a 403 authorization error banner and are redirected.

---

## 4. Running the Project

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Starts Vite development server on `http://localhost:3000`.

### Production Build
```bash
npm run build
npm run preview
```
Verified clean build with zero TypeScript or linter errors.
