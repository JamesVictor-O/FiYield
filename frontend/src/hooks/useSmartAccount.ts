import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';

interface SmartAccountConfig {
  bundlerUrl: string;
  entryPointAddress: string;
  factoryAddress: string;
  paymasterUrl?: string;
}

interface SmartAccountState {
  smartAccountAddress: string | null;
  isDeployed: boolean;
  balance: bigint;
  isLoading: boolean;
  error: string | null;
}

export const useSmartAccount = (config: SmartAccountConfig) => {
  const { address: eoaAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [state, setState] = useState<SmartAccountState>({
    smartAccountAddress: null,
    isDeployed: boolean,
    balance: 0n,
    isLoading: false,
    error: null,
  });

  // Generate smart account address
  const generateSmartAccountAddress = useCallback(async () => {
    if (!eoaAddress || !walletClient) return null;

    try {
      // This would typically use a library like @account-abstraction/sdk
      // For now, we'll create a deterministic address based on EOA
      const salt = 0;
      const initCode = `0x${config.factoryAddress.slice(2)}${eoaAddress.slice(2).padStart(64, '0')}`;
      
      // Calculate CREATE2 address
      const address = await publicClient?.getAddress({
        bytecode: initCode,
        opcode: 'CREATE2',
        salt: salt,
      });

      return address;
    } catch (error) {
      console.error('Error generating smart account address:', error);
      return null;
    }
  }, [eoaAddress, walletClient, config.factoryAddress, publicClient]);

  // Deploy smart account
  const deploySmartAccount = useCallback(async () => {
    if (!eoaAddress || !walletClient) return false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Deploy smart account using factory
      const deployTx = await walletClient.sendTransaction({
        to: config.factoryAddress,
        data: `0x${eoaAddress.slice(2).padStart(64, '0')}`, // Deploy data
        value: 0n,
      });

      await publicClient?.waitForTransactionReceipt({ hash: deployTx });
      
      setState(prev => ({ 
        ...prev, 
        isDeployed: true, 
        isLoading: false 
      }));
      
      return true;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Deployment failed',
        isLoading: false 
      }));
      return false;
    }
  }, [eoaAddress, walletClient, config.factoryAddress, publicClient]);

  // Send transaction through smart account
  const sendTransaction = useCallback(async (
    to: string,
    value: bigint,
    data: string = '0x'
  ) => {
    if (!state.smartAccountAddress || !walletClient) return null;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Create user operation
      const userOp = {
        sender: state.smartAccountAddress,
        nonce: await getNonce(),
        initCode: '0x',
        callData: encodeCallData(to, value, data),
        callGasLimit: 100000n,
        verificationGasLimit: 100000n,
        preVerificationGas: 21000n,
        maxFeePerGas: parseEther('0.00000002'), // 20 gwei
        maxPriorityFeePerGas: parseEther('0.000000001'), // 1 gwei
        paymasterAndData: '0x',
        signature: '0x',
      };

      // Sign and send user operation
      const signature = await signUserOperation(userOp);
      userOp.signature = signature;

      // Send to bundler
      const response = await fetch(`${config.bundlerUrl}/eth_sendUserOperation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_sendUserOperation',
          params: [userOp, config.entryPointAddress],
        }),
      });

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return result.result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Transaction failed',
        isLoading: false 
      }));
      return null;
    }
  }, [state.smartAccountAddress, walletClient, config]);

  // Get smart account balance
  const getBalance = useCallback(async () => {
    if (!state.smartAccountAddress || !publicClient) return;

    try {
      const balance = await publicClient.getBalance({
        address: state.smartAccountAddress,
      });
      
      setState(prev => ({ ...prev, balance }));
    } catch (error) {
      console.error('Error getting balance:', error);
    }
  }, [state.smartAccountAddress, publicClient]);

  // Check if smart account is deployed
  const checkDeployment = useCallback(async () => {
    if (!state.smartAccountAddress || !publicClient) return;

    try {
      const code = await publicClient.getCode({
        address: state.smartAccountAddress,
      });
      
      setState(prev => ({ ...prev, isDeployed: code !== '0x' }));
    } catch (error) {
      console.error('Error checking deployment:', error);
    }
  }, [state.smartAccountAddress, publicClient]);

  // Helper functions
  const getNonce = async (): Promise<bigint> => {
    if (!state.smartAccountAddress || !publicClient) return 0n;
    
    try {
      const nonce = await publicClient.readContract({
        address: config.entryPointAddress,
        abi: [{
          name: 'getNonce',
          type: 'function',
          inputs: [{ name: 'sender', type: 'address' }],
          outputs: [{ name: 'nonce', type: 'uint256' }],
          stateMutability: 'view',
        }],
        functionName: 'getNonce',
        args: [state.smartAccountAddress],
      });
      
      return nonce as bigint;
    } catch (error) {
      return 0n;
    }
  };

  const encodeCallData = (to: string, value: bigint, data: string): string => {
    // Encode execute call data for smart account
    return `0xb61d27f6${to.slice(2).padStart(64, '0')}${value.toString(16).padStart(64, '0')}${data.slice(2).padStart(64, '0')}`;
  };

  const signUserOperation = async (userOp: any): Promise<string> => {
    if (!walletClient) throw new Error('Wallet not connected');
    
    // Hash user operation
    const userOpHash = await publicClient?.readContract({
      address: config.entryPointAddress,
      abi: [{
        name: 'getUserOpHash',
        type: 'function',
        inputs: [{ name: 'userOp', type: 'tuple' }],
        outputs: [{ name: 'hash', type: 'bytes32' }],
        stateMutability: 'view',
      }],
      functionName: 'getUserOpHash',
      args: [userOp],
    });

    // Sign with EOA
    const signature = await walletClient.signMessage({
      message: { raw: userOpHash as `0x${string}` },
    });

    return signature;
  };

  // Initialize smart account
  useEffect(() => {
    if (eoaAddress) {
      generateSmartAccountAddress().then(address => {
        setState(prev => ({ ...prev, smartAccountAddress: address }));
      });
    }
  }, [eoaAddress, generateSmartAccountAddress]);

  // Check deployment and balance when smart account address changes
  useEffect(() => {
    if (state.smartAccountAddress) {
      checkDeployment();
      getBalance();
    }
  }, [state.smartAccountAddress, checkDeployment, getBalance]);

  return {
    ...state,
    deploySmartAccount,
    sendTransaction,
    getBalance,
    checkDeployment,
  };
};
