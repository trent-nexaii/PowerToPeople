# Power to the People — book landing page

A single-page website for *Power to the People: The Ministry of Works and Construction of the Tongariro Power Development* by Gillian Tompsett (Spinning Plates Press, 2026).

The whole site is three things:

```
index.html          the page (all styling and script are inside this one file)
images/cover.jpg    book cover (portrait)
images/crew.jpg     historical construction photo (landscape)
images/author.jpg   author portrait (portrait or square)
images/share.jpg    the picture shown when the link is shared (made from the cover)
robots.txt          tells search engines they may index the page
sitemap.xml         lists the page and its pictures for search engines
apps-script/Code.gs the small script that emails each sign-up to you (see section 2)
README.md           this file
```

To look at it, double-click `index.html` and it opens in your web browser. No installation is needed.

The three images were taken from the sell sheet PDF, so the page already shows the real cover, the Moawhango Dam crew photo and the author's portrait. If you have larger originals (the versions sent to the printer, for example), swap them in using the steps below and the page will look sharper on big screens.

---

## 1. Replacing the three images (optional)

1. Get each photo as a JPEG file (the file name ends in `.jpg`).
2. Rename the files exactly as below, including lower-case letters:
   - the book cover → `cover.jpg`
   - the construction photo → `crew.jpg`
   - the author photo → `author.jpg`
3. Drag them into the `images` folder, replacing the files that are there.
4. Open `index.html` again. The new photos will appear.

Nothing in `index.html` needs to change. Tips:

- **Cover:** a portrait image, about 2 wide to 3 tall (for example 1000 × 1430 pixels).
- **Crew photo:** a landscape image, about 4 wide to 3 tall (for example 1600 × 1200 pixels). Other shapes still work; the edges are trimmed to fit.
- **Author photo:** a portrait or square image (for example 800 × 1040 pixels). The top of the picture is kept, so the face should be in the upper part.
- Keep each file under about 500 KB so the page loads quickly on phones. Any photo editor or free online tool can "resize" or "compress" a JPEG.
- If you want to change the caption under the construction photo, open `index.html` in a plain text editor (Notepad on Windows, TextEdit on Mac), search for `<figcaption>`, and change the sentence between `<figcaption>` and `</figcaption>`.

---

## 2. Setting up the email sign-up form

**Until the steps below are done, no sign-up is emailed anywhere.** The page knows this: instead of showing "Thank you", it opens the visitor's own email app with a message addressed to spinningplatespress@icloud.com, so sign-ups are not lost in the meantime. That is a stop-gap, not the finished thing, because it depends on the visitor having an email app set up.

To receive sign-ups automatically, the page needs somewhere to send them. The recommended way uses a small script inside a Google account: each sign-up is emailed to the address you choose and added to a Google Sheet, so you also have a list to write to when the book launches. The receiving address is stored in the script on Google's side. It is never written into the page or into these files, so visitors cannot see it.

You need a Google account (a Gmail address, or any account you use for Google Drive). It takes about ten minutes.

### Option A — Google Sheet and script (recommended, works with any hosting)

1. Go to <https://sheets.google.com>, sign in, and click the **+** to create a blank spreadsheet. Name it something like "Power to the People sign-ups". This sheet will hold the list.
2. In the spreadsheet's menu, click **Extensions**, then **Apps Script**. A new tab opens showing a code editor with a few lines in it.
3. Delete those lines. Open the file `apps-script/Code.gs` from this folder in a plain text editor (Notepad on Windows, TextEdit on Mac), select everything, copy it, and paste it into the code editor.
4. Near the top of the pasted code, check this line:

   ```
   var RECIPIENT = "spinningplatespress@icloud.com";
   ```

   That is the inbox that will receive every sign-up. Change it only if the sign-ups should go somewhere else. Keep the quotes.
5. Click the **save** icon (or press Ctrl+S / Cmd+S).
6. **Send a test email first.** In the toolbar above the code, there is a drop-down that says `doPost`. Change it to `sendTestEmail` and click **Run**. Google asks you to authorise the script: choose your account, and if it shows a warning that the app isn't verified, click **Advanced**, then **Go to … (unsafe)**, then **Allow**. (This warning appears because you wrote the script yourself; it is yours.) Within a minute a message with the subject "Test: New sign-up for Power to the People" should arrive at spinningplatespress@icloud.com. Check the junk folder too. **If it does not arrive, stop here**: the script has not been authorised, and nothing after this will work either.
7. Click the blue **Deploy** button at the top right, then **New deployment**.
8. Click the gear icon next to "Select type" and choose **Web app**. Fill in:
   - Description: anything, for example "Sign-up form".
   - Execute as: **Me**. (Not "User accessing the web app"; that would make every visitor sign in.)
   - Who has access: **Anyone**. (Not "Anyone with Google account". This lets the web page send to it. Nobody can read the sheet or your address through it.)
9. Click **Deploy**. If Google asks you to authorise again, allow it as in step 6.
10. Google now shows a **Web app URL** that begins with `https://script.google.com/macros/s/` and ends in `/exec`. Click **Copy**.
11. Open `index.html` in a plain text editor and find this line near the bottom:

    ```
    const FORM_ENDPOINT = "REPLACE_ME";
    ```

    Replace `REPLACE_ME` with the URL you copied, keeping the quotation marks:

    ```
    const FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycb.../exec";
    ```

12. Save the file and publish it (section 3). Test it by entering your own email address on the page. The button reads "Sending…" for a moment, then "Thank you" appears. Within a minute a message with the subject "New sign-up for Power to the People" arrives at spinningplatespress@icloud.com, and a new row appears in the spreadsheet under a tab called "Sign-ups".

