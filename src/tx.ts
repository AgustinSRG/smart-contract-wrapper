// Transaction

"use strict";

import { FeeMarketEIP1559TxData, FeeMarketEIP1559Transaction, LegacyTxData, LegacyTransaction } from '@ethereumjs/tx';
import { Common } from '@ethereumjs/common';
import { Web3RPCClient } from './rpc-client';
import { bigintsToHex, parseAddress, parseBytes, parseQuantity, toHex } from './utils';
import { privateKeyToAddress } from './account';
import { AddressLike, BytesLike, QuantityLike, TransactionReceipt, TransactionSendingOptions } from './types';

const NonceCollisionErrorMessages = [
    "nonce too low",
    "replacement transaction underpriced"
];

/**
 * Details for building a transaction
 */
export interface TransactionBuildDetails {
    /**
     * Transaction destination address
     */
    to: AddressLike | null;

    /**
     * Transaction data
     */
    data: BytesLike;

    /**
     * Transaction value
     */
    value: QuantityLike;
}

/**
 * Sends a transaction
 * @param to Destination address
 * @param data Data
 * @param value Value (wei)
 * @param options RPC options
 * @returns The transaction receipt
 */
export function sendTransaction(to: AddressLike | null, data: BytesLike, value: QuantityLike, options: TransactionSendingOptions): Promise<TransactionReceipt>;

/**
 * Sends a transaction
 * @param details The transaction build details
 * @param options RPC options
 * @returns The transaction receipt
 */
export function sendTransaction(details: TransactionBuildDetails, options: TransactionSendingOptions): Promise<TransactionReceipt>;


export function sendTransaction(toOrDetails: AddressLike | null | TransactionBuildDetails, dataOrOptions: BytesLike | TransactionSendingOptions, value?: QuantityLike, options?: TransactionSendingOptions): Promise<TransactionReceipt> {
    if (typeof toOrDetails === "object" && toOrDetails !== null) {
        return sendTransactionInternal(toOrDetails.to, toOrDetails.data, toOrDetails.value, dataOrOptions as TransactionSendingOptions);
    } else {
        return sendTransactionInternal(toOrDetails as AddressLike, dataOrOptions as BytesLike, value, options);
    }
}

async function sendTransactionInternal(to: AddressLike | null, data: BytesLike, value: QuantityLike, options: TransactionSendingOptions) {
    let receipt: TransactionReceipt;
    while (!receipt) {
        try {
            if (options.isFeeMarket === true || options.isFeeMarket === undefined) {
                receipt = await sendFeeMarketTransaction(to, data, value, options);
            } else {
                receipt = await sendGasPriceTransaction(to, data, value, options)
            }
        } catch (ex) {
            if (options.nonce !== undefined) {
                throw ex;
            }
            const errMessageLower = (ex.message + "").toLowerCase();
            let isNonceError = false;
            for (const errMsg of NonceCollisionErrorMessages) {
                if (errMessageLower.includes(errMsg)) {
                    isNonceError = true;
                    break;
                }
            }
            if (isNonceError) {
                if (options.logFunction) {
                    options.logFunction(`Transaction nonce collision detected. Retrying the transaction with a new nonce.`);
                }
            } else {
                throw ex;
            }
        }
    }
    return receipt;
}

