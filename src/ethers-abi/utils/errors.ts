// Error utils

"use strict";

export function isError(e: unknown, name: string): boolean {
    return e instanceof Error && e.name === name;
}

export function makeError(message: string, code: string, info?: any): Error {
    const error = new Error(message + (info ? Object.keys(info).map(k => `${k}=${info[k]}`).join(", ") : ""));
    error.name = code;
    return error;
}

export function assert(check: unknown, message: string, code: string, info?: any) {
    if (!check) { throw makeError(message, code, info); }
}

/**
 *  A simple helper to simply ensuring provided arguments match expected
 *  constraints, throwing if not.
 *
 *  In TypeScript environments, the %%check%% has been asserted true, so
 *  any further code does not need additional compile-time checks.
 */
export function assertArgument(check: unknown, message: string, name: string, value: unknown): asserts check {
    assert(check, message, "INVALID_ARGUMENT", { argument: name, value: value });
}

export function assertArgumentCount(count: number, expectedCount: number, message?: string): void {
    if (!message) { message = ""; }
    else if (message) { message = ": " + message; }

    assert(count >= expectedCount, "missing argument" + message, "MISSING_ARGUMENT", {
        count: count,
        expectedCount: expectedCount
    });

    assert(count <= expectedCount, "too many arguments" + message, "UNEXPECTED_ARGUMENT", {
        count: count,
        expectedCount: expectedCount
    });
}

const _normalizeForms = ["NFD", "NFC", "NFKD", "NFKC"].reduce((accum, form) => {
    try {
        // General test for normalize
        /* c8 ignore start */
        if ("test".normalize(form) !== "test") { throw new Error("bad"); }
        /* c8 ignore stop */

        if (form === "NFD") {
            const check = String.fromCharCode(0xe9).normalize("NFD");
            const expected = String.fromCharCode(0x65, 0x0301)
            /* c8 ignore start */
            if (check !== expected) { throw new Error("broken") }
            /* c8 ignore stop */
        }

        accum.push(form);
    } catch (error) { }

    return accum;
}, <Array<string>>[]);

/**
 *  Throws if the normalization %%form%% is not supported.
 */
export function assertNormalize(form: string): void {
    assert(_normalizeForms.indexOf(form) >= 0, "platform missing String.prototype.normalize", "UNSUPPORTED_OPERATION", {
        operation: "String.prototype.normalize", info: { form }
    });
}

/**
 *  Many classes use file-scoped values to guard the constructor,
 *  making it effectively private. This facilitates that pattern
 *  by ensuring the %%givenGaurd%% matches the file-scoped %%guard%%,
 *  throwing if not, indicating the %%className%% if provided.
 */
export function assertPrivate(givenGuard: any, guard: any, className?: string): void {
    if (!className) { className = ""; }
    if (givenGuard !== guard) {
        let method = className, operation = "new";
        if (className) {
            method += ".";
            operation += " " + className;
        }
        assert(false, `private constructor; use ${method}from* methods`, "UNSUPPORTED_OPERATION", {
            operation
        });
    }
}