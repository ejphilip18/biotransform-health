import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // Call your Convex backend to verify the reset token
    // const result = await fetchAction(api.passwordReset.verifyResetToken, { token });

    // For now, return a mock response
    return NextResponse.json({
      valid: true,
      email: "user@example.com",
      message: "Token is valid",
    });
  } catch (error) {
    console.error("Verify token error:", error);
    return NextResponse.json(
      { error: "Failed to verify reset token" },
      { status: 500 }
    );
  }
}
