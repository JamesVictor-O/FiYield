import { NextRequest, NextResponse } from 'next/server';

// Mock storage for delegation data (in production, use a database)
const delegations = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { smartAccount, delegation, type } = body;

    if (!smartAccount || !delegation || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store delegation data
    const delegationId = `${smartAccount}-${type}`;
    delegations.set(delegationId, {
      smartAccount,
      delegation,
      type,
      createdAt: new Date().toISOString(),
      active: true,
    });

    console.log('Delegation stored:', {
      delegationId,
      type,
      smartAccount,
    });

    return NextResponse.json({
      success: true,
      delegationId,
      message: 'Delegation created successfully',
    });
  } catch (error) {
    console.error('Error storing delegation:', error);
    return NextResponse.json(
      { error: 'Failed to store delegation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const smartAccount = searchParams.get('smartAccount');
    const type = searchParams.get('type');

    if (smartAccount) {
      // Get delegations for specific smart account
      const userDelegations = Array.from(delegations.values()).filter(
        (delegation) => delegation.smartAccount === smartAccount
      );

      if (type) {
        // Filter by type
        const filteredDelegations = userDelegations.filter(
          (delegation) => delegation.type === type
        );
        return NextResponse.json({ delegations: filteredDelegations });
      }

      return NextResponse.json({ delegations: userDelegations });
    }

    // Get all delegations (for admin purposes)
    const allDelegations = Array.from(delegations.values());
    return NextResponse.json({ delegations: allDelegations });
  } catch (error) {
    console.error('Error retrieving delegations:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve delegations' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const delegationId = searchParams.get('delegationId');

    if (!delegationId) {
      return NextResponse.json(
        { error: 'Delegation ID is required' },
        { status: 400 }
      );
    }

    const delegation = delegations.get(delegationId);
    if (!delegation) {
      return NextResponse.json(
        { error: 'Delegation not found' },
        { status: 404 }
      );
    }

    // Mark as inactive instead of deleting
    delegation.active = false;
    delegation.revokedAt = new Date().toISOString();
    delegations.set(delegationId, delegation);

    return NextResponse.json({
      success: true,
      message: 'Delegation revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking delegation:', error);
    return NextResponse.json(
      { error: 'Failed to revoke delegation' },
      { status: 500 }
    );
  }
}
