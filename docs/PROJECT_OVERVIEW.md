# Pharmacy Compounding Compliance Platform - Project Documentation

## Project Overview

**Product Name**: Compounded

**Mission**: Transform regulatory compliance from a documentation burden into an intelligent, automated system that maintains rigor while eliminating repetition.

**Target Market**: Compounding pharmacies in Ontario, Canada (expandable to other provinces and US states)

---

## Problem Statement

The Ontario College of Pharmacists (OCP) requires compounding pharmacies to:
- Create **one risk assessment per preparation** (including different strengths of the same compound)
- Review every assessment **every 12 months** (with supervisor signature)
- Maintain comprehensive hazard analysis, PPE recommendations, and facility level justifications
- Track cumulative risk exposure across all preparations

**The Challenge**:
For a pharmacy compounding 120 formulations, this means:
- 120 separate risk assessment records
- 120 annual reviews to track and complete
- Hundreds of hours spent on repetitive documentation
- Risk of compliance gaps (missed reviews, outdated assessments)
- Manual tracking of regulatory changes (NIOSH, OCP, USP updates)

**The Pain**:
> "The thinking is important. The duplication is heavy."
> — From the business idea email

Supervisors risk shifting from asking **"Is my reasoning solid?"** to **"Is every box filled?"** when overwhelmed by volume.

---

## Solution

An **AI-powered B2B SaaS platform** that:

1. **Automates repetitive work** while preserving professional judgment
2. **Pre-populates risk assessments** from Master Formulation Records
3. **Auto-tags hazard data** from ingredient databases (NIOSH, SDS, WHMIS)
4. **Generates professional rationales** with defensible reasoning
5. **Tracks 12-month review cycles** with intelligent reminders
6. **Maintains version history** without paper stacking
7. **Provides cumulative risk dashboards** for facility-wide oversight
8. **Alerts to regulatory changes** and auto-identifies affected preparations

---

## Business Model

### Revenue Model
- **SaaS Subscription** (monthly or annual):
  - Small pharmacy (1-50 preparations): $199/month
  - Medium pharmacy (51-150 preparations): $399/month
  - Large pharmacy (151-300 preparations): $599/month
  - Enterprise (300+ preparations or multi-facility): Custom pricing

- **Add-ons**:
  - Sterile compounding module: +$100/month
  - Multi-province compliance: +$50/month per additional province
  - Priority support: +$99/month

### Target Customers
- **Primary**: Independent compounding pharmacies (100-150 preparations)
- **Secondary**: Pharmacy chains (multi-facility deployments)
- **Tertiary**: Hospital pharmacies with compounding operations

### Market Size (Ontario)
- ~4,500 community pharmacies in Ontario
- Estimated 20-30% perform compounding (900-1,350 pharmacies)
- Target 10% market penetration Year 1: 90-135 customers
- Average revenue per customer: $399/month = $35,910/month = $430,920 annual recurring revenue (ARR) at 10% penetration

### Go-to-Market Strategy
1. **Pilot Program** (Months 1-4): 5-10 early adopter pharmacies (free beta)
2. **Case Studies & Testimonials** (Month 5): Publish success stories
3. **OCP Conference Presence** (annually): Booth, presentations, networking
4. **Digital Marketing**: SEO, Google Ads, LinkedIn targeting pharmacy owners
5. **Partnerships**: OCP endorsement, pharmacy associations, consultants
6. **Referral Program**: $500 credit for each referred pharmacy

---

## Technology Architecture

> **Note (Feb 2026):** The tech stack below reflects what is actually built and running,
> replacing the original planning-phase spec.

### Frontend (Built)
- **Web App**: React + Vite (JavaScript)
- **Key Features**: MFR form, ingredient autocomplete, risk assessment display
- **Backend integration**: API client with automatic demo-mode fallback

### Backend (Built)
- **API Server**: Node.js + Express
- **Database**: PostgreSQL with Prisma ORM (10 models, typed schema)
- **Auth**: JWT + bcryptjs (3 roles: Pharmacist, Supervisor, Admin)
- **Rule Engine**: Deterministic risk assessment logic (no AI at runtime)
- **Data Pipeline**: Automated fetchers for NIOSH (PDF), PubChem (API), Health Canada DPD (API)

