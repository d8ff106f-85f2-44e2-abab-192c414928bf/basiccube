// Show an error dialog if there's any uncaught exception or promise rejection.
// This gets set up on all pages that include util.ts.
globalThis.addEventListener('unhandledrejection', (ev) => {
    fail(`unhandled promise rejection, please report a bug!
  https://github.com/webgpu/webgpu-samples/issues/new\n${ev.reason}`);
});
globalThis.addEventListener('error', (ev) => {
    fail(`uncaught exception, please report a bug!
  https://github.com/webgpu/webgpu-samples/issues/new\n${ev.error}`);
});
/** Shows an error dialog if getting an adapter wasn't successful. */
function quitIfAdapterNotAvailable(adapter) {
    if (!('gpu' in navigator)) {
        fail('navigator.gpu is not defined - WebGPU not available in this browser');
    }
    if (!adapter) {
        fail("requestAdapter returned null - this sample can't run on this system");
    }
}
function supportsDirectBufferBinding(device) {
    const buffer = device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM,
    });
    const layout = device.createBindGroupLayout({
        entries: [{ binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: {} }],
    });
    try {
        device.createBindGroup({
            layout,
            entries: [{ binding: 0, resource: buffer }],
        });
        return true;
    }
    catch {
        return false;
    }
    finally {
        buffer.destroy();
    }
}
function supportsDirectTextureBinding(device) {
    const texture = device.createTexture({
        size: [1],
        usage: GPUTextureUsage.TEXTURE_BINDING,
        format: 'rgba8unorm',
    });
    const layout = device.createBindGroupLayout({
        entries: [{ binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {} }],
    });
    try {
        device.createBindGroup({
            layout,
            entries: [{ binding: 0, resource: texture }],
        });
        return true;
    }
    catch {
        return false;
    }
    finally {
        texture.destroy();
    }
}
function supportsDirectTextureAttachments(device) {
    const texture = device.createTexture({
        size: [1],
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        format: 'rgba8unorm',
        sampleCount: 4,
    });
    const resolveTarget = device.createTexture({
        size: [1],
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        format: 'rgba8unorm',
    });
    const depthTexture = device.createTexture({
        size: [1],
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        format: 'depth16unorm',
        sampleCount: 4,
    });
    const encoder = device.createCommandEncoder();
    try {
        const pass = encoder.beginRenderPass({
            colorAttachments: [
                { view: texture, resolveTarget, loadOp: 'load', storeOp: 'store' },
            ],
            depthStencilAttachment: {
                view: depthTexture,
                depthLoadOp: 'load',
                depthStoreOp: 'store',
            },
        });
        pass.end();
        return true;
    }
    catch (e) {
        console.error(e);
        return false;
    }
    finally {
        encoder.finish();
        texture.destroy();
        resolveTarget.destroy();
    }
}
/**
 * Shows an error dialog if getting a adapter or device wasn't successful,
 * or if/when the device is lost or has an uncaptured error. Also checks
 * for direct buffer binding, direct texture binding, and direct texture attachment binding.
 */
function quitIfWebGPUNotAvailableOrMissingFeatures(adapter, device) {
    if (!device) {
        quitIfAdapterNotAvailable(adapter);
        fail('Unable to get a device for an unknown reason');
        return;
    }
    device.lost.then((reason) => {
        fail(`Device lost ("${reason.reason}"):\n${reason.message}`);
    });
    device.addEventListener('uncapturederror', (ev) => {
        fail(`Uncaptured error:\n${ev.error.message}`);
    });
    if (!supportsDirectBufferBinding(device) ||
        !supportsDirectTextureBinding(device) ||
        !supportsDirectTextureAttachments(device)) {
        fail('Core features of WebGPU are unavailable. Please update your browser to a newer version.');
    }
}
/** Fail by showing a console error, and dialog box if possible. */
const fail = (() => {
    function createErrorOutput() {
        if (typeof document === 'undefined') {
            // Not implemented in workers.
            return {
                show(msg) {
                    console.error(msg);
                },
            };
        }
        const dialogBox = document.createElement('dialog');
        dialogBox.close();
        document.body.append(dialogBox);
        const dialogText = document.createElement('pre');
        dialogText.style.whiteSpace = 'pre-wrap';
        dialogBox.append(dialogText);
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'OK';
        closeBtn.onclick = () => dialogBox.close();
        dialogBox.append(closeBtn);
        return {
            show(msg) {
                // Don't overwrite the dialog message while it's still open
                // (show the first error, not the most recent error).
                if (!dialogBox.open) {
                    dialogText.textContent = msg;
                    dialogBox.showModal();
                }
            },
        };
    }
    let output;
    return (message) => {
        if (!output)
            output = createErrorOutput();
        output.show(message);
        throw new Error(message);
    };
})();




