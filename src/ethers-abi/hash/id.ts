
import { keccak256Hex } from "../crypto";
import { toUtf8Bytes } from "../utils/utf8";


/**
 *  A simple hashing function which operates on UTF-8 strings to
 *  compute an 32-byte identifier.
 *
 *  This simply computes the [UTF-8 bytes](toUtf8Bytes) and computes
 *  the [[keccak256]].
 *
 *  @example:
 *    id("hello world")
 *    //_result:
 */
export function id(value: string): string {
    return keccak256Hex(toUtf8Bytes(value));
}