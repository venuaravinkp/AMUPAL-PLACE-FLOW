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

- Real-world project briefs live in a shared typed catalog; private progress and portfolio submissions use authenticated server functions with owner-only RLS, so the same briefs and validation serve every student surface without exposing student work.
- Project pages load saved work through shared TanStack Query options in protected loaders; submission validation also runs server-side so completion cannot be bypassed by editing browser state.
