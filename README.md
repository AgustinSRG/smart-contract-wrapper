# Smart Contract Wrapper

[![npm version](https://badge.fury.io/js/%40asanrom%2Fsmart-contract-wrapper.svg)](https://badge.fury.io/js/%40asanrom%2Fsmart-contract-wrapper)

Typescript wrapper for smart contract interaction.

This is a library to interact with Ethereum EVM using the json-RPC API. It allows both calling pure and view methods and also sending transactions.

## Installation

If you are using a npm managed project use:

```
npm install @asanrom/smart-contract-wrapper
```

## Usage

This library exports various utilities, along with the class `SmartContractInterface`, that allows the interaction with smart contracts using the ABI definition.

Using this class you can create a class for a smart contract, implementing the methods you want to use, here is an example:

```ts
// ERC20 contract wrapper

"use strict";

import { AddressLike, deploySmartContract, MethodTransactionOptions, outputToQuantity, outputToString, parseQuantity, Quantity, QuantityLike, RPCOptions, SmartContractEvent, SmartContractInterface, TransactionResult, TransactionSendingOptions } from "@asanrom/smart-contract-wrapper";

import { ERC20_ABI, ERC20_BYTECODE } from "./erc20-data";

export class ERC20Contract {

    private _contractInterface: SmartContractInterface;

    public static async deploy(name: string, symbol: string, initialSupply: QuantityLike, options: TransactionSendingOptions): Promise<ERC20Contract> {
        const deployed = await deploySmartContract(ERC20_BYTECODE, ERC20_ABI, [name, symbol, parseQuantity(initialSupply)], 0, options);
        if (deployed.receipt.status > BigInt(0)) {
            return new ERC20Contract(deployed.result, options);
        } else {
            throw new Error("Transaction reverted");
        }
    }

    constructor(address: AddressLike, rpcOptions: RPCOptions) {
        this._contractInterface = new SmartContractInterface(address, ERC20_ABI, rpcOptions);
    }

    public async balanceOf(address: AddressLike): Promise<Quantity> {
        const result = await this._contractInterface.callViewMethod("balanceOf", [address], {});
        return outputToQuantity(result[0]);
    }

    public async symbol(): Promise<string> {
        const result = await this._contractInterface.callViewMethod("symbol", [], {});
        return outputToString(result[0]);
    }

    public async name(): Promise<string> {
        const result = await this._contractInterface.callViewMethod("name", [], {});
        return outputToString(result[0]);
    }

    public async decimals(): Promise<Quantity> {
        const result = await this._contractInterface.callViewMethod("decimals", [], {});
        return outputToQuantity(result[0]);
    }

    public async totalSupply(): Promise<Quantity> {
        const result = await this._contractInterface.callViewMethod("totalSupply", [], {});
        return outputToQuantity(result[0]);
    }

    public async transfer(address: AddressLike, amount: QuantityLike, options: MethodTransactionOptions): Promise<TransactionResult<SmartContractEvent>> {
        const result = await this._contractInterface.callMutableMethod("transfer", [address, amount], options);

        if (result.receipt.status > BigInt(0)) {
            const transferEvent = this._contractInterface.findEvent(result.receipt, "Transfer");
            return {
                receipt: result.receipt,
                result: transferEvent,
            };
        } else {
            throw new Error("Transaction reverted");
        }
    }
}
```

## Documentation

 - [Library documentation (Auto-generated)](https://agustinsrg.github.io/smart-contract-wrapper/docs)

## Contract interface generator

For automatic generation of a smart contract class, use the following utility:

 - [Smart contract wrapper generator](https://agustinsrg.github.io/smart-contract-wrapper/codegen)
