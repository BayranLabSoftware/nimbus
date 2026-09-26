/**
 * The few WebGPU declarations the blast solver's host uses (rule 1270). The
 * TypeScript of this repository ships none, and no dependency is added for
 * them; these follow the W3C WebGPU specification's names.
 */

export interface GpuBuffer {
  readonly size: number;
  mapAsync(mode: number, offset?: number, size?: number): Promise<void>;
  getMappedRange(offset?: number, size?: number): ArrayBuffer;
  unmap(): void;
  destroy(): void;
}

export interface GpuQueue {
  writeBuffer(buffer: GpuBuffer, offset: number, data: ArrayBufferView | ArrayBuffer): void;
  submit(commands: unknown[]): void;
  onSubmittedWorkDone(): Promise<void>;
}

export interface GpuComputePass {
  setPipeline(pipeline: unknown): void;
  setBindGroup(index: number, group: unknown): void;
  dispatchWorkgroups(x: number, y?: number, z?: number): void;
  end(): void;
}

export interface GpuCommandEncoder {
  beginComputePass(): GpuComputePass;
  copyBufferToBuffer(
    source: GpuBuffer,
    sourceOffset: number,
    destination: GpuBuffer,
    destinationOffset: number,
    size: number
  ): void;
  clearBuffer(buffer: GpuBuffer, offset?: number, size?: number): void;
  finish(): unknown;
}

export interface GpuComputePipeline {
  getBindGroupLayout(index: number): unknown;
}

export interface GpuDevice {
  readonly queue: GpuQueue;
  createBuffer(descriptor: { size: number; usage: number; mappedAtCreation?: boolean }): GpuBuffer;
  createShaderModule(descriptor: { code: string }): unknown;
  createComputePipeline(descriptor: {
    /** 'auto', or a pipeline layout. */
    layout: unknown;
    compute: { module: unknown; entryPoint: string };
  }): GpuComputePipeline;
  createBindGroup(descriptor: {
    layout: unknown;
    entries: { binding: number; resource: { buffer: GpuBuffer } }[];
  }): unknown;
  createCommandEncoder(): GpuCommandEncoder;
  destroy(): void;
}

export interface GpuAdapter {
  readonly limits: Record<string, number>;
  readonly info?: { vendor?: string; architecture?: string; description?: string };
  requestDevice(descriptor?: { requiredLimits?: Record<string, number> }): Promise<GpuDevice>;
}

export interface Gpu {
  requestAdapter(options?: {
    powerPreference?: 'high-performance' | 'low-power';
  }): Promise<GpuAdapter | null>;
}

/** GPUBufferUsage and GPUMapMode, by value. */
export const BUFFER = {
  MAP_READ: 0x0001,
  COPY_SRC: 0x0004,
  COPY_DST: 0x0008,
  UNIFORM: 0x0040,
  STORAGE: 0x0080,
} as const;
export const MAP_READ = 0x0001;
