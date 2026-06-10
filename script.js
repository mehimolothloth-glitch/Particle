(function(){
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  
  const MAX_PARTICLES = 1000;
  const BASE_RADIUS = 4.2;
  const CONNECTION_DIST = 100;
  const MAX_SPEED = 1.1;
  
  let isDragging = false;
  let mouseX = 0, mouseY = 0;
  let currentMode = 'draw';
  let canvasWidth = window.innerWidth;
  let canvasHeight = window.innerHeight;
  let lastAddTime = 0;
  let lastEraseTime = 0;
  const ADD_COOLDOWN_MS = 18;
  const ERASE_COOLDOWN = 30;
  
  function resizeCanvas() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    drawScene();
  }
  
  function updateCounterUI() {
    const span = document.getElementById('particleCount');
    if(span) span.innerText = particles.length;
  }
  
  function showMessage(msg, duration = 1300) {
    const toast = document.getElementById('toastMsg');
    if(!toast) return;
    toast.style.opacity = '1';
    toast.innerText = msg;
    setTimeout(() => {
      toast.style.opacity = '0';
    }, duration);
  }
  
  function updateModeUI() {
    const modeDiv = document.getElementById('modeText');
    if(modeDiv) {
      if(currentMode === 'draw') {
        modeDiv.innerText = '🎨 GAMBAR';
        modeDiv.style.background = '#2a5a7a';
      } else {
        modeDiv.innerText = '⚰️ HAPUS';
        modeDiv.style.background = '#8b3c2a';
      }
    }
    showMessage(`Mode: ${currentMode === 'draw' ? 'GAMBAR (tambah partikel)' : 'HAPUS (sentuh partikel)'}`, 800);
  }
  
  function addParticleAt(x, y) {
    if(particles.length >= MAX_PARTICLES) particles.shift();
    const offX = (Math.random() - 0.5) * 9;
    const offY = (Math.random() - 0.5) * 9;
    let px = Math.min(canvasWidth - 6, Math.max(6, x + offX));
    let py = Math.min(canvasHeight - 6, Math.max(6, y + offY));
    const hue = (Date.now() * 0.5 + px * 0.8 + py * 0.6) % 360;
    const sat = 70 + Math.sin(px * 0.02) * 18;
    const light = 58 + Math.cos(py * 0.025) * 12;
    
    particles.push({
      x: px, y: py,
      vx: (Math.random() - 0.5) * MAX_SPEED * 0.9,
      vy: (Math.random() - 0.5) * MAX_SPEED * 0.9,
      radius: BASE_RADIUS + Math.random() * 2.2,
      color: `hsl(${hue}, ${sat}%, ${light}%)`
    });
    updateCounterUI();
  }
  
  function eraseNearestParticle(x, y, radius = 50) {
    if(particles.length === 0) return false;
    
    let closestIdx = -1;
    let closestDist = radius;
    
    for(let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.hypot(dx, dy);
      if(dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }
    
    if(closestIdx !== -1) {
      particles.splice(closestIdx,1);
      updateCounterUI();
      return true;
    }
    return false;
  }
  
  function clearAllParticles() {
    particles = [];
    updateCounterUI();
    showMessage('Semua partikel dibersihkan', 1100);
    drawScene();
  }
  
  function updateParticles() {
    if(particles.length === 0) return;
    const mouseInBounds = (mouseX > 0 && mouseX < canvasWidth && mouseY > 0 && mouseY < canvasHeight);
    for(let p of particles) {
      p.vx += (Math.random() - 0.5) * 0.2;
      p.vy += (Math.random() - 0.5) * 0.2;
      
      if(mouseInBounds) {
        let dx = p.x - mouseX, dy = p.y - mouseY;
        let dist = Math.hypot(dx, dy);
        if(dist < 70 && dist > 0.5) {
          let force = (70 - dist) / 70;
          let angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force * 0.42;
          p.vy += Math.cos(angle) * force * 0.42;
        }
      }
      
      p.vx = Math.min(MAX_SPEED, Math.max(-MAX_SPEED, p.vx));
      p.vy = Math.min(MAX_SPEED, Math.max(-MAX_SPEED, p.vy));
      p.x += p.vx;
      p.y += p.vy;
      
      if(p.x - p.radius <= 0) { p.x = p.radius; p.vx *= -0.88; }
      if(p.x + p.radius >= canvasWidth) { p.x = canvasWidth - p.radius; p.vx *= -0.88; }
      if(p.y - p.radius <= 0) { p.y = p.radius; p.vy *= -0.88; }
      if(p.y - p.radius >= canvasHeight) { p.y = canvasHeight - p.radius; p.vy *= -0.88; }
      
      let match = p.color.match(/\d+/);
      let currentHue = match ? parseFloat(match[0]) : 0;
      let newHue = (currentHue + 0.45) % 360;
      p.color = `hsl(${newHue}, 72%, 62%)`;
    }
  }
  
  function drawScene() {
    if(!ctx) return;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    if(particles.length > 1) {
      for(let i = 0; i < particles.length; i++) {
        for(let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i], p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if(dist < CONNECTION_DIST) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(100, 200, 255, ${0.6 * (1 - dist / CONNECTION_DIST)})`;
            ctx.lineWidth = 1.3;
            ctx.stroke();
          }
        }
      }
    }
    
    for(let p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x - 1, p.y - 1, p.radius * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffffcc';
      ctx.fill();
    }
    
    if(isDragging) {
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 28, 0, Math.PI * 2);
      ctx.strokeStyle = currentMode === 'draw' ? '#aaffdd' : '#ffaa88';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }
  
  function updateTouchPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;
    if(e.touches) {
      if(e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else return;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    mouseX = Math.min(canvasWidth, Math.max(0, (clientX - rect.left) * scaleX));
    mouseY = Math.min(canvasHeight, Math.max(0, (clientY - rect.top) * scaleY));
  }
  
  function handleDragStart(e) {
    e.preventDefault();
    isDragging = true;
    updateTouchPosition(e);
    if(currentMode === 'draw') {
      addParticleAt(mouseX, mouseY);
      lastAddTime = Date.now();
    } else {
      eraseNearestParticle(mouseX, mouseY, 55);
      lastEraseTime = Date.now();
    }
    drawScene();
  }
  
  function handleDragMove(e) {
    if(!isDragging) return;
    e.preventDefault();
    updateTouchPosition(e);
    const now = Date.now();
    
    if(currentMode === 'draw') {
      if(now - lastAddTime >= ADD_COOLDOWN_MS) {
        addParticleAt(mouseX, mouseY);
        lastAddTime = now;
      }
    } else {
      if(now - lastEraseTime >= ERASE_COOLDOWN) {
        eraseNearestParticle(mouseX, mouseY, 55);
        lastEraseTime = now;
      }
    }
    drawScene();
  }
  
  function handleDragEnd(e) {
    isDragging = false;
    drawScene();
  }
  
  function attachEvents() {
    canvas.addEventListener('mousedown', handleDragStart);
    window.addEventListener('mousemove', (e) => {
      if(!isDragging) updateTouchPosition(e);
      drawScene();
    });
    window.addEventListener('mouseup', handleDragEnd);
    canvas.addEventListener('touchstart', handleDragStart, { passive: false });
    canvas.addEventListener('touchmove', handleDragMove, { passive: false });
    canvas.addEventListener('touchend', handleDragEnd);
    canvas.addEventListener('touchcancel', handleDragEnd);
  }
  
  function setupButtons() {
    const clearBtn = document.getElementById('clearBtn');
    if(clearBtn) {
      clearBtn.onclick = () => {
        clearAllParticles();
      };
    }
    
    const toggleBtn = document.getElementById('toggleModeBtn');
    if(toggleBtn) {
      toggleBtn.onclick = () => {
        if(currentMode === 'draw') {
          currentMode = 'erase';
        } else {
          currentMode = 'draw';
        }
        updateModeUI();
      };
    }
  }
  
  function init() {
    resizeCanvas();
    attachEvents();
    setupButtons();
    for(let i = 0; i < 50; i++) {
      addParticleAt(Math.random() * canvasWidth, Math.random() * canvasHeight);
    }
    updateModeUI();
    requestAnimationFrame(function animate() {
      updateParticles();
      drawScene();
      requestAnimationFrame(animate);
    });
  }
  
  window.addEventListener('resize', () => resizeCanvas());
  init();
})();
