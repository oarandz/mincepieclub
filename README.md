# Mince Pie Club

A simple, mobile-friendly website backed by Supabase. No build tools or package installation needed.

The GitHub upload ZIP contains only the website and publishing instructions; the database is already set up separately.

## What is ready

- Open the site and click a name, or **New name**.
- See only the mince pies that person has not rated.
- Rate five categories using sliders from **0 to 5 in 0.5 steps**, with plain-English explanations and a live description for every half-point, from “Terrible — vomit-inducing” to “Best mince pie I’ve ever tasted”.
- Add an optional comment. Each person has one editable review per pie.
- Open **The table** for all pies, reviews, taster profiles, category rankings and value rankings.
- Operator controls add/edit pies, set box quantity and price, upload a photo, archive/restore pies, and remove reviews.
- Uploaded photos replace the cartoon on cards, detail pages and ranking thumbnails. With no photo, or if a photo cannot load, the cartoon appears. JPG, PNG and WebP are supported up to 5 MB. Only the operator may upload or replace photos.
- Replacing/removing a photo changes the displayed image; old files are retained in the private-to-write, public-to-read `pie-photos` bucket to avoid accidentally breaking existing links. The bucket can be tidied from Supabase later.
- Filter rankings by minimum review count and download them as CSV.

## Upload to GitHub

1. Create a GitHub repository with a `main` branch.
2. Put the **contents of this folder** at the repository root. `index.html` should be at the top level, not inside another folder.
3. Include the hidden `.github/workflows/pages.yml` file if using the automatic publishing workflow. GitHub's web upload may hide dotfolders; dragging the entire extracted folder contents from Finder after pressing **Command + Shift + .** reveals it. Alternatively, follow the branch-publishing option below, which does not need the hidden folder.
4. In the repository, open **Settings → Pages → Build and deployment**, choose **GitHub Actions**, and run the **Publish Mince Pie Club** workflow from the Actions tab if it has not run already.
5. GitHub Pages provides the website address. Keep that address for the Supabase step below.

**Simpler branch-publishing option:** upload `index.html`, `styles.css`, `app.js`, `data.js`, `domain.js`, `config.js`, `favicon.svg`, and `.nojekyll`. In **Settings → Pages**, choose **Deploy from a branch**, `main`, and `/ (root)`. The other files are setup/reference files and are not needed to run the website.

GitHub Pages supports this static frontend, while Supabase stores the shared data. Publishing instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Supabase: provisioned

The Supabase project, database tables, score validation, and permissions are already created:

- Project: **Mince Pie Club**
- Organisation: **owen's**
- Region: **London (`eu-west-2`)**
- Dashboard: https://supabase.com/dashboard/project/ilijcejzqkhdlnvnxqsg
- Operator email: **the address you supplied in this chat**
- `config.js` already contains the project URL and browser-safe publishable key.
- The live database starts empty. Fictional sample pies are available only in the separate demo.

**One final setting needs the published GitHub Pages URL:** open [Supabase Authentication → URL Configuration](https://supabase.com/dashboard/project/ilijcejzqkhdlnvnxqsg/auth/url-configuration). Set **Site URL** to the full GitHub Pages website address, including the repository path and trailing `/`. Add that same address to **Redirect URLs**. This makes operator email links return to your website. Share the published address in this chat if you would like help finishing this setting. It could not be configured before the repository address existed.

Example only: for a site at `https://YOUR-USERNAME.github.io/mince-pie-club/`, use that exact address in both settings. Avoid broad wildcard redirects.

Then open the website, create/select your taster name, click **The table → Operator**, and enter your operator email. Open the emailed link in the same browser. Only a verified user with the approved email receives operator permissions. You do not need a password. Supabase's default mail service may restrict recipients or rate-limit delivery; if you change the operator email or need reliable delivery to more addresses, configure custom SMTP in Supabase. See https://supabase.com/docs/guides/auth/auth-smtp

The database migration files are retained separately in the local source folder and are not needed for GitHub. Do not re-run them on the provisioned project. The deployment workflow publishes only the seven website files.

## Scores and value

Each review's overall score is the equal-weight mean of the five category scores. A pie's category and overall scores are averaged across all its reviews.

- **Price per pie** = box price ÷ pies per box.
- **Value** = overall score ÷ price per pie, shown as score points per £.
- Higher values rank first. Computation uses the full price per pie, not its rounded display value.
- Pies with no reviews or marked archived do not appear in rankings.
- Tied exact scores share a rank; review count then pie name orders tied rows.
- Rankings show review counts and can require at least 1, 3, 5 or 10 reviews.
- Updating a box price changes its current value ranking for all existing reviews. Historical price tracking is not included.

## Trusted-group model

Tasters have deliberately shared identities: anyone with access can choose any name and submit or edit that name's review. This matches the requested no-login group experience; names do not prove who wrote a review. Review text and names are visible to everyone visiting the site. Use display names and keep the link within your group if preferred. A public GitHub Pages address is accessible to anyone who has it.

Supabase enforces the operator restrictions independently of the interface. The browser never contains a service-role key. Anonymous visitors cannot add/edit pies, delete reviews, change existing profile names, or read the private operator allowlist. The `is_operator()` helper returns only whether the currently signed-in user is the approved, email-verified operator. Its privileged lookup is in a private schema, outside the public API. Direct access to the operator email allowlist is denied.

No analytics, photo uploads, external trackers, or paid services have been added. Google Fonts loads the fonts; local fallback fonts work if it is unavailable.

## Preview or try the demo

Serve this folder with any static web server; do not double-click `index.html` because browsers restrict JavaScript modules on file URLs. For example, if Python is available:

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173/` for the connected, empty site. Add `?demo=1` for an isolated demo, e.g. `http://localhost:4173/?demo=1`. On the published site the same query works. Demo profiles/reviews/pies stay in that browser's local storage and never touch Supabase. Demo operator controls are deliberately available without an email because they only edit local sample data.

## Verification completed

Scoring checks cover equal weighting, price-per-pie value, zero scores, half steps, missing/invalid scores, ties, minimum-review filtering and archived/unrated exclusions. Database verification ran in a rolled-back transaction: valid review submission and upsert succeeded; invalid scores, anonymous catalogue writes, anonymous review deletion and non-operator catalogue writes were rejected; verified operator updates succeeded. No verification records remain in the shared database.

The local interface was checked for name selection, new names, draggable sliders, live average, saving and reopening reviews, disappearance from the unrated list, rankings, and operator controls. Selecting, previewing, saving and displaying an uploaded image was verified in the local demo. Photo storage policies were checked in a rolled-back database transaction. The connected site successfully read the live, empty Supabase tables. Real operator email delivery and the final GitHub-hosted site still need checking after the website URL is added in Supabase.
