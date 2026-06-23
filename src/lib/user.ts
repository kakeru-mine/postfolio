import { redirect } from "next/navigation";
import {
  AuthenticationError,
  getAuthenticatedUser,
} from "@/lib/auth";

export async function getCurrentUser() {
  const user = await getAuthenticatedUser();
  if (!user) throw new AuthenticationError();
  return user;
}

export async function requirePageUser() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  return user;
}

export function getOptionalCurrentUser() {
  return getAuthenticatedUser();
}
