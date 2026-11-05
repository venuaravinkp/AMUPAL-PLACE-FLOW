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
- Resume and planner data use authenticated server functions, shared query options and owner-only RLS; shared client-safe validation and deterministic scoring keep private career records isolated and estimates reproducible.
- Career resources are a department-tagged educational catalog; grade calculators accept explicit institutional conversion inputs because university grading rules vary.
- Resume export uses a token-themed print-only document and browser PDF printing so personal data never goes to a third-party renderer.
- Certificates require server-scored lesson results and database-graded final assessments; public verification exposes only the certificate snapshot, never student contact details.
- Training uses explicit owner-granted report and assignment permissions enforced by RLS and authenticated functions; trainers cannot administer questions, courses or roles.
