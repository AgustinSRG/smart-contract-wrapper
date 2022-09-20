// Types

"use strict";

import { JsonFragment } from "@ethersproject/abi";

/**
 * Ethereum address (Hex string with 0x prefix)
 */
export type Address = string;

/**
 * Number (bigint)
 */
export type Quantity = bigint;

/**
 * Array of bytes (Buffer)
 */
export type Bytes = Buffer;

/**
 * Can be parsed into ethrereum address
 */
export type AddressLike = string;

/**
 * Can be parsed into a number
 */
export type QuantityLike = string | number | bigint;

/**
 * Can be parsed into an array of bytes
 */
export type BytesLike = string | Buffer;

/**
 * Input parameter
 * Can be parsed and encoded to hex
 */
export type InputParam = AddressLike | QuantityLike | BytesLike | string | boolean;

/**
 * Input parameter for ABI encoding
 * Can be parsed into an ABI call
 */
export type InputABIParam = InputParam | InputParam[] | InputABIParam[];

/**
 * List of input parameters ready to be encoded for ABI
 */
export type InputABIParams = ReadonlyArray<InputABIParam>;

/**
 * Output parameter
 */
export type OutputParam = Address | Quantity | Bytes | string | boolean;

/**
 * Output ABI parameter
 * Returned by smart contract calls or events
 */
export type OutputABIParam = OutputParam | OutputParam[] | OutputABIParam[];

/**
 * List of outputs. Usually the result of smart contract calls
 */
export type OutputABIParams = ReadonlyArray<OutputABIParam>;

/**
 * ABI definition
 */
export type ABILike = ReadonlyArray<JsonFragment>;

/**
 * Smart contract event
 */
export interface SmartContractEvent {
    /**
     * Name of the event
     */
    name: string;

    /**
     * Signature of the event
     */
    signature: string;

    /**
     * Parameters
     */
    parameters: OutputABIParams;
}

/**
 * Block data
 * https://ethereum.org/es/developers/docs/apis/json-rpc/#eth_getblockbyhash
 */
export interface BlockData {
    number: Quantity;

    hash: Bytes,
    parentHash: Bytes,
    nonce: Bytes,

    sha3Uncles: Bytes,
    logsBloom: Bytes,

    transactionsRoot: Bytes,

    stateRoot: Bytes;

    receiptsRoot: Bytes;

    miner: Bytes;

    difficulty: Quantity,
    totalDifficulty: Quantity;

    extraData: Bytes,

    size: Quantity,

    gasLimit: Quantity,
    gasUsed: Quantity,
    baseFeePerGas: Quantity,

    timestamp: Quantity,
}

/**
 * Options for message call
 * https://ethereum.org/es/developers/docs/apis/json-rpc/#eth_call
 */
export interface MessageCallOptions {
    from?: BytesLike;
    to: BytesLike;
    gas?: QuantityLike;
    gasPrice?: QuantityLike;
    value?: QuantityLike;
    data: BytesLike;
}

/**
 * Transaction receipt
 * https://ethereum.org/es/developers/docs/apis/json-rpc/#eth_gettransactionreceipt
 */
export interface TransactionReceipt {
    transactionHash: Bytes;
    transactionIndex: Quantity;
    blockHash: Bytes;
    blockNumber: Quantity;
    from: Bytes;
    to: Bytes;
    cumulativeGasUsed: Quantity;
    gasUsed: Quantity;
    contractAddress: Address;
    logs: TransactionLog[];
    logsBloom: Bytes;
    root: Bytes;
    status: Quantity;
}

/**
 * Transaction Log
 * https://ethereum.org/es/developers/docs/apis/json-rpc/#eth_getfilterchanges
 */
export interface TransactionLog {
    removed: boolean;
    logIndex: Quantity;
    transactionIndex: Quantity;
    transactionHash: Bytes;
    blockHash: Bytes;
    blockNumber: Quantity;
    address: Address;
    data: Bytes;
    topics: Bytes[];
}

/**
 * RPC request options
 */
export interface RPCOptions {
    /**
     * RPC URL. Example: http://localhost:8545
     */
    rpcURL: string;

    /**
     * Request timeout in milliseconds
     */
    timeout?: number;
}

/**
 * Options for making a method call
 */
export interface MethodCallingOptions {
    /**
     * Address that is calling
     */
    from?: AddressLike,

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
    privateKey: BytesLike;

    /**
     * Chain ID
     */
    chainId?: QuantityLike;

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

/**
 * Options for sending a transaction
 */
export interface TransactionSendingOptions extends RPCOptions, MethodTransactionOptions {

}

/**
 * Transaction result
 */
export interface TransactionResult<Type> {
    /**
     * Transaction receipt
     */
    receipt: TransactionReceipt;

    /**
     * Result
     */
    result: Type;
}
