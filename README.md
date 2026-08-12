# 🟣 Science Platform: Open Access & Review Management System

### 📋 Overview

**Science Platform** is a multi-organizational, open-access web ecosystem designed to automate and streamline the evaluation, peer-review, and distribution of scientific articles, grant proposals, and educational initiatives. The platform mitigates administrative overhead, eliminates non-specialized review assignments, and ensures conflict-of-interest protection.

---

### 🏗️ Architectural Approach

Built with the **MERN stack** (_MongoDB, Express, React, Node.js_) using **Feature-Driven Development (FDD)** principles, the platform prioritizes high performance, security, and deterministic reliability:

- **FDD-Modular SPA Architecture** – Monolithic React client layer delivering high responsiveness, minimal network latency, and UI consistency without microfrontend overhead.
- **Security-First Design** – Advanced **JWT-based authentication** stored via **HTTP-only cookies** for robust session management and data isolation.
- **Role-Based Access Control (RBAC)** – Multi-tenant access management handling dynamic role changes between _Authors_, _Reviewers_, and _Admins_.
- **Deterministic Expert Matching** – Multi-criteria selection algorithm balancing domain expertise (`allowedDomains`), publication types (`allowedTypes`), and workload minimization.

---

### 🔄 Core Lifecycle: From Submission to Peer-Review

The platform features a multi-stage lifecycle state machine supported by **Cascade Cleanup Logic** for handling edge cases:

1. **Submission** ── Authorized authors submit materials to specific organizational programs.
2. **Deterministic Assignment** ── System automatically evaluates expert workload and domain compatibility, or Admins triage assigned submissions.
3. **Peer Review** ── Reviewers evaluate submissions with three outcomes:
   - `✅ Approved` ── Published to the public open-access archive.
   - `🔄 Revision` ── Returned to the author for targeted improvements and re-evaluation.
   - `❌ Declined` ── Rejected to maintain rigorous academic standards.
4. **Exception Recovery** ── Cascade cleanup automatically re-routes queued items if a reviewer changes roles, is banned, or is unlinked from an organization.

---

### ⚡ Technical Highlights

- **Aggregation Pipelines** – Schema-optimized MongoDB Atlas structures tailored for complex multi-criteria filtering.
- **Dev-Time LLM Integration** – Architectural planning and boundary-case simulation assisted by Large Language Models during system design.
- **Dual-Channel Notifications** – Real-time In-App and Email alerts ensuring prompt action on queue state changes.

---

### 🚀 Getting Started

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/KeLar36/science_hub.git](https://github.com/KeLar36/science_hub.git)
   cd science-hub
   ```
