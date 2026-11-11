# Rome Cross-VM Dashboard — User Guide

## Overview

Rome Cross-VM Dashboard is a decentralized application demonstrating shared state between EVM and Solana through the Rome Protocol.

Users can connect both wallet types, read the shared contract message, and submit updates from either environment.

**Live application:** https://rome-crossvm-dashboard.vercel.app/

## 1. Connect an EVM Wallet

1. Open the dashboard.
2. Select the EVM wallet connection option.
3. Connect Rabby Wallet.
4. Add or switch to the Rome Hadrian network if prompted.
5. Confirm that your wallet is connected and the network is displayed correctly.

## 2. Connect a Solana Wallet

1. Open the Solana wallet section.
2. Select Phantom.
3. Approve the connection request.
4. Make sure Phantom is connected to Solana Devnet.

## 3. Read the Shared State

Navigate to the shared contract section.

The dashboard reads the current message stored in the Rome smart contract. The same shared state can be accessed through both wallet environments.

## 4. Update the Message with EVM

1. Connect Rabby Wallet.
2. Enter a new message in the EVM write section.
3. Submit the transaction.
4. Review the transaction details in your wallet.
5. Approve the transaction.
6. Wait for confirmation and check the updated shared message.

## 5. Update the Message with Solana

1. Connect Phantom.
2. Enter a new message in the Solana write section.
3. Sign the Rome authorization and Solana transaction.
4. Approve the request in Phantom.
5. Wait for confirmation.
6. Check the shared message to verify the update.

## 6. Verify Transactions

Use the Activity Log to follow wallet connections and transaction activity.

EVM transactions can be checked using the Rome Hadrian Explorer:

https://via-hadrian.testnet.romeprotocol.xyz/

Solana Devnet transactions can be checked using Solana Explorer:

https://explorer.solana.com/?cluster=devnet

## Smart Contract

**Network:** Rome Hadrian Testnet

**Contract address:**
`0xdAe249302D9b3C59071666feAAcbFfd48243c49a`

The contract exposes a message read function and a message update function.

## Notes

This guide describes the currently deployed Hadrian testnet version of Rome Cross-VM Dashboard. Wallet transactions require user approval and the appropriate network assets for transaction fees.
