import { NextRequest, NextResponse } from "next/server";

// Mock user preferences storage
const userPreferences = new Map<string, any>();

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, preferences } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Update user preferences
    const existingPreferences =
      userPreferences.get(walletAddress.toLowerCase()) || {};
    const updatedPreferences = {
      ...existingPreferences,
      ...preferences,
      updatedAt: new Date().toISOString(),
    };

    userPreferences.set(walletAddress.toLowerCase(), updatedPreferences);

    return NextResponse.json(updatedPreferences);
  } catch (error) {
    console.error("Error updating user preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const preferences = userPreferences.get(address.toLowerCase());

    if (!preferences) {
      return NextResponse.json(
        { error: "User preferences not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
