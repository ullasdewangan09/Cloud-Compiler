import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  BoxGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';

interface LoginLoadingScreenProps {
  onComplete: () => void;
}

export function LoginLoadingScreen({ onComplete }: LoginLoadingScreenProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const brandRef = useRef<HTMLHeadingElement | null>(null);
  const taglineRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const container = canvasRef.current;
    const brand = brandRef.current;
    const tagline = taglineRef.current;

    if (!container || !brand || !tagline) {
      return;
    }

    let frameId = 0;
    let finishTimer = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const scene = new Scene();
    scene.background = new Color(0xffffff);

    const camera = new PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 10;

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const hemiLight = new HemisphereLight(0xffffff, 0xe2e8f0, 1.9);
    const keyLight = new DirectionalLight(0xffffff, 2.5);
    const fillLight = new DirectionalLight(0xf1f5f9, 0.8);

    keyLight.position.set(-5, 8, 5);
    fillLight.position.set(5, -2, -2);

    scene.add(hemiLight, keyLight, fillLight);

    const cubeGroup = new Group();
    const geometry = new BoxGeometry(2.3, 2.3, 2.3);
    const material = new MeshPhysicalMaterial({
      color: 0xf1f5f8,
      metalness: 0.24,
      roughness: 0.82,
      reflectivity: 0.8,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    });

    const cube = new Mesh(geometry, material);
    cube.rotation.set(0.6, 0.8, 0);
    cubeGroup.add(cube);
    scene.add(cubeGroup);

    const resize = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - window.innerWidth / 2) / 150;
      mouseY = (event.clientY - window.innerHeight / 2) / 150;
    };

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      cubeGroup.rotation.y = targetX * 0.18;
      cubeGroup.rotation.x = targetY * 0.12;
      renderer.render(scene, camera);
    };

    const introTimeline = gsap.timeline({
      defaults: { ease: 'expo.out' },
      onComplete: () => {
        finishTimer = window.setTimeout(onComplete, 500);
      },
    });

    const floatTween = gsap.to(cube.position, {
      y: 0.2,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    const rotationTween = gsap.to(cube.rotation, {
      y: `+=${Math.PI * 2}`,
      duration: 24,
      repeat: -1,
      ease: 'none',
    });

    introTimeline
      .from(cube.scale, { duration: 2.2, x: 0, y: 0, z: 0, ease: 'back.out(1.5)' })
      .to(brand, { duration: 1.3, opacity: 1, y: 0, startAt: { y: 20 } }, '-=1.2')
      .to(tagline, { duration: 1.2, opacity: 1, letterSpacing: '0.4em' }, '-=1');

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(finishTimer);
      introTimeline.kill();
      floatTween.kill();
      rotationTween.kill();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onComplete]);

  return (
    <div className="login-loading-screen" role="status" aria-live="polite" aria-label="Signing you in">
      <div ref={canvasRef} className="login-loading-canvas" />

      <div className="login-loading-copy">
        <h1 ref={brandRef} className="login-loading-brand">
          Velo<span>Qube</span>
        </h1>
        <p ref={taglineRef} className="login-loading-tagline">
          Cloud Compiler
        </p>
      </div>
    </div>
  );
}
