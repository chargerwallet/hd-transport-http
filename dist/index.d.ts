import * as _chargerwallet_hd_transport from '@chargerwallet/hd-transport';
import _chargerwallet_hd_transport__default, { ChargerWalletDeviceInfoWithSession, AcquireInput } from '@chargerwallet/hd-transport';

type IncompleteRequestOptions = {
    body?: Array<any> | Record<string, unknown> | string;
    url: string;
    timeout?: number;
};
declare class HttpTransport {
    _messages: ReturnType<typeof _chargerwallet_hd_transport__default.parseConfigure> | undefined;
    configured: boolean;
    stopped: boolean;
    url: string;
    Log?: any;
    constructor(url?: string);
    _post(options: IncompleteRequestOptions): Promise<any>;
    init(logger: any): Promise<string>;
    _silentInit(): Promise<string>;
    configure(signedData: any): void;
    listen(old?: Array<ChargerWalletDeviceInfoWithSession>): Promise<ChargerWalletDeviceInfoWithSession[]>;
    enumerate(): Promise<ChargerWalletDeviceInfoWithSession[]>;
    _acquireMixed(input: AcquireInput): Promise<any>;
    acquire(input: AcquireInput): Promise<string>;
    release(session: string, onclose: boolean): Promise<void>;
    call(session: string, name: string, data: Record<string, unknown>): Promise<_chargerwallet_hd_transport.MessageFromChargerWallet>;
    post(session: string, name: string, data: Record<string, unknown>): Promise<void>;
    read(session: string): Promise<_chargerwallet_hd_transport.MessageFromChargerWallet>;
    requestDevice(): Promise<never>;
    stop(): void;
    cancel(): void;
}

export { HttpTransport as default };
