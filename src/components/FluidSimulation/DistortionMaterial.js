import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const DistortionMaterial = shaderMaterial(
  {
    uFluidTex: null,
    uTextTex: null,
    uDistortionStrength: 0.15,
    uAberrationStrength: 0.02,
    uGlowColor: new THREE.Color('#ffffff'), // Čistě bílá pro odlesky
    uSpecularPower: 64.0,
    uTime: 0.0,
    uShimmerIntensity: 0.3
  },
  // Vertex Shader (zůstává stejný)
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
  `,
  // Fragment Shader (KOMPLETNÍ UPDATE pro Crystal look bez hnědé)
  `
  uniform sampler2D uFluidTex;
  uniform sampler2D uTextTex;
  uniform float uDistortionStrength;
  uniform float uAberrationStrength;
  uniform vec3 uGlowColor;
  uniform float uSpecularPower;
  uniform float uTime;
  uniform float uShimmerIntensity;

  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    // 1. Čtení rychlosti fluidu
    vec2 fluid = texture2D(uFluidTex, vUv).xy;
    float speed = length(fluid);

    // 2. TRUE PRISM REFRAKCE: Použijeme vektory jako data pro lom světla
    vec2 refractVec = fluid * uDistortionStrength;

    // 3. CHROMATICKÁ ABERACE (Duhový hranol na textu)
    float red = texture2D(uTextTex, vUv - refractVec * 3.5).r;   // Posunuto hodně
    float green = texture2D(uTextTex, vUv - refractVec * 1.0).g; // Střed
    float blue = texture2D(uTextTex, vUv + refractVec * 1.5).b;  // Posunuto na druhou stranu (+)
    vec3 refractiveScene = vec3(red, green, blue);

    // 4. CRYSTAL FRESNEL (Zářivě bílé hrany skla po celé ploše)
    // Vypočítáme 3D normálu z rychlosti fluidu
    vec3 normal = normalize(vec3(fluid * 40.0, 1.0));
    
    // Fresnelův efekt (čím strmější ohyb, tím výraznější hrana)
    float fresnel = pow(1.0 - max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
    
    // Zářivě bílé skleněné hrany (čistě aditivní, garantuje absenci hnědé)
    vec3 dynamicRGB = vec3(abs(fluid.x) * 10.0, 0.2, abs(fluid.y) * 10.0); 
    vec3 glassEdgeGlow = dynamicRGB * fresnel * speed * 4.0;

    // 5. OSTRÉ JISKRY A ODLESKY (Diamantový prach)
    // Fake světelný zdroj mírně z boku
    float spec = pow(max(dot(normal, normalize(vec3(0.4, 0.6, 1.0))), 0.0), uSpecularPower);
    
    // Animované mikrojiskry
    float shimmerNoise = hash(vUv * 600.0 + uTime * 0.1);
    shimmerNoise = pow(shimmerNoise, 30.0);
    vec3 sparkles = uGlowColor * shimmerNoise * spec * speed * 25.0 * uShimmerIntensity;
    
    // Hlavní bílé odlesky povrchu
    vec3 mainGlow = uGlowColor * spec * speed * 1.5;

    // Finální ČISTĚ ADITIVNÍ mix: Základní scéna + Bílé hrany + Bílé odlesky
    // Tady se hnědá nemá jak vzít!
    vec3 finalColor = refractiveScene + glassEdgeGlow + mainGlow + sparkles;

    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
  }
  `
)