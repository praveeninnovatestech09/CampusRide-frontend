<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Frontend (TanStack Start, `src/`) talks only to the separate Express + MongoDB REST API in `server/` via `src/lib/api.ts` (base URL from `VITE_API_URL`); the user chose this over Lovable Cloud so it runs locally.
- Auth is a JWT stored in localStorage; `_authenticated` layout is client-only (`ssr: false`) and every protected endpoint re-checks the token and ownership server-side.
