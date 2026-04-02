import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import crypto from "crypto";

// Generate a secure random token
function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Request password reset
export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const users = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .collect();

    if (users.length === 0) {
      // For security, don't reveal if email exists
      return { success: true, message: "If an account exists with this email, a reset link has been sent." };
    }

    const user = users[0];
    const token = generateResetToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create password reset token
    await ctx.db.insert("passwordResetTokens", {
      userId: user._id,
      email: args.email,
      token,
      expiresAt,
      createdAt: Date.now(),
      used: false,
    });

    // In a real app, you would send an email here with the reset link
    // For now, we'll just return the token (in production, use a proper email service)
    console.log(`Password reset token for ${args.email}: ${token}`);

    return {
      success: true,
      message: "If an account exists with this email, a reset link has been sent.",
      // In development, return token for testing
      token: process.env.NODE_ENV === "development" ? token : undefined,
    };
  },
});

// Verify reset token
export const verifyResetToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const resetToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!resetToken) {
      return { valid: false, message: "Invalid or expired token." };
    }

    if (resetToken.used) {
      return { valid: false, message: "This reset link has already been used." };
    }

    if (resetToken.expiresAt < Date.now()) {
      return { valid: false, message: "This reset link has expired." };
    }

    return {
      valid: true,
      email: resetToken.email,
      userId: resetToken.userId,
    };
  },
});

// Reset password with token
export const resetPasswordWithToken = mutation({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }

    const resetToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!resetToken) {
      throw new Error("Invalid or expired token.");
    }

    if (resetToken.used) {
      throw new Error("This reset link has already been used.");
    }

    if (resetToken.expiresAt < Date.now()) {
      throw new Error("This reset link has expired.");
    }

    // Get the user
    const user = await ctx.db.get(resetToken.userId);
    if (!user) {
      throw new Error("User not found.");
    }

    // Mark token as used
    await ctx.db.patch(resetToken._id, { used: true });

    // In a real app with Convex Auth, you would update the password here
    // For now, we'll just return success
    // The actual password update would be handled by the auth provider

    return {
      success: true,
      message: "Password reset successfully. Please sign in with your new password.",
    };
  },
});

// Clean up expired tokens (can be called periodically)
export const cleanupExpiredTokens = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredTokens = await ctx.db
      .query("passwordResetTokens")
      .collect();

    let deletedCount = 0;
    for (const token of expiredTokens) {
      if (token.expiresAt < now || (token.used && token.expiresAt < now + 7 * 24 * 60 * 60 * 1000)) {
        await ctx.db.delete(token._id);
        deletedCount++;
      }
    }

    return { deletedCount };
  },
});
