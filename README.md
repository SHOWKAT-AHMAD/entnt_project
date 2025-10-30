# TalentFlow Hiring Platform

TalentFlow is a modern, full-featured recruitment platform built with React and Vite. It supports:

- Job management (create, archive, manage jobs)
- Candidate pipeline (drag-and-drop stages, search, live apply)
- Assessments per job (powerful builder, preview, validation, persistence)
- Dual-pane builder/preview for assessment authoring
- Authentication modals (login/signup) with demo credentials
- Responsive, branded UI—beautiful home, jobs, candidates, assessments sections
- State persistence: assessment drafts and candidate answers are locally cached per-job
- Universal error/success notifications

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run and open:**
   ```bash
   npm run dev
   # App available at http://localhost:5173
   ```
3. **Demo login:**
   - Email: `hr@example.com` / Password: `demo123`

## Key Features
- **Jobs Page:** List/add/archive jobs, access assessments
- **Candidates Pipeline:** Kanban/drag-and-drop, search, real-time updates when applied
- **Assessment Builder:** Per-job, create sections and all question types, conditional logic, live preview, auto-save, validation
- **Submissions:** Candidates apply live, answers persist per assessment
- **Modern UI/UX:** Sticky header/footer, all forms styled, mobile-friendly

## For Developers
- All local storage keys follow per-job pattern: `assessment_draft_{jobId}` and `assessment_responses_{jobId}`
- Global toasts for errors, feedback everywhere
- Fully modular components in `/src/components` and pages in `/src/pages`
- Mock server for API endpoints (MSW)

---
© 2024 TalentFlow. Contact: support@talentflow.com
