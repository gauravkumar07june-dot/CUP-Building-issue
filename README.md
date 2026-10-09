# CUP Building Issue Register

A website where every team raises CUP Building issues, anyone replies with a solution, and management records the final decision. Everything is saved in one Google Sheet that you own.

| File | What it is |
|---|---|
| `index.html` | The website |
| `config.js` | Website settings (you paste one link here) |
| `lib/` | Excel export library |
| `Code.gs` | Script that goes into your Google Sheet. Do NOT upload this to GitHub |

## Part A: Google Sheet (stores the issues), about 5 minutes

1. Open sheets.google.com and create a blank sheet. Name it `CUP Building Issue Register`.
2. Menu **Extensions > Apps Script**. Delete whatever is in the editor and paste the full contents of `Code.gs`.
3. At the top of the script, put the email IDs of the people who give final decisions in `MANAGER_EMAILS`. `ALLOWED_DOMAIN` is already set to `lntecc.com`.
4. Click **Deploy > New deployment**. Click the gear icon and choose **Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Click **Deploy** and approve the permission screens (choose your account > Advanced > Go to project > Allow). It asks for permission to edit the sheet and to send email as you; the email permission is used only to send sign-in codes.
5. Copy the **Web app URL** (it ends with `/exec`).

If you later change the script or the manager list: **Deploy > Manage deployments > pencil > Version: New version > Deploy**. The URL stays the same.

## Part B: GitHub (hosts the website)

1. In your repository delete the zip file. Click **Add file > Upload files** and upload `index.html`, `config.js` and the `lib` folder so that `index.html` sits at the top level.
2. Open `config.js` in GitHub, click the pencil, and paste the Web app URL between the quotes of `apiUrl: ""`. Commit.
3. **Settings > General > Danger Zone > Change visibility > Public** (free GitHub Pages needs this; the files hold no issue data).
4. **Settings > Pages**: Source **Deploy from a branch**, Branch **main**, folder **/(root)**, Save.
5. After a minute the site is at `https://<your-username>.github.io/<repository-name>/`.

## Part C: Share

Send the site link on WhatsApp. Each person types their `@lntecc.com` email, receives a 6-digit code on that email, and enters it once. That phone or computer then stays signed in for 30 days.

## Good to know

- **The one file:** the Google Sheet has three tabs (Issues, Replies, Decisions) that fill up automatically. Use File > Download > Microsoft Excel any time. The website also has a "Download register (.xlsx)" button.
- **Refresh:** the dashboard reloads every 30 seconds and after every action.
- **AI solution:** "Copy AI prompt" packs the issue and all replies. Paste it into Copilot or any AI assistant and save the answer back on the issue.
- **Who can see it:** only people who can receive email on an `@lntecc.com` address. Without signing in, the site shows nothing and the sheet accepts nothing. The sheet records the email of whoever raised, replied or decided.
- **Sign-in emails** are sent from your Gmail address. A personal Gmail account can send about 100 per day, which is enough because each person needs a code only once a month per device. Ask people to check Junk the first time.
- **Remove everyone's access at once:** in the Apps Script editor, choose the function `signEveryoneOut` and click Run.
- **Do not edit column headers or delete rows** in the sheet. To remove a test issue, delete its whole row.
- **Limits:** this suits a project team (hundreds of issues). The data sits in your personal Google account, not in company systems.
