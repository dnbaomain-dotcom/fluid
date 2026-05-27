import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const SkyGlassMaterial = shaderMaterial(
  {
    uFluidTex: null,      // Tvoje FBO tekutina
    uDistortion: 0.15,    // Síla lomu skla
    uAberration: 0.02,    // Chromatická aberace (duha)
    uFogStrength: 0.4,    // Síla snové mlhy
    uHighlight: 3.0,      // Intenzita odlesků
    uSkyColor1: new THREE.Color(0.76, 0.86, 0.93),
    uSkyColor2: new THREE.Color(0.95, 0.88, 0.88),
    uCloudColor: new THREE.Color(0.98, 0.98, 1.0),
    uTime: 0.0,
  },
  // Vertex Shader
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader - Tady mícháme nebe, mlhu a sklo
  `
  uniform sampler2D uFluidTex;
  uniform float uDistortion;
  uniform float uAberration;
  uniform float uFogStrength;
  uniform float uHighlight;
  uniform vec3 uSkyColor1;
  uniform vec3 uSkyColor2;
  uniform vec3 uCloudColor;
  uniform float uTime;

  varying vec2 vUv;

  // Jednoduchý noise pro simulaci jemné mlhy
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  void main() {
    // 1. Čtení fluidních dat
    vec2 fluid = texture2D(uFluidTex, vUv).xy;
    float speed = length(fluid);

    // Vlny ohýbají UV souřadnice
    vec2 distort = fluid * uDistortion;

    // 2. GENEROVÁNÍ SNOVÉHO GRADIENTU (Mlha a nebe)
    // Vytvoříme plynulý barevný přechod posunutý o deformaci z fluidu
    vec2 uvTarget = vUv - distort;
    
    // Základní klidné barvy nebe (pastelová modrá, jemná růžová/perleťová, bílá)
    vec3 skyColor1 = uSkyColor1;
    vec3 skyColor2 = uSkyColor2;
    vec3 cloudWhite = uCloudColor;

    // Vytvoříme organický pohyb mlhy na pozadí
    float fogPattern = noise(uvTarget * 3.0 + vec2(uTime * 0.05, uTime * 0.02));
    
    // Prvotní mix gradientu nebe podle vertikální pozice (Y) a mlhy
    vec3 baseSky = mix(skyColor1, skyColor2, uvTarget.y + fogPattern * 0.2);
    vec3 finalSky = mix(baseSky, cloudWhite, fogPattern * uFogStrength);

    // 3. CHROMATICKÁ ABERACE NA HRANÁCH VLN
    // Aby to mělo ten skleněný feeling, ořízneme RGB kanály toho gradientu v místech ohybu
    float r = mix(skyColor1, skyColor2, (uvTarget.y - distort.y * uAberration) + fogPattern * 0.2).r;
    float g = finalSky.g;
    float b = mix(skyColor1, skyColor2, (uvTarget.y + distort.y * uAberration) + fogPattern * 0.2).b;
    
    vec3 crystalSpectrum = vec3(r, g, b);

    // 4. JEMNÉ SKLENĚNÉ ODLESKY
    // Na hřebeny vln přidáme čistě bílé zářivé odlesky
    vec3 highlights = vec3(1.0) * pow(speed, 1.8) * uHighlight;

    // Výsledný clean setup snového nebe s fluidním sklem
    gl_FragColor = vec4(crystalSpectrum + highlights, 1.0);
  }
  `
)