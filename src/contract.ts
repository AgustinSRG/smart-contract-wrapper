// Smart contract

"use strict"

import { Web3RPCClient } from "./rpc-client";
import { normalizeABIResult, parseAddress, parseBytes } from "./utils";
import { Interface } from "@ethersproject/abi";
import { sendTransaction } from "./tx";
import { interpretLog } from "./events";
import { ABILike, Address, AddressLike, BytesLike, InputABIParams, MethodCallingOptions, MethodTransactionOptions, OutputABIParams, QuantityLike, RPCOptions, SmartContractEvent, TransactionLog, TransactionReceipt, TransactionResult, TransactionSendingOptions } from "./types";

/**
 * Deploys smart contract
 * @param byteCode The byte code of the smart contract
 * @param abi The ABI definition of the smart contract
 * @param constructorParams The constructor params
 * @param value The value to send to the constructor (wei)
 * @param options The transaction options (including RPC options)
 * @returns A result with the transaction receipt and the contract address
*/
export async function deploySmartContract(byteCode: BytesLike, abi: ABILike, constructorParams: InputABIParams, value: QuantityLike, options: TransactionSendingOptions): Promise<TransactionResult<Address>> {
    const contractInterface = new Interface(abi);

    const byteCodeBuf = parseBytes(byteCode);
    const deployEncoded = parseBytes(contractInterface.encodeDeploy(constructorParams));

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
    public address: Address;

    /**
     * RPC options
     */
    public rpcOptions: RPCOptions;

    /**
     * Contract ABI
     */
    public abi: ABILike;

    /**
     * Contract interface for ABI encoding
     */
    protected contractInterface: Interface;

    /**
     * @param address Address of the smart contract
     * @param abi Contract ABI
     * @param rpcOptions RPC options
     */
    constructor(address: AddressLike, abi: ABILike, rpcOptions: RPCOptions) {
        this.address = parseAddress(address);
        this.rpcOptions = rpcOptions;
        this.abi = abi;
        this.contractInterface = new Interface(abi);
    }

    /**
     * Calls a view or pure method
     * @param method The nethod name (must be in the ABI)
     * @param params The parameters for the method
     * @param options The options for calling the method
     * @returns The decoded method result
     */
    public async callViewMethod(method: string, params: InputABIParams, options: MethodCallingOptions): Promise<OutputABIParams> {
        const callDataHexString = this.contractInterface.encodeFunctionData(method, params);
        const result = await Web3RPCClient.getInstance().msgCall({
            to: this.address,
            from: options.from,
            data: callDataHexString,
            gas: options.gas,
            gasPrice: options.gasPrice,
            value: options.value,
        }, "latest", this.rpcOptions);
        return normalizeABIResult(this.contractInterface.decodeFunctionResult(method, result));
    }

    /**
     * Calls a mutable, non-payable method
     * This sends a transaction
     * @param method The nethod name (must be in the ABI)
     * @param params The parameters for the method
     * @param options The options for sending the transaction
     * @returns The transaction receipt
     */
    public async callMutableMethod(method: string, params: InputABIParams, options: MethodTransactionOptions): Promise<TransactionResult<void>> {
        const txDataHexString = this.contractInterface.encodeFunctionData(method, params);
        const receipt = await sendTransaction(this.address, txDataHexString, 0, { ...options, ...this.rpcOptions });
        return {
            receipt: receipt,
            result: null,
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
    public async callPayableMethod(method: string, params: InputABIParams, value: QuantityLike, options: MethodTransactionOptions): Promise<TransactionResult<void>> {
        const txDataHexString = this.contractInterface.encodeFunctionData(method, params);
        const receipt = await sendTransaction(this.address, txDataHexString, value, { ...options, ...this.rpcOptions });
        return {
            receipt: receipt,
            result: null,
        };
    }

    /**
     * Parses transaction logs
     * @param logs Transaction logs
     * @returns The smart contract events
     */
    public parseTransactionLogs(logs: TransactionLog[]): SmartContractEvent[] {
        const events: SmartContractEvent[] = [];
        for (const log of logs) {
            const event = interpretLog(log, this.abi, this.contractInterface);
            if (event) {
                events.push(event);
            }
        }
        return events;
    }

    /**
     * Finds event in transaction receipt
     * @param receipt Transaction recept
     * @param name Event name
     * @returns The event, or null if not found
     */
    public findEvent(receipt: TransactionReceipt, name: string): SmartContractEvent {
        const events = this.parseTransactionLogs(receipt.logs);
        for (const event of events) {
            if (event.name === name) {
                return event;
            }
        }
        return null;
    }
}
