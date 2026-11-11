# Restaurant Management System - Admin Panel Frontend

A modern, responsive, enterprise-grade restaurant management admin dashboard built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Axios**, **React Hook Form**, and **Zod**.

The frontend integrates directly with the FastAPI multi-tenant backend and Keycloak identity provider, featuring full **Role-Based Access Control (RBAC)** supporting **OWNER**, **MANAGER**, and **STAFF** roles.

---

## 1. Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS with a clean SaaS design system (Slate navy sidebar, Emerald primary accents, rounded cards, subtle shadows)
- **HTTP Client:** Axios with request interceptors for Bearer authentication, 401 automatic token refresh queue, and normalized FastAPI error extraction
- **Form Management:** React Hook Form
- **Validation:** Zod schemas aligned strictly with backend Pydantic models
- **Icons:** Lucide React
- **Notifications:** Responsive floating toast notification system (`success`, `error`, `warning`, `info`)

---

## 2. Project Directory Structure

```text
restaurant-management-frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx           # Keycloak user sign-in
│   │   │   └── register/
│   │   │       └── page.tsx           # Owner & Tenant registration
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx             # Dashboard shell with Sidebar & Topbar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx           # Metrics overview & recent records
│   │   │   ├── tenant/
│   │   │   │   └── page.tsx           # Tenant info, edit & delete
│   │   │   ├── restaurants/
│   │   │   │   └── page.tsx           # Restaurant CRUD & branch linking
│   │   │   └── branches/
│   │   │       └── page.tsx           # Branch CRUD with restaurant selector
│   │   ├── globals.css                # Global theme variables & scrollbars
│   │   ├── layout.tsx                 # Root layout with Toast & Auth providers
│   │   └── page.tsx                   # Auth redirect router
│   ├── components/
│   │   ├── ui/                        # Reusable UI primitives
│   │   │   ├── alert.tsx              # Alert banners (info, success, warning, destructive)
│   │   │   ├── badge.tsx              # Status & Role badges (OWNER, MANAGER, STAFF)
│   │   │   ├── button.tsx             # Button with loading spinner & variants
│   │   │   ├── card.tsx               # Card, CardHeader, CardTitle, CardContent
│   │   │   ├── dialog.tsx             # Accessible modal dialog
│   │   │   ├── input.tsx              # Input with label, error & helper text
│   │   │   ├── spinner.tsx            # Loading indicator
│   │   │   └── table.tsx              # Responsive styled data table
│   │   ├── layout/                    # Layout structure components
│   │   │   ├── breadcrumbs.tsx        # Dynamic route breadcrumbs
│   │   │   ├── sidebar.tsx            # Dark navy sidebar with tenant & role badge
│   │   │   └── topbar.tsx             # Header with context indicators & user dropdown
│   │   ├── forms/                     # Form components
│   │   │   ├── login-form.tsx         # POST /auth/login with validation
│   │   │   └── register-form.tsx      # POST /tenants/signup + auto-login workflow
│   │   └── dialogs/                   # Modal dialogs for CRUD
│   │       ├── branch-dialog.tsx      # Create / edit branch modal
│   │       ├── confirm-dialog.tsx     # Reusable confirmation modal (deletions)
│   │       ├── restaurant-dialog.tsx  # Create / edit restaurant modal
│   │       └── tenant-edit-dialog.tsx # Edit tenant name & description modal
│   ├── context/
│   │   ├── auth-context.tsx           # Global auth state, tenant switcher & RBAC helpers
│   │   └── toast-context.tsx          # Toast notification provider
│   ├── lib/
│   │   ├── permissions.ts             # Centralized Role & Permission mappings
│   │   ├── token-storage.ts           # Token & session persistence
│   │   └── utils.ts                   # Class name merger (clsx + twMerge) & date formatters
│   ├── services/
│   │   ├── api.ts                     # Axios client with interceptors & error parser
│   │   ├── auth.service.ts            # Auth & refresh endpoints
│   │   ├── branch.service.ts          # Branch CRUD API calls
│   │   ├── restaurant.service.ts      # Restaurant CRUD API calls
│   │   └── tenant.service.ts          # Tenant CRUD API calls
│   └── types/
│       ├── api.ts                     # PaginatedResponse & PaginationMetadata
│       ├── auth.ts                    # AuthUser, TokenResponse, LoginPayload
│       ├── branch.ts                  # BranchItem, BranchResponse, payloads
│       ├── permissions.ts             # RoleEnum & PermissionEnum
│       ├── restaurant.ts              # RestaurantItem, RestaurantResponse, payloads
│       └── tenant.ts                  # TenantItem, TenantSignupPayload, etc.
├── .env.local                         # Environment variables
├── next.config.ts                     # Next.js configuration
├── package.json                       # Dependencies & scripts
└── tsconfig.json                      # Path aliases (@/* -> ./src/*)
```

---

## 3. Installation & Run Instructions

### Prerequisites
- Node.js v20+ or v22+
- npm v10+

### Setup
Navigate to the frontend folder:
```bash
cd restaurant-management-frontend
```

