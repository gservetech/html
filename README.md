# Social Media Automation

This project queues content and publishes it to Facebook, Instagram, and Twitter/X on a schedule.

There are two automation modes:

- Shared automation: one content file is used for all enabled platforms.
- Single-platform automation: Facebook, Instagram, or Twitter/X can run with separate queues.

## How The Automation Works

### Shared automation flow

The root automation is the main workflow:

1. Load `.env` credentials and scheduler settings.
2. Read the oldest file from `content-queue/`.
3. Parse the file into title, body, links, images, and hashtags.
4. Format the content for each enabled platform.
5. Post to Twitter/X, Facebook, and Instagram.
6. Move the source file into `posted/`.
7. Save the posting results in:
   - `post-history.json`
   - `posted/<timestamp>_<filename>.results.json`

Important behavior:

- The shared scheduler posts one queued file to all enabled platforms.
- Platforms that are not configured are skipped.
- In the shared flow, the queued file is moved to `posted/` after the run, even if some platforms fail.
- Failures are recorded in the results JSON so you can see what succeeded and what failed.

### Single-platform flow

Each platform also has its own automation folder and queue:

- Facebook: `fb-automation/`
- Facebook RoyalKing: `fb-royalking-automation/`
- Facebook Print: `fb-print-automation/`
- Instagram: `instagram/`
- Twitter/X: `twitter/`

Each platform-specific scheduler:

1. Reads from its own `content-queue/`.
2. Verifies only that platform's credentials.
3. Posts only to that platform.
4. Moves the file to that platform's `posted/` folder only when the post succeeds.

## Project Structure

Shared automation:

- `scheduler.js`: root daily scheduler for all platforms
- `post-now.js`: run one shared posting cycle immediately
- `setup.js`: verify all configured credentials
- `test-post.js`: preview the next shared queued item
- `add-content.js`: create a shared queued post interactively
- `content-queue/`: incoming shared content
- `posted/`: shared posted archive

Platform automation:

- `fb-automation/`: Facebook-only workflow
- `fb-royalking-automation/`: RoyalKing Facebook Page workflow
- `fb-print-automation/`: Print Facebook Page workflow
- `instagram/`: Instagram-only workflow
- `twitter/`: Twitter-only workflow

Shared utilities:

- `utils/html-parser.js`: parses content files and formats platform text
- `utils/image-host.js`: keeps public image URLs or uploads local images to ImgBB
- `utils/logger.js`: console logging used by the automation scripts

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env`

```bash
copy .env.example .env
```

Fill in the credentials you need.

Minimum scheduler settings:

```env
POST_TIME=09:00
TIMEZONE=Asia/Kolkata
```

Platform enablement is automatic:

- Twitter/X is enabled when the Twitter keys are filled in.
- Facebook is enabled when `FACEBOOK_PAGE_ID` and `FACEBOOK_PAGE_ACCESS_TOKEN` are filled in.
- Facebook Page scheduler can use `FACEBOOK_POST_TIME` and `FACEBOOK_TIMEZONE`, with fallback to `POST_TIME` and `TIMEZONE`.
- RoyalKing Facebook Page is enabled when `FACEBOOK_ROYALKING_PAGE_ID` and `FACEBOOK_ROYALKING_PAGE_ACCESS_TOKEN` are filled in.
- Print Facebook Page is enabled when `FACEBOOK_PRINT_PAGE_ID` and `FACEBOOK_PRINT_PAGE_ACCESS_TOKEN` are filled in.
- Instagram is enabled when `INSTAGRAM_BUSINESS_ACCOUNT_ID` and `INSTAGRAM_ACCESS_TOKEN` are filled in.

## Content Format

Supported file types:

- `.html`
- `.htm`
- `.txt`
- `.md`

### HTML content

The parser reads:

- title from `<article><h1>`, then `<h1>`, then `<title>`
- description from `<meta name="description">`
- paragraphs from `<article><p>` or `<body><p>`
- links from `<a href="...">`
- images from `<img src="...">`
- hashtags from paragraph text

Example:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Spring Special</title>
  <meta name="description" content="Fresh pasta special this week.">
</head>
<body>
  <article>
    <h1>Spring Special</h1>
    <p>Fresh pasta special this week.</p>
    <img src="https://example.com/pasta.jpg" alt="Pasta special">
    <a href="https://example.com/order">Order now</a>
    <p>#pasta #special</p>
  </article>
</body>
</html>
```