### Data Strategy (Built)
- **Offline-first**: All external data fetched and stored locally as JSON, seeded into PostgreSQL
- **Sources**: NIOSH 2024 (213 drugs), PubChem (88 compounds), Health Canada DPD (71 drugs), 116 ingredient profiles
- **Updates**: `npm run fetch:all` to re-fetch, `npm run db:seed` to reload

### Future (Not Yet Built)
- **PDF Export**: Puppeteer or React-PDF for assessment PDFs
- **AI Enhancement**: OpenAI/Claude for rationale refinement (offline)
- **Mobile**: React Native (Phase 4)
- **Infrastructure**: Docker, CI/CD, cloud hosting (Phase 3+)

---

## Project Structure

```
/pharma
├── server/                       # Express.js backend (Phase 1 -- built)
│   ├── prisma/schema.prisma      # 10-model PostgreSQL schema
│   ├── src/routes/               # REST API (auth, ingredients, mfr, assessments)
│   ├── src/services/ruleEngine.js # Deterministic risk assessment engine
│   ├── src/data/seed/            # Offline JSON data + seed script
│   └── src/data/fetchers/        # NIOSH, PubChem, Health Canada scrapers
├── poc-pharma-risk/              # React + Vite frontend (PoC -- built)
│   ├── src/components/           # MFRForm, IngredientInput, RiskAssessmentDisplay
│   ├── src/services/             # Backend API client + assessment generation
│   └── src/data/                 # Fallback ingredient database
├── agents/                       # Agent specs (future phases)
├── docs/                         # Business + product documentation
├── datasources/                  # Data source inventory
├── features/                     # 5-phase feature roadmap
├── input/                        # Original business idea + OCP templates
└── output/                       # Dev logs, roadmaps, briefs
```

---

## Key Differentiators

### vs. Manual Paper-Based Systems
- **Speed**: 67% faster assessment creation
- **Consistency**: AI ensures uniform quality across all assessments
- **Version Control**: No paper stacking, clean digital history
- **Reminders**: Automated vs. manual tracking

### vs. Generic Compliance Software
- **Pharmacy-Specific**: Built for OCP/NAPRA requirements, not generic QMS
- **AI-Powered**: Intelligent generation, not just digital forms
- **Regulatory Expertise**: Built-in compliance expert chatbot
- **Cumulative Risk**: Facility-wide analysis, not just per-preparation

### vs. Consultants
- **Cost**: $400/month vs. $5,000+ for consultant assessment
- **Speed**: Instant vs. weeks waiting for consultant availability
- **Scalability**: Handle 100+ preparations easily
- **Continuous**: 24/7 support vs. one-time engagement

---

## Success Criteria

### Year 1 Goals
- [ ] 100 paying customers
- [ ] $400K ARR (annual recurring revenue)
- [ ] 95% customer retention rate
- [ ] NPS >50 (Net Promoter Score)
- [ ] 10,000+ risk assessments generated

### Year 2 Goals
- [ ] 300 paying customers
- [ ] $1.2M ARR
- [ ] Expand to 3 additional provinces (BC, AB, QC)
- [ ] Launch sterile compounding module
- [ ] SOC 2 Type II certification

### Year 3 Goals
- [ ] 500 paying customers
- [ ] $2.5M ARR
- [ ] National coverage (all Canadian provinces)
- [ ] Enterprise pharmacy chain deals (10+ locations)
- [ ] International expansion (US market entry)

---

## Team Requirements

### Founding Team (Year 1)
- **CEO/Co-Founder** (Pharmacist): Regulatory expertise, customer relationships
- **CTO/Co-Founder** (Technical): AI/ML, system architecture, development
- **Lead Developer** (Full-Stack): React, Node.js, PostgreSQL
- **AI/ML Engineer**: NLP, GPT integration, predictive models
- **UX/UI Designer**: User-centered design for pharmacists

### Year 2 Expansion
- **Sales Manager**: B2B sales, pharmacy partnerships
- **Customer Success Manager**: Onboarding, support, retention
- **Compliance Specialist**: Regulatory updates, knowledge base maintenance
- **Marketing Manager**: Content, SEO, events

---

## Regulatory & Compliance Considerations

