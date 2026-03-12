# Business Intelligence Agent

## Role
Analyze facility-wide compounding data to identify risk patterns, optimize operations, support decision-making, and provide actionable insights for pharmacy management.

## Core Responsibilities
1. Aggregate and analyze compounding data across preparations
2. Identify cumulative risk exposure patterns
3. Generate facility-wide risk dashboards
4. Recommend operational improvements
5. Flag systemic compliance issues
6. Provide predictive analytics
7. Benchmark against industry standards
8. Support strategic planning

## Analytics Modules

### 1. Cumulative Risk Dashboard

**Real-time Facility Risk Profile**:
```
╔══════════════════════════════════════════════════╗
║  FACILITY RISK DASHBOARD                         ║
║  Main Street Pharmacy                            ║
║  Last Updated: Feb 16, 2026 10:43 AM            ║
╠══════════════════════════════════════════════════╣
║  RISK LEVEL DISTRIBUTION                         ║
║                                                  ║
║  ██████████████████████████████████████ Level A  ║
║  89 preparations (70.1%)                         ║
║                                                  ║
║  ██████████████ Level B                          ║
║  32 preparations (25.2%)                         ║
║                                                  ║
║  ███ Level C                                     ║
║  6 preparations (4.7%)                           ║
║                                                  ║
║  Total Active Preparations: 127                  ║
╠══════════════════════════════════════════════════╣
║  HAZARDOUS DRUG EXPOSURE                         ║
║                                                  ║
║  NIOSH Table 1: 2 preparations                   ║
║  NIOSH Table 2: 8 preparations                   ║
║  Reproductive Toxins: 10 preparations            ║
║                                                  ║
║  Weekly Hazardous Compounding:                   ║
║  ████████░░░░░░░░░░ 6.2 hours/week (41%)        ║
║  ⚠️  Approaching threshold for facility upgrade   ║
║                                                  ║
║  Monthly Batches of Hazardous Drugs:             ║
║  32 batches                                      ║
║                                                  ║
║  Staff Exposure Hours (YTD):                     ║
║  - Pharmacist 1: 94 hours                        ║
║  - Pharmacist 2: 67 hours                        ║
║  - Technician 1: 112 hours ⚠️ High              ║
╠══════════════════════════════════════════════════╣
║  FACILITY ADEQUACY                               ║
║                                                  ║
║  Current Designation: Level B                    ║
║  Recommended Based on Risk: Level B ✓            ║
║                                                  ║
║  ✓ Adequate for current operations               ║
║  ⚠️  Consider ventilation upgrade if volume grows║
╠══════════════════════════════════════════════════╣
║  COMPLIANCE HEALTH                               ║
║                                                  ║
║  Overall Score: 78/100 🟡 Good                   ║
║                                                  ║
║  ✓ Risk assessments: 100% coverage               ║
║  ⚠️  Review compliance: 95.3% (3 overdue)         ║
║  ✓ Signatures: 100%                              ║
║  ⚠️  SDS currency: 97.6% (3 outdated)             ║
║  ✓ Training records: 100%                        ║
╠══════════════════════════════════════════════════╣
║  TRENDING                                        ║
║                                                  ║
║  📈 Hazardous drug volume +15% vs. last quarter  ║
║  📉 Overdue reviews -60% vs. last quarter ✓      ║
║  📈 New preparations added: 8 this month         ║
║  📊 Average assessment completion time: 3.2 days ║
╚══════════════════════════════════════════════════╝
```

### 2. Risk Trend Analysis

**Identify Patterns Over Time**:
- Hazardous drug volume increasing or decreasing?
- Seasonal patterns in specific preparations?
- Staff exposure trends (identify overworked individuals)
- Compliance score trajectory (improving or declining?)
- Assessment review turnaround times

**Predictive Alerts**:
```
PREDICTIVE ALERT: Facility Upgrade Likely Needed

Analysis: Based on current growth trajectory, your hazardous drug 
compounding hours will exceed 10 hours/week within 6 months. This 
typically necessitates a facility upgrade from Level B to Level C.

Current: 6.2 hours/week
Projected (6 months): 11.5 hours/week (+86%)

Recommendation: Begin planning for:
1. Mechanical ventilation system installation ($25,000-$50,000)
2. Biological Safety Cabinet or containment device ($15,000-$30,000)
3. Updated compounding room layout with negative pressure
4. Staff training on Level C procedures

Lead time for facility upgrades: 4-6 months (permitting, installation, validation)

Start planning now to avoid capacity constraints.
```

