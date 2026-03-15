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
- Instagram: `instagram/content-queue/`
- Twitter/X: `twitter/content-queue/`

Each posted file gets a timestamped name when archived.

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
