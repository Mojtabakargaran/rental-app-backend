@ -1,85 +0,0 @@
# Backend - Equipment Rental Management Platform

This document provides a comprehensive overview of the backend architecture and structure for AI-assisted development.

---

## Architecture Overview

**Architecture Type:** Event-driven Microservices with API Gateway

**Technology Stack:**
- **Language:** TypeScript (strict mode)
- **Framework:** NestJS (separate installation per service)
- **Database:** PostgreSQL (per service)
- **ORM:** TypeORM
- **Inter-service Communication:** gRPC
- **Message Broker:** RabbitMQ
- **Cache:** Redis (sessions, rate limiting)
- **API Documentation:** Swagger/OpenAPI

---

## Services

### 1. API Gateway
**Port:** 3000  
**Purpose:** Routes client requests to appropriate microservices via gRPC  
**Endpoints:** Authentication (registration, login, email verification, password reset, first-time login password change), Dashboard (landing page with user/company info), User Profile (language preference updates), User Management (role retrieval, user creation, user list with search/filter, user details, role modification, profile updates), Equipment (category listing, category creation, category viewing with pagination/search/filters, category updates, category deactivation/reactivation, category deletion, equipment creation, equipment browsing with filtering/searching, equipment details viewing, equipment updates, equipment status management, equipment archival/deletion)  
**Features:** Session validation, multi-service data aggregation (P3UC01), user language preference management (P3UC02), role-based user creation with permission checks (P4UC01), paginated user list with search and filter capabilities (P4UC02), user role assignment and modification with self-modification prevention and rate limiting (P4UC03), user profile information updates with email change handling (P4UC04), user account deactivation and reactivation with session invalidation (P4UC05), first-time login password change with temporary session handling (P4UC06), equipment category management (P5UC01), equipment category viewing with pagination, search, and hierarchical filters (P5UC02), equipment category updates with hierarchy validation and optimistic locking (P5UC03), equipment category archiving with deactivation, reactivation, and soft deletion (P5UC04), equipment creation with validation and category checks (P6UC01), equipment browsing with multi-filter and search capabilities (P6UC02), equipment details viewing with creator/updater names and permissions (P6UC03), equipment information updates with serial number validation and change tracking (P6UC04), equipment status updates with reason tracking (P6UC05), equipment archival and permanent deletion with permission checks (P6UC05)
---

### 2. Auth Service
**Port:** 50051 (gRPC), 3001 (HTTP)  
**Database:** auth_db  
**Purpose:** Authentication, registration orchestration, token management, and session handling  
**Features:** User login with first-login detection (P2UC01), password reset (P2UC02), session validation (P3UC01), session invalidation for deactivated users (P4UC05), first-time login password change with temporary sessions (P4UC06), rate limiting, Redis-based session storage, event publishing for audit
---

### 3. User Service
**Port:** 50052 (gRPC), 3002 (HTTP)  
**Database:** user_db  
**Tables:** users, roles, user_roles  
**Purpose:** User account and role management  
**Features:** Password updates (P2UC02), user activation with email verification timestamp (P1UC03, P4UC06), role assignments, user profile retrieval (P3UC01), owner lookup by tenant (P3UC01), language preference updates (P3UC02), role retrieval and user creation by company owner with temporary password generation (P4UC01), paginated user listing with search and filter capabilities (P4UC02), user details retrieval with tenant isolation (P4UC02), user role modification with self-modification prevention, rate limiting, and permission cache invalidation (P4UC03), user profile information updates with email uniqueness validation and change tracking (P4UC04), user account deactivation and reactivation with last owner prevention and data preservation (P4UC05), password and deactivation status tracking for first-time login detection (P4UC06), user names retrieval for metadata display (P6UC03)
---

### 4. Tenant Service
**Port:** 50053 (gRPC), 3003 (HTTP)  
**Database:** tenant_db  
**Tables:** tenants  
**Purpose:** Multi-tenant company/organization management  
**Features:** Company info retrieval with owner details (P3UC01), calls user-service via gRPC for owner information
---

### 5. Notification Service (Email Service)
**Port:** 3004 (HTTP)  
**Database:** None (stateless)  
**Purpose:** Email sending and notification management  
**Features:** Email verification, password reset emails (P2UC02), welcome emails with temporary passwords (P4UC01), email verification after profile update (P4UC04), account deactivation and reactivation notifications (P4UC05), password change confirmation on first login (P4UC06), multilingual templates (English/Persian), retry logic with exponential backoff
---

### 6. Audit Service
**Port:** 3005 (HTTP)  
**Database:** audit_db  
**Purpose:** System-wide audit logging and compliance tracking
**Features:** Logs all user actions, equipment operations, and system events including status changes, archival, and permanent deletions (P6UC05)  
**Features:** Event-driven audit logging for user actions (registration, login, dashboard access, language changes, user creation by company owner, user role modifications by company owner, user profile updates by company owner, user deactivation and reactivation, password change on first login, equipment category creation, equipment category viewing, equipment category updates, equipment category deactivation, equipment category reactivation, equipment category deletion, equipment creation, equipment list viewing, equipment details viewing, equipment updates), correlation tracking, retention policies
---

### 7. Equipment Service
**Port:** 50056 (gRPC), 3006 (HTTP)  
**Database:** equipment_db  
**Tables:** equipment_categories, equipment  
**Purpose:** Equipment and category management  
**Features:** Equipment category creation with hierarchical structure (P5UC01, max 3 levels), category listing with active filter, category viewing with pagination/search/filters (P5UC02), category updates with circular reference detection and optimistic locking (P5UC03), category archiving with deactivation/reactivation and soft deletion (P5UC04), equipment creation with category validation (P6UC01), equipment browsing with pagination/multi-filter/search/sort (P6UC02: status filter, category filter, manufacturer filter, free text search, date range filters, category path hierarchy), equipment details viewing with full information display and creator/updater metadata (P6UC03), equipment information updates with validation and change tracking (P6UC04), equipment status management with optional reason tracking and status history (P6UC05), equipment archival (soft delete) with full data capture for audit (P6UC05), equipment permanent deletion with complete data capture for compliance (P6UC05), dependency validation (active children/equipment checks), name uniqueness validation, parent-child relationship management, serial number uniqueness within tenant, custom attributes support, soft delete handling for archived equipment with deletedBy tracking, event publishing for audit
---


## Environment Configuration

### Setup Instructions

1. **Docker Compose Environment Variables**
   - Copy `.env.example` to `.env` in the `backend/` directory
   - Update the values with your secure credentials (PostgreSQL, RabbitMQ, Redis)

2. **Service-Specific Environment Variables**
   - Each service has its own `.env.example` file in its directory
   - Copy each `.env.example` to `.env` and configure accordingly
   - See individual service `.env.example` files for required variables

### Important Security Notes
- ⚠️ **Never commit `.env` files** to version control
- ✅ All `.env` files are already in `.gitignore`
- 🔑 Use strong, unique passwords for production environments
- 📝 Refer to `.env.example` files for required configuration
