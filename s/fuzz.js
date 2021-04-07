const fuzz = (function (adjectives, nouns, verbs) {
    const config = {
        prefixes: 100,
        metrics: 10,
        max: 10000,
        buffer: 30,
        skip: 20
    };

    const roll1 = n => Math.random() < 1/n;
    const randint = max => Math.floor(Math.random() * max);
    const randex = arr => randint(arr.length - 1);
    const randel = arr => arr[randex(arr)];

    const repeat_uniq = function(f, n) {
        let set = new Set();
        while (n > 0) {
            let v = f();
            if (set.has(v)) continue;
            set.add(v);
            n -= 1;
        }
        return Array.from(set.values());
    };

    const prefix = () => randel(adjectives) + '.' + randel(nouns);
    const metric = (prefix) => prefix + '.' + randel(verbs);

    // For graphite, we'll have to do the sorting
    const prefixes = repeat_uniq(prefix, config.prefixes);
    const metrics = prefixes.flatMap(p => repeat_uniq(() => metric(p), config.metrics).sort());

    const e = 0.1;
    let values = new Map();
    metrics.forEach(function (m) {
        let v = Math.random() * config.max;
        values.set(m, {
            max: v,
            buffer: Array.from({length: config.buffer}, () => v),
            index: 0
        });
    });

    // 1. Calculate difference from the average for this value
    // 2. Update the rolling average buffer
    // 3. Normalize all values between 0 and 1
    function step(metric) {
        let {buffer, index, max} = metric,
            avg = buffer.reduce((n, m) => n + m) / buffer.length,
            abs = Math.random() * range(max),
            delta = roll1(2) ? abs : -1 * abs,
            value = Math.max(avg + delta, 0);

        if (! roll1(config.skip)) {
            metric.average = avg / config.max;
            metric.value = metric.average;
            metric.delta = 0;
            return;
        }

        // Rolling avg
        index = (index + 1) % buffer.length;
        buffer[index] = value;
        metric.index = index;

        max = Math.max(max, value);
        metric.max = max;
        metric.value = value / config.max;
        metric.average = avg / config.max;
        metric.delta = metric.value - avg / max;
    }

    function range(max) {
        let inv = 1/max;
        if (inv > 0.1) return 5;
        if (inv > 0.01) return 25;
        if (inv > 0.001) return 100;
        return max * 0.08;
    }

    return {
        prefixes: prefixes,
        metrics: metrics,

        next: function () {
            // Insert order. Order is required for consistent mapping
            for (const [k, v] of values) {
                step(v);
            }
            return values;
        },

        size: function () {
            return values.size;
        }
    };
})(adjectives, nouns, verbs);
