// Utils

"use strict"

export type DataLike = string | Buffer;
export type QuantityLike = string | number | bigint;

/**
 * Parses quantity from RPC result
 * @param q The quantity as number or string
 * @returns The quantity as bigint
 */
export function parseQuantity(q: QuantityLike): bigint {
    if (typeof q === "number") {
        return BigInt(q);
    } else if (typeof q === "string") {
        return BigInt(hexWithPrefix(q));
    } else if (typeof q === "bigint") {
        return q;
    } else {
        return BigInt(0);
    }
}

/**
 * Parses bytes from RPC result
 * @param b The bytes as hex string
 * @returns The bytes as buffer
 */
export function parseHexBytes(b: DataLike): Buffer {
    if (typeof b === "string") {
        return Buffer.from(hexNoPrefix(b), "hex");
    } else if (b instanceof Buffer) {
        return b;
    } else {
        return Buffer.from(new Uint8Array([])); // Empty buffer
    }
}

/**
 * Encodes to hex to send to RPC
 * @param b Input number or buffer
 * @returns The hex string
 */
export function toHex(b: QuantityLike | DataLike): string {
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