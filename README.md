# Social Media Automation

This project is set up to queue content and publish it on a daily schedule to Facebook, Instagram, and Twitter/X.

## Before You Run Automation

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and fill in your credentials:

```bash
copy .env.example .env
```

3. Set the scheduler values in `.env`:

```env
POST_TIME=09:00
TIMEZONE=Asia/Kolkata
```

4. Add content to the queue:

```bash
npm run add-content
```

You can also place `.html`, `.htm`, `.txt`, or `.md` files directly into the queue folder used by the scheduler.

## Running The Shared Automation

Use the root scheduler when you want one queued item to be posted across all configured platforms.

### Start the daily scheduler

```bash
npm start
```

What this does:

- Verifies credentials for each platform.
- Reads the next file from `content-queue/`.
- Waits until the daily time from `POST_TIME`.
- Posts to every enabled platform.
- Moves the processed file into `posted/`.
- Writes post results to `post-history.json` and a per-post `.results.json` file.

Important:

- The scheduler only runs while the process is active.
- Keep the terminal or server process running.
- Stop it with `Ctrl+C`.

## Useful Automation Commands

Verify credentials:

```bash
npm run setup
```

Preview the next queued post:

```bash
npm run test-post
```

Run one immediate posting cycle without waiting for the scheduled time:

```bash
npm run post-now
```

## Queue Behavior

The shared scheduler uses this flow:

1. Read the oldest file from `content-queue/`.
2. Parse the content and format it for each enabled platform.
3. Publish it.
4. Move the original file to `posted/`.
5. Save the posting result metadata.

If the queue is empty, the scheduler stays running and waits for the next scheduled check.

## Running A Single Platform Scheduler

Use these only if you want to run a platform separately with its own queue.

Facebook only:

```bash
npm run fb:schedule
```

Instagram only:

```bash
npm run ig:schedule
```

Twitter/X only:

```bash
npm run tw:schedule
```

Single-platform queues:

- Facebook: `fb-automation/content-queue/`
- Instagram: `instagram/content-queue/`
- Twitter/X: `twitter/content-queue/`

## Recommended Daily Workflow

1. Add or drop content into the queue.
2. Run `npm run setup` if credentials changed.
3. Run `npm run test-post` to preview formatting.
4. Start the automation with `npm start`.
5. Leave the process running until the scheduled post time passes.
