// Types

"use strict";

import { JsonFragment } from "@asanrom/ethers-abi";

/**
 * Block tag
 */
export type BlockTag = "latest" | "earliest" | "pending";

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
 * Can be parsed into ethereum address
 */
export type AddressLike = string;

/**
 * Can be parsed into a number
 */
export type QuantityLike = string | number | bigint;

/**
 * Can be parsed into an array of bytes
 */
export type BytesLike = string | Buffer | Uint8Array;

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

    /**
     * Reference to the log
     */
    log: TransactionLog;
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

    transactions: Bytes[],

    uncles: Bytes[],
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
 * RPC provider to send json-RPC request to the node
 */
export interface RPCProvider {
    /**
     * Performs a JSON-RPC request
     * @param method RPC Method
     * @param params Method parameters
     * @param timeout Timeout in ms
     * @returns The JSON RPC result
     */
    rpcRequest(method: string, params: any[], timeout: number): Promise<any>;
}

/**
 * RPC request options
 */
export type RPCOptions = RPCOptionsWithProvider | RPCOptionsWithURL;

/**
 * RPC request options.
 * With a provider.
 */
export interface RPCOptionsWithProvider {
    /**
     * RPC provider to send JSON-RPC request to the node
     */
    provider: RPCProvider;

    /**
     * Request timeout in milliseconds
     */
    timeout?: number;
}

/**
 * RPC request options.
 * With an URL.
 */
export interface RPCOptionsWithURL {
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
 * Options for sending a method transaction
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
     * Gas price, by default it used the recommended gas price
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
     * Gas limit, by default it used the estimated gas
     */
    gasLimit?: QuantityLike;

    /**
     * Timeout in milliseconds to wait for the transaction receipt. Set to 0 for no timeout. By default no timeout.
     */
    receiptWaitTimeout?: number;

    /**
     * Transaction nonce. 
     * If not provided:
     *  - The transactions count is used.
     *  - In case of collision, the transaction will be retried with a new nonce.
     */
    nonce?: QuantityLike;

    /**
     * Log Function to receive progress messages
     */
    logFunction?: (msg: string) => void;

    /**
     * Function called before sending the transaction
     */
    beforeSend?: () => void | Promise<void>;

    /**
     * Function called after sending the transaction, before waiting for receipt
     */
    afterSend?: () => void | Promise<void>;
}

/**
 * Options for sending a transaction
 */
export type TransactionSendingOptions = RPCOptions & MethodTransactionOptions;

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

/**
 * Options to filter transaction logs
 */
export interface TransactionLogFilterOptions {
    /**
     * First block of the range
     */
    fromBlock?: QuantityLike | BlockTag;

    /**
     * Last block of the range
     */
    toBlock?: QuantityLike | BlockTag;

    /**
     * Contract address
     */
    address?: AddressLike;

    /**
     * Array of topics to filter by
     */
    topics?: (BytesLike | BytesLike[])[];
}

/**
 * Wrapper for smart contract events
 * Wraps the event with the parsed data
 */
export interface SmartContractEventWrapper<Type> {
    /**
     * Event
     */
    event: SmartContractEvent;

    /**
     * Event data
     */
    data: Type;
}
