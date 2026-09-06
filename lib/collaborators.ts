import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import type { Collaborator } from "@/types/collaborator";

export async function enrichCollaborators(rows: { email: string }[]): Promise<Collaborator[]> {
  const profiles = new Map<string, Collaborator>();
  if (rows.length) {
    try {
      const client = await clerkClient();
      for (let start = 0; start < rows.length; start += 100) {
        const emails = rows.slice(start, start + 100).map(({ email }) => email);
        let offset = 0;
        let totalCount = 0;
        do {
          const result = await client.users.getUserList({ emailAddress: emails, limit: 100, offset });
          totalCount = result.totalCount;
          for (const user of result.data) {
            for (const address of user.emailAddresses) {
              const email = address.emailAddress.toLowerCase();
              profiles.set(email, {
                email,
                displayName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || null,
                imageUrl: user.hasImage ? user.imageUrl : null,
              });
            }
          }
          offset += 100;
        } while (offset < totalCount);
      }
    } catch {
      // Access management remains available if Clerk profile lookup is unavailable.
    }
  }
  return rows.map(({ email }) => ({ ...profiles.get(email.toLowerCase()), email, displayName: profiles.get(email.toLowerCase())?.displayName ?? null, imageUrl: profiles.get(email.toLowerCase())?.imageUrl ?? null }));
}

export async function readCollaboratorEmail(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return null; }
  if (!body || typeof body !== "object" || !("email" in body) || typeof body.email !== "string") return null;
  const email = body.email.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