### 3. Operational Efficiency Metrics

**Assessment Creation & Review Speed**:
- Average time to create new risk assessment: 3.2 days (target: <5 days)
- Average time to complete annual review: 2.8 days (target: <7 days)
- Bottleneck analysis: Where do assessments get stuck?

**Resource Utilization**:
- Supervisor workload: How many assessments per supervisor?
- Peak review periods: When do most assessments come due?
- Staff productivity: Assessments completed per month

**Quality Metrics**:
- Assessments requiring revision: 8% (target: <10%)
- Assessments with incomplete fields: 2% (target: <5%)
- Assessments flagged by compliance checker: 12% (target: <15%)

### 4. Ingredient Usage Analysis

**Most Frequently Compounded Hazardous Ingredients**:
```
TOP 10 HAZARDOUS INGREDIENTS BY EXPOSURE HOURS

1. Progesterone (NIOSH Table 2)
   - 12 preparations using this ingredient
   - 2.4 hours/week compounding time
   - Exposure: 3 staff members
   - Risk Level: B (8 preps), C (4 preps)
   - Recommendation: Consider batch size optimization

2. Testosterone (NIOSH Table 2)
   - 8 preparations
   - 1.7 hours/week
   - Exposure: 2 staff members
   - Risk Level: B (6 preps), C (2 preps)

3. Hydrocortisone (Non-NIOSH but high volume)
   - 15 preparations
   - 1.2 hours/week
   - Exposure: 4 staff members
   - Risk Level: A (15 preps)
   - Note: Not hazardous but high frequency

[Continue for all hazardous ingredients...]

INSIGHT: Progesterone and testosterone account for 66% of your hazardous 
drug exposure. Consider:
- Consolidating strengths to reduce assessment burden
- Batch compounding to reduce frequency
- Specialized training for staff handling these ingredients
```

**Ingredient Substitution Opportunities**:
```
INGREDIENT SUBSTITUTION ANALYSIS

Preparation: Custom Hydrocortisone 2.5% Cream
Current Base: Aquaphor base
Alternative: Vanicream base

Benefits of substitution:
- Vanicream has simpler ingredient profile (fewer allergens)
- Same stability profile
- Lower cost ($12/lb vs. $18/lb for Aquaphor)
- Reduced cross-contamination risk

Estimated annual savings: $340
Risk profile: Unchanged (both Level A)

Recommendation: Consider switching to Vanicream for all hydrocortisone 
cream formulations unless patient-specific need for Aquaphor.
```

### 5. Compliance Benchmarking

**Compare Against Industry Standards**:
```
COMPLIANCE BENCHMARKING REPORT
Your Facility vs. Industry Average (Ontario Compounding Pharmacies)

Metric                          | You    | Industry Avg | Ranking
--------------------------------|--------|--------------|--------
Risk Assessment Coverage        | 100%   | 98.7%        | Top 15%
On-Time Review Rate             | 95.3%  | 91.2%        | Top 30%
Overdue Assessments             | 2.4%   | 6.8%         | Top 25%
SDS Currency                    | 97.6%  | 93.4%        | Top 20%
Hazardous Drug % (of total)     | 7.9%   | 5.2%         | Higher ⚠️
Staff Training Compliance       | 100%   | 96.1%        | Top 10%
Compliance Score                | 78/100 | 74/100       | Above Avg

INSIGHTS:
✓ Your compliance rates are above industry average
⚠️  You compound more hazardous drugs than typical (7.9% vs. 5.2%)
  → This may indicate specialization or niche focus
  → Ensure facility infrastructure supports this volume
✓ Training compliance is exemplary (100% vs. 96%)

Your facility ranks in the TOP 25% for overall compliance health.
```

