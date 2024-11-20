export type HttpRequestOptions = {
    body?: Array<any> | Record<string, unknown> | string;
    url: string;
    method: 'POST' | 'GET';
    timeout?: number;
};
export declare function request(options: HttpRequestOptions): Promise<any>;
//# sourceMappingURL=http.d.ts.map