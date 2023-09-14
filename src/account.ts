// Account management utils

"use strict";
import { keccak256 } from 'ethereum-cryptography/keccak'
import { secp256k1 } from 'ethereum-cryptography/secp256k1'
import { Address } from './types';
import { hexWithPrefix } from './utils';

/**
 * Generates an address from a public key
 * @param pubKey The public key
 * @returns The address
 */
export function publicKeyToAddress(pubKey: Buffer): Address {
    return hexWithPrefix(Buffer.from(keccak256(pubKey)).slice(-20).toString("hex"));
}

/**
 * Generates address from a private key
 * @param privateKey The private key
 * @returns The address
 */
export function privateKeyToAddress(privateKey: Buffer): Address {
    const publicKey = Buffer.from(secp256k1.ProjectivePoint.fromPrivateKey(privateKey).toRawBytes(false).slice(1));
    return publicKeyToAddress(publicKey);
}
