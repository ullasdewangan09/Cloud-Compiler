import{c as n,r as d,j as f}from"./index-C6qi_1Ip.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],S=n("arrow-right",_);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],w=n("eye-off",x);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],E=n("eye",A);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=[["circle",{cx:"12",cy:"16",r:"1",key:"1au0dj"}],["rect",{x:"3",y:"10",width:"18",height:"12",rx:"2",key:"6s8ecr"}],["path",{d:"M7 10V7a5 5 0 0 1 10 0v3",key:"1pqi11"}]],F=n("lock-keyhole",k);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]],L=n("shield",C);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=[["circle",{cx:"12",cy:"8",r:"5",key:"1hypcn"}],["path",{d:"M20 21a8 8 0 0 0-16 0",key:"rfgkzh"}]],N=n("user-round",b);function P(){const s=d.useRef(null);return d.useEffect(()=>{const r=s.current;if(!r)return;const e=r.getContext("webgl");if(!e)return;const p=`
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `,v=`
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

        // Ground Perspective Simulation
        float depth = 1.0 / (uv.y + 1.15);
        vec2 gridUv = vec2(uv.x * depth, depth + u_time * 0.15);

        // Layered Procedural Noise for Terrain
        float n = noise(gridUv * 3.5);
        float ripples = sin(gridUv.y * 18.0 + n * 8.0 + u_time * 0.5);

        // Neon Topographic Lines
        float topoLine = smoothstep(0.03, 0.0, abs(ripples));

        // Color Palette
        vec3 baseColor   = vec3(0.04, 0.03, 0.12); // Deep Space
        vec3 accentColor = vec3(0.1,  0.3,  0.8);  // Electric Blue
        vec3 neonColor   = vec3(0.6,  0.2,  1.0);  // Neon Purple

        // Composite
        vec3 finalColor = mix(baseColor, accentColor, n * 0.6);
        finalColor += topoLine * neonColor * depth * 0.4;

        // Horizon Fog / Fade
        float fade = smoothstep(0.1, -1.0, uv.y);
        finalColor *= (1.0 - length(uv) * 0.45) * (1.0 - fade);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,l=(i,a)=>{const o=e.createShader(i);return e.shaderSource(o,a),e.compileShader(o),o},t=e.createProgram();e.attachShader(t,l(e.VERTEX_SHADER,p)),e.attachShader(t,l(e.FRAGMENT_SHADER,v)),e.linkProgram(t),e.useProgram(t);const m=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,m),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),e.STATIC_DRAW);const u=e.getAttribLocation(t,"position");e.enableVertexAttribArray(u),e.vertexAttribPointer(u,2,e.FLOAT,!1,0,0);const y=e.getUniformLocation(t,"u_time"),g=e.getUniformLocation(t,"u_resolution");let c;const h=i=>{const{innerWidth:a,innerHeight:o}=window;(r.width!==a||r.height!==o)&&(r.width=a,r.height=o,e.viewport(0,0,a,o)),e.uniform1f(y,i*.001),e.uniform2f(g,a,o),e.drawArrays(e.TRIANGLES,0,6),c=requestAnimationFrame(h)};return c=requestAnimationFrame(h),()=>cancelAnimationFrame(c)},[]),f.jsx("div",{className:"fixed inset-0 w-full h-full -z-10",style:{background:"#0a0810"},children:f.jsx("canvas",{ref:s,className:"w-full h-full block touch-none",style:{filter:"contrast(1.1) brightness(0.95)"}})})}export{S as A,w as E,F as L,P,L as S,N as U,E as a};
