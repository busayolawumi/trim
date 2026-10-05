import { z } from "zod";

// Shared by signup and settings so both accept the same values.
export const nameSchema = z.string().trim().min(1, "Enter your name.").max(80);
export const emailSchema = z.email("Enter a valid email.").trim().toLowerCase();
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters.").max(200);
