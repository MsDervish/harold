# Harold

A hand-drawn line that draws itself on a web page. Scroll down and it wanders down the page, looping around each picture on the way; scroll back up and it undraws. Or it trails behind your mouse. Charcoal, purple crayon, or any color.

Named for *Harold and the Purple Crayon*, where the line makes the world.

**See it:** https://harold-demo.kate-tyson.workers.dev

Made by Kate Tyson with Claude in Code for Creatives (Cohort 4), November 2026, from the front page of her bed photos site, [nomadfarm](https://nomadfarm-beds.kate-tyson.workers.dev).

## Install it as a Claude skill

Tell your Claude Code:

> Install the Harold skill from https://github.com/MsDervish/harold. Put SKILL.md and harold.js in a folder called `harold` inside `~/.claude/skills/`.

Then, in your site's folder, type `/harold`. Claude asks how you'd like the line (what it does, what color, which pictures get a loop), adds it to your page, and shows you.

## Or add it by hand

Copy `harold.js` next to your page, and put this just before `</body>`:

```html
<script src="harold.js"></script>
```

Settings go on that same line, all optional:

| Setting | Choices |
|---|---|
| `data-mode` | `scroll` (default), `cursor`, `both` |
| `data-color` | `charcoal` (default), `crayon`, or any color, like `#c0392b` |
| `data-width` | thickness in pixels (default 3) |
| `data-layer` | `under` the words and pictures (default), or `over` |
| `data-reveal` | `yes`: pictures fade in as the line reaches them |
| `data-trail` | cursor mode: `fade` (default) or `keep` |

For example: `<script src="harold.js" data-color="crayon" data-mode="both"></script>`

Harold loops every picture bigger than a thumbnail. To choose, add `data-harold` to the ones you want (a picture, a section, anything), and it loops only those. To leave one out, add `data-harold-skip`.

With the line `under`, anything with its own background color hides the line where it crosses. That's often nice; if not, use `data-layer="over"`.

## What's here

- `harold.js`: the line, one file, no other code needed.
- `SKILL.md`: the `/harold` skill for Claude Code.
- `index.html`: the demo page, with buttons to try every setting.

Free to use, change and pass on.
