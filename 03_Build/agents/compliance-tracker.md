# Compliance Tracker Agent

## Role
Monitor risk assessment lifecycles, track review deadlines, ensure regulatory compliance, and maintain audit trails for pharmacy compounding operations.

## Core Responsibilities
1. Track 12-month risk assessment review cycles
2. Generate renewal reminders and notifications
3. Monitor signature and approval workflows
4. Maintain version history and audit trails
5. Flag outdated or incomplete assessments
6. Track cumulative facility-wide risk exposure
7. Generate compliance reports for inspections
8. Alert supervisors to regulatory changes

## Compliance Requirements Tracked

### Per-Preparation Requirements (OCP Standards)
1. **One Risk Assessment per Preparation**
   - Different strengths = separate assessments
   - Each linked to specific Master Formulation Record
   - Status: Active, Under Review, Archived, Expired

2. **12-Month Review Cycle**
   - Every risk assessment reviewed annually
   - Signed and dated by compounding supervisor
   - Reassessed if practice or standards change mid-cycle
   - Grace period: 30 days (system escalates if overdue)

3. **Version Control**
   - Track all changes to assessments
   - Document reason for revision
   - Link to regulatory change or internal incident
   - Maintain archived versions (minimum 2 years)

4. **Signature Requirements**
   - Initial approval: Compounding Supervisor
   - Annual review: Compounding Supervisor
   - Changes: Supervisor + Pharmacist who requested change
   - Digital signature with timestamp

5. **Linked Documentation**
   - Master Formulation Record (MFR) reference
   - Safety Data Sheets (SDS) for all APIs
   - Product monographs (DIN references)
   - Training records for specialized preparations

### Facility-Wide Requirements

6. **Cumulative Risk Assessment**
   - Aggregate exposure across all preparations
   - Track total hours compounding hazardous drugs
   - Monitor facility capacity vs. assigned level
   - Flag when facility upgrades needed

7. **Regulatory Updates**
   - Monitor NIOSH list updates (quarterly check)
   - Track OCP guideline revisions
   - Alert when USP <795> changes
   - Update affected assessments

## Data Schema

### Risk Assessment Tracking Table
```
assessment_id (UUID, primary key)
preparation_id (foreign key to MFR)
product_name (text)
concentration (text)
protocol_number (text)
version_number (integer)
status (enum: draft, active, under_review, expired, archived)
assigned_risk_level (enum: A, B, C)
created_date (timestamp)
approved_date (timestamp)
approved_by (user_id)
last_reviewed_date (timestamp)
next_review_due (date) -- created_date + 365 days
review_status (enum: current, due_soon, overdue, reviewed)
days_until_review (computed: next_review_due - today)
```

### Review Reminder Table
```
reminder_id (UUID, primary key)
assessment_id (foreign key)
reminder_type (enum: 90_day, 30_day, 7_day, overdue)
scheduled_date (date)
sent_date (timestamp)
recipient (user_id)
acknowledged (boolean)
acknowledged_date (timestamp)
```

### Version History Table
```
version_id (UUID, primary key)
assessment_id (foreign key)
version_number (integer)
change_date (timestamp)
changed_by (user_id)
change_reason (enum: annual_review, regulatory_update, ingredient_change, facility_change, error_correction)
change_description (text)
field_changes (jsonb) -- {"risk_level": {"old": "A", "new": "B"}, ...}
previous_version_snapshot (jsonb) -- full previous document
approval_status (enum: pending, approved, rejected)
```

### Signature Log Table
```
signature_id (UUID, primary key)
assessment_id (foreign key)
version_id (foreign key)
signer_name (text)
signer_role (enum: compounding_supervisor, designated_manager, pharmacist)
signature_timestamp (timestamp)
ip_address (text)
signature_method (enum: digital_certificate, password_auth, biometric)
document_hash (text) -- SHA-256 of signed document
```

### Cumulative Risk Tracking Table
```
facility_id (UUID)
calculation_date (date)
total_active_preparations (integer)
level_a_count (integer)
level_b_count (integer)
level_c_count (integer)
niosh_table1_count (integer)
niosh_table2_count (integer)
reproductive_toxin_count (integer)
total_compounding_hours_per_week (decimal)
hazardous_compounding_hours_per_week (decimal)
high_risk_preparations (array of assessment_ids)
recommended_facility_level (enum: A, B, C)
current_facility_level (enum: A, B, C)
upgrade_needed (boolean)
upgrade_rationale (text)
```

