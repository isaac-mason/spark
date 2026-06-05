import * as THREE from "three";

const WIDTH = 4096;

export class SplatIndexTexture {
  readonly texture: THREE.ExternalTexture;
  readonly image: { data: Uint32Array; width: number; height: number };
  private renderer: THREE.WebGLRenderer;
  private glTexture: WebGLTexture;
  private allocatedHeight = 0;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    const gl = renderer.getContext() as WebGL2RenderingContext;
    const glTexture = gl.createTexture();
    if (!glTexture) {
      throw new Error("createTexture failed");
    }
    this.glTexture = glTexture;
    renderer.state.activeTexture(gl.TEXTURE0);
    renderer.state.bindTexture(gl.TEXTURE_2D, glTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    renderer.state.bindTexture(gl.TEXTURE_2D, null);
    this.texture = new THREE.ExternalTexture(glTexture);
    this.image = { data: new Uint32Array(0), width: WIDTH, height: 0 };
    this.texture.image = this.image;
  }

  upload(height: number, data: Uint32Array, forceRealloc: boolean) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    this.renderer.state.activeTexture(gl.TEXTURE0);
    this.renderer.state.bindTexture(gl.TEXTURE_2D, this.glTexture);
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    // Use texSubImage2D into existing storage when possible. Must fall back
    // to texImage2D when storage hasn't been allocated yet (first upload) or
    // the new height exceeds the allocation.
    const useSub = !forceRealloc && height <= this.allocatedHeight;

    if (useSub) {
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        WIDTH,
        height,
        gl.RGBA_INTEGER,
        gl.UNSIGNED_INT,
        data,
      );
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA32UI,
        WIDTH,
        height,
        0,
        gl.RGBA_INTEGER,
        gl.UNSIGNED_INT,
        data,
      );
      this.allocatedHeight = height;
    }

    this.renderer.state.bindTexture(gl.TEXTURE_2D, null);
    this.image.data = data;
    this.image.height = height;
  }

  dispose() {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    gl.deleteTexture(this.glTexture);
    this.texture.sourceTexture = null;
    this.texture.dispose();
  }
}
