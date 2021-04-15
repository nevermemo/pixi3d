import { vec4 } from "gl-matrix"

export namespace Vec4 {
  export function set(x: number, y: number, z: number, w: number, out: Float32Array) {
    return <Float32Array>vec4.set(out, x, y, z, w)
  }
  export function transformMat4(a: Float32Array, m: Float32Array, out: Float32Array) {
    return <Float32Array>vec4.transformMat4(out, a, m)
  }
}