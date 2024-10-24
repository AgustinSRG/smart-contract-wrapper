import { toUtf8Bytes, toUtf8String } from "../../utils/utf8";

import { Typed } from "../typed";
import { DynamicBytesCoder } from "./bytes";

import type { Reader, Writer } from "./abstract-coder";


/**
 *  @_ignore
 */
export class StringCoder extends DynamicBytesCoder {

    constructor(localName: string) {
        super("string", localName);
    }

    defaultValue(): string {
        return "";
    }

    encode(writer: Writer, _value: string | Typed): number {
        return super.encode(writer, toUtf8Bytes(Typed.dereference(_value, "string")));
    }

    decode(reader: Reader): any {
        return toUtf8String(super.decode(reader));
    }
}