function Quat(i,j,k,l) {
    return {
        i,
        j,
        k,
        l,

        exp() {
            const i = this.i;
            const j = this.j;
            const k = this.k;
            const l = this.l;
            const ijk = Math.sqrt(i*i + j*j + k*k);
            const cos = Math.cos(ijk);
            const sin = Math.sin(ijk);
            const mag = Math.exp(l);
            return Quat(
                mag * sin * i / ijk,
                mag * sin * j / ijk,
                mag * sin * k / ijk,
                mag * cos,
            );
        },

        log() {
            const i = this.i;
            const j = this.j;
            const k = this.k;
            const l = this.l;
            const ll = l*l;
            const rr = i*i + j*j + k*k;
            const ang = Math.atan2(Math.sqrt(rr), Math.sqrt(ll));
            const ijk = Math.sqrt(rr);
            return Quat(
                ang * i / ijk,
                ang * j / ijk,
                ang * k / ijk,
                0.5 * Math.log(ll + rr),
            );
        },

        outer(that) {
            return [
                this.i * that.i, this.i * that.j, this.i * that.k, this.i * that.l,
                this.j * that.i, this.j * that.j, this.j * that.k, this.j * that.l,
                this.k * that.i, this.k * that.j, this.k * that.k, this.k * that.l,
                this.l * that.i, this.l * that.j, this.l * that.k, this.l * that.l,
            ];
        },

        compose(that) {
            const [ ii , ij , ik , il , 
                    ji , jj , jk , jl , 
                    ki , kj , kk , kl , 
                    li , lj , lk , ll ] = this.outer(that);
            return Quat(
                li - kj + jk + il, 
                lj + ki + jl - ik, 
                lk + kl - ji + ij, 
                ll - kk - jj - ii,
            );
        },

        asColMat() {
            const [ ii , ij , ik , il , 
                    ji , jj , jk , jl , 
                    ki , kj , kk , kl , 
                    li , lj , lk , ll ] = this.outer(this);
            return [
                (ll+ii)-(jj+kk), 
                (ij+ji)+(lk+kl), 
                (ki+ik)-(lj+jl), 

                (ij+ji)-(lk+kl),
                (ll+jj)-(kk+ii),
                (jk+kj)+(li+il),

                (ki+ik)+(lj+jl),                
                (jk+kj)-(li+il),
                (ll+kk)-(ii+jj),                
            ];
        },
    };
};








