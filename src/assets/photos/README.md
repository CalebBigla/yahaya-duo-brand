# Photography for the public site

The site currently uses temporary placeholder photos (see `src/lib/images.ts`). Most are
735–736 px wide downloads, and several are named after other businesses, so their usage
rights are unknown. Replace them with **licensed or commissioned** photos.

Do not download images from the web for these slots.

## How to add photos

1. Put the original files in this folder (`src/assets/photos/`). Use the slot name below
   as the file name, e.g. `home-hero.jpg`.
2. Run `npm run images`. It writes AVIF, WebP and JPEG versions at 640/960/1440/2048 px
   into `generated/` and a `generated/index.ts` manifest. It never enlarges a photo.
3. In `src/lib/images.ts`, point the slot at the generated entry, for example:
   `homeHero: { ...photos["home-hero"], alt: "…" }`, and write a real alt text.
4. Commit the originals, `generated/` and the change to `images.ts`.

## Slots

Minimum 2400 px on the long edge for every slot. One consistent warm colour grade across
the set. Real people and places the company serves; client journeys only with written
consent.

| Slot (file name) | Used on | Aspect | Subject |
|---|---|---|---|
| `home-hero` | Homepage hero, desktop | 16:9 or wider | One calm, high-quality travel scene; space on the left for the headline |
| `home-hero-mobile` | Homepage hero, phones | 4:5 portrait | Art-directed crop of the same scene |
| `desk-travel` | "Private Travel" card | 4:5 portrait | A private-travel moment (lounge, arrival, family) |
| `desk-trade` | "Trade & Energy" card | 4:5 portrait | Port, cargo or energy operations, sober tone |
| `journey-umrah` | Signature journeys | 4:5 portrait | Makkah or Madinah, respectful framing |
| `journey-dubai` | Signature journeys | 4:5 portrait | Dubai stay |
| `journey-istanbul` | Signature journeys | 4:5 portrait | Istanbul |
| `journey-egypt` | Signature journeys (optional 4th) | 4:5 portrait | Egypt |
| `travel-hero` | Private Travel page hero | 16:9 | Travel scene |
| `trade-hero` | Trade & Energy page hero | 16:9 | Cargo, logistics or energy |
| `about-office` | About page | 3:2 | The Yola office, exterior or interior |
| `about-team` | About page | 3:2 | The team at work (with consent) |
| `founder` | Homepage founder's note, About | 3:4 portrait | Founder portrait. **Current photo is real and can stay** until a new one is taken |

## Placeholder files to replace first

Listed in `imagesToReplace` in `src/lib/images.ts`: every file named after another business
or place (India, Karachi, Jaipur, Akasha, Los Cabos, Vietnam…), the `download (2x)` files,
and the 736 px destination photos.