async function sendFeeMarketTransaction(to: AddressLike, data: BytesLike, value: QuantityLike, options: TransactionSendingOptions): Promise<TransactionReceipt> {
    let chainId: bigint = options.chainId === undefined ? undefined : parseQuantity(options.chainId);

    if (chainId === undefined) {
        chainId = await Web3RPCClient.getInstance().getNetworkId(options);
    }

    const customCommon = Common.custom(
        {
            name: 'my-network',
            networkId: chainId,
            chainId: chainId,
        },
        {
            baseChain: "mainnet",
            hardfork: 'london',
        }
    );

    const privateKey = parseBytes(options.privateKey);
    const accountAddress = privateKeyToAddress(privateKey);

    let recommendedMaxPriorityFeePerGas = BigInt(0);

    if (options.maxFeePerGas === undefined) {
        try {
            const pendingBlock = await Web3RPCClient.getInstance().getBlockByNumber("pending", options);
            const baseFee = pendingBlock.baseFeePerGas;
            recommendedMaxPriorityFeePerGas = (baseFee * BigInt(2)) + (options.maxPriorityFeePerGas === undefined ? BigInt(0) : parseQuantity(options.maxPriorityFeePerGas));
            if (options.logFunction) {
                options.logFunction(`Recommended maxFeePerGas of the network: ${toHex(recommendedMaxPriorityFeePerGas)} wei`);
            }
        } catch (ex) {
            if (options.logFunction) {
                options.logFunction(`Could not fetch the recommended maxFeePerGas. Error: ${ex.message}`);
            }
        }
    }

    let recommendedGasLimit = BigInt(6000000);

    if (options.gasLimit === undefined) {
        try {
            recommendedGasLimit = await Web3RPCClient.getInstance().estimateGas({
                to: to,
                from: accountAddress,
                data: data,
                value: value,
            }, "pending", options);
            
            if (options.logFunction) {
                options.logFunction(`Recommended gas limit of the transaction: ${toHex(recommendedGasLimit)} wei`);
            }
        } catch (ex) {
            if (options.logFunction) {
                options.logFunction(`Could not fetch the recommended gas limit. Error: ${ex.message}`);
            }
        }
    }

    const maxFeePerGas = options.maxFeePerGas === undefined ? recommendedMaxPriorityFeePerGas : parseQuantity(options.maxFeePerGas);
    const maxPriorityFeePerGas = options.maxPriorityFeePerGas === undefined ? 0 : parseQuantity(options.maxPriorityFeePerGas);

    const gasLimit = options.gasLimit === undefined ? recommendedGasLimit : parseQuantity(options.gasLimit);

    let nonce: bigint;
    let nonceHex: string;

    if (options.nonce === undefined) {
        const nonceFromRPC = await Web3RPCClient.getInstance().getTransactionCount(accountAddress, "pending", options);
        nonceHex = toHex(nonceFromRPC);
        nonce = nonceFromRPC;
    } else {
        nonceHex = toHex(options.nonce);
        nonce = BigInt(nonceHex);
    }


    // Build transaction

    const txData: FeeMarketEIP1559TxData = {
        nonce: nonce,
        gasLimit: gasLimit,
        chainId: chainId,
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas,
    };

    if (to) {
        txData.to = parseAddress(to) as any;
    }

    if (data) {
        txData.data = toHex(data) as any;
    }

    if (value) {
        txData.value = parseQuantity(value);
    }

    if (options.logFunction) {
        options.logFunction(`Transaction data: ${JSON.stringify(bigintsToHex(txData))}`);
    }

    let tx = new FeeMarketEIP1559Transaction(txData, { common: customCommon });

    // Sign transaction
    if (options.logFunction) {
        options.logFunction(`Signing transaction...`);
    }
    tx = tx.sign(privateKey);

    // Serialize transaction
    const serializedTx = tx.serialize();

    return sendSerializedTransaction(serializedTx, accountAddress, nonce, options);
}