### Compliance Alert Table
```
alert_id (UUID, primary key)
alert_type (enum: review_due, review_overdue, regulatory_change, ingredient_update, missing_signature, incomplete_assessment)
severity (enum: info, warning, critical)
assessment_id (foreign key, nullable)
preparation_id (foreign key, nullable)
title (text)
description (text)
created_date (timestamp)
due_date (date)
assigned_to (user_id)
status (enum: open, acknowledged, in_progress, resolved, dismissed)
resolution_notes (text)
resolved_date (timestamp)
```

## Automated Workflows

### 1. Review Reminder Workflow
```
Daily 6:00 AM:
  - Query all assessments
  - Calculate days until next review
  
  IF days_until_review = 90:
    - Create 90-day reminder
    - Email supervisor: "Review due in 3 months"
    
  IF days_until_review = 30:
    - Create 30-day reminder
    - Email + in-app notification: "Review due in 30 days"
    - Add to supervisor's task list
    
  IF days_until_review = 7:
    - Create 7-day reminder
    - Email + SMS + in-app notification: "URGENT: Review due in 7 days"
    - Escalate to pharmacy manager
    
  IF days_until_review < 0:
    - Create overdue alert (critical severity)
    - Email supervisor + manager daily until resolved
    - Flag assessment status as "overdue"
    - Highlight in red on dashboard
```

### 2. New Assessment Creation Workflow
```
WHEN new MFR is approved:
  - Trigger Risk Assessment Generator Agent
  - Create assessment_id and link to MFR
  - Set status = "draft"
  - Calculate next_review_due = today + 365 days
  - Assign to compounding supervisor
  
WHEN assessment is completed:
  - Validate all required fields present
  - Route to supervisor for signature
  - Set status = "pending_approval"
  
WHEN supervisor signs:
  - Set status = "active"
  - Record signature in signature_log
  - Set approved_date = today
  - Create 90-day reminder
  - Update cumulative risk calculation
```

### 3. Annual Review Workflow
```
WHEN review is initiated:
  - Present current assessment to supervisor
  - Highlight any changes in ingredient hazard data since last review
  - Show regulatory updates (NIOSH, OCP, USP)
  - Flag if facility circumstances changed
  
Supervisor Actions:
  - Confirm "no changes needed" → re-sign and extend 12 months
  - OR "changes required" → create new version, update fields, sign
  
System Actions:
  - Increment version_number
  - Archive previous version
  - Set last_reviewed_date = today
  - Set next_review_due = today + 365 days
  - Log in version_history
  - Reset reminder schedule
```

### 4. Regulatory Update Propagation
```
WHEN ingredient hazard data changes:
  - Query all assessments using that ingredient
  - Create alert for each affected assessment
  - Notify supervisors: "Ingredient X reclassified - review required"
  - Flag assessments for out-of-cycle review
  
WHEN NIOSH list updated:
  - Compare old vs new list
  - Identify ingredients moved between tables
  - Query affected assessments
  - Auto-generate impact report
  - Require supervisor acknowledgment
  
WHEN OCP standards change:
  - System-wide notification to all facilities
  - Require acknowledgment
  - Set deadline for compliance (per OCP guidance)
  - Track facilities that have updated vs. pending
```

### 5. Cumulative Risk Calculation (Weekly)
```
Every Monday 7:00 AM:
  - Aggregate all active assessments
  - Count by risk level (A, B, C)
  - Count NIOSH drugs
  - Calculate total compounding hours
  - Compare to facility capacity
  
IF facility has Level C preparations BUT designated Level B:
  - Create critical alert: "Facility upgrade required"
  - Generate upgrade plan
  - Notify manager and owner
  
IF hazardous drug hours > 20/week AND no mechanical ventilation:
  - Create warning alert: "Engineering controls recommended"
  - Suggest ventilation system installation
```

## Dashboard Views

### 1. Supervisor Dashboard
- **Upcoming Reviews** (next 90 days)
- **Overdue Reviews** (red alert badges)
- **Pending Signatures** (action required)
- **Active Preparations by Risk Level** (pie chart)
- **Cumulative Risk Score** (facility-wide metric)
- **Recent Regulatory Updates** (with affected preparations count)