### Data Privacy
- **No patient data** (only preparation specifications)
- **PIPEDA compliant** (Canadian privacy law)
- **HIPAA-ready** (for US expansion)
- **Secure**: Encryption at rest (AES-256) and in transit (TLS 1.3)

### Pharmacy Regulations
- **OCP Endorsed**: Seek OCP endorsement/partnership
- **NAPRA Aligned**: Ensure alignment with national standards
- **USP Referenced**: Compliance with USP <795> technical standards

### Quality Assurance
- **Accuracy**: AI recommendations validated by licensed pharmacists
- **Updates**: Regulatory knowledge base updated quarterly
- **Auditing**: Internal audits of AI output quality

---

## Risks & Mitigation

### Risk 1: Regulatory Change Resistance
**Risk**: Pharmacists skeptical of AI in compliance.
**Mitigation**: 
- Emphasize AI augments, doesn't replace judgment
- Transparency in AI reasoning
- Pilot with early adopters, gather testimonials
- OCP partnership for credibility

### Risk 2: Competition from Larger Players
**Risk**: Established QMS vendors add pharmacy module.
**Mitigation**:
- Deep pharmacy specialization (hard to replicate)
- AI differentiation (generic vendors lack this)
- First-mover advantage in Ontario market
- Build community/network effects

### Risk 3: AI Accuracy Issues
**Risk**: AI generates incorrect or non-compliant recommendations.
**Mitigation**:
- Extensive testing with pilot pharmacies
- Pharmacist review required for all AI output
- Validation layer (consistency checks)
- Clear disclaimer: pharmacist retains responsibility

### Risk 4: Customer Acquisition Cost (CAC) Too High
**Risk**: Cost to acquire customers exceeds revenue.
**Mitigation**:
- Focus on high-value customers (medium-large pharmacies)
- Referral program (viral loop)
- Content marketing (SEO, thought leadership)
- Partnership channels (consultants, associations)

---

## Next Steps

### Immediate (Weeks 1-4)
1. [ ] Validate demand: Interviews with 20 compounding pharmacies
2. [ ] Prototype core workflow: MFR → Risk Assessment (basic)
3. [ ] Test AI rationale generation with real data
4. [ ] Secure pilot partners (5 pharmacies)

### Short-Term (Months 1-6)
1. [ ] Build MVP (Phase 1 features)
2. [ ] Launch private beta with pilot pharmacies
3. [ ] Iterate based on feedback
4. [ ] Prepare for public launch

### Medium-Term (Months 6-12)
1. [ ] Public launch (Phase 2 complete)
2. [ ] Scale to 100 customers
3. [ ] Raise seed funding ($500K-$1M)
4. [ ] Hire core team

### Long-Term (Years 2-3)
1. [ ] Multi-province expansion
2. [ ] Sterile compounding module
3. [ ] Series A funding ($3M-$5M)
4. [ ] US market entry

---

## Contact & Resources

**Project Owner**: [Your Name]
**Email**: [Your Email]
**GitHub**: [Repository URL]
**Documentation**: [Project Folder]

**Key Resources**:
- OCP Website: https://www.ocpinfo.com/
- NIOSH Hazardous Drugs: https://www.cdc.gov/niosh/topics/hazdrug/
- NAPRA: https://napra.ca/
- USP: https://www.usp.org/

---

## Appendix: Key Definitions

- **MFR**: Master Formulation Record (recipe for compounded preparation)
- **NIOSH**: National Institute for Occupational Safety and Health (US agency that classifies hazardous drugs)
- **OCP**: Ontario College of Pharmacists (regulatory body)
- **NAPRA**: National Association of Pharmacy Regulatory Authorities (Canadian standards body)
- **USP <795>**: United States Pharmacopeia chapter on non-sterile compounding
- **SDS**: Safety Data Sheet (chemical hazard information)
- **WHMIS**: Workplace Hazardous Materials Information System (Canadian hazard classification)
- **GHS**: Globally Harmonized System (international chemical classification)
- **Level A/B/C**: OCP facility level designations (A = lowest risk, C = highest risk)

---

**Last Updated**: February 17, 2026
**Version**: 1.1 (tech stack and structure updated to reflect Phase 1 implementation)
