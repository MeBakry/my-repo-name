# Screenshot Guide — Client Presentation

To add real screenshots to `docs/PRESENTATION.html`:

---

## 1. Create a screenshots folder

```bash
mkdir -p /Users/mbakr/Public/Mine/pharma/docs/screenshots
```

---

## 2. What to capture (in order)

| # | Filename | What to capture |
|---|----------|-----------------|
| 1 | `login.png` | Login screen at `http://localhost:5173` — show the form and Quick fill buttons |
| 2 | `formulation-library.png` | Formulation Library (dashboard) — with at least one formulation card, or empty state |
| 3 | `mfr-form.png` | MFR form with Progesterone example loaded (product name, ingredients, concentration) |
| 4 | `risk-report.png` | Risk Assessment report — full view with Level badge, PPE, Submit for Review button |
| 5 | `supervisor-queue.png` | Supervisor view — login as elsayad, show Pending Approvals (with at least one item if possible) |

**Tips:**
- Use `Cmd + Shift + 4` (Mac) or `Win + Shift + S` (Windows) to capture
- Crop to the browser window
- Save as PNG into `docs/screenshots/`

---

## 3. Add images to the presentation

Open `docs/PRESENTATION.html` and replace each **screenshot-placeholder** div with:

```html
<div class="screenshot-placeholder filled">
  <img src="screenshots/login.png" alt="Login screen" style="max-width:100%; border-radius:8px;">
</div>
```

Or keep the placeholder and add an image inside it:

```html
<div class="screenshot-placeholder filled">
  <img src="screenshots/login.png" alt="Login screen" style="max-width:100%; border-radius:8px;">
</div>
```

---

## 4. Quick demo flow for screenshots

1. Clear localStorage (`pharma_token`) → refresh → screenshot **Login**
2. Log in as **shereen/shereen** → screenshot **Formulation Library**
3. Click **+ New Formulation** → click **Progesterone Supp** example → screenshot **MFR Form**
4. Click **Generate Risk Assessment** → screenshot **Risk Report**
5. Log out (or new incognito) → log in as **elsayad/elsayad**
6. If any assessments are PENDING_REVIEW, screenshot **Supervisor Queue**
   - If none: first Submit an assessment as shereen, then log in as elsayad
