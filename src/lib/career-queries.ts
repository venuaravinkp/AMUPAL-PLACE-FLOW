import { queryOptions } from "@tanstack/react-query";
import { readResume, readPlanner } from "./career.functions";
export const resumeQueryOptions = queryOptions({ queryKey: ["student-resume"], queryFn: () => readResume() });
export const plannerQueryOptions = queryOptions({ queryKey: ["student-planner"], queryFn: () => readPlanner() });