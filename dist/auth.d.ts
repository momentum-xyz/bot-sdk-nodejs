/// <reference lib="dom" />
export interface AuthConfig {
    backendUrl: string;
}
export declare const fetchAuthChallenge: (address: string, config?: AuthConfig) => Promise<any>;
export declare const getAuthTokenWithSignature: (signedChallenge: string, address: string, config?: AuthConfig) => Promise<any>;
export declare const getAuthTokenWithPrivateKey: (key: string, config?: AuthConfig) => Promise<any>;
export declare const getAuthTokenWithMnemonicPhrase: (phrase: string, config?: AuthConfig) => Promise<any>;
//# sourceMappingURL=auth.d.ts.map