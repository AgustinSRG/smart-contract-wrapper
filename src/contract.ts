// Smart contract

"use strict"

import { RPCOptions, TransactionReceipt, Web3RPCClient } from "./rpc-client";
import { DataLike, parseHexBytes, QuantityLike } from "./utils";
import { Interface, Fragment, JsonFragment, Result } from "@ethersproject/abi";
import { sendTransaction, TransactionSendingOptions } from "./tx";

export type ABILike = string | ReadonlyArray<Fragment | JsonFragment | string>;

/**
 * Deploys smart contract
 * @param byteCode The byte code of the smart contract
 * @param abi The ABI definition of the smart contract
 * @param constructorParams The constructor params
 * @param value The value to send to the constructor (wei)
 * @param options The transaction options (including RPC options)
 * @returns A result with the transaction receipt and the contract address
*/
export async function deploySmartContract(byteCode: DataLike, abi: ABILike, constructorParams: any[], value: QuantityLike, options: TransactionSendingOptions): Promise<TransactionResult<Buffer>> {
    const contractInterface = new Interface(abi);

    const byteCodeBuf = parseHexBytes(byteCode);
    const deployEncoded = parseHexBytes(contractInterface.encodeDeploy(constructorParams));

    const txData = Buffer.concat([byteCodeBuf, deployEncoded]);

    const receipt = await sendTransaction(null, txData, value, options);

    return {
        receipt: receipt,
        result: receipt.contractAddress,
    };
}

/**
 * Provides an interface for smart contract interaction
 */
export class SmartContractInterface {
    /**
     * Address of the smart contract
     */
    public address: Buffer;

    /**
     * RPC options
     */
    public rpcOptions: RPCOptions;

    /**
     * Contract interface for ABI encoding
     */
    protected contractInterface: Interface;

    /**
     * @param address Address of the smart contract
     * @param abi Contract ABI
     * @param rpcOptions RPC options
     */
    constructor(address: DataLike, abi: ABILike, rpcOptions: RPCOptions) {
        this.address = parseHexBytes(address);
        this.rpcOptions = rpcOptions;
        this.contractInterface = new Interface(abi);
    }

    /**
     * Calls a view or pure method
     * @param method The nethod name (must be in the ABI)
     * @param params The parameters for the method
     * @param options The options for calling the method
     * @returns The decoded method result
     */
    public async callViewMethod(method: string, params: any[], options: MethodCallingOptions): Promise<Result> {
        const callDataHexString = this.contractInterface.encodeFunctionData(method, params);
        const result = await Web3RPCClient.getInstance().msgCall({
            to: this.address,
            from: options.from,
            data: callDataHexString,
            gas: options.gas,
            gasPrice: options.gasPrice,
            value: options.value,
        }, "latest", this.rpcOptions);
        return this.contractInterface.decodeFunctionResult(method, result);
    }

    /**
     * Calls a mutable, non-payable method
     * This sends a transaction
     * @param method The nethod name (must be in the ABI)
     * @param params The parameters for the method
     * @param options The options for sending the transaction
     * @returns The transaction receipt
     */
    public async callMutableMethod(method: string, params: any[], options: MethodTransactionOptions): Promise<TransactionResult<void>> {
        const txDataHexString = this.contractInterface.encodeFunctionData(method, params);
        const receipt = await sendTransaction(this.address, txDataHexString, 0, { ...options, ...this.rpcOptions });
        return {
            receipt: receipt,
        };
    }

    /**
     * Calls a mutable, payable method
     * This sends a transaction
     * @param method The nethod name (must be in the ABI)
     * @param params The parameters for the method
     * @param value The value to send (wei)
     * @param options The options for sending the transaction
     * @returns The transaction receipt
     */
    public async callPayableMethod(method: string, params: any[], value: QuantityLike, options: MethodTransactionOptions): Promise<TransactionResult<void>> {
        const txDataHexString = this.contractInterface.encodeFunctionData(method, params);
        const receipt = await sendTransaction(this.address, txDataHexString, value, { ...options, ...this.rpcOptions });
        return {
            receipt: receipt,
        };
    }
}

/**
 * Options for making a method call
 */
export interface MethodCallingOptions {
    /**
     * Address that is calling
     */
    from?: DataLike,

    /**
     * Max gas to use
     */
    gas?: QuantityLike;

    /**
     * Gas price
     */
    gasPrice?: QuantityLike;

    /**
     * Value in wei
     */
    value?: QuantityLike;
}

/**
 * Opntions for sending a method transaction
 */
export interface MethodTransactionOptions {
    /**
     * Private key to sign the transaction
     */
    privateKey: DataLike;

    /**
     * Chain ID
     */
    chainId: QuantityLike;

    /**
     * Fee market transaction? (to use fee instead of gas price)
     * True by default
     */
    isFeeMarket?: boolean;

    /**
     * Gas price, by default 0
     */
    gasPrice?: QuantityLike;

    /**
     * The maximum inclusion fee per gas (this fee is given to the miner)
     */
    maxPriorityFeePerGas?: QuantityLike;

    /**
     * The maximum total fee
     */
    maxFeePerGas?: QuantityLike;

    /**
     * Gas limit, by default 6000000
     */
    gasLimit?: QuantityLike;

    /**
     * Timeout in milliseconds to wait for the transaction receipt. Set to 0 for no timeout. By default no tiemout.
     */
    receiptWaitTimeout?: number;

    /**
     * Transaction nonce. 
     * If not provided:
     *  - The transactions count is used.
     *  - In case of collission, the transaction will be retried with a new nonce.
     */
    nonce?: QuantityLike;

    /**
     * Log Function to receive progress messages
     */
    logFunction?: (msg: string) => void;
}

export interface TransactionResult<Type> {
    receipt: TransactionReceipt;
    result?: Type;
}