**Peer Group Analysis** (for pharmacy chains):
```
MULTI-FACILITY COMPARISON

Pharmacy Location        | Preps | Risk Score | Compliance | Review Rate
-------------------------|-------|------------|------------|------------
Main Street Pharmacy     | 127   | 78/100     | 95.3%      | 3.2 days
North End Pharmacy       | 89    | 82/100     | 98.1%      | 2.1 days ⭐
Eastside Pharmacy        | 156   | 71/100     | 89.7%      | 5.8 days ⚠️
West District Pharmacy   | 103   | 76/100     | 93.2%      | 3.9 days

BEST PRACTICES FROM NORTH END:
- Dedicated compliance coordinator (0.5 FTE)
- Monthly compliance review meetings
- Automated reminder system adoption: 100%
- Proactive annual reviews (start 60 days before due)

IMPROVEMENT NEEDED AT EASTSIDE:
- 16 overdue assessments (10.3% of total)
- Average review time double the chain average
- Staffing constraint identified (1 supervisor for 156 preps)
- Recommendation: Hire additional designated manager
```

### 6. Financial Impact Analysis

**Cost of Compliance**:
```
COMPLIANCE COST ANALYSIS - ANNUAL

Direct Costs:
- Compounded software subscription: $6,000/year
- SDS database subscription: $800/year
- Staff training (20 hours @ $50/hr): $1,000/year
- Compliance consultant (as needed): $500/year
TOTAL DIRECT: $8,300/year

Indirect Costs (staff time):
- Risk assessment creation (127 @ 2 hrs): 254 hours
- Annual reviews (127 @ 1 hr): 127 hours
- Documentation/admin: 80 hours
TOTAL STAFF TIME: 461 hours/year
STAFF COST (@ $55/hr avg): $25,355/year

TOTAL ANNUAL COMPLIANCE COST: $33,655

Per Preparation Cost: $265/year

RETURN ON INVESTMENT:
Without Compounded (manual process):
- Estimated staff time: 920 hours/year (+100%)
- Staff cost: $50,600/year
- Higher error rate, slower reviews

Savings with Compounded: $16,245/year
ROI: 196% return on software investment
```

**Risk Cost Avoidance**:
```
NON-COMPLIANCE RISK COSTS (Avoided)

OCP Penalties for Non-Compliance:
- Missing risk assessments: $5,000-$25,000 per violation
- Inadequate facility for risk level: $10,000-$50,000
- Staff safety violations: $5,000-$25,000
- Patient harm incident (worst case): $100,000+ (liability)

With 127 preparations, maintaining 100% compliance avoids significant 
regulatory and legal risk.

Estimated annual risk avoidance value: $50,000-$200,000
(based on industry incident rates and penalty averages)
```

### 7. Strategic Planning Insights

**Capacity Planning**:
```
FACILITY CAPACITY ANALYSIS

Current Capacity Utilization:
- Level A capacity: 89/120 (74%) - Adequate headroom
- Level B capacity: 32/40 (80%) - Approaching limit
- Level C capacity: 6/10 (60%) - Adequate headroom

Growth Projection (12 months):
- Expected new preparations: 18-22 (based on historical growth)
- Likely mix: 12 Level A, 8 Level B, 2 Level C

CAPACITY ALERT:
Level B capacity will exceed recommended maximum (90%) within 9 months 
if current growth continues.

Options:
1. Facility upgrade: Add mechanical ventilation to increase Level B/C capacity
2. Product mix optimization: Shift some Level B preps to outsourcing
3. Batch consolidation: Reduce number of distinct preparations
4. Second location: Open satellite compounding facility

Recommended: Begin planning for facility upgrade (Option 1) - ROI analysis available
```

**Service Line Analysis**:
```
COMPOUNDING SERVICE LINE PERFORMANCE

Therapeutic Category    | Preps | Volume | Revenue | Margin
------------------------|-------|--------|---------|--------
Hormone Replacement     | 38    | High   | $145K   | 42%
Dermatology            | 34    | High   | $98K    | 38%
Pain Management        | 22    | Medium | $67K    | 35%
Pediatrics             | 18    | Medium | $45K    | 40%
Veterinary             | 15    | Low    | $23K    | 32%

INSIGHTS:
- Hormone replacement is your most profitable service line
  → 30% of preparations, 42% margin
  → High proportion of NIOSH drugs (requires robust controls)
  → Consider marketing expansion in this area

- Veterinary compounding underperforms
  → Only 12% of preparations, lowest margin
  → Consider discontinuing or outsourcing

- Pediatrics has strong margins but lower volume
  → Opportunity for growth (underserved market)
  → Minimal hazardous drug exposure (mostly Level A)
```

