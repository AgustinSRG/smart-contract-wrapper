// Account management utils

"use strict";

import { keccak256 } from 'ethereum-cryptography/keccak'
import { Point } from 'ethereum-cryptography/secp256k1'

/**
 * Generates an address from a public key
 * @param pubKey The public key
 * @returns The address
 */
export function publicKeyToAddress(pubKey: Buffer): Buffer {
    return Buffer.from(keccak256(pubKey)).slice(-20);
}

/**
 * Generates address from a private key
 * @param privateKey The private key
 * @returns The address
 */
export function privateKeyToAddress(privateKey: Buffer): Buffer {
    const publicKey = Buffer.from(Point.fromPrivateKey(privateKey).toRawBytes(false).slice(1));
    return publicKeyToAddress(publicKey);
}
