import React from "react";
import { Button } from "../../ui/button";

interface TokenSelectorProps {
  selectedToken: string;
  onTokenSelect: (token: string) => void;
}

const TOKENS = [
  {
    address: "0x5D876D73f4441D5f2438B1A3e2A51771B337F27A",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    vaultAddress: "0x50888e2e57d8E17A5D0D3F72eFc71a239F6EEff6",
  },
  {
    address: "0x6BB379A2056d1304E73012b99338F8F581eE2E18",
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
    vaultAddress: "0x265F78F4F74193D58387D3EE84AB7c95A90e3D49",
  },
  {
    address: "0xB5481b57fF4e23eA7D2fda70f3137b16D0D99118",
    symbol: "CURR",
    name: "Currances",
    decimals: 18,
    vaultAddress: "0x0000000000000000000000000000000000000000", // Pending deployment
  },
  {
    address: "0xd455943dbc86A559A822AF08f5FDdD6B122E0748",
    symbol: "MockUSDC",
    name: "Mock USDC",
    decimals: 6,
    vaultAddress: "0x63F57C1588FdaE25c2300b2a36c90fd346C79966",
  },
];

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onTokenSelect,
}) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Select Token to Deposit</h3>
      <div className="grid grid-cols-2 gap-2">
        {TOKENS.map((token) => (
          <Button
            key={token.address}
            variant={selectedToken === token.address ? "default" : "outline"}
            onClick={() => onTokenSelect(token.address)}
            className="flex flex-col items-center p-3 h-auto"
          >
            <div className="text-sm font-medium">{token.symbol}</div>
            <div className="text-xs text-gray-500">{token.name}</div>
          </Button>
        ))}
      </div>
    </div>
  );
};
