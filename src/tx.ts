// Transaction

"use strict";

import { FeeMarketEIP1559TxData, FeeMarketEIP1559Transaction, TxData, Transaction } from '@ethereumjs/tx';
import { Common } from '@ethereumjs/common';
import { RPCOptions, TransactionReceipt, Web3RPCClient } from './rpc-client';
import { DataLike, parseHexBytes, parseQuantity, QuantityLike, toHex } from './utils';
import { privateKeyToAddress } from './account';

/**
 * Transaction sending options
 */
export interface TransactionSendingOptions extends RPCOptions {
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

const NonceCollisionErrorMessages = [
    "nonce too low",
    "replacement transaction underpriced"
];

/**
 * Sends a transaction
 * @param to Destination address
 * @param data Data
 * @param value Value (wei)
 * @param options RPC options
 * @returns The transaction receipt
 */
export async function sendTransaction(to: DataLike, data: DataLike, value: QuantityLike, options: TransactionSendingOptions): Promise<TransactionReceipt> {
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

        return receipt;
    }
    
}


async function sendFeeMarketTransaction(to: DataLike, data: DataLike, value: QuantityLike, options: TransactionSendingOptions): Promise<TransactionReceipt> {
    const customCommon = Common.custom(
        {
            name: 'my-network',
            networkId: parseQuantity(options.chainId),
            chainId: parseQuantity(options.chainId),
        },
        {
            baseChain: "mainnet",
            hardfork: 'london',
        }
    );

    const privateKey = parseHexBytes(options.privateKey);
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

    const maxFeePerGas = toHex(options.maxFeePerGas === undefined ? recommendedMaxPriorityFeePerGas : options.maxFeePerGas);
    const maxPriorityFeePerGas = toHex(options.maxPriorityFeePerGas === undefined ? 0 : options.maxPriorityFeePerGas);
    const gasLimitHex = toHex(options.gasLimit === undefined ? 6000000 : options.gasLimit);

    let nonceHex: string;

    if (options.nonce === undefined) {
        const nonceFromRPC = await Web3RPCClient.getInstance().getTransactionCount(accountAddress, "pending", options);
        nonceHex = toHex(nonceFromRPC);
    } else {
        nonceHex = toHex(options.nonce);
    }


    // Build transaction

    const txData: FeeMarketEIP1559TxData = {
        nonce: nonceHex,
        gasLimit: gasLimitHex,
        chainId: options.chainId,
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas,
    };

    if (to) {
        txData.to = to;
    }

    if (data) {
        txData.data = data;
    }

    if (value) {
        txData.value = value;
    }

    if (options.logFunction) {
        options.logFunction(`Transaction data: ${JSON.stringify(txData)}`);
    }

    let tx = new FeeMarketEIP1559Transaction(txData, { common: customCommon });

    // Sign transaction
    if (options.logFunction) {
        options.logFunction(`Signing transaction...`);
    }
    tx = tx.sign(privateKey);

    // Serialize transaction
    const serializedTx = tx.serialize();

    return sendSerializedTransaction(serializedTx, options);
}

async function sendGasPriceTransaction(to: DataLike, data: DataLike, value: QuantityLike, options: TransactionSendingOptions): Promise<TransactionReceipt> {
    const customCommon = Common.custom(
        {
            name: 'my-network',
            networkId: parseQuantity(options.chainId),
            chainId: parseQuantity(options.chainId),
        },
        {
            baseChain: "mainnet",
            hardfork: 'london',
        }
    );

    const privateKey = parseHexBytes(options.privateKey);
    const accountAddress = privateKeyToAddress(privateKey);

    let recommendedGasPrice= BigInt(0);

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

    const gasPriceHex = toHex(options.gasPrice === undefined ? recommendedGasPrice : options.gasPrice);
    const gasLimitHex = toHex(options.gasLimit === undefined ? 6000000 : options.gasLimit);

    let nonceHex: string;

    if (options.nonce === undefined) {
        const nonceFromRPC = await Web3RPCClient.getInstance().getTransactionCount(accountAddress, "pending", options);
        nonceHex = toHex(nonceFromRPC);
    } else {
        nonceHex = toHex(options.nonce);
    }


    // Build transaction

    const txData: TxData = {
        nonce: nonceHex,
        gasLimit: gasLimitHex,
        gasPrice: gasPriceHex,
    };

    if (to) {
        txData.to = to;
    }

    if (data) {
        txData.data = data;
    }

    if (value) {
        txData.value = value;
    }

    if (options.logFunction) {
        options.logFunction(`Transaction data: ${JSON.stringify(txData)}`);
    }

    let tx = new Transaction(txData, { common: customCommon });

    // Sign transaction
    if (options.logFunction) {
        options.logFunction(`Signing transaction...`);
    }
    tx = tx.sign(privateKey);

    // Serialize transaction
    const serializedTx = tx.serialize();

    return sendSerializedTransaction(serializedTx, options);
}

async function sendSerializedTransaction(serializedTx: Buffer, options: TransactionSendingOptions): Promise<TransactionReceipt> {
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

    while (!receipt) {
        receipt = await Web3RPCClient.getInstance().getTransactionReceipt(txHash, options);

        if (!receipt) {
            // Wait 1 second and try fetching the receipt again
            await (new Promise(function (resolve2) {
                setTimeout(resolve2, 1000);
            }));

            // Check timeout
            if (options.receiptWaitTimeout !== undefined && options.receiptWaitTimeout > 0 && (Date.now() - startTime > options.receiptWaitTimeout)) {
                throw new Error("Timed out after " + options.receiptWaitTimeout + " milliseconds.");
            }
        } else {
            if (options.logFunction) {
                options.logFunction(`Transaction mined: ${toHex(txHash)} / Block: ${toHex(receipt.blockNumber)}`);
            }
        }
    }

    return receipt;
}
