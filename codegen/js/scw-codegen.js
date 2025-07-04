// Smart contract wrapper code generation

function generateWrapper(className, abi, omitDetailsFuncs) {
    var result = {
        imports: {},

        deployFn: "",

        viewFn: [],
        txFn: [],

        eventFn: [],
        eventStruct: [],
        eventTypes: [],
    };

    var wrapperName = className + "Wrapper";

    var overloadedMethods = Object.create(null);
    var overloadedMethodsIndex = Object.create(null);
    var methodSet = Object.create(null);

    for (var i = 0; i < abi.length; i++) {
        var entry = abi[i];

        if (entry.type === "function") {
            if (methodSet[entry.name]) {
                overloadedMethods[entry.name] = true;
                overloadedMethodsIndex[entry.name] = 0;
            }
            methodSet[entry.name] = true;
        }
    }

    var hasConstructorEntry = false;

    for (var i = 0; i < abi.length; i++) {
        var entry = abi[i];

        if (entry.type === "constructor") {
            hasConstructorEntry = true;
            result.deployFn = makeDeployFunction(entry, result, className, "    ", omitDetailsFuncs);
        } else if (entry.type === "function") {
            if (entry.stateMutability === "view" || entry.stateMutability === "pure") {
                result.viewFn.push(makeViewFunction(entry, result, "    ", overloadedMethods[entry.name], overloadedMethodsIndex));
            } else {
                result.txFn.push(makeTransactionFunction(entry, result, "    ", className, overloadedMethods[entry.name], overloadedMethodsIndex, omitDetailsFuncs));
            }
        } else if (entry.type === "event") {
            result.eventTypes.push(entry.name);
            result.eventStruct.push(makeEventStruct(entry, result, ""));
            result.eventFn.push(makeEventFunc(entry, result, "    "));
        }
    }

    if (!hasConstructorEntry) {
        result.deployFn = makeDeployFunction({
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        }, result, wrapperName, "    ", omitDetailsFuncs);
    }

    result.imports["SmartContractInterface"] = true;
    if (!omitDetailsFuncs) {
        result.imports["TransactionBuildDetails"] = true;
    }
    result.imports["AddressLike"] = true;
    result.imports["Address"] = true;
    result.imports["QuantityLike"] = true;
    result.imports["BlockTag"] = true;
    result.imports["RPCOptions"] = true;
    result.imports["ABILike"] = true;
    result.imports["SmartContractEvent"] = true;

    var lines = [];

    lines.push('// ' + className + ' contract wrapper');

    lines.push('');

    lines.push('"use strict";');

    lines.push('');

    lines.push('import { ' + Object.keys(result.imports).join(", ") + ' } from "@asanrom/smart-contract-wrapper";');

    lines.push('');

    lines.push('export class ' + wrapperName + ' {');

    lines.push('    public address: Address;');
    lines.push('    private _contractInterface: SmartContractInterface;');

    lines.push('');

    lines.push(result.deployFn);

    lines.push('');

    lines.push('    constructor(address: AddressLike, rpcOptions: RPCOptions) {');
    lines.push('        this._contractInterface = new SmartContractInterface(address, ' + className + '_ABI, rpcOptions);');
    lines.push('        this.address = this._contractInterface.address;');
    lines.push('    }');

    for (var i = 0; i < result.viewFn.length; i++) {
        lines.push('');
        lines.push(result.viewFn[i]);
    }

    for (var i = 0; i < result.txFn.length; i++) {
        lines.push('');
        lines.push(result.txFn[i]);
    }


    lines.push('');
    lines.push('    public async findEvents(fromBlock: QuantityLike | BlockTag, toBlock: QuantityLike | BlockTag): Promise<' + className + 'EventCollection> {');
    lines.push('        const events = await this._contractInterface.findEvents(fromBlock, toBlock);');
    lines.push('        return new ' + className + 'EventCollection(events);');
    lines.push('    }');

    lines.push('}');

    lines.push('');

    lines.push('export type ' + className + "EventType = " + (result.eventTypes.map(function (t) {
        return JSON.stringify(t);
    }).join(" | ") || '"string"') + ';');

    lines.push('');

    lines.push('export class ' + className + "EventCollection" + " {");

    lines.push('    public events: SmartContractEvent[];');

    lines.push('    constructor(events: SmartContractEvent[]) {');
    lines.push('        this.events = events;');
    lines.push('    }');

    lines.push('');

    lines.push('    public length(): number {');
    lines.push('        return this.events.length');
    lines.push('    }');

    lines.push('');

    lines.push('    public getEventType(index: number): ' + className + 'EventType {');
    lines.push('        return <any>this.events[index].name');
    lines.push('    }');

    lines.push('');

    lines.push('    public filter(eventType: ' + className + 'EventType): ' + className + 'EventCollection {');
    lines.push('        return new ' + className + 'EventCollection(this.events.filter(event => event.name === eventType));');
    lines.push('    }');

    for (var i = 0; i < result.eventFn.length; i++) {
        lines.push('');
        lines.push(result.eventFn[i]);
    }


    lines.push('}');

    for (var i = 0; i < result.eventStruct.length; i++) {
        lines.push('');
        lines.push(result.eventStruct[i]);
    }

    lines.push('');

    lines.push('export const ' + className + '_ABI: ABILike = ' + JSON.stringify(abi, null, "    ") + ";")

    return lines.join("\n") + "\n";
}

