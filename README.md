# streamora-admin
19 July 2026

# Streamora Admin Portal 🎛️

Web dashboard for managing the Streamora catalog, built with **React** and the
**Firebase JS SDK**, deployed to **Firebase Hosting**. This directory will hold
the React app; this README is the build spec and setup guide.

> The mobile app (repo root) is read-only against the catalog by design —
> everything content-related happens here.

## Responsibilities

| Area | What admins can do |
|------|--------------------|
| **Movies** | Create/edit/delete movies; upload posters + video files to Storage; set `videoUrls` per quality, `downloadUrl` (mp4), `isPremium` |
| **Categories** | Create/rename/delete categories |
| **Users** | View users, toggle `subscriptionStatus` (free/premium), grant/revoke admin role |
| **Analytics** | Playback and engagement stats from Firebase Analytics dashboards |

## Stack

- React + TypeScript
- Firebase JS SDK v10+ (modular): Auth, Firestore, Storage
- React Router for navigation, TanStack Query (or plain hooks) for data
- Firebase Hosting for deploys

## Architecture & security model

Admin access is enforced with **Firebase Auth custom claims**, not email
allowlists in client code:

1. An admin signs in with the same Firebase Auth (Google or email/password).
2. Their token carries `admin: true`, set server-side via a Cloud Function or
   one-off script using the Admin SDK:

   ```js
   // e.g. in functions/: node -e "..."
   const { getAuth } = require("firebase-admin/auth");
   await getAuth().setCustomUserClaims(uid, { admin: true });
   ```

3. Firestore/Storage rules check the claim. The root rules currently deny all
   client writes to `movies` and `categories`; when the portal is built, relax
   them to:

   ```
   function isAdmin() {
     return request.auth != null && request.auth.token.admin == true;
   }

   match /movies/{movieId}     { allow read: if signedIn(); allow write: if isAdmin(); }
   match /categories/{catId}   { allow read: if signedIn(); allow write: if isAdmin(); }
   match /users/{userId}       { allow list, get: if isAdmin() || isOwner(userId); }
   ```

   Mirror the same `isAdmin()` check in `storage.rules` for
   `/thumbnails`, `/trailers`, and `/videos` uploads.

4. The portal UI also gates routes on the claim
   (`getIdTokenResult().claims.admin`), but rules are the real boundary.

## Data contracts (must match the mobile app)

Documents the portal writes must follow the shapes in the root README's
[data model](../README.md#firestore-data-model). Key invariants:

- `movies.createdAt` — set with `serverTimestamp()`; the app's Trending row
  and category rows order by it, and `sendNewMovieNotification` fires on create.
- `movies.videoUrls` — map of quality → URL. Either full external URLs (CDN)
  or Storage object paths (e.g. `videos/{movieId}/720p.m3u8`) — the
  `secureVideoAccess` function handles both.
- `movies.downloadUrl` — a single mp4 URL; without it, offline download is
  unavailable for that title (HLS can't be downloaded as one file).
- `movies.duration` — minutes, as a number.
- Deleting a movie should also delete its Storage files and consider stale
  references in users' `favorites`/`downloads` (a cleanup Cloud Function is
  the right home for this).

## Storage upload layout

```
/thumbnails/{movieId}.jpg
/trailers/{movieId}.mp4
/videos/{movieId}/{quality}.m3u8   (+ segment files)
```

Storage isn't initialized on `streamora-e457f` yet (Blaze required) — until it
is, enter external video/poster URLs directly on the movie form instead of
uploading.

## Getting started (once building)

```bash
cd admin
npm create vite@latest . -- --template react-ts
npm install firebase react-router-dom
npm run dev
```

Reuse the web app config already registered on the Firebase project — the
values live in [`lib/firebase_options.dart`](../lib/firebase_options.dart)
under `static const FirebaseOptions web` (apiKey, appId, authDomain, etc.).
They are not secrets; security comes from Auth + rules.

## Deploy

Firebase Hosting currently points at the Flutter web build (`build/web` in
[firebase.json](../firebase.json)). When the portal is ready, either:

- **Point hosting at the portal** — change `hosting.public` to `admin/dist`, or
- **Multi-site hosting** (recommended) — keep the main site for a future
  landing page and add an `admin` site:

  ```bash
  firebase hosting:sites:create streamora-admin
  # firebase.json: "hosting": [{ "site": "streamora-e457f", "public": "build/web", ... },
  #                             { "site": "streamora-admin", "public": "admin/dist", ... }]
  firebase deploy --only hosting:streamora-admin
  ```

## Roadmap

- [ ] Scaffold Vite + React app, Firebase init, auth-gated routing
- [ ] Admin claim script + rules update (Firestore & Storage)
- [ ] Movies CRUD with poster/video upload + progress
- [ ] Categories CRUD
- [ ] Users table with premium toggle (writes via callable function, since
      rules block client-side `subscriptionStatus` changes)
- [ ] Dashboard: counts, recent signups, most-favorited titles
- [ ] Multi-site hosting deploy + CI
