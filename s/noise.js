const noise = (function (data, ring) {
    const config = {
        distanceScale: 100,
        freq: 252.7,  // cello, 4th position up to A4
        freqScale: 187.3,
        gain: 1,
        attackTime: 0.1,
        useSetValue: false
    },
          AudioContext = window.AudioContext || window.webkitAudioContext,
          audioCtx = new AudioContext();

    let sources = new Map();

    function initPanner (panner, opts) {
        let {x, y, z} = opts;

        x = x * config.distanceScale;
        y = y * config.distanceScale;
        z = z * config.distanceScale;

        if(panner.positionX) {
            panner.positionX.value = x;
            panner.positionY.value = y;
            panner.positionZ.value = z;
        } else {
            panner.setPosition(x, y, z);
        }

        // Non-directional sound, so that orientation doesn't matter
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;

        // if(panner.forwardX) {
        //     panner.forwardX.value = 0;
        //     panner.forwardY.value = 0;
        //     panner.forwardZ.value = -1;
        //     panner.upX.value = 0;
        //     panner.upY.value = 1;
        //     panner.upZ.value = 0;
        // } else {
        //     panner.setOrientation(0, 0, -1, 0, 1, 0);
        // }
        // panner.panningModel = 'HRTF';
    }

    // 2. Set frequency and volume
    // 3. Play
    function setValue(noise, metric, key) {
        let { osc, gain, pan, on, x, y } = noise,
            { value, average, delta } = metric;

        ring.dot(key, x, y, average, delta);

        if (Math.abs(delta) < 0.03) {
            if (on) set(gain.gain, 0);
            noise.on = false;
        } else {
            const hz = config.freq + average * config.freqScale,
                  vol = config.gain * Math.abs(delta),
                  z = average * config.distanceScale;

            set(osc.frequency, hz);
            set(gain.gain,  vol);
            // pan.positionZ.value = z;
            noise.on = true;
        }
    }

    function set(prop, value) {
        if (config.useSetValue) {
            // This is documented, but causes huge static
            prop.linearRampToValueAtTime(value, audioCtx.currentTime + config.attackTime);
        } else {
            // This is also documented, so :shrug:
            prop.value = value;
        }
    }

    // Create initial values arranged in a ring
    function initSpeakers() {
        let epsilon = 2 * Math.PI / data.size();
        const nr = r => (r > 2 * Math.PI) ? 0 : r + epsilon;
        const nx = r => Math.cos(r);
        const ny = r => Math.sin(r);

        const z = 0;
        let x = 1, y = 0, r = 0;

        for (const [k, v] of data.next()) {
            let p = audioCtx.createPanner();
            initPanner(p, {x: x, y: y, z: z, r: r});

            let o = audioCtx.createOscillator(),
                g = audioCtx.createGain();

            g.gain.value = 0;
            o.connect(g).connect(p).connect(audioCtx.destination);
            o.start();

            sources.set(k, {
                x: x,
                y: y,
                pan: p,
                osc: o,
                gain: g,
            });

            r = nr(r);
            x = nx(r);
            y = ny(r);
        }
    }

    // Close over our context for loop
    function next () {
        for (const [k, v] of data.next()) {
            setValue(sources.get(k), v, k);
        }
    }

    function loop () {
        next();
        setTimeout(loop, 1000);
    }

    initSpeakers();

    // Interface
    return {
        sources: sources,
        next: next,
        loop: loop
    };
})(fuzz, ring);
