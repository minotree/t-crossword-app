export async function mobileIdentity(token: string, verify: (token: string) => Promise<{ id: string; anonymous: boolean } | null>): Promise<string> {
  const user = await verify(token);
  if (!user?.anonymous || !/^[a-f0-9-]{36}$/i.test(user.id)) throw new Error('Anonymous authentication required');
  return `mobile-anonymous:${user.id}`;
}
