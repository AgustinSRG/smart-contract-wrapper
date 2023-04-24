// Smart contract wrapper codegen

function generateWrappper(className, abi) {
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

    for (var i = 0; i < abi.length; i++) {
        var entry = abi[i];

        if (entry.type === "constructor") {
            result.deployFn = makeDeployFunction(entry, result, wrapperName, "    ");
        } else if (entry.type === "function") {
            if (entry.stateMutability === "view" || entry.stateMutability === "pure") {
                result.viewFn.push(makeViewFunction(entry, result, "    ", overloadedMethods[entry.name], overloadedMethodsIndex));
            } else {
                result.txFn.push(makeTransactionFunction(entry, result, "    ", className, overloadedMethods[entry.name], overloadedMethodsIndex));
            }
        } else if (entry.type === "event") {
            result.eventTypes.push(entry.name);
            result.eventStruct.push(makeEventStruct(entry, result, ""));
            result.eventFn.push(makeEventFunc(entry, result, "    "));
        }
    }

    result.imports["SmartContractInterface"] = true;
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
    lines.push('        this._contractInterface = new SmartContractInterface(address, CONTRACT_ABI, rpcOptions);');
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

    lines.push('export class ' +  className + "EventCollection" + " {");

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

    lines.push('const CONTRACT_ABI: ABILike = ' + JSON.stringify(abi, null, "    ") + ";")

    return lines.join("\n") + "\n";
}

function makeDeployFunction(entry, result, className, tabSpaces) {
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

    lines.push('public static async deploy(' + params.join(", ") + '): Promise<' + className + '> {');
    lines.push('    const deployed = await deploySmartContract(bytecode, CONTRACT_ABI, [' + getCallArgumentsList(entry) + '], ' + (entry.payable ? "value" : "0") + ', options);');
    lines.push('    if (deployed.receipt.status > BigInt(0)) {');
    lines.push('        return new ' + className + '(deployed.result, options);');
    lines.push('    } else {');
    lines.push('        throw new Error("Transaction reverted");');
    lines.push('    }');
    lines.push('}');

    return lines.map(function (l) {
        return tabSpaces + l;
    }).join("\n");
}

function makeFunctionParams(inputs, result) {
    return inputs.map(function (i, j) {
        return (i.name || ("param_" + j)) + ": " + getABITypescriptType(i.type, result, true);
    });
}

function getCallArgumentsList(entry) {
    return entry.inputs.map(function (i, j) { return i.name || "param_" + j; }).join(", ");
}

function getABITypescriptType(abiType, result, isInput) {
    abiType = abiType + "";
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
    } else if ((/^\(.*\)$/).test(abiType)) {
        // Tuple
        var innerText = abiType.substr(1, abiType.length - 1)
        var tName = "";
        var openTupleCount = 0;

        var typeArray = [];

        for (var i = 0; i < innerText.length; i++) {
            var c = innerText.charAt(i);

            if (c === "(") {
                tName += c;
                openTupleCount++;
            } else if (c === ")") {
                tName += c;
                openTupleCount--;
            } else if (c === "," && openTupleCount === 0) {
                typeArray.push(tName);
                tName = "";
            } else {
                tName += c;
            }
        }

        if (tName) {
            typeArray.push(tName);
        }

        return "[" + typeArray.map(function (t) {
            return getABITypescriptType(t, result, isInput);
        }).join(", ") + "]";
    }
}

function makeFunctionResultType(outputs, outType, result) {
    if (outType === "void") {
        return "void";
    } else if (outType === "single") {
        return getABITypescriptType(outputs[0].type, result, false);
    } else if (outType === "tuple") {
        return "[" + outputs.map(function (o) {
            return getABITypescriptType(o.type, result, false);
        }).join(", ") + "]";
    } else if (outType === "struct") {
        return "{" + outputs.map(function (o) {
            return o.name + ": " + getABITypescriptType(o.type, result, false);
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

    lines.push('    ' + (outType === "void" ? "" : 'const result: any = ') + 'await this._contractInterface.callViewMethod(' + sanitizeMethodEntry(entry, isOverloaded) + ', [' + getCallArgumentsList(entry) + '], options || {});');

    if (outType === "single") {
        lines.push('    return result[0]');
    } else if (outType === "tuple") {
        lines.push('    return result');
    } else if (outType === "struct") {
        lines.push('    return {');
        for (var i = 0; i < entry.outputs.length; i++) {
            var out = entry.outputs[i];
            lines.push('        ' + out.name + ': result[' + i + ']' + ',');
        }
        lines.push('    };');
    }

    lines.push('}');

    return lines.map(function (l) {
        return tabSpaces + l;
    }).join("\n");
}

function makeTransactionFunction(entry, result, tabSpaces, className, isOverloaded, overloadedMethodsIndex) {
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
        lines.push('    const result = await this._contractInterface.callPayableMethod(' + sanitizeMethodEntry(entry, isOverloaded) + ', [' + getCallArgumentsList(entry) + '], value, options);');
    } else {
        lines.push('    const result = await this._contractInterface.callMutableMethod(' + sanitizeMethodEntry(entry, isOverloaded) + ', [' + getCallArgumentsList(entry) + '], options);');
    }

    lines.push('');

    lines.push('    if (result.receipt.status > BigInt(0)) {');
    lines.push('        const decodedEvents = this._contractInterface.parseTransactionLogs(result.receipt.logs)');
    lines.push('        return { receipt: result.receipt, result: new ' + resultName + '(decodedEvents) };');
    lines.push('    } else {')
    lines.push('        throw new Error("Transaction reverted");');
    lines.push('    }');

    lines.push('}');

    return lines.map(function (l) {
        return tabSpaces + l;
    }).join("\n");
}

function makeEventStruct(entry, result, tabSpaces) {
    var lines = [];

    lines.push('export interface ' + entry.name + 'Event {');

    for (var i = 0; i < entry.inputs.length; i++) {
        var out = entry.inputs[i];
        lines.push('    ' + (out.name || ("_" + i)) + ': ' + getABITypescriptType(out.type, result, false) + ",");
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


    lines.push('    const result: any = this.events[index].parameters;');
    lines.push('    return {');
    lines.push('        event: this.events[index],');
    lines.push('        data: {');

    for (var i = 0; i < entry.inputs.length; i++) {
        var out = entry.inputs[i];
        lines.push('            ' + out.name + ': result[' + i + ']' + ',');
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

    return "FunctionFragment.fromObject(" + JSON.stringify(entry) + ")";
}
