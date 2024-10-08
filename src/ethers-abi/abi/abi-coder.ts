/* eslint eqeqeq: 0 */

/**
 *  When sending values to or receiving values from a [[Contract]], the
 *  data is generally encoded using the [ABI standard](link-solc-abi).
 *
 *  The AbiCoder provides a utility to encode values to ABI data and
 *  decode values from ABI data.
 *
 *  Most of the time, developers should favour the [[Contract]] class,
 *  which further abstracts a lot of the finer details of ABI data.
 *
 *  @_section api/abi/abi-coder:ABI Encoding
 */

// See: https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI

import { assertArgumentCount, assertArgument } from "../utils/index";

import { Coder, Reader, Result, Writer } from "./coders/abstract-coder";
import { AddressCoder } from "./coders/address";
import { ArrayCoder } from "./coders/array";
import { BooleanCoder } from "./coders/boolean";
import { BytesCoder } from "./coders/bytes";
import { FixedBytesCoder } from "./coders/fixed-bytes";
import { NullCoder } from "./coders/null";
import { NumberCoder } from "./coders/number";
import { StringCoder } from "./coders/string";
import { TupleCoder } from "./coders/tuple";
import { ParamType } from "./fragments";

import type {
    BytesLike,
} from "../utils/index";

// https://docs.soliditylang.org/en/v0.8.17/control-structures.html
const PanicReasons: Map<number, string> = new Map();
PanicReasons.set(0x00, "GENERIC_PANIC");
PanicReasons.set(0x01, "ASSERT_FALSE");
PanicReasons.set(0x11, "OVERFLOW");
PanicReasons.set(0x12, "DIVIDE_BY_ZERO");
PanicReasons.set(0x21, "ENUM_RANGE_ERROR");
PanicReasons.set(0x22, "BAD_STORAGE_DATA");
PanicReasons.set(0x31, "STACK_UNDERFLOW");
PanicReasons.set(0x32, "ARRAY_RANGE_ERROR");
PanicReasons.set(0x41, "OUT_OF_MEMORY");
PanicReasons.set(0x51, "UNINITIALIZED_FUNCTION_CALL");

const paramTypeBytes = new RegExp(/^bytes([0-9]*)$/);
const paramTypeNumber = new RegExp(/^(u?int)([0-9]*)$/);


let defaultCoder: null | AbiCoder = null;
let defaultMaxInflation = 1024;

/**
 *  The **AbiCoder** is a low-level class responsible for encoding JavaScript
 *  values into binary data and decoding binary data into JavaScript values.
 */
export class AbiCoder {

    #getCoder(param: ParamType): Coder {
        if (param.isArray()) {
            return new ArrayCoder(this.#getCoder(param.arrayChildren), param.arrayLength, param.name);
        }

        if (param.isTuple()) {
            return new TupleCoder(param.components.map((c) => this.#getCoder(c)), param.name);
        }

        switch (param.baseType) {
        case "address":
            return new AddressCoder(param.name);
        case "bool":
            return new BooleanCoder(param.name);
        case "string":
            return new StringCoder(param.name);
        case "bytes":
            return new BytesCoder(param.name);
        case "":
            return new NullCoder(param.name);
        }

        // u?int[0-9]*
        let match = param.type.match(paramTypeNumber);
        if (match) {
            const size = parseInt(match[2] || "256");
            assertArgument(size !== 0 && size <= 256 && (size % 8) === 0,
                "invalid " + match[1] + " bit length", "param", param);
            return new NumberCoder(size / 8, (match[1] === "int"), param.name);
        }

        // bytes[0-9]+
        match = param.type.match(paramTypeBytes);
        if (match) {
            const size = parseInt(match[1]);
            assertArgument(size !== 0 && size <= 32, "invalid bytes length", "param", param);
            return new FixedBytesCoder(size, param.name);
        }

        assertArgument(false, "invalid type", "type", param.type);
    }

    /**
     *  Get the default values for the given %%types%%.
     *
     *  For example, a ``uint`` is by default ``0`` and ``bool``
     *  is by default ``false``.
     */
    getDefaultValue(types: ReadonlyArray<string | ParamType>): Result {
        const coders: Array<Coder> = types.map((type) => this.#getCoder(ParamType.from(type)));
        const coder = new TupleCoder(coders, "_");
        return coder.defaultValue();
    }

    /**
     *  Encode the %%values%% as the %%types%% into ABI data.
     *
     *  @returns DataHexstring
     */
    encode(types: ReadonlyArray<string | ParamType>, values: ReadonlyArray<any>): string {
        assertArgumentCount(values.length, types.length, "types/values length mismatch");

        const coders = types.map((type) => this.#getCoder(ParamType.from(type)));
        const coder = (new TupleCoder(coders, "_"));

        const writer = new Writer();
        coder.encode(writer, values);
        return writer.data;
    }

    /**
     *  Decode the ABI %%data%% as the %%types%% into values.
     *
     *  If %%loose%% decoding is enabled, then strict padding is
     *  not enforced. Some older versions of Solidity incorrectly
     *  padded event data emitted from ``external`` functions.
     */
    decode(types: ReadonlyArray<string | ParamType>, data: BytesLike, loose?: boolean): Result {
        const coders: Array<Coder> = types.map((type) => this.#getCoder(ParamType.from(type)));
        const coder = new TupleCoder(coders, "_");
        return coder.decode(new Reader(data, loose, defaultMaxInflation));
    }

    static _setDefaultMaxInflation(value: number): void {
        assertArgument(typeof(value) === "number" && Number.isInteger(value), "invalid defaultMaxInflation factor", "value", value);
        defaultMaxInflation = value;
    }

    /**
     *  Returns the shared singleton instance of a default [[AbiCoder]].
     *
     *  On the first call, the instance is created internally.
     */
    static defaultAbiCoder(): AbiCoder {
        if (defaultCoder == null) {
            defaultCoder = new AbiCoder();
        }
        return defaultCoder;
    }
}
