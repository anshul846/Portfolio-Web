
      import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

      const canvas = document.getElementById("bg-canvas");
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 25);

      function resize() {
        const w = window.innerWidth,
          h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
      window.addEventListener("resize", resize);
      resize();

      // Underwater Particles (bubbles)

      const bubbleCount = 2000;
      const positions = new Float32Array(bubbleCount * 3);
      const colors = new Float32Array(bubbleCount * 3);
      const sizes = new Float32Array(bubbleCount);

      const colorA = new THREE.Color(0x99d6ff); // light blue
      const colorB = new THREE.Color(0x003d66); // dark blue

      for (let i = 0; i < bubbleCount; i++) {
        const i3 = i * 3;
        // Spread in space (x,y,z)
        positions[i3] = (Math.random() - 0.5) * 40;
        positions[i3 + 1] = (Math.random() - 0.5) * 35;
        positions[i3 + 2] = (Math.random() - 0.5) * 40;

        const t = Math.random();
        const c = colorA.clone().lerp(colorB, t);
        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;

        sizes[i] = 0.1 + Math.random() * 0.3; // bubble size variations
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

      const material = new THREE.PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        sizeAttenuation: true,
        depthWrite: false,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      // Blue hover glow sphere slowly rotating
      const glowGeo = new THREE.SphereGeometry(10, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x007acc,
        transparent: true,
        opacity: 0.03,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      scene.add(glow);

      // Mouse parallax controls
      const mouse = { x: 0, y: 0 };
      window.addEventListener("pointermove", (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      });

      let time = 0;

      function animate() {
        requestAnimationFrame(animate);
        time += 0.003;

        // Create slow wave-like vertical bubble motion
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < bubbleCount; i++) {
          positions[i * 3 + 1] += 0.005 * Math.sin(time * 2 + i);
          if (positions[i * 3 + 1] > 20) positions[i * 3 + 1] = -20; // reset up flow
        }
        geometry.attributes.position.needsUpdate = true;

        points.rotation.y += 0.0009;
        glow.rotation.y -= 0.0006;
        glow.material.opacity = 0.02 + Math.abs(Math.sin(time)) * 0.02;

        camera.position.x += (mouse.x * 3 - camera.position.x) * 0.05;
        camera.position.y += (mouse.y * 2 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
      }
      animate();

      // Intersection observer reveal animations
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add("show");
          });
        },
        { threshold: 0.15 }
      );
      document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

      // Footer year update
      document.getElementById("year").textContent = new Date().getFullYear();

      // Button magnetic effect
      document.querySelectorAll(".magnet").forEach((btn) => {
        const glow = btn.querySelector(".mglow");
        btn.addEventListener("pointermove", (e) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          glow.style.width = "180px";
          glow.style.height = "180px";
          glow.style.transform = `translate(${x - 90}px, ${y - 90}px)`;
        });
        btn.addEventListener("pointerleave", () => {
          glow.style.width = glow.style.height = "0px";
        });
      });

      // Cards tilt effect
      document.querySelectorAll(".tilt").forEach((card) => {
        card.addEventListener("pointermove", (e) => {
          const rect = card.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width;
          const py = (e.clientY - rect.top) / rect.height;
          const rx = (py - 0.5) * -8;
          const ry = (px - 0.5) * 10;
          card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        });
        card.addEventListener("pointerleave", () => {
          card.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg)`;
        });
      });

      // Custom cursor
      const cursor = document.getElementById("cursor");
      window.addEventListener("pointermove", (e) => {
        cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      });
      document.querySelectorAll("a, button, .magnet, .tilt").forEach((el) => {
        el.addEventListener("pointerenter", () =>
          cursor.classList.add("cursor--active")
        );
        el.addEventListener("pointerleave", () =>
          cursor.classList.remove("cursor--active")
        );
      });

      // Resume download safe fallback
      function downloadResume(url, filename) {
        try {
          const sameOrigin =
            location.origin === new URL(url, location.href).origin;
          if (sameOrigin) {
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            a.remove();
            return;
          }
        } catch (_) {}
        fetch(url, { mode: "cors" })
          .then((r) => r.blob())
          .then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(blobUrl);
            a.remove();
          })
          .catch(() => window.open(url, "_blank", "noopener,noreferrer"));
      }
      const resumeAnchor = document.getElementById("resumeBtn");
      if (resumeAnchor) {
        const RESUME_URL = "/Resume.pdf";
        const RESUME_NAME = "Anshul_Singal_Resume.pdf";
        resumeAnchor.addEventListener("click", (e) => {
          e.preventDefault();
          downloadResume(RESUME_URL, RESUME_NAME);
        });
      }