### TXT or Markdown content

The parser uses:

- first non-empty line as the title
- remaining lines as the body
- URLs as links
- markdown image syntax as images
- `#tags` as hashtags

## Images

Image handling matters most for Facebook and Instagram:

- If the image source is already a public `http` or `https` URL, the automation uses it directly.
- If the image is local, the automation tries to upload it to ImgBB using `IMGBB_API_KEY`.
- Facebook can still fall back to a text-only post when image hosting is unavailable.
- Instagram requires at least one accessible public image URL and will fail without it.

## Shared Automation Commands

Add a shared post interactively:

```bash
npm run add-content
```

Preview the next shared queued item:

```bash
npm run test-post
```

Verify all credentials:

```bash
npm run setup
```

Run one shared posting cycle immediately:

```bash
npm run post-now
```

Start the shared daily scheduler:

```bash
npm start
```

When `npm start` is running:

- it checks credentials on startup
- it shows the queue status
- it schedules one run per day using `POST_TIME` and `TIMEZONE`
- it keeps waiting until you stop it with `Ctrl+C`

## Single-Platform Commands

Facebook:

```bash
npm run fb:add-content
npm run fb:test
npm run fb:test-post
npm run fb:post
npm run fb:schedule
```

Optional env:

```env
FACEBOOK_PAGE_ID=your_page_id_here
FACEBOOK_PAGE_ACCESS_TOKEN=your_long_lived_page_access_token_here
FACEBOOK_POST_TIME=09:00
FACEBOOK_TIMEZONE=Asia/Kolkata
```

Facebook RoyalKing:

```bash
npm run fb:royalking:add-content
npm run fb:royalking:test
npm run fb:royalking:test-post
npm run fb:royalking:post
npm run fb:royalking:schedule
npm run fb:royalking:token
```

Required env:

```env
FACEBOOK_ROYALKING_PAGE_ID=your_royalking_page_id_here
FACEBOOK_ROYALKING_PAGE_ACCESS_TOKEN=your_royalking_long_lived_page_access_token_here
FACEBOOK_ROYALKING_POST_TIME=09:00
FACEBOOK_ROYALKING_TIMEZONE=Asia/Kolkata
```

Facebook Print:

```bash
npm run fb:print:add-content
npm run fb:print:test
npm run fb:print:test-post
npm run fb:print:post
npm run fb:print:schedule
npm run fb:print:token
```

Required env:

```env
FACEBOOK_PRINT_PAGE_ID=your_print_page_id_here
FACEBOOK_PRINT_PAGE_ACCESS_TOKEN=your_print_long_lived_page_access_token_here
FACEBOOK_PRINT_POST_TIME=09:00
FACEBOOK_PRINT_TIMEZONE=Asia/Kolkata
```

Facebook group browser automation:

```bash
npm run fbg:add-content
npm run fbg:login
npm run fbg:test
npm run fbg:test-post
npm run fbg:post
npm run fbg:schedule
```

This is a separate workflow from the Facebook Page API poster. It uses its own queue at `fb-group-automation/content-queue/` and does not modify the existing `fb-automation/` page-posting code.

Required setup for the separate group script:

```env
FACEBOOK_GROUP_URL=https://www.facebook.com/groups/your-group-id/
FACEBOOK_GROUP_POST_AS_NAME=Your Page Name
FACEBOOK_GROUP_BROWSER_PROFILE_DIR=.facebook-group-browser-profile
FACEBOOK_GROUP_HEADLESS=0
FACEBOOK_GROUP_TIMEOUT_MS=120000
```

Then install the dependency and save a browser session:

```bash
npm install
npx playwright install chromium
npm run fbg:login
```

Notes:

- `npm run fbg:login` is where you sign into Facebook and, if needed, switch posting identity to your Page once.
- `FACEBOOK_GROUP_POST_AS_NAME` is a best-effort selector. If Facebook changes the UI, set the actor manually during login and keep the same browser profile.
- This standalone group script is intentionally separate so `npm run fb:post` continues to use the existing page Graph API flow unchanged.

Instagram:

```bash
npm run ig:add-content
npm run ig:test
npm run ig:test-post
npm run ig:post
npm run ig:schedule
```

Twitter/X:

```bash
npm run tw:add-content
npm run tw:test
npm run tw:test-post
npm run tw:post
npm run tw:schedule
```

