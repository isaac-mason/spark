import * as THREE from "three";
export declare class SplatIndexTexture {
    readonly texture: THREE.ExternalTexture;
    readonly image: {
        data: Uint32Array;
        width: number;
        height: number;
    };
    private renderer;
    private glTexture;
    private allocatedHeight;
    constructor(renderer: THREE.WebGLRenderer);
    upload(height: number, data: Uint32Array, forceRealloc: boolean): void;
    dispose(): void;
}
