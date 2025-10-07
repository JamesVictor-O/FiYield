#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Read deployed addresses
const deployedAddressesPath = path.join(
  __dirname,
  "../deployed-addresses.json"
);
const frontendAddressesPath = path.join(
  __dirname,
  "../../frontend/src/components/contract/addresses/index.ts"
);

if (!fs.existsSync(deployedAddressesPath)) {
  console.error(
    "❌ deployed-addresses.json not found. Please deploy contracts first."
  );
  process.exit(1);
}

const deployedAddresses = JSON.parse(
  fs.readFileSync(deployedAddressesPath, "utf8")
);

// Read current frontend addresses file
let frontendContent = fs.readFileSync(frontendAddressesPath, "utf8");

// Update addresses
Object.entries(deployedAddresses).forEach(([key, address]) => {
  const regex = new RegExp(`(${key}:\\s*")([^"]+)(")`, "g");
  frontendContent = frontendContent.replace(regex, `$1${address}$3`);
});

// Also update legacy names
if (deployedAddresses.FI_YIELD_VAULT) {
  frontendContent = frontendContent.replace(
    /(YIELDMAKER_VAULT:\s*")([^"]+)(")/,
    `$1${deployedAddresses.FI_YIELD_VAULT}$3`
  );
}

if (deployedAddresses.AAVE_STRATEGY) {
  frontendContent = frontendContent.replace(
    /(SIMPLE_HOLD_STRATEGY:\s*")([^"]+)(")/,
    `$1${deployedAddresses.AAVE_STRATEGY}$3`
  );
}

// Write updated content
fs.writeFileSync(frontendAddressesPath, frontendContent);

console.log("✅ Frontend addresses updated successfully!");
console.log("Updated addresses:");
Object.entries(deployedAddresses).forEach(([key, address]) => {
  console.log(`  ${key}: ${address}`);
});
