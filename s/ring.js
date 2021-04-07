const ring = (function (data) {
    const canvas = document.getElementById('ring');

    function canvasCtx(canvas) {
        // https://www.html5rocks.com/en/tutorials/canvas/hidpi/
        // Get the device pixel ratio, falling back to 1.
        var dpr = window.devicePixelRatio || 1;
        // Get the size of the canvas in CSS pixels.
        var rect = canvas.getBoundingClientRect();
        // Give the canvas pixel dimensions of their CSS
        // size * the device pixel ratio.
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        var ctx = canvas.getContext('2d');
        // Scale all drawing operations by the dpr, so you
        // don't have to worry about the difference.
        ctx.scale(dpr, dpr);
        return [ctx, rect.width, rect.height];
    }

    function onMouse(ev) {
        const x = ev.offsetX,
              y = ev.offsetY;
    }

    let mouseData = new Map();

    const [ctx, width, height] = canvasCtx(canvas);

    const originX = width / 2,
          originY = height / 2,
          textBox = document.getElementById('metric-box').getBoundingClientRect().height,
          shorter = Math.min(width, height),
          scale = (shorter - textBox - 30) / 2,
          dotSize = scale / data.size() * 2;

    function dot (key, x, y, val, delta) {
        const sx = originX + x * scale,
              sy = originY + y * scale,
              ex = originX + x * scale * 1.02,
              ey = originY + y * scale * 1.02,
              md = [sx, sy];

        mouseData.set(md, {key: key, val: val});

        ctx.strokeStyle = fillStyle(val, delta);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        // ctx.arc(sx, sy, dotSize, 0, 2 * Math.PI);
        // ctx.fill();
    }

    function fillStyle(val, delta) {
        const grey = Math.round(val * 0xff);
        // part of the color distribution only
        const blue = Math.min(
            Math.round(
                (Math.abs(delta) * 0x66) + grey
            ),
            0xff
        );

        const g = grey.toString(16);
        const b = blue.toString(16);

        if (delta > 0) {
            return "#" + g + g + b;
        } else {
            return "#" + b + g + g;
        }
    }

    return {
        dot: dot
    };
})(fuzz);
