// Utils

"use strict"

import { Result } from "@ethersproject/abi";
import { Address, AddressLike, Bytes, BytesLike, InputParam, OutputABIParam, OutputABIParams, Quantity, QuantityLike } from "./types";
import { BigNumber } from "@ethersproject/bignumber";

/**
 * Parses address from RPC result
 * @param a Input string
 * @returns Address with the 0x prefix (20 bytes)
 */
export function parseAddress(a: AddressLike): Address {
    if (typeof a === "string") {
        const buf = Buffer.from(hexNoPrefix(a), "hex");
        if (buf.length !== 20) {
            throw new Error("Invalid address: " + a);
        }
        return hexWithPrefix(buf.toString("hex"));
    } else {
        return null;
    }
}

/**
 * Ensures output ABI param is an address
 * If cannot be parsed, it will throw an error
 * @param o The output ABI param
 * @returns The address
 */
export function outputToAddress(o: OutputABIParam): Address {
    if (typeof o === "string") {
        return o;
    } else if (o instanceof Buffer) {
        return parseAddress(hexWithPrefix(o.toString("hex")));
    } else {
        throw new Error("Invalid address");
    }
}

/**
 * Parses quantity from RPC result
 * @param q The quantity as number or string
 * @returns The quantity as bigint
 */
export function parseQuantity(q: QuantityLike): Quantity {
    if (typeof q === "number") {
        return BigInt(q);
    } else if (typeof q === "string") {
        return BigInt(q);
    } else if (typeof q === "bigint") {
        return q;
    } else {
        return BigInt(0);
    }
}

/**
 * Ensures output ABI param is a quantity
 * If cannot be parsed, it will throw an error
 * @param o The output ABI param
 * @returns The quantity
 */
export function outputToQuantity(o: OutputABIParam): Quantity {
    if (typeof o === "bigint") {
        return o;
    } else if (typeof o === "number") {
        return BigInt(o);
    } else if (typeof o === "string") {
        return BigInt(o);
    } else {
        return BigInt(0);
    }
}

/**
 * Parses bytes from RPC result
 * @param b The bytes as hex string
 * @returns The bytes as buffer
 */
export function parseBytes(b: BytesLike): Bytes {
    if (typeof b === "string") {
        return Buffer.from(hexNoPrefix(b), "hex");
    } else if (b instanceof Buffer) {
        return b;
    } else {
        return Buffer.from(new Uint8Array([])); // Empty buffer
    }
}

/**
 * Ensures output ABI param is a byte array
 * If cannot be parsed, it will throw an error
 * @param o The output ABI param
 * @returns The byte array
 */
export function outputToBytes(o: OutputABIParam): Bytes {
    if (typeof o === "string") {
        return Buffer.from(hexNoPrefix(o), "hex");
    } else if (o instanceof Buffer) {
        return o;
    } else {
        return Buffer.from(new Uint8Array([])); // Empty buffer
    }
}

/**
 * Ensures output ABI param is a boolean
 * If cannot be parsed, it will throw an error
 * @param o The output ABI param
 * @returns The boolean
 */
export function outputToBoolean(o: OutputABIParam): boolean {
    return !!o;
}

/**
 * Ensures output ABI param is a string
 * If cannot be parsed, it will throw an error
 * @param o The output ABI param
 * @returns The string
 */
export function outputToString(o: OutputABIParam): string {
    return o + "";
}

/**
 * Ensures output ABI param is a tuple
 * If cannot be parsed, it will throw an error
 * @param o The output ABI param
 * @returns The tuple
 */
export function outputToTuple(o: OutputABIParam): OutputABIParam[] {
    if (Array.isArray(o)) {
        return o;
    } else {
        return [];
    }
}

/**
 * Encodes to hex to send to RPC
 * @param b Input number or buffer
 * @returns The hex string
 */
export function toHex(b: InputParam): string {
    if (typeof b === "number") {
        return hexWithPrefix((BigInt(b)).toString(16));
    } else if (typeof b === "bigint") {
        return hexWithPrefix(b.toString(16));
    } else if (typeof b === "string") {
        return hexWithPrefix(b);
    } else if (b instanceof Buffer) {
        return hexWithPrefix(b.toString("hex"));
    } else {
        return undefined;
    }
}

/**
 * Adds the prefix 0x to a hex string (if not already present)
 * @param hex The hex input
 * @returns The hex string starting with 0x
 */
export function hexWithPrefix(hex: string) {
    hex = (hex + "").toLowerCase();

    if (hex.substr(0, 2) !== "0x") {
        hex = "0x" + hex;
    }

    return hex;
}

/**
 * Strips the 0x prefix from a hex string
 * @param hex The hex input
 * @returns The hex string without the 0x prefix
 */
export function hexNoPrefix(hex: string) {
    hex = (hex + "").toLowerCase();

    if (hex.substr(0, 2) !== "0x") {
        return hex;
    } else {
        return hex.substr(2);
    }
}

/**
 * Normalizes ABI result
 * @param i Regular ABI result
 * @returns Normalized ABI result
 */
export function normalizeABIResult(i: Result): OutputABIParams {
    const r = [];

    for (const b of i) {
        if (b instanceof Uint8Array) {
            r.push(Buffer.from(b));
        } else if (b instanceof BigNumber) {
            r.push(b.toBigInt());
        } else if (Array.isArray(b)) {
            r.push(normalizeABIResult(b));
        } else {
            r.push(b);
        }
    }

    return r;
}
