@group(0) @binding(0) var<uniform> proj : mat4x4f;
@group(0) @binding(1) var<uniform> view : mat4x4f;

struct VertexOutput {
    @builtin(position) Position : vec4f,
    @location(0) fragUV : vec2f,
    @location(1) fragPosition: vec4f,
}

@vertex
fn main(
    @location(0) position : vec3f,
) -> VertexOutput {
    var output : VertexOutput;
    output.Position = proj * view * vec4(position, 1);
    output.fragUV = vec2(0);
    output.fragPosition = 0.5 * (vec4(position, 1) + vec4(1.0, 1.0, 1.0, 1.0));
    return output;
}