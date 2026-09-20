# Power to the People — landing page handoff

Single self-contained HTML file. No build step. Open `index.html` in a browser to run it.
Deploy: commit as `index.html`, import the repo in Vercel.

Book: *Power to the People — The Ministry of Works and Construction of the Tongariro Power
Development*, Gillian Tompsett. Spinning Plates Press, on sale October 2026.
ISBN 978-0-473-79935-9. The page exists to drive pre-orders.

## Structure

A WebGL tunnel is fixed behind eight scrolling content stations: portal, epigraph, argument,
photo plate, two endorsements, author, and a daylight finale that carries the CTA. A pre-order
bar is pinned throughout. Scroll position drives camera travel, the metre counter, and the
emergence into daylight.

## Do not rebuild the tunnel renderer

It is tuned against a photograph of the Rangipo surge chamber and against actual screenshots.
These specific values were arrived at by correcting visible faults — changing them reintroduces
the faults:

- **`side: THREE.DoubleSide` on the bore.** With `BackSide` and this winding, the surface
  normals face out of the tunnel and the entire lining renders black. This was the single
  biggest bug. Do not "optimise" it back to BackSide without reversing the triangle winding.
- **Texture streak scale.** UV `x` traces the cross-section (~24 m around), `y` runs along the
  tunnel (6 m per tile). Water stains run *down a wall*, so they are long in `x`, narrow in `y`.
  Drawn at the wrong scale they wrap the whole arch and read as hard banding.
- **Exposure.** Point lights at intensity 1.3 / distance 13, hemisphere ambient at 0.07.
  Higher values blow the near walls to white.
- **`WRAP = 84`** must stay a common multiple of the fitting spacing (6) and the texture tile
  (6), or the loop seams visibly.
- **Pixel ratio capped** at 1.6 on narrow viewports. Eight point lights on a standard material
  is the expensive part; if it stutters on older phones, cut lights before cutting resolution.
- The `#vig` vignette is doing double duty: tunnel darkness, and keeping the lit walls from
  competing with body text. It lifts as you emerge.

### Added in the realism pass

The bore is no longer a straight extrusion, and the light string is no longer uniform. Both
carry their own constraints:

- **`bendX` / `bendY` must stay harmonics of `TAU/WRAP`.** The camera wraps every 84 m, so
  any term whose period does not divide 84 makes the loop seam. Amplitudes also stay well
  inside `W` (3.2): swing the centreline further and the bore occludes the portal glow, which
  kills the daylight finale.
- **Anything running the length of the tunnel must be built along the same bend.** Rails,
  conduit, cable and the water surface are all `runCurve`/strip geometry for this reason. A
  straight `BoxGeometry` or a flat `PlaneGeometry` cannot follow the centreline — that is why
  the water stopped being a plane slid along under the camera.
- **Lamp character is keyed to the absolute unit number `n`, never the recycled slot `i`.**
  Key it to the slot and the dead tube appears to hop between fittings as the string scrolls.
- **The lamp level multiplier is capped at 1.0.** Intensity is `1.3 * lvl`, so the exposure
  ceiling above still holds. Do not let `lvl` exceed 1.
- **Flicker is off under `prefers-reduced-motion`.** It is a brightness oscillation on a large
  light source; it must stay behind that check.
- **Wall marks ride their own geometry, not the lining texture.** The texture tiles every 6 m,
  so a distinctive mark baked into it repeats every 6 m and reads as wallpaper. They repeat at
  `WRAP` instead, which is past the fog. Three copies cover the view; a fourth is never drawn.
- **Mark planes face `-sd * PI/2`.** Same lesson as `DoubleSide` on the bore: get this sign
  wrong and the normals face out of the tunnel, so every mark is lit from behind and renders
  black. It is the easiest mistake to make twice.
- **Marks sit at y 1.3-2.5, not at true working height.** The point lights are at the
  springing and the bottom of the wall is the darkest band in the bore. Placed realistically
  low, they simply disappear.
- **Cable sag span (6) must divide `WRAP`,** and the curve needs roughly eight samples per
  span or the catenary renders as a visible zigzag. That is why it samples at 480 while the
  rigid runs sample at 150.
- Marks are deliberately abstract: survey crosses, tallies, paint daubs, a struck-off band.
  No names, dates or initials. This is a documentary book about real people on a real scheme,
  and invented crew marks would be invented history. Real ones from Gillian's research drop
  straight into `markArt`.

## Constraints

- three.js r128 loads from cdnjs. If the host's CSP blocks it, vendor the file locally.
  To test offline, `npm pack three@0.128.0` and serve `package/build/three.min.js` in its
  place — the build is identical to the CDN copy, and it lets you screenshot the tunnel
  without network access.
- Everything else is inline. Images are base64 data URIs — replace with real files once there
  is a repo.

## Outstanding

1. **Photographs.** Current images are extracted from the sell-sheet PDF and are low
   resolution. Source properly from Gillian's research contacts; Genesis Energy and Webuild
   both hold archival imagery of the scheme. **Clearance required before publication.**
2. **Photo caption** is placeholder text.
3. **Pre-order mechanism.** Currently a plain link to spinningplatespress.co.nz. Decide whether
   it is a storefront, a mailing-list capture, or both.
4. **Open Graph / Twitter meta tags** with a share image — the link will be posted, and right
   now it previews as nothing.
5. **Analytics**, if the publisher wants conversion numbers.
6. **Copy review by the author.** The argument section is my compression of Diane Brand's
   endorsement into page prose; it should be Gillian's words.
7. **Tunnel dimensions** are assumed (6.4 m wide, 5.8 m to the crown). Worth checking against
   the real scheme.
8. **Real-device testing**, particularly older Android.
9. `prefers-reduced-motion` is handled for the epigraph and idle drift; confirm it is enough.

## Deadline

On sale October 2026. This should ship before the book does.
