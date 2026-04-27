# MyGPC

Global property calculator with a lead-capture step that emails a branded professional PDF report to the buyer.

## What is implemented

- A redesigned calculator landing page focused on conversion
- Shared calculation logic for the website and report output
- Professional PDF report generation styled around the uploaded financial breakdown template
- Email capture and server-side delivery through Resend
- Validation for incoming report payloads before PDF generation

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Create `.env.local` from `.env.example` and set:

- `RESEND_API_KEY`
- `REPORT_FROM_EMAIL`

`REPORT_FROM_EMAIL` must be a verified sender in Resend, for example:

```bash
REPORT_FROM_EMAIL="MyGPC Reports <report@mygpc.co>"
```

## Report flow

1. User fills in the calculator
2. User enters an email address
3. Frontend posts a validated report payload to `/api/pro-report`
4. The API generates a branded PDF with `@react-pdf/renderer`
5. The API emails the PDF attachment to the user through Resend

## Deploy notes

- Recommended deployment target: Vercel
- Add the same environment variables in Vercel project settings
- Verify the sending domain in Resend before going live
- If you want CRM capture later, the `/api/pro-report` route is the right place to also push leads into Airtable, HubSpot, or a database
