import { createAuthClient } from 'better-auth/react';

/**
 * Browser auth client. baseURL is inferred from the current origin at runtime,
 * so this works in both local and deployed environments. When auth is disabled
 * on the server the /signin and /signup pages never call these methods.
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