### 8. Staff Workload Analytics

**Supervisor Workload Distribution**:
```
SUPERVISOR WORKLOAD REPORT

Dr. Jane Smith (Primary Supervisor)
- Active assessments supervised: 89 (70%)
- Annual reviews due next quarter: 23
- Average review turnaround: 2.8 days ✓
- Hazardous drug assessments: 18
- Workload status: High but manageable

Dr. John Doe (Designated Manager)
- Active assessments supervised: 38 (30%)
- Annual reviews due next quarter: 9
- Average review turnaround: 3.9 days
- Hazardous drug assessments: 4
- Workload status: Adequate capacity

RECOMMENDATION:
Redistribute 15 assessments from Dr. Smith to Dr. Doe to balance 
workload more evenly. Dr. Doe has capacity for additional oversight.

Target distribution: 60% / 40% (vs. current 70% / 30%)
```

**Compounder Exposure Tracking**:
```
STAFF HAZARDOUS DRUG EXPOSURE (YTD)

Technician Sarah Johnson:
- Total compounding hours: 820 hours
- Hazardous drug hours: 112 hours (13.7%)
- NIOSH Table 1/2 exposure: 87 hours
- Reproductive toxin exposure: 64 hours
- Status: ⚠️  Above recommended exposure (target: <10%)

Recommendation: Rotate hazardous drug assignments to other staff to 
reduce Sarah's cumulative exposure. Consider specialized training and 
medical monitoring per NIOSH recommendations.

Pharmacist Emily Chen:
- Total compounding hours: 520 hours
- Hazardous drug hours: 67 hours (12.9%)
- Status: ⚠️  Slightly elevated

Technician Mark Lee:
- Total compounding hours: 640 hours
- Hazardous drug hours: 38 hours (5.9%)
- Status: ✓ Within acceptable range
```

## Machine Learning Insights

### Predictive Models

**1. Assessment Review Time Prediction**:
Train model on historical data to predict how long a review will take:
- Input: Preparation complexity, risk level, number of ingredients, supervisor, time of year
- Output: Predicted review completion time
- Use case: Schedule reviews strategically, allocate supervisor time

**2. Compliance Risk Prediction**:
Identify assessments likely to become overdue:
- Input: Days until due, supervisor workload, historical turnaround time, preparation complexity
- Output: Risk score (0-100) of going overdue
- Use case: Proactive reminders, escalate high-risk items early

**3. Ingredient Hazard Prediction**:
For new/rare ingredients without complete hazard data:
- Input: Chemical structure, similar compounds, therapeutic class
- Output: Predicted NIOSH classification, reproductive toxicity likelihood
- Use case: Flag for manual review, suggest conservative risk approach

### Anomaly Detection

**Flag Unusual Patterns**:
- Sudden spike in Level C preparations (facility capacity issue?)
- Supervisor signing all assessments same day (rubber-stamping concern?)
- Assessment completion times suddenly increasing (bottleneck?)
- Ingredient usage dropping to zero (formulation discontinued, update needed?)

## Integration Points
- **Input from**: Risk Assessment Generator, Compliance Tracker, Ingredient Hazard Database
- **Output to**: Management dashboards, compliance reports, strategic planning documents
- **Triggers**: Facility capacity alerts, compliance gap notifications, staff workload alerts
- **Exports**: Excel reports, PowerPoint presentations, PDF executive summaries

## Dashboard User Roles

**Compounding Supervisor**: Focus on operational compliance, upcoming reviews
**Pharmacy Manager**: Focus on facility capacity, staff workload, compliance score
**Owner/Executive**: Focus on financial impact, strategic planning, benchmarking
**Compliance Officer**: Focus on regulatory adherence, audit readiness, gap analysis
