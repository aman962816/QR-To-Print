# QR to Print — Starter Website

This starter project provides:
- A home page with a QR code linking to the customer upload page
- Customer upload for PDF and image files
- Admin login, print queue, file links, and status updates
- Print options for number of copies and black-and-white/color preference

## Run on your computer

1. Install Node.js (LTS) on the computer.
2. Extract this ZIP folder.
3. Open a terminal/command prompt inside this folder.
4. Run `npm install`
5. Set a strong admin password, then start the site.

Windows PowerShell:
```powershell
$env:ADMIN_PASSWORD="Use-A-Long-Unique-Password"
$env:PUBLIC_BASE_URL="http://localhost:3000"
npm start
```

macOS/Linux:
```bash
ADMIN_PASSWORD="Use-A-Long-Unique-Password" PUBLIC_BASE_URL="http://localhost:3000" npm start
```

Open `http://localhost:3000` on the computer to see the home page and QR code.

## Important: customer phones need a public website address

`localhost` only works on the computer running the server. To let customers scan a QR code using their own mobile data, deploy the site to a hosting service that supports Node.js, persistent file storage, and HTTPS. Then set `PUBLIC_BASE_URL` to the public HTTPS address and print the generated QR code.

Do not expose the local development server directly to the internet. For a real shop, use HTTPS, a strong admin password, regular backups, file retention/deletion rules, and preferably private file storage. The starter stores jobs in memory, so queued jobs disappear when the server restarts; uploaded files remain in the uploads folder. It is a prototype, not a hardened production service.

## Print workflow

1. Customer scans the QR and opens the upload page.
2. Customer uploads PDF/image and submits print preferences.
3. On the shop computer, open `/admin.html`, log in, and refresh the queue.
4. Click a file link to view it. Use the PDF/image viewer's print option or the browser print dialog.
5. Change status to Printing or Completed.

Browser print dialogs may require the operator to confirm paper size, printer, pages, and copies. The site cannot silently print without browser/printer permission.

## Accepted uploads

PDF, JPG, JPEG, PNG, WEBP. Maximum 5 files per submission, 15 MB per file.
