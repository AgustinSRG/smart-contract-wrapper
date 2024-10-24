// Events parsing utils

"use strict"

import { JsonFragment, Result, Interface } from "@asanrom/ethers-abi";
import { keccak256 } from 'ethereum-cryptography/keccak';
import { normalizeABIResult, toHex } from "./utils";
import { ABILike, SmartContractEvent, TransactionLog } from "./types";

/**
 * Interprets transaction log
 * @param log Transaction log
 * @param abi Smart contract ABI
 * @returns The smart contract event, or null if it cannot be decoded
 */
export function interpretLog(log: TransactionLog, abi: ABILike, contractInterface: Interface): SmartContractEvent {
    let eventEntry: JsonFragment;
    let eventSignature: string;

    if (!log.topics || log.topics.length === 0) {
        return null;
    }

    const hashTopic = log.topics[0];

    for (const entry of abi) {
        if (entry.type !== "event") continue;
        const signature = entry.name + "(" + entry.inputs.map(input => input.type).join(",") + ")";
        const hash = Buffer.from(keccak256(Buffer.from(signature, "utf8")));

        if (Buffer.compare(hash, hashTopic) === 0) {
            eventEntry = entry;
            eventSignature = signature;
            break;
        }
    }

    if (!eventEntry) {
        return null;
    }

    let data: Result;

    try {
        data = contractInterface.decodeEventLog(eventEntry.name, log.data, log.topics.map(l => toHex(l)));
    } catch (ex) {
        return null;
    }

    return {
        name: eventEntry.name,
        signature: eventSignature,
        parameters: normalizeABIResult(data),
        log: log,
    };
}
