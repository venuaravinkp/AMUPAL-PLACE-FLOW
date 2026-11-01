import { queryOptions } from "@tanstack/react-query";
import { readProjects } from "./projects.functions";

export const projectQueryOptions = queryOptions({
  queryKey: ["student-projects"],
  queryFn: () => readProjects(),
});

export function projectHead(title: string, description: string) {
  return { meta: [
    { title: `${title} — AMUPAL PLACE FLOW` }, { name: "description", content: description },
    { property: "og:title", content: `${title} — AMUPAL PLACE FLOW` }, { property: "og:description", content: description },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] };
}