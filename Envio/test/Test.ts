import assert from "assert";
import { 
  TestHelpers,
  FiYieldVault_Deposit
} from "generated";
const { MockDb, FiYieldVault } = TestHelpers;

describe("FiYieldVault contract Deposit event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for FiYieldVault contract Deposit event
  const event = FiYieldVault.Deposit.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("FiYieldVault_Deposit is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await FiYieldVault.Deposit.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualFiYieldVaultDeposit = mockDbUpdated.entities.FiYieldVault_Deposit.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedFiYieldVaultDeposit: FiYieldVault_Deposit = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      user: event.params.user,
      amount: event.params.amount,
      riskLevel: event.params.riskLevel,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualFiYieldVaultDeposit, expectedFiYieldVaultDeposit, "Actual FiYieldVaultDeposit should be the same as the expectedFiYieldVaultDeposit");
  });
});