function makeDeployFunction(entry, result, className, tabSpaces, omitDetailsFuncs) {
    var lines = [];

    var params = makeFunctionParams(entry.inputs, result);

    if (entry.payable) {
        result.imports["QuantityLike"] = true;
        params.push('value: QuantityLike');
    }

    result.imports["BytesLike"] = true;
    params.push('bytecode: BytesLike');

    result.imports["TransactionSendingOptions"] = true;
    params.push('options: TransactionSendingOptions');

    result.imports["deploySmartContract"] = true;

    lines.push('public static async deploy(' + params.join(", ") + '): Promise<' + className + 'Wrapper> {');
    lines.push('    const deployed = await deploySmartContract(bytecode, ' + className + '_ABI, [' + getCallArgumentsList(entry) + '], ' + (entry.payable ? "value" : "0") + ', options);');
    lines.push('    if (deployed.receipt.status > BigInt(0)) {');
    lines.push('        return new ' + className + 'Wrapper(deployed.result, options);');
    lines.push('    } else {');
    lines.push('        throw new Error("Transaction reverted");');
    lines.push('    }');
    lines.push('}');

    if (!omitDetailsFuncs) {
        lines.push('');

        result.imports["getTxBuildDetailsForDeploy"] = true;

        lines.push('public static getDeployTxBuildDetails(' + params.slice(0, params.length - 1).join(", ") + '): TransactionBuildDetails {');
        lines.push('    return getTxBuildDetailsForDeploy(bytecode, ' + className + '_ABI, [' + getCallArgumentsList(entry) + '], ' + (entry.payable ? "value" : "0") + ');');
        lines.push('}');
    }

    return lines.map(function (l) {
        return tabSpaces + l;
    }).join("\n");
}

function makeFunctionParams(inputs, result) {
    return inputs.map(function (i, j) {
        return (i.name || ("param_" + j)) + ": " + getABITypescriptType(i, result, true);
    });
}

function getCallArgumentsList(entry) {
    return entry.inputs.map(function (i, j) { return i.name || "param_" + j; }).join(", ");
}

