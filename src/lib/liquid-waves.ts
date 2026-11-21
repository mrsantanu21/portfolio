/**
 * Interactive Liquid Wave & Distortion Canvas
 * GPU-accelerated shader simulating physical water ripples with interference,
 * specular highlights, adaptive theme coloring, and zero-idle CPU overhead.
 */

interface Ripple {
  x: number;
  y: number;
  startTime: number;
  duration: number;
  strength: number;
}

export function initLiquidWaves(canvasId: string = 'fluid-canvas') {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduceMotion || !isFinePointer) {
    canvas.style.display = 'none';
    return;
  }

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
  });

  if (!gl) {
    console.warn('WebGL not supported for liquid waves');
    return;
  }

  // Vertex shader: Fullscreen quad
  const vsSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = (a_position + 1.0) * 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // Fragment shader: Multi-ripple wave interference & liquid refraction
  const fsSource = `
    precision highp float;
    varying vec2 v_uv;
    uniform vec2 u_resolution;
    uniform float u_is_dark;
    
    // Up to 16 concurrent ripples
    uniform vec4 u_ripples[16]; // x, y, progress (0..1), strength
    uniform int u_count;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float aspect = u_resolution.x / u_resolution.y;
      
      vec2 total_disp = vec2(0.0);
      float total_wave = 0.0;

      for (int i = 0; i < 16; i++) {
        if (i >= u_count) break;
        
        vec2 center = u_ripples[i].xy;
        float progress = u_ripples[i].z;
        float strength = u_ripples[i].w;

        vec2 delta = uv - center;
        delta.x *= aspect;
        float dist = length(delta);

        // Expanding circular wave radius
        float wave_radius = progress * 0.55;
        float dist_from_crest = dist - wave_radius;

        // Damped sinusoidal wave profile with localized crest
        float fade = (1.0 - progress) * (1.0 - progress);
        float falloff = exp(-dist * 2.8) * fade;
        float crest = exp(-dist_from_crest * dist_from_crest * 220.0);
        float wave = sin(dist_from_crest * 36.0) * crest * falloff * strength;

        vec2 dir = normalize(delta + 0.0001);
        total_disp += dir * wave;
        total_wave += wave;
      }

      float wave_mag = length(total_disp);

      // Light vs Dark Theme Palette
      if (u_is_dark > 0.5) {
        // Dark Mode: Ethereal luminescent lime/cyan wave glow
        vec3 glow_color = mix(
          vec3(0.78, 1.0, 0.26),  // Accent lime (#c7ff42)
          vec3(0.40, 0.85, 0.95),  // Soft aqua
          clamp(wave_mag * 12.0, 0.0, 1.0)
        );
        float alpha = clamp(abs(total_wave) * 2.2 + wave_mag * 5.0, 0.0, 0.32);
        gl_FragColor = vec4(glow_color, alpha);
      } else {
        // Light Mode: Clean editorial liquid shadow & subtle refraction
        vec3 shade_color = vec3(0.08, 0.08, 0.07);
        float alpha = clamp(abs(total_wave) * 0.9 + wave_mag * 3.2, 0.0, 0.12);
        gl_FragColor = vec4(shade_color, alpha);
      }
    }
  `;

  const createShader = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  const program = gl.createProgram();
  const vs = createShader(gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
  if (!program || !vs || !fs) return;

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return;
  }

  gl.useProgram(program);

  // Set up fullscreen quad buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]),
    gl.STATIC_DRAW
  );

  const aPosition = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  // Uniform locations
  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uIsDark = gl.getUniformLocation(program, 'u_is_dark');
  const uRipples = gl.getUniformLocation(program, 'u_ripples');
  const uCount = gl.getUniformLocation(program, 'u_count');

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // State management
  const maxRipples = 16;
  const ripples: Ripple[] = [];
  let isRunning = false;
  let rafId: number | null = null;
  let lastX = 0;
  let lastY = 0;
  let lastTime = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = Math.round(window.innerWidth * dpr);
    const displayHeight = Math.round(window.innerHeight * dpr);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      gl.viewport(0, 0, displayWidth, displayHeight);
    }
  };

  window.addEventListener('resize', resize, { passive: true });
  resize();

  const addRipple = (clientX: number, clientY: number, strength: number = 1.0, duration: number = 1400) => {
    const x = clientX / window.innerWidth;
    const y = 1.0 - clientY / window.innerHeight; // invert for WebGL coordinate space

    if (ripples.length >= maxRipples) {
      ripples.shift();
    }

    ripples.push({
      x,
      y,
      startTime: performance.now(),
      duration,
      strength: Math.min(Math.max(strength, 0.4), 2.2),
    });

    if (!isRunning) {
      isRunning = true;
      render();
    }
  };

  // Pointer move handler with velocity-aware ripples
  window.addEventListener(
    'pointermove',
    (e) => {
      const now = performance.now();
      const dt = Math.max(now - lastTime, 16);
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.hypot(dx, dy);

      // Trigger ripple when moving past 18px threshold or at least every 65ms
      if (dist > 18 || (dist > 5 && dt > 65)) {
        const speed = Math.min(dist / dt, 3.0);
        addRipple(e.clientX, e.clientY, 0.7 + speed * 0.45, 1300);
        lastX = e.clientX;
        lastY = e.clientY;
        lastTime = now;
      }
    },
    { passive: true }
  );

  // Click shockwave ripple
  window.addEventListener(
    'pointerdown',
    (e) => {
      addRipple(e.clientX, e.clientY, 1.9, 1800);
    },
    { passive: true }
  );

  // Animation frame loop
  const rippleArray = new Float32Array(maxRipples * 4);

  const render = () => {
    const now = performance.now();
    let activeCount = 0;

    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      const elapsed = now - r.startTime;
      const progress = elapsed / r.duration;

      if (progress < 1.0) {
        const idx = activeCount * 4;
        rippleArray[idx] = r.x;
        rippleArray[idx + 1] = r.y;
        rippleArray[idx + 2] = progress;
        rippleArray[idx + 3] = r.strength;
        activeCount++;
      }
    }

    // Clean up expired ripples
    while (ripples.length > 0 && now - ripples[0].startTime >= ripples[0].duration) {
      ripples.shift();
    }

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (activeCount > 0) {
      gl.useProgram(program);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains('dark') ? 1.0 : 0.0;
      gl.uniform1f(uIsDark, isDark);
      gl.uniform1i(uCount, activeCount);
      gl.uniform4fv(uRipples, rippleArray);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = requestAnimationFrame(render);
    } else {
      // Idle: halt loop to achieve 0% CPU consumption
      isRunning = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  };

  // Pause when tab is not visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      isRunning = false;
    }
  });
}
