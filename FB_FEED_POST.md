# Facebook Feed Post Guide

This guide is for these 3 Facebook page automations:

- `fb-automation`
- `fb-royalking-automation`
- `fb-print-automation`

All 3 read from the same root `.env` file.

## 1. Install once

Run this in the project root:

```bash
npm install
```

What happens:

- installs the Node packages the Facebook scripts need
- you usually only need to do this once, or again after package changes

## 2. Create the `.env` file

If you do not already have one:

```bash
copy .env.example .env
```

What happens:

- makes a new `.env` file from the example file
- this is the file all 3 Facebook automations will read

## 3. The simplest `.env` you need

If you want to use all 3 Facebook page automations, this is the simplest useful setup:

```env
POST_TIME=09:00
TIMEZONE=Asia/Colombo

FACEBOOK_PAGE_ID=your_main_page_id
FACEBOOK_PAGE_ACCESS_TOKEN=your_main_page_access_token

FACEBOOK_ROYALKING_PAGE_ID=your_royalking_page_id
FACEBOOK_ROYALKING_PAGE_ACCESS_TOKEN=your_royalking_page_access_token

FACEBOOK_PRINT_PAGE_ID=your_print_page_id
FACEBOOK_PRINT_PAGE_ACCESS_TOKEN=your_print_page_access_token
```

What each env value means:

- `POST_TIME`: default daily post time for the Facebook schedulers
- `TIMEZONE`: timezone used with `POST_TIME`
- `FACEBOOK_PAGE_ID`: the main Facebook Page ID for `fb-automation`
- `FACEBOOK_PAGE_ACCESS_TOKEN`: the access token for that main page
- `FACEBOOK_ROYALKING_PAGE_ID`: the RoyalKing Facebook Page ID
- `FACEBOOK_ROYALKING_PAGE_ACCESS_TOKEN`: the RoyalKing page access token
- `FACEBOOK_PRINT_PAGE_ID`: the Print Facebook Page ID
- `FACEBOOK_PRINT_PAGE_ACCESS_TOKEN`: the Print page access token

Important:

- if you do not set a page-specific time, the script uses `POST_TIME` and `TIMEZONE`
- all 3 automations read the root `.env`, not a separate env file inside each folder

## 4. Optional: set a different time for each page

Only add these if you want different schedules:

```env
FACEBOOK_POST_TIME=09:00
FACEBOOK_TIMEZONE=Asia/Colombo

FACEBOOK_ROYALKING_POST_TIME=10:00
FACEBOOK_ROYALKING_TIMEZONE=Asia/Colombo

FACEBOOK_PRINT_POST_TIME=11:00
FACEBOOK_PRINT_TIMEZONE=Asia/Colombo
```

What happens:

- the main page uses `FACEBOOK_POST_TIME` and `FACEBOOK_TIMEZONE`
- RoyalKing uses `FACEBOOK_ROYALKING_POST_TIME` and `FACEBOOK_ROYALKING_TIMEZONE`
- Print uses `FACEBOOK_PRINT_POST_TIME` and `FACEBOOK_PRINT_TIMEZONE`
- if any of those are missing, the script falls back to `POST_TIME` and `TIMEZONE`

## 5. How to get the env values simply

### `PAGE_ID`

This is your Facebook Page ID.

Simple ways to get it:

1. Open your Facebook Page in a browser.
2. Check the About or Page transparency/details area if the Page ID is shown there.
3. Or use Meta Graph API Explorer and list your pages.

If you already have a working token, the helper command can also detect a matching page and write the page ID into `.env`.

### `PAGE_ACCESS_TOKEN`

This is the token the script uses to post to the page.

Simple way to get it:

1. Go to `https://developers.facebook.com/`
2. Open Graph API Explorer:
   `https://developers.facebook.com/tools/explorer/`
3. Select your Meta app.
4. Generate a user access token.
5. Allow these permissions:
   `pages_manage_posts` and `pages_read_engagement`
6. Use that token to get your page token.

Important:

- the posting scripts need a page access token that can post to the page
- in this repo, the `*:token` helper commands can take your current token, fetch your available pages, and update `.env` with the matched page token

### Which token goes where

Use these env names for each page:

- main page: `FACEBOOK_PAGE_ACCESS_TOKEN`
- RoyalKing page: `FACEBOOK_ROYALKING_PAGE_ACCESS_TOKEN`
- Print page: `FACEBOOK_PRINT_PAGE_ACCESS_TOKEN`

If you only have one page, only fill the main page values.

## 6. Token helper commands

These commands help update `.env` with the correct page ID and page access token for each page.