function getABITypescriptType(abi, result, isInput) {
    let abiType = abi.type + "";
    var matchArray = (/\[([0-9]+)?\]$/).exec(abiType);
    var isArray;

    if (matchArray) {
        isArray = true;
        abiType = abiType.substr(0, abiType.length - matchArray[0].length)
    } else {
        isArray = false;
    }

    if (abiType === "address") {
        if (isInput) {
            result.imports["AddressLike"] = true;
            return "AddressLike" + (isArray ? "[]" : "");
        } else {
            result.imports["Address"] = true;
            return "Address" + (isArray ? "[]" : "");
        }
    } else if (abiType === "string") {
        return "string" + (isArray ? "[]" : "");
    } else if (abiType === "bool") {
        return "boolean" + (isArray ? "[]" : "");
    } else if ((/^(u)?int([0-9]+)?$/).test(abiType)) {
        if (isInput) {
            result.imports["QuantityLike"] = true;
            return "QuantityLike" + (isArray ? "[]" : "");
        } else {
            result.imports["Quantity"] = true;
            return "Quantity" + (isArray ? "[]" : "");
        }
    } else if ((/^bytes([0-9]+)?$/).test(abiType)) {
        if (isInput) {
            result.imports["BytesLike"] = true;
            return "BytesLike" + (isArray ? "[]" : "");
        } else {
            return "string" + (isArray ? "[]" : "");
        }
    } else if (abiType === "tuple" && abi.components) {
        // Tuple
        return "[" + abi.components.map(function (t, i) {
            return (t.name || "t_" + i) + ": " + getABITypescriptType(t, result, isInput);
        }).join(", ") + "]" + (isArray ? "[]" : "");
    }
}

function makeFunctionResultType(outputs, outType, result) {
    if (outType === "void") {
        return "void";
    } else if (outType === "single") {
        return getABITypescriptType(outputs[0], result, false);
    } else if (outType === "tuple") {
        return "[" + outputs.map(function (o) {
            return getABITypescriptType(o, result, false);
        }).join(", ") + "]";
    } else if (outType === "struct") {
        return "{" + outputs.map(function (o) {
            return o.name + ": " + getABITypescriptType(o, result, false);
        }).join(", ") + "}";
    } else {
        return "any";
    }
}

function makeViewFunction(entry, result, tabSpaces, isOverloaded, overloadedMethodsIndex) {
    var lines = [];

    var params = makeFunctionParams(entry.inputs, result);

    result.imports["MethodCallingOptions"] = true;
    params.push('options?: MethodCallingOptions');

    var outType;

    if (entry.outputs.length === 0) {
        outType = "void";
    } else if (entry.outputs.length === 1) {
        outType = "single";
    } else {
        outType = "struct";
        for (var i = 0; i < entry.outputs.length; i++) {
            if (!entry.outputs[i].name) {
                outType = "tuple";
                break;
            }
        }
    }

    var methodName = entry.name;

    if (isOverloaded) {
        methodName += "__" + overloadedMethodsIndex[entry.name];
        overloadedMethodsIndex[entry.name]++;
        result.imports["FunctionFragment"] = true;
    }

    lines.push('public async ' + methodName + '(' + params.join(", ") + '): Promise<' + makeFunctionResultType(entry.outputs, outType, result) + '> {');

    lines.push('    ' + (outType === "void" ? "" : 'const __r: any = ') + 'await this._contractInterface.callViewMethod(' + sanitizeMethodEntry(entry, isOverloaded) + ', [' + getCallArgumentsList(entry) + '], options || {});');

    if (outType === "single") {
        lines.push('    return __r[0]');
    } else if (outType === "tuple") {
        lines.push('    return __r');
    } else if (outType === "struct") {
        lines.push('    return {');
        for (var i = 0; i < entry.outputs.length; i++) {
            var out = entry.outputs[i];
            lines.push('        ' + out.name + ': __r[' + i + ']' + ',');
        }
        lines.push('    };');
    }

    lines.push('}');

    return lines.map(function (l) {
        return tabSpaces + l;
    }).join("\n");
}

