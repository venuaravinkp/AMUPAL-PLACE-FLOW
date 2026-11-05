import { queryOptions } from "@tanstack/react-query";
import { readAssignments, readCertificates, readTraining, verifyCertificate } from "./training.functions";
export const certificatesOptions = () => queryOptions({ queryKey: ["certificates"], queryFn: () => readCertificates() });
export const assignmentsOptions = () => queryOptions({ queryKey: ["assignments"], queryFn: () => readAssignments() });
export const trainingOptions = () => queryOptions({ queryKey: ["training"], queryFn: () => readTraining() });
export const verificationOptions = (id: string) => queryOptions({ queryKey: ["verify-certificate", id], queryFn: () => verifyCertificate({ data: { id } }) });