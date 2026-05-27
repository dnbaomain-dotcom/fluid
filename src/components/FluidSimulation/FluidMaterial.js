import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const FluidMaterial = shaderMaterial(
  {
    uTexture: null,
    uMouse: new THREE.Vector2(),
    uPrevMouse: new THREE.Vector2(),
    uResolution: new THREE.Vector2(),
    uDecay: 0.96,   // Jak rychle kapalina mizí (viskozita)
    uRadius: 0.04,  // Poloměr interakce kurzoru
    uForce: 8.0,    // Intenzita tahu při pohybu kurzoru
    uAdvection: 0.005, // Síla advekce tekutiny
  },
  // Vertex Shader (Klasický fullscreen quad)
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
  `,
  // Fragment Shader (Fyzika tekutiny)
  `
  uniform sampler2D uTexture;
  uniform vec2 uMouse;
  uniform vec2 uPrevMouse;
  uniform vec2 uResolution;
  uniform float uDecay;
  uniform float uRadius;
  uniform float uForce;
  uniform float uAdvection;

  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec4 prevState = texture2D(uTexture, uv);

    // Výpočet vzdálenosti od myši s korekcí poměru stran
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 mouseDir = uMouse - uPrevMouse;
    float dist = distance(uv * aspect, uMouse * aspect);

    // Gaussova křivka pro hladký rozptyl síly kolem kurzoru
    float force = exp(-pow(dist / uRadius, 2.0)) * uForce;
    
    // Nová hybnost (RG kanály ponesou X a Y rychlost)
    vec2 velocity = mouseDir * force;

    // ADVEKCE: Kapalina unáší sama sebe (tady vzniká ten organický vlnitý efekt)
    vec2 advectedUv = uv - prevState.xy * uAdvection;
    vec4 nextState = texture2D(uTexture, advectedUv) * uDecay;

    // Sečtení nového stavu a oříznutí, aby simulace neexplodovala
    vec4 finalState = nextState + vec4(velocity, 0.0, 1.0);
    finalState.xy = clamp(finalState.xy, -1.0, 1.0);

    gl_FragColor = finalState;
  }
  `
)