Main page helper:

```bash
npm run fb:token
```

RoyalKing helper:

```bash
npm run fb:royalking:token
```

Print helper:

```bash
npm run fb:print:token
```

What happens:

- reads the related token from `.env`
- checks your Facebook account through Graph API
- fetches your pages
- tries to match the page ID already in `.env`
- writes the final page ID and page access token back into `.env`

Important:

- the helper still needs a valid starting token in `.env`
- if the token is expired or missing permissions, the helper will fail

## 7. Where to put content

Each automation has its own queue:

- `fb-automation/content-queue/`
- `fb-royalking-automation/content-queue/`
- `fb-print-automation/content-queue/`

What happens after posting:

- if posting succeeds, the file moves into that automation's `posted/` folder
- each automation only reads its own queue

## 8. Commands and what each one does

### Main Facebook page commands

```bash
npm run fb:add-content
```

What happens:

- lets you create a new post file for `fb-automation/content-queue/`
- use this if you want the script to create the content file for you

```bash
npm run fb:test
```

What happens:

- checks that the main Facebook page env values exist
- reads a sample or queued post
- shows you a preview/test flow without using the daily scheduler

```bash
npm run fb:test-post
```

What happens:

- runs the Facebook test script in post mode
- useful after fixing tokens or page IDs

```bash
npm run fb:post
```

What happens:

- posts the next file from `fb-automation/content-queue/` immediately
- if it works, that file moves to `fb-automation/posted/`

```bash
npm run fb:schedule
```

What happens:

- starts a long-running scheduler process
- waits until the configured time every day
- posts from the main page queue when the scheduled time is reached
- keep the terminal open while this is running

```bash
npm run fb:token
```

What happens:

- helps fill or fix `FACEBOOK_PAGE_ID` and `FACEBOOK_PAGE_ACCESS_TOKEN` in `.env`

### RoyalKing commands

```bash
npm run fb:royalking:add-content
```

What happens:

- adds a new post into `fb-royalking-automation/content-queue/`

```bash
npm run fb:royalking:test
```

What happens:

- checks RoyalKing env values and runs the test flow

```bash
npm run fb:royalking:test-post
```

What happens:

- runs the RoyalKing test flow in post mode

```bash
npm run fb:royalking:post
```

What happens:

- posts the next RoyalKing queued file immediately

```bash
npm run fb:royalking:schedule
```

What happens:

- starts the daily RoyalKing scheduler
- keep the terminal open while it waits

```bash
npm run fb:royalking:token
```

What happens:

- helps fill or fix `FACEBOOK_ROYALKING_PAGE_ID` and `FACEBOOK_ROYALKING_PAGE_ACCESS_TOKEN`

### Print commands

```bash
npm run fb:print:add-content
```

What happens:

- adds a new post into `fb-print-automation/content-queue/`

```bash
npm run fb:print:test
```

What happens:

- checks Print env values and runs the test flow

```bash
npm run fb:print:test-post
```

What happens:

- runs the Print test flow in post mode

```bash
npm run fb:print:post
```

What happens:

- posts the next Print queued file immediately

```bash
npm run fb:print:schedule
```

What happens:

- starts the daily Print scheduler
- keep the terminal open while it waits

```bash
npm run fb:print:token
```

What happens:

- helps fill or fix `FACEBOOK_PRINT_PAGE_ID` and `FACEBOOK_PRINT_PAGE_ACCESS_TOKEN`

## 9. Simple run order

For any of the 3 Facebook automations, use this order:

1. Fill in `.env`.
2. Run the related `*:token` command if you want help filling the page ID and page token.
3. Add content to that page queue.
4. Run the related `*:test` command.
5. Run the related `*:post` command if you want to post now.
6. Run the related `*:schedule` command if you want daily automatic posting.

## 10. Quick examples

Post to the main Facebook page right now:

```bash
npm run fb:post
```

Start only the RoyalKing daily scheduler:

```bash
npm run fb:royalking:schedule
```

Fix or refresh the Print page token in `.env`:

```bash
npm run fb:print:token
```

## 11. If it does not work

Check these first:

- `.env` exists in the project root
- the page ID is for the correct page
- the access token belongs to the correct page
- the token has `pages_manage_posts` and `pages_read_engagement`
- the correct queue folder has at least one content file
- you are running the commands from the project root

Common cases:

- `*:test` fails: env values are missing, wrong, or expired
- `*:token` fails: the starting token in `.env` is invalid or does not have the needed permissions
- `*:post` fails: the queue is empty, the token is bad, or the page ID does not match the token
