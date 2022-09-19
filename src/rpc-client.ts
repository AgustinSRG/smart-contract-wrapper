// JSON-RPC Web3 client

"use strict";

import { Request } from "./request";
import { DataLike, parseHexBytes, parseQuantity, QuantityLike, toHex } from "./utils";

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
 * Minimal version of Web3 RPC client
 * For smart contract interaction
 */
export class Web3RPCClient {
    private static instance: Web3RPCClient;

    /**
     * Creates a singleton instance of Web3RPCClient
     * @returns A singleton instance
     */
    public static getInstance(): Web3RPCClient {
        if (!Web3RPCClient.instance) {
            Web3RPCClient.instance = new Web3RPCClient();
        }
        return Web3RPCClient.instance;
    }

    /**
     * Performs a JSON-RPC request
     * @param method RPC Method
     * @param params Method parameters
     * @param options Request options
     * @returns The JSON RPC result
     */
    public rpcRequest(method: string, params: any[], options: RPCOptions): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            Request.post(options.rpcURL, {
                json: {
                    jsonrpc: "2.0",
                    method: method,
                    params: params,
                    id: 1,
                },
                timeout: options.timeout,
            }, (err, res, body) => {
                if (err) {
                    return reject(err);
                }
                if (res.statusCode !== 200) {
                    return reject(new Error("JSON RPC status code: " + res.statusCode));
                }
                try {
                    const parsedBody = JSON.parse(body);

                    if (parsedBody.error) {
                        return reject(new Error("Error code " + parsedBody.error.code + " / " + parsedBody.error.message));
                    }

                    resolve(parsedBody.result);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    /**
     * Gets a block by number (required for certain calls)
     * @param num Block number
     * @param options RPC options
     * @returns The block data
     */
    public async getBlockByNumber(num: "latest" | "pending" | number, options: RPCOptions): Promise<BlockData> {
        const result = await this.rpcRequest("eth_getBlockByNumber", [num, false], options);

        if (result === null) {
            return null;
        }

        return {
            number: parseQuantity(result.number),

            hash: parseHexBytes(result.hash),
            parentHash: parseHexBytes(result.parentHash),
            nonce: parseHexBytes(result.nonce),

            sha3Uncles: parseHexBytes(result.sha3Uncles),
            logsBloom: parseHexBytes(result.logsBloom),

            transactionsRoot: parseHexBytes(result.transactionsRoot),

            stateRoot: parseHexBytes(result.stateRoot),

            receiptsRoot: parseHexBytes(result.receiptsRoot),

            miner: parseHexBytes(result.miner),

            difficulty: parseQuantity(result.difficulty),
            totalDifficulty: parseQuantity(result.totalDifficulty),

            extraData: parseHexBytes(result.extraData),

            size: parseQuantity(result.size),

            gasLimit: parseQuantity(result.gasLimit),
            gasUsed: parseQuantity(result.gasUsed),
            baseFeePerGas: parseQuantity(result.baseFeePerGas),

            timestamp: parseQuantity(result.timestamp),
        };
    }

    /**
     * Gets the current gas price in wei
     * @param options RPC options
     * @returns The gas price
     */
    public async gasPrice(options: RPCOptions): Promise<bigint> {
        const result = await this.rpcRequest("eth_gasPrice", [], options);
        return parseQuantity(result);
    }

    /**
     * Get transaction count (for next nonce)
     * @param address Address (0x...)
     * @param tag Tag that can be latest=last block or pending=last pending transaction
     * @param options RPC options
     * @returns The transaction count
     */
    public async getTransactionCount(address: DataLike, tag: "latest" | "pending", options: RPCOptions): Promise<bigint> {
        const result = await this.rpcRequest("eth_getTransactionCount", [toHex(address), tag], options);
        return parseQuantity(result);
    }

    /**
     * Get account balance
     * @param address Address (0x...)
     * @param tag Tag that can be latest=last block or pending=last pending transaction
     * @param options RPC options
     * @returns The account balance
     */
    public async getBalance(address: DataLike, tag: "latest" | "pending", options: RPCOptions): Promise<bigint> {
        const result = await this.rpcRequest("eth_getBalance", [toHex(address), tag], options);
        return parseQuantity(result);
    }

    /**
     * Performs a message call (for pure and view methods)
     * @param callOptions Calling options
     * @param tag Tag that can be latest=last block or pending=last pending transaction
     * @param options RPC options
     * @returns The results (ABI encoded)
     */
    public async msgCall(callOptions: MessageCallOptions, tag: "latest" | "pending", options: RPCOptions): Promise<Buffer> {
        const result = await this.rpcRequest("eth_call", [{
            from: toHex(callOptions.from),
            to: toHex(callOptions.to),
            gas: toHex(callOptions.gas),
            gasPrice: toHex(callOptions.gasPrice),
            value: toHex(callOptions.value),
            data: toHex(callOptions.data),
        }, tag], options);
        return parseHexBytes(result);
    }

    /**
     * Sends raw transaction
     * @param txData Signed transaction
     * @param options RPC options
     * @returns The transaction hash
     */
    public async sendRawTransaction(txData: DataLike, options: RPCOptions): Promise<Buffer> {
        const result = await this.rpcRequest("eth_sendRawTransaction", [toHex(txData)], options);
        return parseHexBytes(result);
    }

    /**
     * Gets transaction receipt
     * @param txHash The transaction hash
     * @param options RPC options
     * @returns The transaction receipt, or null if the transaction is not mined yet
     */
    public async getTransactionReceipt(txHash: DataLike, options: RPCOptions): Promise<TransactionReceipt> {
        const result = await this.rpcRequest("eth_getTransactionReceipt", [toHex(txHash)], options);

        if (!result) {
            return null;
        }

        return {
            transactionHash: parseHexBytes(result.transactionHash),

            transactionIndex: parseQuantity(result.transactionIndex),

            blockHash: parseHexBytes(result.blockHash),
            blockNumber: parseQuantity(result.blockNumber),

            from: parseHexBytes(result.from),
            to: parseHexBytes(result.to),

            cumulativeGasUsed: parseQuantity(result.cumulativeGasUsed),
            gasUsed: parseQuantity(result.gasUsed),

            contractAddress: parseHexBytes(result.contractAddress),

            logs: forceArray(result.logs).map(l => {
                if (!l || typeof l !== "object") {
                    l = {};
                }
                return {
                    removed: !!l.removed,
                    logIndex: parseQuantity(l.logIndex),
                    transactionIndex: parseQuantity(l.transactionIndex),
                    transactionHash: parseHexBytes(l.transactionHash),
                    blockHash: parseHexBytes(l.blockHash),
                    blockNumber: parseQuantity(l.blockNumber),
                    address: parseHexBytes(l.address),
                    data: parseHexBytes(l.data),
                    topics: forceArray(l.topics).map(t => {
                        return parseHexBytes(t);
                    }),
                };
            }),

            logsBloom: parseHexBytes(result.logsBloom),

            root: parseHexBytes(result.root),

            status: parseQuantity(result.status),
        };
    }
}

/**
 * Block data
 * https://ethereum.org/es/developers/docs/apis/json-rpc/#eth_getblockbyhash
 */
export interface BlockData {
    number: bigint;

    hash: Buffer,
    parentHash: Buffer,
    nonce: Buffer,

    sha3Uncles: Buffer,
    logsBloom: Buffer,

    transactionsRoot: Buffer,

    stateRoot: Buffer;

    receiptsRoot: Buffer;

    miner: Buffer;

    difficulty: bigint,
    totalDifficulty: bigint;

    extraData: Buffer,

    size: bigint,

    gasLimit: bigint,
    gasUsed: bigint,
    baseFeePerGas: bigint,

    timestamp: bigint,
}

/**
 * Options for message call
 * https://ethereum.org/es/developers/docs/apis/json-rpc/#eth_call
 */
export interface MessageCallOptions {
    from?: DataLike;
    to: DataLike;
    gas?: QuantityLike;
    gasPrice?: QuantityLike;
    value?: QuantityLike;
    data: DataLike;
}

/**
 * Transaction receipt
 * https://ethereum.org/es/developers/docs/apis/json-rpc/#eth_gettransactionreceipt
 */
export interface TransactionReceipt {
    transactionHash: Buffer;
    transactionIndex: bigint;
    blockHash: Buffer;
    blockNumber: bigint;
    from: Buffer;
    to: Buffer;
    cumulativeGasUsed: bigint;
    gasUsed: bigint;
    contractAddress: Buffer;
    logs: TransactionLog[];
    logsBloom: Buffer;
    root: Buffer;
    status: bigint;
}

/**
 * Transaction Log
 * https://ethereum.org/es/developers/docs/apis/json-rpc/#eth_getfilterchanges
 */
export interface TransactionLog {
    removed: boolean;
    logIndex: bigint;
    transactionIndex: bigint;
    transactionHash: Buffer;
    blockHash: Buffer;
    blockNumber: bigint;
    address: Buffer;
    data: Buffer;
    topics: Buffer[];
}

function forceArray(arr: any): any[] {
    if (arr instanceof Array) {
        return arr;
    } else {
        return [];
    }
}

