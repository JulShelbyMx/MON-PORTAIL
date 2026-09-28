/**
 * Hero ocean — the Thousand Sunny actually sails.
 *  - Waves are sums of travelling sines, moving in the direction of travel.
 *  - The boat crosses the screen (bow to the left), rides the wave surface
 *    and pitches according to the wave slope under its hull.
 *  - Foam trails behind the stern and spray flies from the bow.
 */
(function () {
    const ocean = document.getElementById('ocean');
    const backCanvas = document.getElementById('sea-back');
    const frontCanvas = document.getElementById('sea-front');
    const rig = document.getElementById('boat-rig');
    if (!ocean || !backCanvas || !frontCanvas || !rig) return;

    const bctx = backCanvas.getContext('2d');
    const fctx = frontCanvas.getContext('2d');
    const css = getComputedStyle(document.documentElement);
    const col = name => css.getPropertyValue(name).trim();

    // Wave layers. `s` = phase speed in px/s (waves travel left, like the boat).
    const LAYERS = [
        { base: 0.22, comps: [{ l: 720, a: 7, s: 7, p: 0.4 }, { l: 320, a: 3, s: 10, p: 1.7 }], c: ['--sea-1a', '--sea-1b'], crest: 0.10 },
        { base: 0.36, comps: [{ l: 560, a: 9, s: 13, p: 1.2 }, { l: 250, a: 4, s: 18, p: 0.3 }], c: ['--sea-2a', '--sea-2b'], crest: 0.14 },
        { base: 0.52, comps: [{ l: 480, a: 12, s: 26, p: 2.6 }, { l: 210, a: 4, s: 34, p: 1.1 }], c: ['--sea-3a', '--sea-3b'], crest: 0.18 },
        { base: 0.70, comps: [{ l: 640, a: 12, s: 46, p: 0.9 }, { l: 270, a: 4, s: 56, p: 2.2 }], c: ['--sea-4a', '--sea-4b'], crest: 0.22 }
    ];
    const RIDE = LAYERS[2]; // the wave layer in front of the hull

    let W = 0, H = 0, dpr = 1, sc = 1;
    let boatW = 0, boatH = 0;
    let boatX = 0, angle = 0;
    let sunX = 0;
    let t = 0, last = 0, running = false, visible = true;
    const particles = [];
    let foamAcc = 0, sprayAcc = 0;

    const TAU = Math.PI * 2;

    function surface(layer, x, time) {
        let y = H * layer.base;
        for (const c of layer.comps) {
            const k = TAU / c.l;
            y += c.a * sc * Math.sin(k * x + k * c.s * time + c.p);
        }
        return y;
    }

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = ocean.clientWidth;
        H = ocean.clientHeight;
        sc = H / 260;
        [backCanvas, frontCanvas].forEach(cv => {
            cv.width = Math.round(W * dpr);
            cv.height = Math.round(H * dpr);
        });
        bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        boatW = rig.offsetWidth;
        boatH = rig.offsetHeight || boatW * 1.182;
        const sun = document.querySelector('.hero .sun');
        if (sun) {
            const s = sun.getBoundingClientRect(), o = ocean.getBoundingClientRect();
            sunX = s.left + s.width / 2 - o.left;
        } else { sunX = W * 0.7; }
    }

    function drawLayer(ctx, layer, time) {
        const top = H * layer.base - 26 * sc;
        const g = ctx.createLinearGradient(0, top, 0, H);
        g.addColorStop(0, col(layer.c[0]));
        g.addColorStop(1, col(layer.c[1]));

        ctx.beginPath();
        ctx.moveTo(0, H);
        const pts = [];
        for (let x = 0; x <= W + 8; x += 8) {
            const y = surface(layer, x, time);
            pts.push(y);
            ctx.lineTo(x, y);
        }
        ctx.lineTo(W + 8, H);
        ctx.closePath();
        ctx.fillStyle = g;
        ctx.fill();

        // bright crest line
        ctx.beginPath();
        pts.forEach((y, i) => (i ? ctx.lineTo(i * 8, y) : ctx.moveTo(0, y)));
        ctx.strokeStyle = 'rgba(190, 225, 255,' + layer.crest + ')';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // Sun reflection glittering on the water
    function drawGlitter(ctx, layer, time, rows, alpha) {
        for (let i = 0; i < rows; i++) {
            const y = surface(layer, sunX, time) + 4 + i * 6 * sc;
            const wobble = 0.55 + 0.45 * Math.sin(time * 1.7 + i * 1.3);
            const half = (8 + i * 5) * wobble * sc;
            ctx.fillStyle = 'rgba(255, 205, 140,' + (alpha * (1 - i / rows) * wobble) + ')';
            ctx.fillRect(sunX - half, y, half * 2, 1.6);
        }
    }

    function spawn(kind, x, y, extra) {
        particles.push(Object.assign({ kind, x, y, age: 0 }, extra));
        if (particles.length > 260) particles.shift();
    }

    function updateParticles(dt, time) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.age += dt;
            if (p.age >= p.life) { particles.splice(i, 1); continue; }
            if (p.kind === 'foam') {
                p.x -= RIDE.comps[0].s * dt * 0.9;          // drifts with the water
                p.y = surface(RIDE, p.x, time) + p.dy;       // stays on the surface
            } else {                                          // spray
                p.vy += 420 * dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
            }
        }
    }

    function drawParticles(ctx) {
        for (const p of particles) {
            const k = p.age / p.life;
            if (p.kind === 'foam') {
                const w = p.w * (1 + k * 1.8);
                ctx.fillStyle = 'rgba(235, 246, 255,' + (0.55 * (1 - k)) + ')';
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, w, 2.2 * sc + k * 1.5, 0, 0, TAU);
                ctx.fill();
            } else {
                ctx.fillStyle = 'rgba(240, 249, 255,' + (0.85 * (1 - k)) + ')';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * (1 - k * 0.4), 0, TAU);
                ctx.fill();
            }
        }
    }

    function frame(now) {
        if (!running) return;
        const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
        last = now;
        t += dt;

        // --- boat sails to the left, and wraps around
        const speed = Math.max(48, W * 0.052);
        boatX -= speed * dt;
        if (boatX < -boatW * 1.3) boatX = W + boatW * 0.4;

        // --- ride the wave: height at hull centre, pitch from slope bow->stern
        const cx = boatX + boatW * 0.5;
        const bowX = boatX + boatW * 0.16;
        const sternX = boatX + boatW * 0.84;
        const yc = surface(RIDE, cx, t);
        const yBow = surface(RIDE, bowX, t);
        const yStern = surface(RIDE, sternX, t);
        const target = Math.atan2(yStern - yBow, sternX - bowX) * (180 / Math.PI) * 0.9;
        angle += (target - angle) * Math.min(1, dt * 5);
        const sink = boatH * 0.13;
        const y = yc + sink - boatH;

        rig.style.transform = 'translate3d(' + (boatX - (W / 2 - boatW / 2)) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + angle.toFixed(2) + 'deg)';

        // --- foam behind the stern, spray at the bow (only while on screen)
        if (boatX > -boatW && boatX < W) {
            foamAcc += dt * 34;
            while (foamAcc >= 1) {
                foamAcc -= 1;
                const fx = sternX + Math.random() * 14;
                spawn('foam', fx, 0, { life: 2.4 + Math.random() * 1.2, dy: 2 + Math.random() * 7 * sc, w: (10 + Math.random() * 16) * sc });
            }
            sprayAcc += dt * 46;
            while (sprayAcc >= 1) {
                sprayAcc -= 1;
                spawn('spray', bowX - 4 + Math.random() * 8, yBow + sink * 0.2 + 2, {
                    life: 0.5 + Math.random() * 0.5,
                    vx: -(30 + Math.random() * 90) - speed * 0.2,
                    vy: -(60 + Math.random() * 120),
                    r: 0.8 + Math.random() * 1.6
                });
            }
        }
        updateParticles(dt, t);

        // --- draw
        bctx.clearRect(0, 0, W, H);
        drawLayer(bctx, LAYERS[0], t);
        drawLayer(bctx, LAYERS[1], t);
        drawGlitter(bctx, LAYERS[1], t, 7, 0.32);

        fctx.clearRect(0, 0, W, H);
        drawLayer(fctx, LAYERS[2], t);
        drawGlitter(fctx, LAYERS[2], t, 6, 0.16);
        drawParticles(fctx);
        drawLayer(fctx, LAYERS[3], t);

        requestAnimationFrame(frame);
    }

    function start() {
        if (running || !visible || document.hidden) return;
        running = true;
        last = performance.now();
        requestAnimationFrame(frame);
    }
    function stop() { running = false; }

    resize();
    boatX = W * 0.62 - boatW / 2;
    start();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const ratio = boatX / (W || 1);
            resize();
            boatX = ratio * W;
        }, 120);
    });

    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            visible = entries[0].isIntersecting;
            visible ? start() : stop();
        }).observe(ocean);
    }
})();
