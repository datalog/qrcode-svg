![SVG QR Code Generator](img/generated.svg)

## QR Code svg generator
Pure javascript QR Code generator. Armed with elegant method for creating SVG nodes.

## Easy to start
After `qrcode.min.js` is downloaded and connected to your html5 page, call:
```javascript
var
svgNode = new QRCode("Hello World!");
```

All other options:
```javascript
var
svgNode = new QRCode({

     msg  :  'https://github.com/datalog/qrcode-svg'
    ,dim  :   256
    ,pad  :   41
    ,swp  :   1
    ,ecl  :  'L'
    ,pal  : ['#037','#f2f4f8']

});
```

## Options
* **msg** - QR Code message, obviously, this is **mandatory parameter**
* **dim** - since QR Code is a square ``dim`` is equal to needed width or height in pixels, `256` pixels is set by default
* **pad** - white space padding, `41` pixels is set by default, `0` is for no padding; if ``pad`` is greater than  half of the ``dim``, then QR Code will be rotated by 180 degrees
* **swp** - swap the X and Y modules, `0` is set by default, `1` is for swapping
* **ecl** - error correction level: `L`, `M`, `H`, `Q`
* **pal** - palette, array of colors, `['#000']` is set by default, `['#000','#f2f4f8']` you may set second value for background