function makeTransactionFunction(entry, result, tabSpaces, className, isOverloaded, overloadedMethodsIndex, omitDetailsFuncs) {
    var lines = [];

    var resultName = className + "EventCollection";

    var params = makeFunctionParams(entry.inputs, result);

    if (entry.payable) {
        result.imports["QuantityLike"] = true;
        params.push('value: QuantityLike');
    }

    result.imports["MethodTransactionOptions"] = true;
    params.push('options: MethodTransactionOptions');

    result.imports["SmartContractEvent"] = true;
    result.imports["TransactionResult"] = true;

    var methodName = entry.name;

    if (isOverloaded) {
        methodName += "__" + overloadedMethodsIndex[entry.name];
        overloadedMethodsIndex[entry.name]++;
        result.imports["FunctionFragment"] = true;
    }

    lines.push('public async ' + methodName + '(' + params.join(", ") + '): Promise<TransactionResult<' + resultName + '>> {');

    if (entry.payable) {
        lines.push('    const __r = await this._contractInterface.callPayableMethod(' + sanitizeMethodEntry(entry, isOverloaded) + ', [' + getCallArgumentsList(entry) + '], value, options);');
    } else {
        lines.push('    const __r = await this._contractInterface.callMutableMethod(' + sanitizeMethodEntry(entry, isOverloaded) + ', [' + getCallArgumentsList(entry) + '], options);');
    }

    lines.push('');

    lines.push('    if (__r.receipt.status > BigInt(0)) {');
    lines.push('        const decodedEvents = this._contractInterface.parseTransactionLogs(__r.receipt.logs)');
    lines.push('        return { receipt: __r.receipt, result: new ' + resultName + '(decodedEvents) };');
    lines.push('    } else {')
    lines.push('        throw new Error("Transaction reverted");');
    lines.push('    }');

    lines.push('}');

    if (!omitDetailsFuncs) {
        lines.push('');

        lines.push('public ' + methodName + '$txBuildDetails(' + params.slice(0, params.length - 1).join(", ") + '): TransactionBuildDetails {');

        if (entry.payable) {
            lines.push('    return this._contractInterface.encodePayableMethod(' + sanitizeMethodEntry(entry, isOverloaded) + ', [' + getCallArgumentsList(entry) + '], value);');
        } else {
            lines.push('    return this._contractInterface.encodeMutableMethod(' + sanitizeMethodEntry(entry, isOverloaded) + ', [' + getCallArgumentsList(entry) + ']);');
        }

        lines.push('}');
    }

    return lines.map(function (l) {
        return tabSpaces + l;
    }).join("\n");
}

function makeEventStruct(entry, result, tabSpaces) {
    var lines = [];

    lines.push('export interface ' + entry.name + 'Event {');

    for (var i = 0; i < entry.inputs.length; i++) {
        var out = entry.inputs[i];
        lines.push('    ' + (out.name || ("_" + i)) + ': ' + getABITypescriptType(out, result, false) + ",");
    }

    lines.push('}');

    return lines.map(function (l) {
        return tabSpaces + l;
    }).join("\n");
}

function makeEventFunc(entry, result, tabSpaces) {
    var lines = [];

    result.imports["SmartContractEventWrapper"] = true;
    result.imports["SmartContractEvent"] = true;
    lines.push('public get' + entry.name + 'Event(index: number): SmartContractEventWrapper<' + entry.name + 'Event> {');


    lines.push('    const __r: any = this.events[index].parameters;');
    lines.push('    return {');
    lines.push('        event: this.events[index],');
    lines.push('        data: {');

    for (var i = 0; i < entry.inputs.length; i++) {
        var out = entry.inputs[i];
        lines.push('            ' + out.name + ': __r[' + i + ']' + ',');
    }

    lines.push('        },');

    lines.push('    };');

    lines.push('}');

    return lines.map(function (l) {
        return tabSpaces + l;
    }).join("\n");
}

function sanitizeMethodEntry(entry, isOverloaded) {
    if (!isOverloaded) {
        return JSON.stringify(entry.name);
    }

    return "FunctionFragment.from(" + JSON.stringify(entry) + ")";
}
