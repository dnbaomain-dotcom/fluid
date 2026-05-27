import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const NeonGlassMaterial = shaderMaterial(
  {
    uFluidTex: null,
    uGridScale: 5.0,
    uPulseSpeed: 1.0,
    uGlow: 3.5,
    uHue: 0.55,
    uTime: 0.0,
  },
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  `
  uniform sampler2D uFluidTex;
  uniform float uGridScale;
  uniform float uPulseSpeed;
  uniform float uGlow;
  uniform float uHue;
  uniform float uTime;

  varying vec2 vUv;

  vec3 hueToRgb(float h) {
    float r = abs(h * 6.0 - 3.0) - 1.0;
    float g = 2.0 - abs(h * 6.0 - 2.0);
    float b = 2.0 - abs(h * 6.0 - 4.0);
    return clamp(vec3(r, g, b), 0.0, 1.0);
  }

  void main() {
    vec2 fluid = texture2D(uFluidTex, vUv).xy;
    float speed = length(fluid);

    vec2 gridUv = vUv * uGridScale;
    vec2 grid = abs(fract(gridUv - 0.5) - 0.5) / fwidth(gridUv);
    float gridMask = min(grid.x, grid.y);
    float lines = smoothstep(0.0, 0.08, gridMask);

    float pulse = sin((vUv.x + vUv.y) * 10.0 + uTime * uPulseSpeed + speed * 5.0) * 0.5 + 0.5;
    float glowLine = pow(lines * pulse, 2.4);

    vec3 base = hueToRgb(uHue) * mix(0.22, 1.0, pulse);
    vec3 neon = base * vec3(1.0, 0.85, 1.0);
    vec3 gridColor = mix(neon * 0.3, neon * 1.8, glowLine);

    vec3 fluidAccent = vec3(abs(fluid.x), abs(fluid.y), 1.0) * speed * 1.2;
    vec3 streak = vec3(1.0, 0.75, 1.0) * pow(max(0.0, 1.0 - gridMask * 3.0), 4.0) * 0.85;

    vec3 finalColor = clamp(gridColor + fluidAccent + streak * uGlow * 0.8, 0.0, 1.0);
    gl_FragColor = vec4(finalColor, 1.0);
  }
  `
)
