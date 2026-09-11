# Role-Based Access Control (RBAC)

Sahayak AI employs strict Role-Based Access Control to ensure data privacy, security, and a tailored user experience. 

Frontend routing and visibility are driven by the authenticated user's role. More importantly, **backend authorization** prevents unauthorized data access across roles.

## The Roles

### 1. ELDERLY
- **Primary user** of the system.
- **Access Level**: Can access *only their own* data.
- **Capabilities**:
  - View personal routine and schedule.
  - Play cognitive games (progress is saved to their profile).
  - View family memories and send/receive messages.
  - Trigger SOS / Help alerts.
  - Interact with the Voice Assistant.

### 2. FAMILY
- **Connected family member**.
- **Access Level**: Can access data *only for the specific elderly users* they are linked to via the database relation.
- **Capabilities**:
  - View the daily summary and activity of their connected elderly user.
  - Send messages and initiate calls.
  - Upload family memories.
  - Schedule appointments/events for the elderly user.

### 3. CAREGIVER
- **Professional or assigned caregiver**.
- **Access Level**: Can access data for *multiple assigned patients*.
- **Capabilities**:
  - View a dashboard of assigned patients.
  - Manage care tasks and daily checklists.
  - Receive critical alerts (e.g., missed medicine, SOS).
  - Write and review care notes.
  - Communicate with the patient or family.

### 4. HEALTHCARE
- **Clinical professional (Doctor, Nurse, Therapist)**.
- **Access Level**: Can access clinical and routine data for *authorized patients only*.
- **Capabilities**:
  - View detailed patient clinical profiles.
  - Monitor cognitive game performance and trends.
  - Review routine adherence.
  - Manage clinical appointments.

## Security Boundary Implementation

- **Frontend Visibility is NOT Security**: While the frontend conditionally renders links and redirects unauthorized users (e.g., an Elderly user trying to access `/healthcare` will be redirected), the frontend is bypassed easily.
- **Backend Enforcement**: Every API route enforces authorization. 
  - Example: When fetching `/api/patients/:id`, the backend validates that the requesting user's JWT ID matches the target patient (if Elderly), is connected as a Family member, or is explicitly assigned as a Caregiver/Healthcare professional.
- **Data Isolation**: Database queries automatically scope results using `WHERE` clauses bound to the authenticated user's context.
