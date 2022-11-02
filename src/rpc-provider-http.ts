// HTTP provider

"use strict";

import HTTP from "http";
import HTTPS from "https";
import { RPCProvider } from "./types";

/**
 * Options for RPC_HTTP_Provider
 */
export interface RPC_HTTP_Provider_Options {
    /**
     * Keep alive the connections (true by default)
     */
    keepAlive: boolean;

    /**
     * Max number of connections
     */
    maxConnections: number;
}

/**
 * HTTP provider for JSON-RPC requests
 */
export class RPC_HTTP_Provider implements RPCProvider {
    public url: URL;

    private tls: boolean;

    private agent: HTTP.Agent;
    private agentTLS: HTTPS.Agent;

    private internalID: number;

    /**
     * @param url The HTTP or HTTPS url to connect to the node
     * @param options Options
     */
    constructor(url: string | URL, options?: RPC_HTTP_Provider_Options) {
        if (typeof url === "string") {
            this.url = new URL(url);
        } else {
            this.url = url;
        }
        if (!(['http:', 'https:'].includes(this.url.protocol))) {
            throw new Error("Invalid URL given for the HTTP provider: " + this.url.toString());
        }
        this.tls = this.url.protocol === "https:";

        if (this.tls) {
            this.agentTLS = new HTTPS.Agent({
                keepAlive: options ? (options.keepAlive !== undefined ? options.keepAlive : true) : true,
                maxSockets: options ? (options.maxConnections !== undefined ? options.maxConnections : Infinity) : Infinity,
            });
        } else {
            this.agent = new HTTP.Agent({
                keepAlive: options ? (options.keepAlive !== undefined ? options.keepAlive : true) : true,
                maxSockets: options ? (options.maxConnections !== undefined ? options.maxConnections : Infinity) : Infinity,
            });
        }

        this.internalID = 0;
    }

    private getNextRequestID(): number {
        this.internalID++;
        return this.internalID;
    }

    /**
     * Performs a JSON-RPC request
     * @param method RPC Method
     * @param params Method parameters
     * @param timeout Timeout in ms
     * @returns The JSON RPC result
     */
    public async rpcRequest(method: string, params: any[], timeout: number): Promise<any> {
        let request: HTTP.ClientRequest;
        const requestID = this.getNextRequestID();

        return new Promise<any>((resolve, reject) => {
            const responseHandler = function (response: HTTP.IncomingMessage) {
                let body = "";

                if (response.statusCode !== 200) {
                    return reject(new Error("JSON RPC status code: " + response.statusCode));
                }

                response.on("data", function (chunk) {
                    body += chunk;
                });

                response.on("end", function () {
                    try {
                        const parsedBody = JSON.parse(body);

                        if (parsedBody.error) {
                            return reject(new Error("Error code " + parsedBody.error.code + " / " + parsedBody.error.message));
                        }

                        resolve(parsedBody.result);
                    } catch (ex) {
                        reject(ex);
                    }
                });
            };

            if (this.tls) {
                request = HTTPS.request(this.url,{
                    agent: this.agentTLS,
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: timeout || 0,
                }, responseHandler);
            } else {
                request = HTTP.request(this.url,{
                    agent: this.agent,
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: timeout || 0,
                }, responseHandler);
            }

            request.on("error", function (err) {
                reject(err)
            });

            request.write(JSON.stringify({
                jsonrpc: "2.0",
                method: method,
                params: params,
                id: requestID,
            }));

            request.end();
        });
    }

    /**
     * Closes all the active connections
     */
    public destroy() {
        if (this.tls) {
            this.agentTLS.destroy();
        } else {
            this.agent.destroy();
        }
    }
}
