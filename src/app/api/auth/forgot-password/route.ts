import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Call your Convex backend to create a password reset token
    // 2. Send an email with the reset link
    // For now, we'll return a success message

    // This would call your Convex function:
    // const result = await fetchAction(api.passwordReset.requestPasswordReset, { email });

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
