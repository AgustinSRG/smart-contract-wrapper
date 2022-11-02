// Websocket provider

"use strict";

import EventEmitter from "events";
import { WebSocket } from "ws";
import { RPCProvider } from "./types";

/**
 * Options for the websocket provider
 */
export interface RPC_WS_Provider_Options {
    /**
     * Number of connections to open. By default 1.
     */
    numConnections: number;

    /**
     * Number of milliseconds to wait for reconnection
     * By default 2000
     */
    reconnectDelay: number;
}

interface PendingRequest {
    id: number;
    payload: string;
    sent: boolean;
    resolve: (data: any) => void;
    reject: (err: Error) => void;
}

export declare interface RPC_WebSocket_Provider {
    /**
     * Error event, emitted for connection errors
     */
    on(event: "error", listener: (err: Error) => void): this;
}

/**
 * HTTP provider for JSON-RPC requests
 */
export class RPC_WebSocket_Provider extends EventEmitter implements RPCProvider {
    public url: URL;

    private internalID: number;

    private connections: WebSocketConnectionManager[];

    private requests: Map<number, PendingRequest>;
    private queue: number[];

    constructor(url: string | URL, options?: RPC_WS_Provider_Options) {
        super();
        if (typeof url === "string") {
            this.url = new URL(url);
        } else {
            this.url = url;
        }
        if (!(['ws:', 'wss:'].includes(this.url.protocol))) {
            throw new Error("Invalid URL given for the WebSocket provider: " + this.url.toString());
        }
        const numConnections = options !== undefined ? (options.numConnections || 1) : 1;

        this.requests = new Map();
        this.queue = [];
        this.connections = [];

        for (let i = 0; i < numConnections; i++) {
            const connection = new WebSocketConnectionManager(this.url, options !== undefined ? (options.reconnectDelay || 2000) : 2000);

            connection.on("error", (err => {
                this.emit("error", err);
            }));

            connection.on("response", this.onResponse.bind(this));

            connection.connect();

            this.connections.push(connection);
        }
    }

    private getNextRequestID(): number {
        this.internalID++;
        return this.internalID;
    }

    private onResponse(request: PendingRequest, responseData: any) {
        if (!this.requests.has(request.id)) {
            // Request was interrupted
            this.handleRequestQueue();
            return;
        }

        this.requests.delete(request.id);

        if (responseData.error) {
            return request.reject(new Error("Error code " + responseData.error.code + " / " + responseData.error.message));
        }

        request.resolve(responseData.result);

        this.handleRequestQueue();
    }

    private handleRequestQueue() {
        if (this.queue.length === 0) {
            return;
        }

        while (this.queue.length > 0) {
            const queueHead = this.queue[0];
            const request = this.requests.get(queueHead);

            let everythingBusy = true;

            for (const con of this.connections) {
                if (con.busy) {
                    continue;
                }

                con.send(request);

                this.queue.shift(); // Remove from queue
                request.sent = true;

                everythingBusy = false;
                break;
            }

            if (everythingBusy) {
                return;
            }
        }
    }

    /**
     * Performs a JSON-RPC request
     * @param method RPC Method
     * @param params Method parameters
     * @param timeout Timeout in ms
     * @returns The JSON RPC result
     */
    public async rpcRequest(method: string, params: any[], timeout: number): Promise<any> {
        const requestID = this.getNextRequestID();
        const requestPayload = {
            jsonrpc: "2.0",
            method: method,
            params: params,
            id: requestID,
        };

        return new Promise<any>((resolve, reject) => {
            let timer: NodeJS.Timeout;

            const resolveFunc = (data: any) => {
                if (timer !== undefined) {
                    clearTimeout(timer);
                }
                resolve(data);
            };

            const rejectFunc = (err: Error) => {
                if (timer !== undefined) {
                    clearTimeout(timer);
                }
                reject(err);
            };

            const request: PendingRequest = {
                id: requestID,
                payload: JSON.stringify(requestPayload),
                sent: false,
                resolve: resolveFunc,
                reject: rejectFunc,
            };

            if (timeout !== undefined && timeout > 0) {
                timer = setTimeout(() => {
                    this.onResponse(request, {
                        error: {
                            code: -1,
                            message: "Timed out",
                        }
                    });
                }, timeout);
            }

            this.requests.set(requestID, request);
            this.queue.push(requestID);

            this.handleRequestQueue();
        });
    }

    /**
     * Closes all the active connections
     */
    public destroy() {
        this.connections.forEach(con => {
            con.close();
        });

        this.queue = [];

        this.requests.forEach(request => {
            request.reject(new Error("Provider was destroyed"));
        });
    }
}

class WebSocketConnectionManager extends EventEmitter {
    public url: URL;

    public busy: boolean;

    private pendingRequest: PendingRequest;

    private ws: WebSocket;

    private connected: boolean;

    private reconnectTimeout: NodeJS.Timeout;

    private reconnectDelay: number;

    constructor(url: URL, reconnectDelay: number) {
        super();
        this.url = url;
        this.busy = false;
        this.pendingRequest = null;
        this.ws = null;
        this.reconnectTimeout = null;
        this.reconnectDelay = reconnectDelay;
    }

    public connect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.removeAllListeners();
            this.ws.close();
            this.ws = null;
        }

        this.connected = false;

        this.ws = new WebSocket(this.url);

        this.ws.on("open", this.onOpen.bind(this));
        this.ws.on("message", this.onMessage.bind(this));
        this.ws.on("close", this.onClose.bind(this));
        this.ws.on("error", this.onError.bind(this));
    }

    private reconnect() {
        this.reconnectTimeout = null;
        this.connect();
    }

    private onOpen() {
        this.connected = true;
        if (this.pendingRequest) {
            this.ws.send(this.pendingRequest.payload);
        }
    }

    private onClose() {
        this.ws.removeAllListeners();
        this.ws = null;
        this.connected = false;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        this.reconnectTimeout = setTimeout(this.reconnect.bind(this), this.reconnectDelay);
    }

    private onError(err: Error) {
        this.emit("error", err);
    }

    private onMessage(data: Buffer) {
        if (!(data instanceof Buffer)) {
            return;
        }

        const request = this.pendingRequest;

        if (!request) {
            return;
        }

        const dataString = data.toString("utf8");

        let parsedData: any;

        try {
            parsedData = JSON.parse(dataString);
        } catch (ex) {
            this.emit("error", ex);
            return;
        }

        this.busy = false;
        this.pendingRequest = null;

        this.emit("response", request, parsedData);
    }

    public send(request: PendingRequest) {
        if (this.busy) {
            throw new Error("The connection is busy");
        }
        this.pendingRequest = request;
        this.busy = true;
        if (this.connected) {
            this.ws.send(request.payload);
        }
    }

    public close() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.removeAllListeners();
            this.ws.close();
            this.ws = null;
        }

        this.connected = false;
    }
}
