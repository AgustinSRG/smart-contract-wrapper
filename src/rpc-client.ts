// JSON-RPC Web3 client

"use strict";

import { Request } from "./request";
import { AddressLike, BlockData, BlockTag, Bytes, BytesLike, MessageCallOptions, Quantity, QuantityLike, RPCOptions, TransactionLog, TransactionLogFilterOptions, TransactionReceipt } from "./types";
import { parseAddress, parseBytes, parseQuantity, toHex } from "./utils";

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
        if ("provider" in options && options.provider !== undefined && options.provider) {
            return options.provider.rpcRequest(method, params, options.timeout);
        } else if (!("rpcURL" in options) || options.rpcURL === undefined) {
            throw new Error("You must set a provider or an URL to send a json-RPC request");
        }
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
                    return reject(new Error("JSON RPC status code: " + res.statusCode + ".\nResponse: " + body + "\nContext: " + JSON.stringify({
                        url: options.rpcURL,
                        method,
                        params,
                    })));
                }
                try {
                    const parsedBody = JSON.parse(body);

                    if (parsedBody.error) {
                        return reject(new Error("[" + method + "] RPC Error " + parsedBody.error.code + " / " + parsedBody.error.message + "\nContext: " + JSON.stringify({
                            url: options.rpcURL,
                            method,
                            params,
                        })));
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
    public async getBlockByNumber(num: BlockTag | QuantityLike, options: RPCOptions): Promise<BlockData> {
        if (typeof num !== "string") {
            num = toHex(num);
        }
        const result = await this.rpcRequest("eth_getBlockByNumber", [num, false], options);

        if (result === null) {
            return null;
        }

        return {
            number: parseQuantity(result.number),

            hash: parseBytes(result.hash),
            parentHash: parseBytes(result.parentHash),
            nonce: parseBytes(result.nonce),

            sha3Uncles: parseBytes(result.sha3Uncles),
            logsBloom: parseBytes(result.logsBloom),

            transactionsRoot: parseBytes(result.transactionsRoot),

            stateRoot: parseBytes(result.stateRoot),

            receiptsRoot: parseBytes(result.receiptsRoot),

            miner: parseBytes(result.miner),

            difficulty: parseQuantity(result.difficulty),
            totalDifficulty: parseQuantity(result.totalDifficulty),

            extraData: parseBytes(result.extraData),

            size: parseQuantity(result.size),

            gasLimit: parseQuantity(result.gasLimit),
            gasUsed: parseQuantity(result.gasUsed),
            baseFeePerGas: parseQuantity(result.baseFeePerGas),

            timestamp: parseQuantity(result.timestamp),

            transactions: Array.isArray(result.transactions) ? result.transactions.map(parseBytes) : [],

            uncles: Array.isArray(result.uncles) ? result.uncles.map(parseBytes) : [],
        };
    }

    /**
     * Gets the network ID
     * This is used by default if the chain ID is not specified
     * @param options RPC options
     * @returns The network ID
     */
    public async getNetworkId(options: RPCOptions): Promise<Quantity> {
        const result = await this.rpcRequest("net_version", [], options);
        return parseQuantity(result);
    }

    /**
     * Gets the current gas price in wei
     * @param options RPC options
     * @returns The gas price
     */
    public async gasPrice(options: RPCOptions): Promise<Quantity> {
        const result = await this.rpcRequest("eth_gasPrice", [], options);
        return parseQuantity(result);
    }

    /**
     * Estimates gas for a transaction
     * This can be used to set the gas limit
     * @param callOptions Calling options
     * @param tag Tag that can be latest=last block or pending=last pending transaction
     * @param options RPC options
     * @returns The estimated gas used by the transaction
     */
    public async estimateGas(callOptions: MessageCallOptions, tag: BlockTag, options: RPCOptions): Promise<Quantity> {
        const result = await this.rpcRequest("eth_estimateGas", [{
            from: toHex(callOptions.from),
            to: toHex(callOptions.to),
            gas: toHex(callOptions.gas),
            gasPrice: toHex(callOptions.gasPrice),
            value: toHex(callOptions.value),
            data: toHex(callOptions.data),
        }, tag], options);
        return parseQuantity(result);
    }

    /**
     * Get transaction count (for next nonce)
     * @param address Address (0x...)
     * @param tag Tag that can be latest=last block or pending=last pending transaction
     * @param options RPC options
     * @returns The transaction count
     */
    public async getTransactionCount(address: AddressLike, tag: BlockTag, options: RPCOptions): Promise<Quantity> {
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
    public async getBalance(address: AddressLike, tag: BlockTag, options: RPCOptions): Promise<Quantity> {
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
    public async msgCall(callOptions: MessageCallOptions, tag: BlockTag, options: RPCOptions): Promise<Bytes> {
        const result = await this.rpcRequest("eth_call", [{
            from: toHex(callOptions.from),
            to: toHex(callOptions.to),
            gas: toHex(callOptions.gas),
            gasPrice: toHex(callOptions.gasPrice),
            value: toHex(callOptions.value),
            data: toHex(callOptions.data),
        }, tag], options);
        return parseBytes(result);
    }

    /**
     * Sends raw transaction
     * @param txData Signed transaction
     * @param options RPC options
     * @returns The transaction hash
     */
    public async sendRawTransaction(txData: BytesLike, options: RPCOptions): Promise<Bytes> {
        const result = await this.rpcRequest("eth_sendRawTransaction", [toHex(txData)], options);
        return parseBytes(result);
    }

    /**
     * Gets transaction receipt
     * @param txHash The transaction hash
     * @param options RPC options
     * @returns The transaction receipt, or null if the transaction is not mined yet
     */
    public async getTransactionReceipt(txHash: BytesLike, options: RPCOptions): Promise<TransactionReceipt> {
        const result = await this.rpcRequest("eth_getTransactionReceipt", [toHex(txHash)], options);

        if (!result) {
            return null;
        }

        return {
            transactionHash: parseBytes(result.transactionHash),

            transactionIndex: parseQuantity(result.transactionIndex),

            blockHash: parseBytes(result.blockHash),
            blockNumber: parseQuantity(result.blockNumber),

            from: parseBytes(result.from),
            to: parseBytes(result.to),

            cumulativeGasUsed: parseQuantity(result.cumulativeGasUsed),
            gasUsed: parseQuantity(result.gasUsed),

            contractAddress: parseAddress(result.contractAddress),

            logs: forceArray(result.logs).map(l => {
                if (!l || typeof l !== "object") {
                    l = {};
                }
                return {
                    removed: !!l.removed,
                    logIndex: parseQuantity(l.logIndex),
                    transactionIndex: parseQuantity(l.transactionIndex),
                    transactionHash: parseBytes(l.transactionHash),
                    blockHash: parseBytes(l.blockHash),
                    blockNumber: parseQuantity(l.blockNumber),
                    address: parseAddress(l.address),
                    data: parseBytes(l.data),
                    topics: forceArray(l.topics).map(t => {
                        return parseBytes(t);
                    }),
                };
            }),

            logsBloom: parseBytes(result.logsBloom),

            root: parseBytes(result.root),

            status: parseQuantity(result.status),
        };
    }

    /**
     * Gets transaction logs
     * @param filter Block range and filter
     * @param options RPC options
     * @returns The array of transaction logs
     */
    public async getLogs(filter: TransactionLogFilterOptions, options: RPCOptions): Promise<TransactionLog[]> {
        const parsedOptions: TransactionLogFilterOptions = {};

        if (filter.fromBlock !== undefined) {
            if (typeof filter.fromBlock !== "string") {
                parsedOptions.fromBlock = toHex(filter.fromBlock);
            } else {
                parsedOptions.fromBlock = filter.fromBlock;
            }
        }

        if (filter.toBlock !== undefined) {
            if (typeof filter.toBlock !== "string") {
                parsedOptions.toBlock = toHex(filter.toBlock);
            } else {
                parsedOptions.toBlock = filter.toBlock;
            }
        }

        if (filter.address !== undefined) {
            parsedOptions.address = filter.address;
        }

        if (filter.topics !== undefined) {
            parsedOptions.topics = filter.topics.map(t => {
                if (Array.isArray(t) && !(t instanceof Buffer)) {
                    return t.map(st => {
                        return toHex(st);
                    });
                } else {
                    return toHex(t);
                }
            });
        }

        const result = await this.rpcRequest("eth_getLogs", [parsedOptions], options);

        return forceArray(result).map(l => {
            if (!l || typeof l !== "object") {
                l = {};
            }
            return {
                removed: !!l.removed,
                logIndex: parseQuantity(l.logIndex),
                transactionIndex: parseQuantity(l.transactionIndex),
                transactionHash: parseBytes(l.transactionHash),
                blockHash: parseBytes(l.blockHash),
                blockNumber: parseQuantity(l.blockNumber),
                address: parseAddress(l.address),
                data: parseBytes(l.data),
                topics: forceArray(l.topics).map(t => {
                    return parseBytes(t);
                }),
            };
        });
    }
}

function forceArray(arr: any): any[] {
    if (arr instanceof Array) {
        return arr;
    } else {
        return [];
    }
}

