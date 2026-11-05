---
name: harold
description: Adds Harold to a website, a hand-drawn line that draws itself down the page as you scroll and loops around the pictures (or trails behind the mouse), in charcoal, purple crayon, or any color. Use when someone types /harold, or says "add Harold", "add the drawing line", "draw a line on my site", "the line that draws itself", or "the Harold line".
---

# Harold

Harold is a line that draws itself on a web page, named for *Harold and the Purple Crayon*, where
the line makes the world. Kate Tyson made it in Code for Creatives (Cohort 4), from the front page of
her bed photos site, and wrote it so anyone in the class could use it.

It's one file, `harold.js`, in this skill's folder. Putting it on a page is one line of code. This
skill does that for you, asks how you'd like the line, and shows you the result.

## How to talk to them

Plain words. If you need a word like "script tag", say what it is in the same breath ("the one line
that tells the page to load Harold"). One question at a time, short.

## Step 1: find the site

Find out which site and which page(s). If you're already in a site folder, list its `.html` files
and ask which pages get Harold (often just the front page). If you can't tell where the site is, ask.
Read each chosen page before changing it.

If a page already draws its own line (an `<svg>` with paths that draw on scroll, like nomadfarm's front
page), say so and ask before adding Harold on top.

## Step 2: how they'd like the line

Ask these one at a time. Each has a default, so "you pick" is a fine answer.

1. **What should it do?** Draw down the page as you scroll and loop the pictures (`scroll`, the
   default); trail behind your mouse (`cursor`; it does nothing on phones); or both (`both`).
2. **What should it look like?** Charcoal (the default), purple crayon (Harold's own), or any color
   they name.
3. **Which pictures get a loop?** All of them (the default: every picture bigger than a thumbnail), or
   just some. If some: which ones. Logos and icons can be left out.
4. Only if the page has lots of words: **behind the words or on top?** Behind (`under`, the default)
   is calmer. On top (`over`) is bolder.

## Step 3: put it on

1. Copy `harold.js` from this skill's folder into the site's folder, next to the page (or into a
   `js/` folder if the site already has one; then point to it there).
2. Just before `</body>`, add one line, with only the settings that differ from the defaults:
   ```html
   <script src="harold.js" data-color="crayon"></script>
   ```
   The settings: `data-mode` (scroll, cursor, both), `data-color` (charcoal, crayon, or any CSS color),
   `data-width` (thickness in pixels, default 3), `data-layer` (under, over), `data-reveal="yes"`
   (pictures fade in as the line reaches them), `data-trail="keep"` (cursor mode: what you draw stays).
   The top of `harold.js` explains each one.
3. If they picked only some pictures: add `data-harold` to each picture they want looped (anything with
   it can be looped, a section or a box of text too). Harold then loops only those. To leave one out
   instead, add `data-harold-skip` to it.
4. **Check the background.** With the line behind (`under`), anything with its own background color or
   picture (a page wrapper, a card, a colored band) hides the line where it crosses. If the whole page
   sits in a box with a background, move that background onto `body`, or use `data-layer="over"`.
   Say which you did.

## Step 4: show them

Open the page in the browser and look: scroll the whole way down, then back up (the line should
undraw), at laptop size and at phone size. If `/c4c-verify` is installed, it does this well. Check the
console for errors. Show a screenshot or two with the line partway drawn.

Fix what's clearly wrong (a loop running off the edge, the line hidden behind a background). Then ask
what they think. The first look usually brings a change: crayon instead of charcoal, fewer loops,
thicker. Each is one setting.

## Step 5: put it online

This skill only changes the files on their computer. If the site is online, offer `/c4c-ship` (or
however they usually publish) to put the new version up. Don't publish without their yes.

## Good to know

- The wobble is seeded from the page's address, so the line is the same for every visitor, every time.
- People who've asked their computer for reduced motion get the whole line drawn at once, and no
  cursor trail.
- It's free to use and change. The source and a demo with every setting:
  https://github.com/MsDervish/harold and https://harold-demo.kate-tyson.workers.dev