If something is wrong:

- **The page opens your email app instead of showing "Thank you".** The `FORM_ENDPOINT` line in `index.html` still says `REPLACE_ME`, or the version with the URL has not been published yet.
- **"Sorry, something went wrong" appears on the page.** The page reached the address but did not get a proper answer. Check the URL you pasted is the one ending in `/exec` (not `/dev`), that the deployment has **Who has access: Anyone**, and that you authorised the script (step 6). After changing the script's settings, deploy a **New version** (see the notes below).
- **"Thank you" appears but no email arrives.** Check the junk folder at spinningplatespress@icloud.com. Then open the Apps Script editor and click **Executions** in the left-hand menu: each sign-up is listed there, and a failed one shows the reason. If the Sheet tab "Sign-ups" has the row but no email came, the script is being blocked from sending; run `sendTestEmail` again (step 6).
- **The page never pretends.** "Thank you" is shown only after the script confirms it has recorded the address, so a sign-up that reaches "Thank you" has been received.

Notes:

- The URL you pasted is a random code. It does not contain your email address.
- A Google account can send about 100 messages a day this way, which is plenty for sign-ups.
- If you ever change the code in the script, you must click **Deploy → Manage deployments**, choose the pencil icon, set Version to **New version**, and click **Deploy** again. The URL stays the same.
- To also send each person a short confirmation email, change `SEND_CONFIRMATION = false` to `true` in the script and redeploy as above.

### Option B — Netlify Forms (only if you host on Netlify, see below)

1. In `index.html`, change the endpoint line to:

   ```
   const FORM_ENDPOINT = "NETLIFY";
   ```

2. A little further up, find the line beginning `<form id="notify-form"` and add three words to it so it reads:

   ```
   <form id="notify-form" name="notify" data-netlify="true" netlify-honeypot="bot-field" method="post" action="#" novalidate>
   ```

3. Save the file and publish it to Netlify. Sign-ups then appear under **Forms** in your Netlify site dashboard.
4. To have each sign-up emailed, open **Site configuration → Forms → Form notifications**, choose **Email notification**, and enter the address that should receive them. The address is stored in Netlify, not in the page.

Either way, the form already includes a hidden "honeypot" field that catches most automated spam, so no CAPTCHA is needed.

---

## 3. Publishing the page

The site is plain files, so any "static" host will do. Here are the two easiest.

### Netlify (drag and drop, about five minutes)

1. Go to <https://app.netlify.com> and sign up for a free account.
2. On the **Sites** page, look for the box that says **"Drag and drop your site output folder here"**.
3. Drag the whole folder that contains `index.html` and the `images` folder onto that box.
4. Netlify uploads it and gives you a web address such as `https://quiet-river-123456.netlify.app`. The page is live.
5. To use a nicer address, open **Site configuration → Domain management** and either change the free `.netlify.app` name or connect a domain you own, for example `powertothepeople.spinningplatespress.co.nz`. Netlify shows the steps on screen.
6. To update the page later, drag the folder onto the **Deploys** page again.

### GitHub Pages (free, good if the files already live in a GitHub repository)

1. Go to <https://github.com> and sign in or create a free account.
2. Click the **+** at the top right, then **New repository**. Give it a name such as `power-to-the-people`, make sure **Public** is selected, and click **Create repository**.
3. On the new repository page, click **uploading an existing file**. Drag `index.html`, `README.md` and the `images` folder into the page, then click **Commit changes** at the bottom.
4. Click the **Settings** tab, then **Pages** in the left-hand menu.
5. Under **Build and deployment → Branch**, choose `main`, leave the folder as `/ (root)`, and click **Save**.
6. Wait a minute or two and refresh the page. A box at the top shows the live address, in the form `https://your-name.github.io/power-to-the-people/`.
7. To update the page later, repeat step 3 with the changed files. GitHub Pages republishes automatically.

---

## Checking the page before you share it

Open the page and look for these things:

- The yellow title, three taglines and a green "Notify me when it's available" button at the top.
- Pressing that button slides down to the sign-up form.
- Typing a wrong address such as `name@example` and pressing the button shows a message asking for a valid address.
- Typing a correct address shows "Thank you" (once section 2 is done; before that, your email app opens with a message addressed to the publisher).
- Make the browser window narrow (or open the page on a phone). Everything should stack into a single column and stay readable.

---

## Search engines and sharing

The page carries everything a search engine or a social network needs, so nothing has to be set up:

- **Structured data** (the `application/ld+json` block in the `<head>`) describes the publisher, the author, the book (title, ISBN, publication date, the two endorsements, pre-order availability) and the page itself, in the schema.org vocabulary that Google and Bing read.
- **Open Graph and Twitter tags** make the link show the cover, title and description when it is shared on Facebook, LinkedIn, X, Slack, WhatsApp and the like. The share picture is `images/share.jpg`.
- **`robots.txt` and `sitemap.xml`** at the root tell crawlers the page may be indexed and where the pictures are.
- The canonical address is `https://www.spinningplatespress.co.nz/`. If the site ends up at a different address, search for that string in `index.html`, `robots.txt` and `sitemap.xml` and replace it.

If you want a physical address or phone number listed for Spinning Plates Press (useful for local search), add `streetAddress`, `addressLocality`, `postalCode` and `telephone` to the `Organization` entry in the structured data. They were left out because they are not published anywhere on the page.

To check it after deploying, paste the address into Google's Rich Results Test (search.google.com/test/rich-results) and the Schema Markup Validator (validator.schema.org).