async function main() {
    const vert_wgsl = await (await fetch('vert.wgsl')).text();
    const frag_wgsl = await (await fetch('frag.wgsl')).text();

    const adapter = await navigator.gpu?.requestAdapter({
        featureLevel: 'compatibility',
    });
    const device = await adapter?.requestDevice();
    quitIfWebGPUNotAvailableOrMissingFeatures(adapter, device);

    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('webgpu');
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format: presentationFormat,
    });
    

    const vertex_stride = 4 * 3;
    const vertex_data = new Float32Array([
        -1,-1,-1,
         1,-1,-1,
        -1, 1,-1,
         1, 1,-1,
        -1,-1, 1,
         1,-1, 1,
        -1, 1, 1,
         1, 1, 1,
    ]);
    const vertex_buffer = device.createBuffer({
        size: vertex_data.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
    });
    new Float32Array(vertex_buffer.getMappedRange()).set(vertex_data);
    vertex_buffer.unmap();


    const cube_indices_length = 3 * 12;
    const index_data_type = 'uint32';
    const index_data = new Uint32Array([
        0, 1, 5,
        5, 4, 0,
        0, 4, 6,
        6, 2, 0,
        0, 2, 3,
        3, 1, 0,
        7, 6, 4,
        4, 5, 7,
        7, 5, 1,
        1, 3, 7,
        7, 3, 2,
        2, 6, 7,
    ]);
    const index_buffer = device.createBuffer({
        size: index_data.byteLength,
        usage: GPUBufferUsage.INDEX,
        mappedAtCreation: true,
    });
    new Uint32Array(index_buffer.getMappedRange()).set(index_data);
    index_buffer.unmap();


    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: device.createShaderModule({
                code: vert_wgsl,
            }),
            buffers: [
                {
                    arrayStride: vertex_stride,
                    attributes: [
                        {
                            shaderLocation: 0,
                            offset: 0,
                            format: 'float32x3',
                        },
                    ],
                },
            ],
        },
        fragment: {
            module: device.createShaderModule({
                code: frag_wgsl,
            }),
            targets: [
                {
                    format: presentationFormat,
                },
            ],
        },
        primitive: {
            topology: 'triangle-list', // 'line-list',
            cullMode: 'back',
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'greater',
            format: 'depth24plus',
        },
    });

    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const cameraBuffer = device.createBuffer({
        size: 4 * 16, // 4x4 matrix
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const modelBuffer = device.createBuffer({
        size: 4 * 16, // 4x4 matrix
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: cameraBuffer },
            { binding: 1, resource: modelBuffer },
        ],
    });

    const renderPassDescriptor = {
        colorAttachments: [
            {
                view: undefined, // Assigned later
                clearValue: [0.0, 0.0, 0.0, 0.0],
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 0.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    const projMatrix = new Float32Array(16);
    const viewMatrix = new Float32Array(16);

    let dragX = 0;
    let dragY = 0;
    let dragT = 0;
    let viewQuat = Quat(0.5,0.5,0.5,0.5);
    let frame_queued = false;
    let slider_value = document.getElementById("scale").value;
    
    window.addEventListener("mouseup", 
        (event) => {
            dragT = 0;
        }
    );

    canvas.addEventListener("mousedown", 
        (event) => {
            dragX = event.clientX;
            dragY = event.clientY;
            dragT = event.timeStamp;
        }
    );

    canvas.addEventListener("mousemove", 
        (event) => {
            if (dragT == 0) return;
            const rx = event.clientX - dragX;
            const ry = event.clientY - dragY;
            const rr = rx*rx + ry*ry;
            dragX = event.clientX;
            dragY = event.clientY;
            if (rr > 0) {
                const sens = 16.0 * Math.PI / 10800.0;
                const rad = Math.sqrt(rr) * sens;
                const rot = Quat(
                    Math.sin(rad/2) * (-ry) / Math.sqrt(rr),
                    Math.sin(rad/2) * (-rx) / Math.sqrt(rr),
                    0,
                    Math.cos(rad/2),
                )
                viewQuat = viewQuat.compose(rot);
                if (!frame_queued) {
                    frame_queued = true;
                    requestAnimationFrame(frame);
                }
            }
        }
    );

    document.getElementById("scale").addEventListener("input", 
        (event) => {
            slider_value = event.target.value;
            if (!frame_queued) {
                frame_queued = true;
                requestAnimationFrame(frame);
            }
        }
    );

    function frame(timestamp) {
        const w = canvas.clientWidth * window.devicePixelRatio;
        const h = canvas.clientHeight * window.devicePixelRatio;
        const f = Math.sqrt(w*w + h*h); 
        const p = projMatrix;
        const v = viewMatrix;   
        [ p[ 0] , p[ 4] , p[ 8] , p[12] ] = [ 1/w , 0.0 , 0.0 , 0.0 ];
        [ p[ 1] , p[ 5] , p[ 9] , p[13] ] = [ 0.0 , 1/h , 0.0 , 0.0 ];
        [ p[ 2] , p[ 6] , p[10] , p[14] ] = [ 0.0 , 0.0 , 0.0 , 1/f ];
        [ p[ 3] , p[ 7] , p[11] , p[15] ] = [ 0.0 , 0.0 ,-1/f , 0.0 ];
        
        [ v[ 0] , v[ 4] , v[ 8] ,
          v[ 1] , v[ 5] , v[ 9] ,
          v[ 2] , v[ 6] , v[10] ] = viewQuat.asColMat();
        [ v[ 3] , v[ 7] , v[11] ] = [ 0.0 , 0.0 , 0.0 ];
        
        v[12] = 0.0;
        v[13] = 0.0;
        v[14] =-8.0;
        v[15] = 1.0;

        const testarr = new Float32Array([slider_value, slider_value, slider_value]);
        device.queue.writeBuffer(vertex_buffer, 84, testarr.buffer, testarr.byteOffset, testarr.byteLength);

        device.queue.writeBuffer(cameraBuffer, 0, p.buffer, p.byteOffset, p.byteLength);
        device.queue.writeBuffer(modelBuffer, 0, v.buffer, v.byteOffset, v.byteLength);

        renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
        const commandEncoder = device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, uniformBindGroup);
        passEncoder.setVertexBuffer(0, vertex_buffer);
        passEncoder.setIndexBuffer(index_buffer, index_data_type);
        passEncoder.drawIndexed(cube_indices_length);
        passEncoder.end();
        device.queue.submit([commandEncoder.finish()]);
        frame_queued = false;
    }

    frame_queued = true;
    requestAnimationFrame(frame);
}


main();