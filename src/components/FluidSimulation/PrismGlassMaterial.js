import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const PrismGlassMaterial = shaderMaterial(
  {
    uFluidTex: null,
    uDistortion: 0.18,
    uAberration: 0.04,
    uGlow: 3.2,
    uPrismPower: 1.8,
    uColor1: new THREE.Color('#79d4ff'),
    uColor2: new THREE.Color('#ff81e3'),
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
  uniform float uDistortion;
  uniform float uAberration;
  uniform float uGlow;
  uniform float uPrismPower;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uTime;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    vec2 fluid = texture2D(uFluidTex, vUv).xy;
    float intensity = length(fluid);
    vec2 offset = fluid * uDistortion;

    vec2 uvDistorted = vUv + offset;
    float band = sin((uvDistorted.x + uvDistorted.y) * 8.0 + uTime * 0.8) * 0.5 + 0.5;
    vec3 base = mix(uColor1, uColor2, uvDistorted.y + band * 0.15);

    float softNoise = noise(uvDistorted * 4.0 + uTime * 0.2) * 0.15;
    base += softNoise;

    vec3 normal = normalize(vec3(fluid * 20.0, 1.0));
    float fresnel = pow(1.0 - max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
    float spec = pow(max(dot(normal, normalize(vec3(0.6, 0.7, 1.0))), 0.0), 64.0);

    vec3 prism = vec3(
      texture2D(uFluidTex, vUv - offset * (0.8 + uPrismPower)).r,
      texture2D(uFluidTex, vUv - offset * 0.2).g,
      texture2D(uFluidTex, vUv + offset * (0.5 + uPrismPower)).b
    );

    vec3 edgeGlow = vec3(1.0) * fresnel * uGlow * intensity * 0.9;
    vec3 shine = vec3(1.0) * spec * 1.8;

    vec3 finalColor = clamp(base * 1.4 + prism * 0.5 + edgeGlow + shine, 0.0, 1.0);
    gl_FragColor = vec4(finalColor, 1.0);
  }
  `
)