Install dependencies:
```bash
npm install
```

### Environment Configuration
The `.env.local` file is configured with the backend API base URL:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### Development Run Command
```bash
npm run dev
```
The application will start at `http://localhost:3000`.

### Production Build Command
```bash
npm run build
npm start
```

---

## 4. API Integration Summary

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/auth/login` | Authenticate with email/username and password via Keycloak |
| **Auth** | `POST` | `/auth/refresh` | Refresh expired access token using refresh token |
| **Tenants** | `POST` | `/tenants/signup` | Register business organization and initial owner |
| **Tenants** | `GET` | `/tenants` | Get paginated tenants for authenticated user |
| **Tenants** | `PUT` | `/tenants/{tenant_id}` | Update business name and description |
| **Tenants** | `DELETE` | `/tenants/{tenant_id}` | Delete tenant (checks for child restaurants/branches) |
| **Restaurants** | `GET` | `/restaurants` | Get paginated restaurants (supports `tenant_id` filter) |
| **Restaurants** | `POST` | `/restaurants` | Create restaurant under tenant (`tenant_id`, `name`, `description`) |
| **Restaurants** | `PUT` | `/restaurants/{restaurant_id}` | Update restaurant name and description |
| **Restaurants** | `DELETE` | `/restaurants/{restaurant_id}` | Delete restaurant (enforces no dependent branches exist) |
| **Branches** | `GET` | `/branches` | Get paginated branches (supports `restaurant_id` & `tenant_id`) |
| **Branches** | `POST` | `/branches` | Create branch under restaurant (validates phone, email, address) |
| **Branches** | `PUT` | `/branches/{branch_id}` | Update branch contact and location details |
| **Branches** | `DELETE` | `/branches/{branch_id}` | Delete branch (enforces no users are assigned to branch) |

---

## 5. Role-Based Access Control (RBAC)

The frontend implements permissions mirroring backend `PermissionEnum` and `ROLE_PERMISSIONS`:

| Capability | OWNER | MANAGER | STAFF |
|---|:---:|:---:|:---:|
| View Restaurants & Branches | ✅ | ✅ | ✅ |
| Create Restaurant | ✅ | ✅ | ❌ |
| Edit Restaurant | ✅ | ✅ | ❌ |
| Delete Restaurant | ✅ | ❌ | ❌ |
| Create Branch | ✅ | ✅ | ❌ |
| Edit Branch | ✅ | ✅ | ❌ |
| Delete Branch | ✅ | ❌ | ❌ |
| Update Tenant Profile | ✅ | ❌ | ❌ |
| Delete Tenant | ✅ | ❌ | ❌ |

- Frontend dynamically hides unauthorized actions (such as Delete buttons for Managers).
- If the backend returns `403 Forbidden`, the Axios error interceptor displays: *"Access denied: You do not have permission to perform this action."*

---

## 6. Registration & Onboarding Workflow

1. **Owner & Tenant Registration (`/register`):**
   - User inputs Business Name, Owner First & Last Name, Email, Password, and Password Confirmation.
   - Dispatches `POST /tenants/signup`.
   - On success (201 Created), immediately dispatches `POST /auth/login` with the same email and password.
   - Stores `access_token` and `refresh_token` in cookies with SameSite=Lax.
   - Redirects to `/restaurants` onboarding page.

2. **Restaurant Management (`/restaurants`):**
   - Displays paginated table of restaurants under the active tenant.
   - "Create Restaurant" opens modal to input restaurant name and description.
   - Each restaurant row includes a green **Manage Branches** button navigating to `/branches?restaurant_id=...`.

3. **Branch Management (`/branches`):**
   - Displays paginated branches for the currently selected restaurant.
   - Restaurant dropdown allows switching between restaurants on the fly.
   - "Create Branch" validates phone number (10–15 digits), address, city, state, and email.

4. **Tenant Management (`/tenant`):**
   - Shows active business name, ID, registration status, creation date, and total restaurants.
   - Allows Owners to edit tenant name and description or safely delete the tenant if no child resources exist.

---

## 7. Security & Compatibility Notes

1. **Token Handling Architecture:**
   - The backend uses Keycloak Bearer tokens in headers (`Authorization: Bearer <token>`) and does not issue HttpOnly cookies.
   - Tokens are stored using client-side cookies (`SameSite=Lax`) and memory storage to support both client-side and server-side components.
   - User passwords are **never** stored in state or storage after authentication.
   - Keycloak client secrets are kept exclusively on the backend; never exposed to the frontend.

2. **Database Integrity & 409 Conflict Handling:**
   - Deleting a restaurant with branches returns `HTTP 409 Conflict`: *"Cannot delete restaurant because it has dependent branch(es)..."*
   - Deleting a branch with assigned users returns `HTTP 409 Conflict`: *"Cannot delete branch because users are assigned to it..."*
   - Deleting a tenant with restaurants or branches returns `HTTP 409 Conflict`.
   - The frontend intercepts these and surfaces informative toast notifications.