async function sendGasPriceTransaction(to: AddressLike, data: BytesLike, value: QuantityLike, options: TransactionSendingOptions): Promise<TransactionReceipt> {
    let chainId: bigint = options.chainId === undefined ? undefined : parseQuantity(options.chainId);

    if (chainId === undefined) {
        chainId = await Web3RPCClient.getInstance().getNetworkId(options);
    }

    const customCommon = Common.custom(
        {
            name: 'my-network',
            networkId: chainId,
            chainId: chainId,
        },
        {
            baseChain: "mainnet",
            hardfork: 'london',
        }
    );

    const privateKey = parseBytes(options.privateKey);
    const accountAddress = privateKeyToAddress(privateKey);

    let recommendedGasPrice = BigInt(0);

    if (options.gasPrice === undefined) {
        try {
            recommendedGasPrice = await Web3RPCClient.getInstance().gasPrice(options);
            if (options.logFunction) {
                options.logFunction(`Recommended gasPrice of the network: ${toHex(recommendedGasPrice)} wei`);
            }
        } catch (ex) {
            if (options.logFunction) {
                options.logFunction(`Could not fetch the recommended gasPrice. Error: ${ex.message}`);
            }
        }
    }

    let recommendedGasLimit = BigInt(6000000);

    if (options.gasLimit === undefined) {
        try {
            recommendedGasLimit = await Web3RPCClient.getInstance().estimateGas({
                to: to,
                from: accountAddress,
                data: data,
                value: value,
            }, "pending", options);
            
            if (options.logFunction) {
                options.logFunction(`Recommended gas limit of the transaction: ${toHex(recommendedGasLimit)} wei`);
            }
        } catch (ex) {
            if (options.logFunction) {
                options.logFunction(`Could not fetch the recommended gas limit. Error: ${ex.message}`);
            }
        }
    }

    const gasPrice = options.gasPrice === undefined ? recommendedGasPrice : parseQuantity(options.gasPrice);
    const gasLimit = options.gasLimit === undefined ? recommendedGasLimit : parseQuantity(options.gasLimit);

    let nonce: bigint;
    let nonceHex: string;

    if (options.nonce === undefined) {
        const nonceFromRPC = await Web3RPCClient.getInstance().getTransactionCount(accountAddress, "pending", options);
        nonce = nonceFromRPC;
        nonceHex = toHex(nonceFromRPC);
    } else {
        nonceHex = toHex(options.nonce);
        nonce = BigInt(nonceHex);
    }

    // Build transaction

    const txData: LegacyTxData = {
        nonce: nonce,
        gasLimit: gasLimit,
        gasPrice: gasPrice,
    };

    if (to) {
        txData.to = parseAddress(to) as any;
    }

    if (data) {
        txData.data = toHex(data) as any;
    }

    if (value) {
        txData.value = parseQuantity(value);
    }

    if (options.logFunction) {
        options.logFunction(`Transaction data: ${JSON.stringify(bigintsToHex(txData))}`);
    }

    let tx = new LegacyTransaction(txData, { common: customCommon });

    // Sign transaction
    if (options.logFunction) {
        options.logFunction(`Signing transaction...`);
    }
    tx = tx.sign(privateKey);

    // Serialize transaction
    const serializedTx = tx.serialize();

    return sendSerializedTransaction(serializedTx, accountAddress, nonce, options);
}

async function sendSerializedTransaction(serializedTx: BytesLike, accountAddress: string, nonce: bigint, options: TransactionSendingOptions): Promise<TransactionReceipt> {
    // Send transaction
    if (options.logFunction) {
        options.logFunction(`Sending transaction...`);
    }
    const txHash = await Web3RPCClient.getInstance().sendRawTransaction(serializedTx, options);

    // Wait for the transaction receipt
    if (options.logFunction) {
        options.logFunction(`Transaction hash: ${toHex(txHash)}`);
        options.logFunction(`Waiting for transaction to be mined...`);
    }
    const startTime = Date.now();
    let receipt: TransactionReceipt;
    let nonceChanged = false;

    while (!receipt) {
        receipt = await Web3RPCClient.getInstance().getTransactionReceipt(txHash, options);

        if (!receipt) {
            if (nonceChanged) {
                throw new Error(NonceCollisionErrorMessages[0]);
            }

            // Wait 1 second and try fetching the receipt again
            await (new Promise(function (resolve2) {
                setTimeout(resolve2, 1000);
            }));

            // Check timeout
            if (options.receiptWaitTimeout !== undefined && options.receiptWaitTimeout > 0 && (Date.now() - startTime > options.receiptWaitTimeout)) {
                throw new Error("Timed out after " + options.receiptWaitTimeout + " milliseconds.");
            }

            // Check nonce
            const nonceFromRPC = await Web3RPCClient.getInstance().getTransactionCount(accountAddress, "latest", options);
            if (nonceFromRPC > nonce) {
                nonceChanged = true;
                continue;
            }
        } else {
            if (options.logFunction) {
                options.logFunction(`Transaction mined: ${toHex(txHash)} / Block: ${toHex(receipt.blockNumber)}`);
            }
        }
    }

    return receipt;
}
