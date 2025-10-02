import { NextRequest, NextResponse } from "next/server";

// Mock user profiles storage (in a real app, this would be a database)
const userProfiles = new Map<string, any>();

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

    // Check if user profile exists
    const profile = userProfiles.get(address.toLowerCase());

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, riskProfile, preferences } = body;

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Store user profile
    const profile = {
      address: address.toLowerCase(),
      riskProfile: riskProfile || "moderate",
      preferences: preferences || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    userProfiles.set(address.toLowerCase(), profile);

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error creating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
