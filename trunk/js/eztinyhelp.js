/*----------------------------------------------------------------------------------------------------------------------
 |  COPYRIGHT       (c) 2012 - 2013 Trace Research and Development Center,
 |                  The Board of Regents of the University of Wisconsin System.
 |                  All rights reserved.
 |
 |  LICENSE         New BSD License
 |
 |  CODE            Alexander Harding and Bern Jordan
 |  SPECIFICATIONS  Bern Jordan
 |
 |  FILE            eztinyhelp.js
 |  DESCRIPTION     This file contains the javascript responsible for the EZ Help lightbox, including transitions and
 |                  generic properties. It is driven by "ezhelp.js".
 *--------------------------------------------------------------------------------------------------------------------*/


var TINYHELP = {};

function T$(i) {
    return document.getElementById(i)
}

TINYHELP.box = function () {
    var p, m, b, fn, ic, iu, iw, ih, ia, f = 0;
    return{
        show: function (c, u, w, h, a, t) {
            if (!f) {

                p = document.createElement('div');
                p.id = 'tinyboxhelp';
                var nofocus = document.createAttribute('data-ez-focusable');
                nofocus.nodeValue = 'false';
                p.setAttributeNode(nofocus);

                m = document.createElement('div');
                m.id = 'tinymaskhelp';

                b = document.createElement('div');
                b.id = 'tinycontenthelp';

                q = document.createElement('div');
                q.id = 'closexbuffer';
                b.appendChild(q);

                closer = document.createElement('div');
                closer.id = 'closexhelp';

                document.body.appendChild(m);
                document.body.appendChild(p);
                p.appendChild(b);
                p.appendChild(closer);

                m.onclick = function () {
                    closeTinyHelp('point');
                };
                window.onresize = TINYHELP.box.resize;
                f = 1;

                closer.onclick = function () {
                    closeTinyHelp('point');
                };

            }
            if (!a && !u) {
                p.style.width = w ? w + 'px' : 'auto';
                p.style.height = h ? h + 'px' : 'auto';
                p.style.backgroundImage = 'none';
                b.innerHTML = c
            } else {
                b.style.display = 'none';
                p.style.width = p.style.height = '100px'
            }
            this.mask();
            ic = c;
            iu = u;
            iw = w;
            ih = h;
            ia = a;
            this.alpha(m, 1, 80, 3);
            if (t) {
                setTimeout(function () {
                    TINYHELP.box.hide()
                }, 1000 * t)
            }
        },
        fill: function (c, u, w, h, a) {
            if (u) {
                p.style.backgroundImage = '';
                var x = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
                x.onreadystatechange = function () {
                    if (x.readyState == 4 && x.status == 200) {
                        TINYHELP.box.psh(x.responseText, w, h, a)
                    }
                };
                x.open('GET', c, 1);
                x.send(null)
            } else {
                this.psh(c, w, h, a)
            }
        },
        psh: function (c, w, h, a) {
            if (a) {
                if (!w || !h) {
                    var x = p.style.width, y = p.style.height;
                    b.innerHTML = c;
                    p.style.width = w ? w + 'px' : '';
                    p.style.height = h ? h + 'px' : '';
                    b.style.display = '';
                    w = parseInt(b.offsetWidth);
                    h = parseInt(b.offsetHeight);
                    b.style.display = 'none';
                    p.style.width = x;
                    p.style.height = y;
                } else {
                    b.innerHTML = c
                }
                this.size(p, w, h)
            } else {
                p.style.backgroundImage = 'none'
            }
        },
        hide: function () {
            TINYHELP.box.alpha(p, -1, 0, 3)
        },
        resize: function () {
            TINYHELP.box.pos();
            TINYHELP.box.mask()
        },
        mask: function () {
            m.style.height = TINYHELP.page.total(1) + 'px';
            m.style.width = '';
            m.style.width = TINYHELP.page.total(0) + 'px'
        },
        pos: function () {
            var t = (TINYHELP.page.height() / 2) - (p.offsetHeight / 2);
            t = t < 10 ? 10 : t;
            p.style.top = (t + TINYHELP.page.top()) + 'px';
            p.style.left = (TINYHELP.page.width() / 2) - (p.offsetWidth / 2) + 'px'
        },
        alpha: function (e, d, a) {
            clearInterval(e.ai);
            if (d == 1) {
                e.style.opacity = 0;
                e.style.filter = 'alpha(opacity=0)';
                e.style.display = 'block';
                this.pos()
            }
            e.ai = setInterval(function () {
                TINYHELP.box.ta(e, a, d)
            }, 20)
        },
        ta: function (e, a, d) {
            var o = Math.round(e.style.opacity * 100);
            if (o == a) {
                clearInterval(e.ai);
                if (d == -1) {
                    e.style.display = 'none';
                    e == p ? TINYHELP.box.alpha(m, -1, 0, 2) : b.innerHTML = p.style.backgroundImage = ''
                } else {
                    e == m ? this.alpha(p, 1, 100) : TINYHELP.box.fill(ic, iu, iw, ih, ia)
                }
            } else {
                var n = Math.ceil((o + ((a - o) * .5)));
                n = n == 1 ? 0 : n;
                e.style.opacity = n / 100;
                e.style.filter = 'alpha(opacity=' + n + ')'
            }
        },
        size: function (e, w, h) {
            e = typeof e == 'object' ? e : T$(e);
            clearInterval(e.si);
            var ow = e.offsetWidth, oh = e.offsetHeight,
                wo = ow - parseInt(e.style.width), ho = oh - parseInt(e.style.height);
            var wd = ow - wo > w ? 0 : 1, hd = (oh - ho > h) ? 0 : 1;
            e.si = setInterval(function () {
                TINYHELP.box.ts(e, w, wo, wd, h, ho, hd)
            }, 20)
        },
        ts: function (e, w, wo, wd, h, ho, hd) {
            var ow = e.offsetWidth - wo, oh = e.offsetHeight - ho;
            if (ow == w && oh == h) {
                clearInterval(e.si);
                p.style.backgroundImage = 'none';
                b.style.display = 'block'
            } else {
                if (ow != w) {
                    var n = ow + ((w - ow) * .5);
                    e.style.width = wd ? Math.ceil(n) + 'px' : Math.floor(n) + 'px'
                }
                if (oh != h) {
                    var n = oh + ((h - oh) * .5);
                    e.style.height = hd ? Math.ceil(n) + 'px' : Math.floor(n) + 'px'
                }
                this.pos()
            }
        }
    }
}();

TINYHELP.page = function () {
    return{
        top: function () {
            return document.documentElement.scrollTop || document.body.scrollTop
        },
        width: function () {
            return self.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
        },
        height: function () {
            return self.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
        },
        total: function (d) {
            var b = document.body, e = document.documentElement;
            return d ? Math.max(Math.max(b.scrollHeight, e.scrollHeight), Math.max(b.clientHeight, e.clientHeight)) :
                Math.max(Math.max(b.scrollWidth, e.scrollWidth), Math.max(b.clientWidth, e.clientWidth))
        }
    }
}();