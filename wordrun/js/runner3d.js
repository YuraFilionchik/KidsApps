// Word Run: 3D-сцена на Three.js — трасса на 3 дорожки, блочный бегун, ворота со словами,
// лужи, частицы и Страж. Про правила игры ничего не знает: о проходе ворот сообщает колбэком.
'use strict';

class WordRunner3D {
  constructor(container, onGate) {
    this.container = container;
    this.onGate = onGate;
    this.LANE = 2.2;
    this.lane = 0;                 // -1, 0, 1
    this.running = false;
    this.mode = 'menu';            // menu | run
    this.baseSpeed = 12;
    this.speed = 1;
    this.boost = 0;
    this.stumble = 0;
    this.gates = null;             // активные ворота { group, options }
    this.passed = [];              // пройденные ворота, уезжают за камеру
    this.particles = [];
    this.trail = null;
    this.t = 0;
    this.last = performance.now();

    this.initScene();
    this.buildTrack();
    this.buildScenery();
    this.buildBoss();
    this.setSkin(SKINS[0]);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7dd3fc);
    this.scene.fog = new THREE.Fog(0x7dd3fc, 30, 75);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 120);
    this.camPos = new THREE.Vector3(0, 1.9, 7.4);
    this.camLook = new THREE.Vector3(0, -0.6, 0);
    this.camera.position.copy(this.camPos);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x64748b, 0.6));
    const sun = new THREE.DirectionalLight(0xffffff, 0.55);
    sun.position.set(6, 14, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 });
    this.scene.add(sun);
  }

  // Портрет: подбираем угол обзора, чтобы все 3 дорожки помещались по ширине.
  resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const aspect = w / h;
    const halfWidth = 4.1, dist = 9.5;
    const vfov = 2 * Math.atan((halfWidth / dist) / aspect) * 180 / Math.PI;
    this.camera.fov = Math.max(52, Math.min(84, vfov));
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  mat(color, extra = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });
  }

  buildTrack() {
    this.roadMat = this.mat(0x60a5fa);
    const road = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.6, 140), this.roadMat);
    road.position.set(0, -0.3, -50);
    road.receiveShadow = true;
    this.scene.add(road);

    // Движущиеся элементы трассы: разметка и бортики с «кнопками»-studs, как у конструктора.
    this.movers = [];
    const dashMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
    const curbA = this.mat(0xfacc15), curbB = this.mat(0xf97316);
    const dashGeo = new THREE.BoxGeometry(0.12, 0.04, 1.6);
    const curbGeo = new THREE.BoxGeometry(0.5, 0.4, 1.9);
    const studGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.1, 10);
    for (let i = 0; i < 26; i++) {
      const z = 8 - i * 4;
      for (const x of [-1.1, 1.1]) {
        const d = new THREE.Mesh(dashGeo, dashMat);
        d.position.set(x, 0.02, z);
        this.scene.add(d); this.movers.push(d);
      }
      for (const x of [-3.6, 3.6]) {
        const c = new THREE.Group();
        const m = i % 2 ? curbA : curbB;
        const box = new THREE.Mesh(curbGeo, m);
        box.position.y = 0.2; box.castShadow = true;
        const s1 = new THREE.Mesh(studGeo, m); s1.position.set(0, 0.45, -0.45);
        const s2 = new THREE.Mesh(studGeo, m); s2.position.set(0, 0.45, 0.45);
        c.add(box, s1, s2);
        c.position.set(x, 0, z);
        this.scene.add(c); this.movers.push(c);
      }
    }
  }

  // Декор по сторонам: блочные деревья и облака — дают ощущение скорости.
  buildScenery() {
    this.scenery = [];
    const trunk = this.mat(0x92400e);
    this.leafMat = this.mat(0x22c55e);
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 16; i++) {
      const side = i % 2 ? 1 : -1;
      const g = new THREE.Group();
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.5), trunk);
      t.position.y = 0.8;
      const s = 1 + (i % 3) * 0.35;
      const l = new THREE.Mesh(new THREE.BoxGeometry(1.6 * s, 1.4 * s, 1.6 * s), this.leafMat);
      l.position.y = 1.6 + 0.7 * s;
      t.castShadow = l.castShadow = true;
      g.add(t, l);
      g.position.set(side * (6 + (i * 1.7) % 4), -0.6, 6 - i * 8.5);
      this.scene.add(g);
      this.scenery.push(g);
    }
    for (let i = 0; i < 8; i++) {
      const c = new THREE.Group();
      for (let k = 0; k < 3; k++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(2.2 - k * 0.4, 0.9, 1.4), cloudMat);
        b.position.set(k * 1.3 - 1.2, (k % 2) * 0.4, 0);
        c.add(b);
      }
      c.position.set((i % 2 ? 1 : -1) * (9 + i % 3 * 3), 9 + (i % 3) * 2, -10 - i * 13);
      this.scene.add(c);
      this.scenery.push(c);
    }
  }

  setWorld(world) {
    const sky = new THREE.Color(world.sky);
    this.scene.background = sky;
    this.scene.fog.color = sky;
    this.roadMat.color.set(world.ground);
    this.bossWorld = world.id;
    this.applyBossSprite();
  }

  setSkin(skin) {
    if (this.player) this.scene.remove(this.player);
    const p = new THREE.Group();
    const head = this.mat(skin.head), torso = this.mat(skin.torso), legs = this.mat(skin.legs);
    const box = (w, h, d, m, x, y, z = 0) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      return mesh;
    };

    const body = new THREE.Group();
    body.add(box(0.85, 0.85, 0.85, head, 0, 2.05));
    body.add(box(1.05, 1.1, 0.55, torso, 0, 1.08));
    // Лицо смотрит в сторону камеры в меню и вперёд при беге (группа разворачивается).
    const dark = new THREE.Color(skin.head).getHSL({}).l < 0.35;
    const eyeMat = new THREE.MeshBasicMaterial({ color: dark ? 0xf8fafc : 0x111827 });
    body.add(box(0.12, 0.16, 0.04, eyeMat, -0.18, 2.12, 0.43));
    body.add(box(0.12, 0.16, 0.04, eyeMat, 0.18, 2.12, 0.43));
    body.add(box(0.34, 0.06, 0.04, eyeMat, 0, 1.88, 0.43));

    // Руки и ноги крепятся за «плечо», чтобы качались, а не вращались вокруг центра.
    const limb = (m, x, y) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, 0);
      pivot.add(box(0.4, 0.95, 0.45, m, 0, -0.45));
      body.add(pivot);
      return pivot;
    };
    this.armL = limb(head, -0.74, 1.6);
    this.armR = limb(head, 0.74, 1.6);
    this.legL = limb(legs, -0.27, 0.95);
    this.legR = limb(legs, 0.27, 0.95);

    const red = this.mat(0xef4444), gold = this.mat(0xfacc15, { metalness: 0.3 });
    if (skin.hat === 'ears') {
      body.add(box(0.24, 0.3, 0.2, torso, -0.27, 2.6), box(0.24, 0.3, 0.2, torso, 0.27, 2.6));
    } else if (skin.hat === 'band') {
      body.add(box(0.9, 0.18, 0.9, red, 0, 2.22), box(0.1, 0.35, 0.1, red, 0.2, 2.05, -0.5));
    } else if (skin.hat === 'antenna') {
      body.add(box(0.06, 0.4, 0.06, legs, 0, 2.65), box(0.16, 0.16, 0.16, red, 0, 2.88));
    } else if (skin.hat === 'plume') {
      body.add(box(0.95, 0.25, 0.95, torso, 0, 2.5), box(0.18, 0.4, 0.8, red, 0, 2.8));
    } else if (skin.hat === 'crown') {
      body.add(box(0.8, 0.2, 0.8, gold, 0, 2.55));
      for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) body.add(box(0.16, 0.22, 0.16, gold, x, 2.75, z));
    }

    p.add(body);
    this.body = body;
    // Тень-кружок под ногами — читается лучше настоящей тени на ярком фоне.
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.6, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    p.add(shadow);
    p.position.x = this.lane * this.LANE;
    this.player = p;
    this.scene.add(p);
  }

  setTrail(trail) {
    this.trail = trail && trail.color ? trail.color : null;
  }

  // Страж: PNG-спрайт из img/bosses, если есть, иначе блочный великан.
  buildBoss() {
    this.boss = new THREE.Group();
    const purple = this.mat(0x7c3aed), gold = this.mat(0xfacc15, { metalness: 0.4 });
    const eye = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const blocky = new THREE.Group();
    const add = (geo, m, x, y, z = 0) => { const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); blocky.add(b); return b; };
    add(new THREE.BoxGeometry(3, 3, 1.8), purple, 0, 4.5);
    add(new THREE.BoxGeometry(2.2, 0.6, 1.4), gold, 0, 6.3);
    add(new THREE.BoxGeometry(0.5, 0.5, 0.1), eye, -0.6, 5, 0.92);
    add(new THREE.BoxGeometry(0.5, 0.5, 0.1), eye, 0.6, 5, 0.92);
    add(new THREE.BoxGeometry(0.9, 2.2, 0.9), purple, -2.1, 4.4);
    add(new THREE.BoxGeometry(0.9, 2.2, 0.9), purple, 2.1, 4.4);
    this.bossBlocky = blocky;
    // Страж — главный момент мира: крупно, над воротами и без тумана.
    this.bossSprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, fog: false }));
    this.bossSprite.scale.set(13, 13, 1);
    this.bossSprite.position.y = 8.2;
    this.bossSprite.visible = false;
    this.boss.add(blocky, this.bossSprite);
    this.boss.position.set(0, 0, -62);
    this.boss.visible = false;
    this.scene.add(this.boss);
  }

  applyBossSprite() {
    const img = WRArt.bossImage(this.bossWorld);
    if (img) {
      const tex = new THREE.Texture(img);
      tex.needsUpdate = true;
      if (this.bossSprite.material.map) this.bossSprite.material.map.dispose();
      this.bossSprite.material.map = tex;
      this.bossSprite.material.needsUpdate = true;
    }
    this.bossSprite.visible = !!img;
    this.bossBlocky.visible = !img;
  }

  showBoss(on) {
    if (on && !this.boss.visible) this.applyBossSprite();
    this.boss.visible = on;
    this.bossDefeat = 0;
  }

  defeatBoss() {
    if (this.boss.visible) this.bossDefeat = 1.2;
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Табличка ворот: английское слово крупно или (режим 4) картинка с подписью.
  gateTexture(opt, picMode, hint) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 400;
    const ctx = c.getContext('2d');
    const glow = hint && opt.correct;
    ctx.fillStyle = glow ? '#dcfce7' : '#ffffff';
    ctx.strokeStyle = glow ? '#16a34a' : '#1e293b';
    ctx.lineWidth = 18;
    this.roundRect(ctx, 12, 12, 488, 376, 44);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (picMode) {
      WRArt.drawWord(ctx, opt.word, 256, 165, 210);
      ctx.fillStyle = '#334155';
      ctx.font = '800 40px Nunito, "Comic Sans MS", sans-serif';
      ctx.fillText(opt.word.ru, 256, 330, 460);
    } else {
      const text = opt.word.en;
      const size = text.length > 7 ? 74 : 92;
      ctx.fillStyle = '#0f172a';
      ctx.font = `900 ${size}px Nunito, "Comic Sans MS", sans-serif`;
      ctx.fillText(text, 256, 205, 460);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }

  // Новые ворота вдали. distance — сколько бежать до них.
  spawnGates(options, { picMode = false, boss = false, hint = false, distance = 56 } = {}) {
    if (this.gates) this.retire(this.gates);
    const group = new THREE.Group();
    group.position.z = -distance;
    const pillar = this.mat(boss ? 0x9333ea : 0x2563eb);
    const top = this.mat(boss ? 0xfacc15 : 0xffffff);
    const pGeo = new THREE.BoxGeometry(0.26, 3.4, 0.26);
    const boards = [];
    for (const opt of options) {
      const g = new THREE.Group();
      g.position.x = opt.lane * this.LANE;
      const pl = new THREE.Mesh(pGeo, pillar); pl.position.set(-0.98, 1.7, 0);
      const pr = new THREE.Mesh(pGeo, pillar); pr.position.set(0.98, 1.7, 0);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.22, 0.3), top); bar.position.y = 3.45;
      pl.castShadow = pr.castShadow = true;
      const tex = this.gateTexture(opt, picMode, hint);
      const faceMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      const board = new THREE.Mesh(new THREE.PlaneGeometry(2.12, 1.66), faceMat);
      board.position.set(0, 2.5, 0.16);
      // Полупрозрачная «плёнка» в проёме, которую игрок пробегает насквозь.
      const film = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.65),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, side: THREE.DoubleSide }));
      film.position.y = 0.85;
      g.add(pl, pr, bar, board, film);
      g.userData = { opt, film, board };
      boards.push(g);
      group.add(g);
    }
    this.scene.add(group);
    this.gates = { group, options, boards };
    this.showBoss(boss);
  }

  retire(gates) {
    this.passed.push(gates);
  }

  dispose(gates) {
    this.scene.remove(gates.group);
    gates.group.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
  }

  // Подсветить выбранные ворота: зелёные — верно, красные — нет; верные всегда зелёные.
  markGates(gates, chosenLane) {
    for (const g of gates.boards) {
      const { opt, film } = g.userData;
      if (opt.correct) { film.material.color.set(0x22c55e); film.material.opacity = 0.55; }
      else if (opt.lane === chosenLane) { film.material.color.set(0xef4444); film.material.opacity = 0.55; }
    }
  }

  clearGates() {
    if (this.gates) { this.dispose(this.gates); this.gates = null; }
    this.passed.forEach(g => this.dispose(g));
    this.passed = [];
    this.showBoss(false);
  }

  setLane(lane) {
    const next = Math.max(-1, Math.min(1, lane));
    const changed = next !== this.lane;
    this.lane = next;
    return changed;
  }

  moveLane(delta) {
    return this.setLane(this.lane + delta);
  }

  burst(color, count = 18, y = 1.2) {
    const geo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: color === 'rainbow' ? new THREE.Color().setHSL(Math.random(), 0.9, 0.6) : color }));
      m.position.set(this.player.position.x, y, 0);
      this.scene.add(m);
      this.particles.push({
        mesh: m, life: 0.9,
        v: new THREE.Vector3((Math.random() - 0.5) * 6, 3 + Math.random() * 4, (Math.random() - 0.3) * 4),
        g: 12, shared: geo
      });
    }
  }

  correctFx() {
    this.boost = 0.6;
    this.burst(0xfacc15, 16, 2.2);
  }

  splashFx() {
    this.stumble = 0.9;
    const puddle = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.05, 24),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.1, transparent: true, opacity: 0.85 }));
    puddle.position.set(this.player.position.x, 0.03, 0.3);
    this.scene.add(puddle);
    this.particles.push({ mesh: puddle, life: 1.6, puddle: true });
    this.burst(0x60a5fa, 22, 0.3);
  }

  start() {
    this.mode = 'run';
    this.running = true;
    this.lane = 0;
  }

  stop() {
    this.running = false;
  }

  toMenu() {
    this.mode = 'menu';
    this.running = false;
    this.lane = 0;
    this.clearGates();
  }

  updateCamera(dt) {
    const run = this.mode === 'run';
    const wantPos = run ? new THREE.Vector3(this.player.position.x * 0.35, 5.6, 8.6) : new THREE.Vector3(0, 1.9, 7.4);
    // В меню смотрим ниже персонажа — он оказывается в верхней половине экрана, над панелью.
    const wantLook = run ? new THREE.Vector3(this.player.position.x * 0.25, 1.4, -9) : new THREE.Vector3(0, -0.6, 0);
    const k = Math.min(1, dt * 3);
    this.camPos.lerp(wantPos, k);
    this.camLook.lerp(wantLook, k);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
  }

  animatePlayer(dt) {
    const p = this.player, t = this.t;
    p.position.x += (this.lane * this.LANE - p.position.x) * Math.min(1, dt * 12);
    const lean = (this.lane * this.LANE - p.position.x) * -0.08;

    if (this.mode === 'menu') {
      this.body.rotation.y += (Math.sin(t * 0.6) * 0.5 - this.body.rotation.y) * Math.min(1, dt * 2);
      this.body.rotation.x = 0;
      this.body.rotation.z = 0;
      p.position.y = Math.sin(t * 2.5) * 0.05;
      this.armL.rotation.x = Math.sin(t * 2) * 0.12;
      this.armR.rotation.x = -Math.sin(t * 2) * 0.12;
      this.armR.rotation.z = 0.15 + Math.max(0, Math.sin(t * 1.3)) * 0.6; // машет рукой
      this.legL.rotation.x = this.legR.rotation.x = 0;
      return;
    }

    // При беге персонаж смотрит вперёд (от камеры).
    this.body.rotation.y += (Math.PI - this.body.rotation.y) * Math.min(1, dt * 8);
    this.armR.rotation.z = 0;
    if (this.stumble > 0) {
      this.body.rotation.x = 0.9 * Math.min(1, this.stumble * 2);
      p.position.y = -0.15;
      return;
    }
    this.body.rotation.x = this.running ? 0.12 : 0;
    this.body.rotation.z = lean;
    const f = this.running ? 13 * (this.speed * (this.boost > 0 ? 1.4 : 1)) : 2;
    const a = this.running ? 0.8 : 0.1;
    p.position.y = this.running ? Math.abs(Math.sin(t * f)) * 0.16 : 0;
    this.legL.rotation.x = Math.sin(t * f) * a;
    this.legR.rotation.x = -Math.sin(t * f) * a;
    this.armL.rotation.x = -Math.sin(t * f) * a * 0.8;
    this.armR.rotation.x = Math.sin(t * f) * a * 0.8;
  }

  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.t += dt;

    if (this.boost > 0) this.boost -= dt;
    if (this.stumble > 0) this.stumble -= dt;

    let v = 0;
    if (this.running) {
      v = this.baseSpeed * this.speed;
      if (this.boost > 0) v *= 1.5;
      if (this.stumble > 0) v *= 0.25;
    } else if (this.mode === 'menu') {
      v = 2.5; // в меню мир медленно едет — сцена живая
    }

    for (const m of this.movers) {
      m.position.z += v * dt;
      if (m.position.z > 10) m.position.z -= 104;
    }
    for (const s of this.scenery) {
      s.position.z += v * dt * (s.position.y > 5 ? 0.3 : 1);
      if (s.position.z > 14) s.position.z -= s.position.y > 5 ? 104 : 136;
    }

    if (this.running && this.trail && this.stumble <= 0 && Math.random() < 0.5) {
      const color = this.trail === 'rainbow' ? new THREE.Color().setHSL((this.t * 0.6) % 1, 0.9, 0.6) : this.trail;
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({ color }));
      m.position.set(this.player.position.x + (Math.random() - 0.5) * 0.5, 0.3 + Math.random() * 0.5, 0.4);
      this.scene.add(m);
      this.particles.push({ mesh: m, life: 0.5, trail: true });
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.puddle) {
        p.mesh.position.z += v * dt;
        p.mesh.material.opacity = Math.max(0, Math.min(0.85, p.life));
      } else if (p.trail) {
        p.mesh.position.z += v * dt * 0.8;
        p.mesh.scale.setScalar(Math.max(0.01, p.life * 2));
      } else {
        p.v.y -= p.g * dt;
        p.mesh.position.addScaledVector(p.v, dt);
        p.mesh.rotation.x += dt * 6;
        p.mesh.scale.setScalar(Math.max(0.01, p.life));
      }
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if (!p.shared) p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    if (this.gates) {
      this.gates.group.position.z += v * dt;
      if (this.running && this.gates.group.position.z >= 0) {
        const gates = this.gates;
        this.gates = null;
        const hit = gates.options.find(o => o.lane === this.lane) || null;
        this.markGates(gates, this.lane);
        this.retire(gates);
        if (this.onGate) this.onGate(hit);
      }
    }
    for (let i = this.passed.length - 1; i >= 0; i--) {
      const g = this.passed[i];
      g.group.position.z += v * dt;
      if (g.group.position.z > 12) { this.dispose(g); this.passed.splice(i, 1); }
    }

    if (this.boss.visible) {
      if (this.bossDefeat > 0) {
        this.bossDefeat -= dt;
        this.boss.rotation.z += dt * 4;
        this.boss.position.y -= dt * 6;
        if (this.bossDefeat <= 0) { this.boss.visible = false; this.boss.rotation.z = 0; }
      } else {
        this.boss.position.y = Math.sin(this.t * 3) * 0.4;
        this.boss.rotation.y = Math.sin(this.t * 1.5) * 0.2;
      }
    }

    this.animatePlayer(dt);
    this.updateCamera(dt);
    this.renderer.render(this.scene, this.camera);
  }
}
