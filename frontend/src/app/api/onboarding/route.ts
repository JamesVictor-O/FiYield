import { NextRequest, NextResponse } from "next/server";

// Mock onboarding data storage
const onboardingData = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, ...answers } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Calculate risk profile based on answers (simplified logic)
    let riskProfile = "moderate"; // default

    // Simple risk calculation based on common onboarding questions
    if (
      answers.riskTolerance === "conservative" ||
      answers.investmentExperience === "beginner"
    ) {
      riskProfile = "conservative";
    } else if (
      answers.riskTolerance === "aggressive" ||
      answers.investmentExperience === "expert"
    ) {
      riskProfile = "aggressive";
    }

    // Store onboarding data
    const onboardingResult = {
      walletAddress: walletAddress.toLowerCase(),
      riskProfile,
      answers,
      completedAt: new Date().toISOString(),
    };

    onboardingData.set(walletAddress.toLowerCase(), onboardingResult);

    // Also create/update user profile
    const profile = {
      address: walletAddress.toLowerCase(),
      riskProfile,
      preferences: answers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // You could also store this in the user profiles map
    // userProfiles.set(walletAddress.toLowerCase(), profile);

    return NextResponse.json({
      success: true,
      riskProfile,
      profile,
    });
  } catch (error) {
    console.error("Error processing onboarding:", error);
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

    const data = onboardingData.get(address.toLowerCase());

    if (!data) {
      return NextResponse.json(
        { error: "Onboarding data not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching onboarding data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