### 2. Compliance Manager Dashboard
- **Facility Compliance Status** (% of assessments current)
- **Review Completion Rate** (on-time vs. late)
- **Signature Backlog**
- **Regulatory Change Impact** (assessments needing updates)
- **Audit Readiness Score** (0-100%)
- **Version History Log** (filterable by date/user/reason)

### 3. Inspection-Ready Report
Generate for OCP inspections:
```
PHARMACY RISK ASSESSMENT COMPLIANCE REPORT
Generated: [Date]
Reporting Period: [Start] to [End]

SUMMARY
-------
Total Active Preparations: 127
Total Risk Assessments on File: 127 (100%)
Current (within 12 months): 121 (95.3%)
Under Review (due <30 days): 6 (4.7%)
Overdue: 0 (0%)

RISK LEVEL DISTRIBUTION
-----------------------
Level A: 89 (70.1%)
Level B: 32 (25.2%)
Level C: 6 (4.7%)

HAZARDOUS DRUGS
---------------
NIOSH Table 1: 2 preparations
NIOSH Table 2: 8 preparations
Reproductive Toxins: 10 preparations

REVIEW COMPLIANCE
-----------------
Reviews Completed on Time (last 12 months): 118/120 (98.3%)
Average Review Turnaround: 3.2 days
Supervisor Signatures: 127/127 (100%)

REGULATORY UPDATES
------------------
NIOSH List Update (Dec 2024): 8 assessments updated within 30 days
OCP Template Update (Feb 2025): 127 assessments reviewed within 60 days

FACILITY CUMULATIVE RISK
-------------------------
Current Facility Designation: Level B
Recommended Based on Cumulative Risk: Level B
Facility Adequate for Current Operations: Yes

AUDIT TRAIL INTEGRITY
----------------------
All assessments have digital signatures: Yes
Version history maintained for 2+ years: Yes
SDS documents linked and current: 124/127 (97.6%)
Missing SDS flagged and pending: 3 preparations

ATTACHMENTS
-----------
- List of all active risk assessments (Appendix A)
- List of NIOSH drugs compounded (Appendix B)
- Review schedule for next 12 months (Appendix C)
- Supervisor training certifications (Appendix D)
```

## Notification System

### Email Templates
1. **90-Day Reminder**: Friendly heads-up with link to assessment
2. **30-Day Reminder**: Actionable reminder with "Review Now" button
3. **7-Day Urgent**: Red-highlighted urgent notice
4. **Overdue Daily**: Escalated to manager with compliance impact note
5. **Regulatory Update**: "Action Required - Ingredient Reclassified"
6. **Facility Risk Alert**: "Cumulative Risk Threshold Exceeded"

### In-App Notifications
- Toast notifications for time-sensitive alerts
- Badge counts on dashboard navigation
- Task list integration (Kanban board)
- Calendar integration for review schedules

### SMS/Text Alerts (Optional)
- Critical overdue assessments
- Facility-level compliance issues
- Regulatory deadlines approaching

## Integration Points
- **Input from**: Risk Assessment Generator Agent (new assessments)
- **Input from**: Ingredient Hazard Database Agent (hazard data changes)
- **Output to**: Document Generation Agent (reports and exports)
- **Sync with**: User Management System (supervisor assignments)
- **Export to**: Quality Management System (audit trails)

## Metrics & KPIs
1. **Compliance Rate**: % of assessments current (target: >95%)
2. **On-Time Review Rate**: % of reviews completed before due date (target: >98%)
3. **Average Review Turnaround**: Days from due date to completion (target: <5 days)
4. **Overdue Assessment Count**: Number currently overdue (target: 0)
5. **Signature Completion Rate**: % of assessments signed (target: 100%)
6. **Audit Readiness Score**: Composite score 0-100 (target: >90)
7. **Regulatory Update Response Time**: Days to update after change (target: <30 days)

## Regulatory Compliance Checklist
For each assessment, track:
- [ ] Linked to approved MFR
- [ ] All APIs have hazard data
- [ ] SDS documents attached and current (<3 years)
- [ ] Initial supervisor signature present
- [ ] Last reviewed within 12 months
- [ ] Next review date scheduled
- [ ] Version history maintained
- [ ] Changes documented and justified
- [ ] Cumulative risk factored into facility-wide assessment
- [ ] Staff training records linked (if specialized preparation)
