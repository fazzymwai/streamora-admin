# Streamora Admin — dev & deploy

React + TypeScript admin portal for the Streamora catalog, built with Next.js
(App Router, static export). Lives in its own repo; the Flutter app, Firestore
rules, and Cloud Functions live in the sibling `../streamora` repo, which this
repo's scripts assume is checked out next to it.

## Local dev

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # type-check + static export into out/
npm run lint
```

Firebase web config is hard-coded in `src/firebase.ts` (mirrored from
`../streamora/lib/firebase_options.dart`); it contains no secrets.

## Granting admin access

Routes and rules are gated on the `admin: true` custom claim. To grant it
(from `../streamora/functions`, with Admin SDK credentials via
`GOOGLE_APPLICATION_CREDENTIALS` or `gcloud auth application-default login`):

```bash
cd ../streamora/functions
npm run grant-admin -- <uid>
```

The user must sign out and back in afterwards — claims only refresh with the
token.

## Deploying rules

The updated `../streamora/firestore.rules` adds `isAdmin()`: admin writes on
`movies`/`categories`, admin `get`/`list` on `users`. Deploy from
`../streamora`:

```bash
firebase deploy --only firestore:rules
```

## Deploying the portal (multi-site hosting)

`../streamora/firebase.json` defines two hosting sites: `streamora-e457f`
(Flutter web, `build/web`) and `streamora-admin` (this portal, `admin/dist`).
One-time setup:

```bash
firebase hosting:sites:create streamora-admin   # run in ../streamora
```

Then each deploy, from this repo:

```bash
npm run build
npm run stage    # copies out/ -> ../streamora/admin/dist
cd ../streamora
firebase deploy --only hosting:streamora-admin
```

Deploying the other site (`firebase deploy --only hosting:streamora-e457f`)
is unaffected.

## Premium toggle (Users page)

Firestore rules forbid every client — admins included — from writing
`subscriptionStatus`; the toggle calls the `setSubscriptionStatus` callable in
`../streamora/functions/index.js` (admin-claim-checked). It ships disabled
with a tooltip because Cloud Functions aren't deployed yet. Once you run
`firebase deploy --only functions`, flip `SUBSCRIPTION_FUNCTION_DEPLOYED` to
`true` in `src/pages/Users.tsx`.

## Notes

- Media fields on the movie form are plain URL inputs rendered through
  `src/components/MediaUrlField.tsx`; swap that component's input for a
  Storage upload widget once the bucket is provisioned (Blaze) — callers
  won't change. `src/firebase.ts` already exports `storage`.
- The dashboard omits "most-favorited titles": favorites live in per-user
  subcollections that rules keep private to each owner, and both favorites
  and downloads use an `items` subcollection, so no cheap query exists. A
  Cloud Function keeping a counter on each movie doc is the right home.
- Movie deletes only remove the Firestore doc; Storage files and stale
  `favorites`/`downloads` references need the cleanup Cloud Function from the
  spec's roadmap.
