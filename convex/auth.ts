import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile: (params) => {
        const email = params.email as string;
        const name = (params.name as string) || "";
        return { email, ...(name ? { name } : {}) };
      },
    }),
  ],
});
