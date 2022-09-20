// ERC20 contract wrapper

"use strict";

import { AddressLike, deploySmartContract, MethodTransactionOptions, outputToQuantity, outputToString, parseQuantity, Quantity, QuantityLike, RPCOptions, SmartContractEvent, SmartContractInterface, TransactionResult, TransactionSendingOptions } from "../../src/index";
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
