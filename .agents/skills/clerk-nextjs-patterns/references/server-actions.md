# Server Actions

Server Actions are public endpoints. Always verify auth.

## Basic Protection

```typescript
'use server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated) throw new Error('Unauthorized');

  const title = formData.get('title');
  if (typeof title !== 'string' || title.trim().length === 0 || title.length > 200) {
    throw new Error('Invalid title');
  }
  await db.posts.create({ data: { title, authorId: userId } });
  revalidatePath('/posts');
}
```

## Org + Role Check (B2B)

```typescript
'use server';
import { auth } from '@clerk/nextjs/server';

export async function createTeamProject(formData: FormData) {
  const { userId, orgId, orgRole } = await auth();
  if (!userId || !orgId) throw new Error('Must be in an organization');
  if (orgRole !== 'org:admin') throw new Error('Only admins can create projects');

  const name = formData.get('name');
  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
    throw new Error('Invalid project name');
  }
  await db.projects.create({ data: { name, organizationId: orgId } });
}
```

## Permission Check (RBAC)

```typescript
'use server';
import { auth } from '@clerk/nextjs/server';

export async function deleteProject(projectId: string) {
  const { userId, has } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const canDelete = await has({ permission: 'org:project:delete' });
  if (!canDelete) throw new Error('Missing permission');

  await db.projects.delete({ where: { id: projectId } });
}
```

> **Core 2 ONLY (skip if current SDK):** `isAuthenticated` is not available. Use `if (!userId)` instead.

[Docs](https://clerk.com/docs/reference/nextjs/server-actions)
