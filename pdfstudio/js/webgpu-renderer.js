// GPU presentation layer for PDF.js raster output.
// PDF.js remains the standards-compliant parser; WebGPU owns scaling/compositing.
export class WebGPURenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.device = null;
        this.context = null;
        this.pipeline = null;
        this.sampler = null;
        this.format = null;
        this.texture = null;
        this.textureSize = [0, 0];
        this.isInitialized = false;
    }

    async init() {
        if (!navigator.gpu) return false;
        try {
            const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
            if (!adapter) return false;
            this.device = await adapter.requestDevice();
            this.format = navigator.gpu.getPreferredCanvasFormat();
            this.context = this.canvas.getContext('webgpu');
            if (!this.context) return false;
            this.configure();
            const module = this.device.createShaderModule({ code: `
                struct Out { @builtin(position) position: vec4f, @location(0) uv: vec2f }
                @vertex fn vs(@builtin(vertex_index) i: u32) -> Out {
                    var pos = array<vec2f, 6>(vec2f(-1.,-1.),vec2f(1.,-1.),vec2f(-1.,1.),vec2f(-1.,1.),vec2f(1.,-1.),vec2f(1.,1.));
                    var uv = array<vec2f, 6>(vec2f(0.,1.),vec2f(1.,1.),vec2f(0.,0.),vec2f(0.,0.),vec2f(1.,1.),vec2f(1.,0.));
                    var out: Out; out.position = vec4f(pos[i], 0., 1.); out.uv = uv[i]; return out;
                }
                @group(0) @binding(0) var pageSampler: sampler;
                @group(0) @binding(1) var pageTexture: texture_2d<f32>;
                @fragment fn fs(in: Out) -> @location(0) vec4f { return textureSample(pageTexture, pageSampler, in.uv); }` });
            this.pipeline = this.device.createRenderPipeline({
                layout: 'auto', vertex: { module, entryPoint: 'vs' },
                fragment: { module, entryPoint: 'fs', targets: [{ format: this.format }] },
                primitive: { topology: 'triangle-list' }
            });
            this.sampler = this.device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
            this.device.lost.then(() => {
                this.texture = null;
                this.isInitialized = false;
            });
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.warn('WebGPU unavailable; using Canvas 2D.', error);
            return false;
        }
    }

    configure() {
        this.context.configure({ device: this.device, format: this.format, alphaMode: 'premultiplied' });
    }

    async renderSource(source) {
        if (!this.isInitialized) return false;
        if (this.canvas.width !== source.width || this.canvas.height !== source.height) {
            this.canvas.width = source.width;
            this.canvas.height = source.height;
            this.configure();
        }
        if (!this.texture || this.textureSize[0] !== source.width || this.textureSize[1] !== source.height) {
            this.texture?.destroy();
            this.texture = this.device.createTexture({
                size: [source.width, source.height], format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
            });
            this.textureSize = [source.width, source.height];
        }
        this.device.queue.copyExternalImageToTexture({ source }, { texture: this.texture }, [source.width, source.height]);
        const bindGroup = this.device.createBindGroup({ layout: this.pipeline.getBindGroupLayout(0), entries: [
            { binding: 0, resource: this.sampler }, { binding: 1, resource: this.texture.createView() }
        ] });
        const encoder = this.device.createCommandEncoder();
        const pass = encoder.beginRenderPass({ colorAttachments: [{
            view: this.context.getCurrentTexture().createView(), clearValue: { r: 1, g: 1, b: 1, a: 1 }, loadOp: 'clear', storeOp: 'store'
        }] });
        pass.setPipeline(this.pipeline); pass.setBindGroup(0, bindGroup); pass.draw(6); pass.end();
        this.device.queue.submit([encoder.finish()]);
        // Submission is ordered by the GPU queue. Waiting on onSubmittedWorkDone()
        // can hang indefinitely on some browser/driver combinations and must not
        // block PDF text extraction or the rest of the editor UI.
        return true;
    }

    destroy() {
        this.texture?.destroy();
        this.texture = null;
        this.textureSize = [0, 0];
        this.isInitialized = false;
    }
}
