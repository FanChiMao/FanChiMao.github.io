# Pixel Ajie: sprite sheet spec

The pixel Ajie on the Ajie page (`src/lib/ajie-pet/`) is drawn from one PNG sprite sheet. Until a
drawn one exists, a placeholder is painted in code (`sprite.ts`). This folder is everything needed to
make the real one:

| File | What it is |
| --- | --- |
| `layout-guide.png` | The placeholder at 8×, with the grid, row names and frame numbers. The red line is the floor. |
| `placeholder-sheet.png` | The placeholder at its real size (192 × 448). Same layout the new sheet must have. |

## The sheet

- **One PNG, 192 × 448 px**: 6 columns × 14 rows of **32 × 32 px** frames.
- **Transparent background.** Hard pixel edges only: no anti-aliasing, no blur, no soft shadows, no
  semi-transparent pixels.
- **Facing right** in every row except `play` (facing us). The page mirrors him to walk left.
- **Floor**: feet (or belly when lying) end on **row 29 or 30** of each frame (counting from 0); rows
  30–31 stay empty except in `play`, where the reaching paw hangs down to row 31.
- **Same size and position in every frame**: the body must not jump around between frames of one
  animation (only the moving parts move).
- **At most ~16 colours**, a 1 px dark-brown outline round the silhouette (like the placeholder).
- Unused cells (right of each row's last frame) stay transparent.

## Rows (order matters)

| Row | Name | Frames | What happens |
| --- | --- | --- | --- |
| 0 | idle | 4 | Standing. 0–2: tail sways a little; 3: eyes closed (blink). |
| 1 | walk | 6 | One full walk cycle (legs in diagonal pairs, small body bob). Loops. |
| 2 | run | 4 | Gallop: gathered, push off, stretched out, landing. Tail straight back. Loops. |
| 3 | sit | 4 | Sitting upright, looking right; tail on the ground, its tip swaying. Loops. |
| 4 | groom | 4 | Sitting, licking a raised front paw, eyes closed (paw up / down). Loops. |
| 5 | sleep | 2 | Curled up (loaf), eyes closed, tail wrapped round; breathing in / out. |
| 6 | jump | 3 | 0: crouch before the jump; 1: rising, legs tucked; 2: falling, legs stretched down. |
| 7 | happy | 4 | Sitting, eyes shut in "^ ^" smiles, mouth open, little bounce. Loops. |
| 8 | held | 2 | Picked up by the scruff, hanging, legs dangling, a bit surprised. |
| 9 | surprised | 2 | Standing, eyes wide, tail straight up and puffed. |
| 10 | lie | 4 | Lying down, **head up, eyes open, watching**; front paws stretched out; tail tip flicks. |
| 11 | play | 4 | **Facing us**, lying on a ledge; 0 and 2: one paw (our left) raised; 1 and 3: that paw reaching down **over the edge** (to row 31). Frame 3 with happy eyes. |
| 12 | stretch | 4 | Waking up: a long stretch forward, front legs reaching out, rear and tail up; eyes closing. Played once. |
| 13 | arch | 4 | Then the back arched up high (the "Halloween cat" stretch), and back down. Played once. |

The page picks the frame rate; a looping row should loop smoothly (last frame leads back to the first).

## What Ajie looks like (from his photos)

- Orange (ginger) tabby: warm orange coat, darker orange stripes on the forehead, back and as
  **rings on the tail**.
- Cream / pale: muzzle, chin, chest, paws.
- **Pink nose**, a little pink blush on the cheeks is fine (chibi).
- Eyes: yellow-green / amber with a dark pupil; at this size dark eyes with one white shine pixel.
- **One ear is tipped** (the top of the ear is cut flat: a shelter / TNR mark). In the photos it is
  the ear on the viewer's right when he faces us. Keep it on the same ear in every frame (in side
  view it is the near, more visible ear).
- Chibi proportions: big head (about 40 % of the height), short legs.

Attach 2–3 photos when asking for the sheet: one of his face (shows the tipped ear), one from the
side (body and tail), one of the paws.

## Prompt (for Codex or an image model)

> Create a pixel-art sprite sheet of my cat Ajie for a website mascot. Match the attached
> `layout-guide.png` exactly: a 192 × 448 px PNG, 6 columns × 14 rows of 32 × 32 px frames,
> transparent background, hard pixel edges (no anti-aliasing, no semi-transparent pixels), at most
> 16 colours, a 1 px dark-brown outline. Same rows, order and frame counts as the guide: idle 4,
> walk 6, run 4, sit 4, groom 4, sleep 2, jump 3, happy 4, held 2, surprised 2, lie 4, play 4, stretch 4, arch 4.
> All rows face right except `play`, which faces the viewer. Feet end on row 29–30 of each frame;
> keep the body in the same place across frames of a row.
> Ajie is a chibi orange tabby: warm orange coat, darker orange stripes on forehead and back, ringed
> tail, cream muzzle, chest and paws, pink nose, amber eyes, and one ear tipped (flat top) — see
> the attached photos. Keep him recognisably the same cat in every frame.

If the result comes out larger than 32 px per frame (image models usually draw at 4–8×, not exactly
on the grid, with soft or semi-transparent edges), keep it as it is: the script below fixes that.

## Putting it on the site

1. Convert the generated image (any size, same layout; the cats need not sit exactly on a grid):

   ```sh
   node scripts/pixel-ajie.mjs path/to/generated.png public/ajie/pixel-ajie.png
   ```

   It finds the cats (rows split at the empty bands between them, each row at the empty columns),
   scales them all by one factor to 32 × 32 frames, makes every pixel fully opaque or transparent,
   removes the reddish fringe a background removal leaves, stands each frame on row 30, lines up side
   views on the head (so frames do not slide), redraws open eyes clean (found in the full-size
   image: a near-black pupil with yellow-green iris round it), keeps the palette to 24 colours, and
   writes an 8× preview to the system temp folder.
2. `src/lib/ajie-pet/sprite.ts` already points `SHEET_SRC` at `/ajie/pixel-ajie.png` (empty: the
   placeholder painted in code).
3. Check on the Ajie page: every animation, walking left (mirrored), on the Instagram link (`play`
   paw on the icon) and inside an open post.

`generated-v2.png` is the source of the sheet in use (made with Codex). It has no tipped ear, in
`play` the paw is raised but never reaches over the edge, and a few frames' eyes still look odd
after the redraw; a next version could fix all three (drawing exactly at 8× would help the eyes most).