## End-To-End Daily Process

Recommended shared workflow:

1. Fill in `.env`.
2. Add content with `npm run add-content` or place files into `content-queue/`.
3. Preview formatting with `npm run test-post`.
4. Verify credentials with `npm run setup`.
5. Start the scheduler with `npm start`.
6. Leave the process running until the scheduled time is reached.
7. Review `post-history.json` or the `posted/*.results.json` file after the run.

Recommended single-platform workflow:

1. Add content to the platform queue.
2. Verify that platform with its `*:test` command.
3. Use `*:test-post` if you want to send a sample post.
4. Use `*:post` for one immediate real run.
5. Use `*:schedule` for the daily automated run.

## Queue And Archive Rules

Shared queue:

- source folder: `content-queue/`
- archive folder: `posted/`
- ordering: oldest file first

Platform queues:

- Facebook: `fb-automation/content-queue/`
- Facebook RoyalKing: `fb-royalking-automation/content-queue/`
- Facebook Print: `fb-print-automation/content-queue/`
- Instagram: `instagram/content-queue/`
- Twitter/X: `twitter/content-queue/`

Each posted file gets a timestamped name when archived.

## Coolify Deployment (Docker)

Deploy all 3 Facebook page automations as a single Docker service on Coolify.

### What gets deployed

- `fb-automation` (main Facebook page)
- `fb-print-automation` (Print Facebook page)
- `fb-royalking-automation` (RoyalKing Facebook page)

All 3 schedulers run inside one container via `start-all-schedulers.js`. Each scheduler uses `node-cron` to post at the configured time (default 8:00 AM IST).

### Deployment steps

1. Push this repo to GitHub/GitLab.
2. In Coolify, add a new resource from your repository.
3. Set **Build Pack** to `Dockerfile`.
4. Add all environment variables from `.env` in the Coolify environment settings.
5. Disable health checks (this is a worker service, not a web server).
6. Deploy.

### Required environment variables in Coolify

```env
FACEBOOK_PAGE_ID=your_page_id
FACEBOOK_PAGE_ACCESS_TOKEN=your_token
FACEBOOK_POST_TIME=08:00
FACEBOOK_TIMEZONE=Asia/Kolkata

FACEBOOK_PRINT_PAGE_ID=your_print_page_id
FACEBOOK_PRINT_PAGE_ACCESS_TOKEN=your_print_token
FACEBOOK_PRINT_POST_TIME=08:00
FACEBOOK_PRINT_TIMEZONE=Asia/Kolkata

FACEBOOK_ROYALKING_PAGE_ID=your_royalking_page_id
FACEBOOK_ROYALKING_PAGE_ACCESS_TOKEN=your_royalking_token
FACEBOOK_ROYALKING_POST_TIME=08:00
FACEBOOK_ROYALKING_TIMEZONE=Asia/Kolkata
```

### Run all schedulers locally

```bash
npm run start:all
```

### Alternative: Coolify Scheduled Tasks

Instead of the built-in `node-cron`, you can use Coolify's cron feature:

1. Change the Dockerfile CMD to `CMD ["tail", "-f", "/dev/null"]` to keep the container alive.
2. In Coolify, go to your service settings and add 3 scheduled tasks:

| Command | Cron (UTC) | Description |
|---|---|---|
| `node fb-automation/post-now.js` | `30 2 * * *` | 8:00 AM IST |
| `node fb-print-automation/post-now.js` | `30 2 * * *` | 8:00 AM IST |
| `node fb-royalking-automation/post-now.js` | `30 2 * * *` | 8:00 AM IST |

Coolify cron uses UTC. 8:00 AM IST = 2:30 AM UTC = `30 2 * * *`.

## Troubleshooting

If `npm run test-post` fails:

- confirm the shared `content-queue/` exists or add content through `npm run add-content`
- confirm the root `utils/` files are present
- check that the next queued file is valid HTML, TXT, or Markdown

If `npm run fb:post`, `npm run ig:post`, or `npm run tw:post` fails:

- confirm the related credentials are set in `.env`
- confirm the queue for that platform contains at least one file
- for Instagram, confirm the post includes an accessible image

If the scheduler appears idle:

- confirm `POST_TIME` and `TIMEZONE` are correct
- keep the terminal running
- wait for the next scheduled daily run
