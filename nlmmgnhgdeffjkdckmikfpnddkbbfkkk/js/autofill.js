/*!
 * @package Autofill
 * @author T. H. Doan
 * @copyright (c) 2010-2018
 * @link http://www.tohodo.com
 */
function init() {
    return new Promise(function (n, t) {
        chrome.storage.local.get(function (i) {
            var s = chrome.runtime.lastError, h, f, e, c, o, u, r;
            if (s) console.error("[" + sExtName + "] " + s.message), t(s.message); else {
                for (bException = !1, r = 0; r < i.exceptions.length; ++r) {
                    try {
                        re = new RegExp(i.exceptions[r], "im")
                    } catch (l) {
                        console.warn("[" + sExtName + "] Exception " + i.exceptions[r] + " is invalid. Skipping...");
                        re = /^\b$/
                    }
                    if (re.test(sSiteHaystack)) {
                        h = "Autofilling is disabled for " + D.URL + " because " + (self === top ? "this page" : "the parent frame") + ' matches "' + i.exceptions[r] + '" on the Exceptions list.';
                        console.warn("[" + sExtName + "] " + h);
                        bException = !0;
                        D.removeEventListener("keydown", handleKeyDown);
                        t(h);
                        return
                    }
                }
                for (oLS = i, f = JSON.parse(oLS.rules), oCats = {}, r = 0; r < oLS.cats.length; ++r) oCats[oLS.cats[r].k] = {
                    n: oLS.cats[r].n,
                    s: oLS.cats[r].s
                };
                for (oAdvanced = {}, r = 0; r < oLS.advanced.length; ++r) if (e = oLS.advanced[r].split(":"), e.length === 2 && (oCats[e[0]] || f[e[0]])) for (c = e[1].trim().split(" "), o = 0; o < c.length; ++o) {
                    u = c[o].split("=");
                    u[0] = u[0].toLowerCase();
                    u[1] = u[1].toLowerCase();
                    switch (u[0]) {
                        case"delay":
                            +u[1] >= .5 && +u[1] <= 60 && (oAdvanced[e[0]] || (oAdvanced[e[0]] = {}), oAdvanced[e[0]][u[0]] = +u[1]);
                            break;
                        default:
                            (u[0] === "all" || u[0] === "forcefill") && u[1] === "true" && (oAdvanced[e[0]] || (oAdvanced[e[0]] = {}), oAdvanced[e[0]][u[0]] = !0)
                    }
                }
                sCatCurrent = oLS.catnow > 2 ? oLS.cats[oLS.catnow - 5].k : oLS.catnow === 1 ? "all" : "";
                oLS.rules = {};
                for (r in f) (f[r].c === sCatCurrent || sCatCurrent === "all" && (f[r].c === "" || oCats[f[r].c] && oCats[f[r].c].n.indexOf(sBackup) < 0) || oAdvanced[r] && oAdvanced[r].all || oCats[f[r].c] && oCats[f[r].c].n === sBackup + sHost) && (oLS.rules[r] = f[r]);
                if (f = undefined, oLS.other.manual) {
                    oForceFill = {};
                    for (r in oAdvanced) oLS.rules[r] && oAdvanced[r].forcefill && (oForceFill[r] = oLS.rules[r]);
                    Object.keys(oForceFill).length || (oForceFill = undefined)
                } else oForceFill = undefined;
                bManual = oLS.other.manual && !(oAdvanced[sCatCurrent] && oAdvanced[sCatCurrent].forcefill) && !oForceFill;
                D.getElementById("autofill-wizard") && Wizard.updateCats();
                D.addEventListener("keydown", handleKeyDown);
                D.dispatchEvent(new Event("init"));
                n()
            }
        })
    })
}

function initFields(n, t) {
    var u, i, f, r;
    if (n) for (u = 0; u < n.length; ++u) if (i = n[u], i.nodeName === "INPUT" || i.getAttribute("aria-checked") === null) if (f = i.getAttribute("aria-selected"), i.backup = oLS.other.backup && i.type !== "password", i.nodeName === "IFRAME") {
        if (!validIframe(i)) continue;
        i.sync = t;
        i.onload = function () {
            initFields([this], this.sync)
        };
        r = getIframe(i);
        r instanceof Array ? initFields(r, t) : typeof r == "string" && initHtmlField(i, r)
    } else i.nodeName !== "SELECT" && f !== null ? f === "true" && (i.parentNode.initialValue = i.getAttribute("data-value")) : (t || (i.type === "checkbox" || i.type === "radio" ? i.initialValue = getChecked(i) || i.checked : i.multiple ? i.initialValue = getSelOptions(i) : (i.isContentEditable ? initHtmlField(i, getHtml(i.innerHTML)) : i.initialValue = i.value, i.initialClass = i.className.trim())), i.backup ? i.addEventListener("input", backupField) : i.removeEventListener("input", backupField))
}

function initHtmlField(n, t) {
    if (n.timer === undefined || n.sync) {
        var i, f = 0, u = 0, r;
        n.initialValue = t;
        n.timer = setInterval(function (n) {
            if (n.isContentEditable) i = n, r = !0; else try {
                i = n.contentDocument && n.contentDocument.body;
                r = n.contentDocument && n.contentDocument.readyState === "complete"
            } catch (t) {
                clearInterval(n.timer);
                return
            }
            if (i) if (n.sync || r && getHtml(i.innerHTML) === n.initialValue) {
                if (n.sync || ++u == 3) {
                    clearInterval(n.timer);
                    n.isContentEditable || (n.backup ? i.addEventListener("input", backupField) : i.removeEventListener("input", backupField));
                    n.done = !0;
                    n.sync || n.dispatchEvent(new Event("done"));
                    return
                }
            } else n.sync || (n.initialValue = getHtml(i.innerHTML)), u = 0;
            ++f == 100 && clearInterval(n.timer)
        }, 100, n)
    }
}

function addRule(n) {
    if (!oET) return [];
    var i = getName(oET), t;
    if (oET.type !== undefined) t = oET.value; else if (oET.isContentEditable) t = getHtml(oET.innerHTML); else if (oET.nodeName === "IFRAME" && (t = getIframe(oET), typeof t != "string")) return [];
    return i && t !== oET.initialValue ? [{
        t: oET.type === "password" ? 1 : 0,
        n: i,
        v: t,
        s: sSite,
        o: +!!oET.initialValue,
        c: n
    }] : []
}

function addRules(n, t) {
    var s, v, r, i;
    t === undefined && (t = D);
    var i, e, u, f, l = ":not([disabled]):not([readonly])", o = [], y = queryBySelector(sInputs + l, t),
        p = queryBySelector("select" + l, t), w = queryBySelector("textarea" + l, t),
        b = queryBySelector("[contenteditable=true]", t), k = queryBySelector("iframe", t),
        d = queryBySelector("[jsaction][aria-selected=true]", t),
        g = queryBySelector("[jsaction][aria-checked=true]", t), c = {};
    for (r = 0; r < y.length; ++r) if ((i = y[r], u = "", e = i.type, e !== "hidden") && (e !== "password" && e !== "checkbox" && e !== "radio" && (e = "text"), (e !== "text" && e !== "password" || i.value !== i.initialValue) && (e !== "checkbox" && e !== "radio" || (getChecked(i) || i.checked) !== i.initialValue))) {
        if (i.type === "date" && i.classList.contains("quantumWizTextinputPaperinputInput")) for (s = i; s.parentElement;) {
            if (s.getAttribute("role") === "listitem" && s.classList.contains(sGForms)) {
                s = s.querySelector("." + sGForms + "Header");
                s && (u = "\\b" + s.innerText.replace(/[^\w ]+/g, "").trim() + "\\b");
                break
            }
            s = s.parentElement
        }
        u || (u = getName(i));
        switch (e) {
            case"text":
                u && o.push({t: 0, n: u, v: i.value, s: sSite, o: +!!i.initialValue, c: n});
                break;
            case"password":
                o.push({t: 1, n: u, v: i.value, s: sSite, o: +!!i.initialValue, c: n});
                break;
            default:
                (e === "checkbox" || e === "radio") && (c[u] === undefined ? c[u] = +i.checked + "" : c[u] += +i.checked + "")
        }
    }
    for (r in c) o.push({t: 3, n: r, v: c[r], s: sSite, c: n});
    for (r = 0; r < p.length; ++r) if ((i = p[r], (i.multiple ? getSelOptions(i) : i.value) !== i.initialValue && i.parentNode.id.indexOf("autofill") !== 0) && (u = getName(i), u)) {
        if (i.multiple) {
            f = "";
            for (var h = 0, a = i.length, nt = 0; h < a; ++h) i[h].selected && (f += '|"' + (i[h].value || i[h].text).replace(/"/g, '\\"') + '"', ++nt), h === a - 1 && nt === a && (f = "1!");
            f = f.slice(1)
        } else f = '"' + (i.value || i.text).replace(/"/g, '\\"') + '"';
        o.push({t: 2, n: u, v: f, s: sSite, c: n})
    }
    for (r = 0; r < w.length; ++r) (i = w[r], i.offsetParent !== null && i.value !== i.initialValue) && (u = getName(i), u && o.push({
        t: 0,
        n: u,
        v: i.value,
        s: sSite,
        o: +!!i.initialValue,
        c: n
    }));
    for (r = 0; r < b.length; ++r) (i = b[r], f = getHtml(i.innerHTML), f !== i.initialValue) && (u = getName(i), u && o.push({
        t: 0,
        n: u,
        v: f,
        s: sSite,
        o: +!!i.initialValue,
        c: n
    }));
    for (r = 0; r < k.length; ++r) if (i = k[r], f = getIframe(i), f instanceof Array) v = addRules(n, i.contentDocument), v.length && (o = o.concat(v)); else {
        if (f === undefined || f === i.initialValue) continue;
        u = getName(i);
        u && o.push({t: 0, n: u, v: f, s: sSite, o: +!!i.initialValue, c: n})
    }
    for (r = 0; r < d.length; ++r) (i = d[r], i.classList.contains("isPlaceholder") || i.getAttribute("data-value") === i.parentNode.initialValue) || (u = getName(i), u && o.push({
        t: 2,
        n: u,
        v: i.innerText.trim(),
        s: sSite,
        c: n
    }));
    for (r = 0; r < g.length; ++r) i = g[r], u = getName(i), u && o.push({t: 3, n: u, v: "1", s: sSite, c: n});
    return o
}

function Autofill(n, t, i, r) {
    var u, p, f, v, k = {}, d, o, l = r ? r : oForceFill || oLS.rules, w = {}, ht = {}, nt = [], wt = [], y = 0, tt,
        bt = "abcdefghijklmnopqrstuvwxyz", kt = "0123456789", ct = bt + bt.toUpperCase() + kt + kt, b, rt, c,
        lt = function (n, t, i) {
            if (n && (n.type !== undefined || n.innerHTML !== t)) {
                var r = n.value === undefined ? n.innerHTML : n.value,
                    u = ["keydown", "keypress", "input", "keyup", "change"];
                switch (n.afMode === undefined ? o.o : n.afMode) {
                    case 2:
                        t += r;
                        break;
                    case 3:
                        t = r + t;
                        break;
                    case 4:
                        t = t + r + t;
                        break;
                    case 5:
                        t = isNaN(r) ? r : ++r;
                        break;
                    case 6:
                        t = isNaN(r) ? r : --r
                }
                n.value === undefined ? n.innerHTML = t : n.value = t;
                fire(n, u);
                n.value !== undefined && n.value !== t && (n.value = t, fire(n, u, !0));
                log(i, n);
                ++y
            }
        }, ut = function (n) {
            var r, t, i;
            if (n.id) try {
                if (r = D.querySelector('[for="' + escapeStr(n.id) + '"]'), r && c.test(r.innerText.trim())) return !0
            } catch (u) {
            }
            if (n.type === "date" && n.classList.contains("quantumWizTextinputPaperinputInput")) for (t = n; t.parentElement;) {
                if (t.getAttribute("role") === "listitem" && t.classList.contains(sGForms)) {
                    if (t = t.querySelector("." + sGForms + "Header"), t && c.test(t.innerText)) return !0;
                    break
                }
                t = t.parentElement
            }
            if ((i = (n.getAttribute("aria-label") || "").trim() + "\n" + (n.name || "").trim() + "\n" + n.id.trim() + "\n" + (n.getAttribute("aria-labelledby") || "").trim() + "\n" + (n.getAttribute("aria-describedby") || "").trim() + "\n" + (n.getAttribute("data-bind") || "").trim() + "\n" + (n.getAttribute("data-reactid") || "").trim() + "\n" + (n.getAttribute("ng-model") || "").trim() + "\n" + n.title.trim() + "\n" + (n.placeholder || "").trim() + "\n" + (n.initialClass || "") + "\n" + n.className.trim(), (n.type === "checkbox" || n.type === "radio") && n.value !== "on" ? i += "\n" + n.value.trim() : n.src && n.src.indexOf(location.origin) === 0 && n.src !== D.URL && (i += "\n" + n.src), c.test(i)) || n.parentNode && n.parentNode.nodeName === "LABEL" && c.test(n.parentNode.innerText.trim()) || oLS.other.labelmatch && findText(n, c)) return !0;
            try {
                return n === D.querySelector(o.n)
            } catch (u) {
            }
            return !1
        }, it = function () {
            var t, i, c, y, p, l, r, a, u, v, w, b, s, n, e;
            if (oLS.other.vars) {
                if ((i = /\{-?\d+(\+\+|\+\d+|--|-\d+)\}/g).test(f)) {
                    for (c = f, t = f.match(i), n = 0; n < t.length; ++n) i = new RegExp(t[n].replace(/(\+\+|\+\d+|--|-\d+)/, "($1)").replace(/\+/g, "\\+")), y = +t[n].replace(/\{(-?\d+).+/, "$1"), p = t[n].indexOf("++") > 0 ? 1 : t[n].indexOf("--") > 0 ? -1 : +t[n].replace(/.+?([+-]\d+).+/, "$1"), f = f.replace(i, y + p), c = c.replace(i, "{" + (y + p) + "$1}");
                    o.v = c;
                    nt.push({key: h, obj: o})
                }
                if (oLS.variables.length && (i = /\{@(\w+)\}/g).test(f)) for (t = f.match(i), n = 0; n < t.length; ++n) for (l = 0; l < oLS.variables.length; ++l) if (r = oLS.variables[l].split(" = "), t[n] === "{@" + r[0] + "}") {
                    if (i = new RegExp("{@" + r[0] + "}", "g"), a = "", r[1].indexOf("javascript:") > -1) try {
                        a = eval(r[1].replace("javascript:", ""))
                    } catch (k) {
                    } else a = r[1].replace(/\\=/g, "=").replace(/\\n/g, "\n");
                    f = f.replace(i, a);
                    break
                }
                if ((i = /\{[nv]\d+\}/g).test(f)) for (t = f.match(i), n = 0; n < t.length; ++n) i = new RegExp(t[n]), u = t[n].replace(/\D+/g, ""), v = t[n].slice(1, 2), oLS.rules["r" + u] && oLS.rules["r" + u][v] !== undefined && (f = f.replace(i, v === "v" && ht["r" + u] ? ht["r" + u] : oLS.rules["r" + u][v]));
                if ((i = /\{[^|}\r\n]+(\|[^|}\r\n]*)+\}/g).test(f)) for (t = f.match(i), n = 0; n < t.length; ++n) i = new RegExp(t[n].replace(/\|/g, "\\|")), w = t[n].substring(1, t[n].length - 1).split("|"), f = f.replace(i, w[R(0, w.length - 1)]);
                if ((i = /\{[#$]\d*\}/g).test(f)) for (t = f.match(i), n = 0; n < t.length; ++n) {
                    if (i = new RegExp(t[n].replace("$", "\\$")), b = +t[n].replace(/\D/g, "") || 1, t[n].indexOf("#") > 0) for (s = R(1, 9), e = 1; e < b; ++e) s += R(0, 9) + ""; else for (s = ct.charAt(R(0, 51)), e = 1; e < b; ++e) s += ct.charAt(R(0, ct.length - 1));
                    f = f.replace(i, s)
                }
            }
            return f
        }, ft, h, g, a, et, at, vt, s, ot, yt, st, pt, e;
    if (typeof n == "string") {
        if (n === sCatCurrent) return;
        if (sCatCurrent = n, ft = 2, sCatCurrent === "all") ft = 1; else for (e = 0; e < oLS.cats.length; ++e) if (oLS.cats[e].k === sCatCurrent) {
            ft = e + 5;
            break
        }
        try {
            chrome.runtime.sendMessage({type: "executeHotkey", data: {catnow: ft}})
        } catch (dt) {
            alert(sBgUpdErr)
        }
    }
    if (!(n instanceof Array)) for (n = queryBySelector(sFillable), e = 0; e < aFO.length; ++e) n.indexOf(aFO[e]) < 0 && n.push(aFO[e]);
    if (tt = n.length, sCatCurrent && sCatCurrent !== "all" && (c = new RegExp(oLS.cats[oLS.catnow - 5].s || ".", "im"), !c.test(sSiteHaystack))) {
        updateStatus(tt, 0);
        return
    }
    for (e in l) t ? oCats[l[e].c] && oCats[l[e].c].n === sBackup + sHost && (w[e] = l[e]) : sCatCurrent === "all" ? (l[e].c === "" || oCats[l[e].c] && oCats[l[e].c].n.indexOf(sBackup) < 0) && (w[e] = l[e]) : (l[e].c === sCatCurrent || oAdvanced[e] && oAdvanced[e].all) && (w[e] = l[e]);
    for (tt || t || i || n.push(D.createElement("input")), e = 0; e < n.length; ++e) if (u = n[e], b = u.getAttribute("aria-checked"), rt = u.getAttribute("aria-selected"), !u.disabled && !u.readOnly) {
        p = u.type;
        for (h in w) if (o = w[h], !oAdvanced[h] || !oAdvanced[h].delay) {
            switch (o.t) {
                case 0:
                    if (p === "password" || p === "checkbox" || p === "radio" || u.nodeName === "SELECT" || b !== null || rt !== null) continue;
                    break;
                case 1:
                    if (p !== "password") continue;
                    break;
                case 2:
                    if (u.nodeName !== "SELECT" && rt === null) continue;
                    break;
                case 3:
                    if (p !== "checkbox" && p !== "radio" && b === null) continue
            }
            if (c = new RegExp((o.s || oCats[o.c] && oCats[o.c].s || "").replace(/\n+/g, "|") || ".", "im"), c.test(sSiteHaystack)) {
                f = o.v;
                try {
                    c = new RegExp(o.n.replace(/\/\*.*?\*\/\s*/g, "") || ".", "im")
                } catch (dt) {
                    c = /^\b$/
                }
                switch (o.t) {
                    case 2:
                        if (ut(u)) if (u.nodeName === "SELECT") if (g = function () {
                            var n = u.id && u.nextElementSibling;
                            n && n.id === u.id + "-button" && n.children[1] && n.children[1].className === "ui-selectmenu-text" && (n.children[1].textContent = u[u.selectedIndex].text);
                            fire(u, ["input", "change"]);
                            log(h, u);
                            ++y
                        }, f = it().trim().toLowerCase(), f === "?") u.selectedIndex = R(0, u.options.length - 1), g(); else if (/^([01]?!|)$/.test(f)) {
                            for (s = 0; s < u.length; ++s) switch (f === "!" || f === "1!") {
                                case!0:
                                    u[s].selected || (u[s].selected = !0);
                                    break;
                                case!1:
                                    u[s].selected && (u[s].selected = !1)
                            }
                            g()
                        } else if (isNaN(f)) {
                            if (u.multiple) {
                                for (/[^\d ]/.test(f) || (f = f.replace(/ +/g, "|")), /[^\d |]/.test(f) || (f = f.replace(/ +/g, "")), a = /^[\d+](\|\d+)*$/.test(f) ? f.split("|") : f.match(/(?<!\\)".*?(?<!\\)"/g), et = !1, a === null && (a = ['"' + f + '"']), s = 0; s < u.length; ++s) at = '"' + u[s].value.toLowerCase().replace(/"/g, '\\"') + '"', vt = '"' + u[s].text.toLowerCase().replace(/"/g, '\\"') + '"', u[s].selected ? a.indexOf(s + "") < 0 && a.indexOf(at) < 0 && a.indexOf(vt) < 0 && (u[s].selected = !1, et = !0) : (a.indexOf(s + "") > -1 || a.indexOf(at) > -1 || a.indexOf(vt) > -1) && (u[s].selected = !0, et = !0);
                                et && g()
                            } else if (f = f.replace(/(?<!\\)"/g, ""), f = f.replace(/\\"/g, '"'), u.value.toLowerCase() !== f) for (s = 0; s < u.length; ++s) if (f === u[s].value.toLowerCase() || f === u[s].text.toLowerCase()) {
                                u[s].selected = !0;
                                g();
                                break
                            }
                        } else u.selectedIndex != f && (u.selectedIndex = +f, u.selectedIndex == f && g()); else rt !== null && (u.afName = o.n, u.afRule = h, u.afTick = 0, u.timer = setInterval(function (n) {
                            bOpen || (bOpen = !0, n.click(), clearInterval(n.timer), n.timer = setInterval(function (n) {
                                var t = D.querySelectorAll(n.afName)[1];
                                t && (t.click(), bOpen = !1, log(n.afRule, n), updateStatus(0, 1));
                                (t || ++n.afTick == 100) && clearInterval(n.timer)
                            }, 100, n));
                            ++n.afTick == 100 && clearInterval(n.timer)
                        }, 100, u));
                        break;
                    case 3:
                        if (ut(u)) if (v = f.replace(/\s+/g, ""), v === "?") switch (u.type) {
                            case"checkbox":
                                y += toggle(u, R(0, 1), h, b);
                                break;
                            case"radio":
                                ot = o.n.replace(/[\^\$]/g, "");
                                wt.indexOf(ot) < 0 && (yt = D.querySelectorAll('input[name="' + escapeStr(ot) + '"]'), y += toggle(yt[R(0, yt.length - 1)], 1, h, b), wt.push(ot))
                        } else v.length > 1 && v.indexOf("!") < 0 ? (k[o.n] === undefined ? k[o.n] = 0 : ++k[o.n], k[o.n] < v.length && toggle(u, +v.charAt(k[o.n]), h, b), v.length === k[o.n] + 1 && ++y) : y += toggle(u, parseInt(v), h, b);
                        break;
                    case 4:
                        d === undefined && (d = {});
                        d[h] = it();
                        break;
                    default:
                        if (u.nodeName === "INPUT" || u.nodeName === "TEXTAREA") (o.o || !u.value) && ut(u) && (lt(u, it(), h), oLS.other.vars && f.indexOf("{") > -1 && (ht[h] = u.value)); else {
                            if (st = u.nodeName === "IFRAME", !st && !u.isContentEditable || st && !validIframe(u) || !ut(u)) continue;
                            if (u.done === undefined) {
                                if (u.afMode !== undefined) continue;
                                u.afMode = o.o;
                                u.afRule = h;
                                u.afValue = it();
                                u.addEventListener("done", function () {
                                    var n = this.nodeName === "IFRAME" ? this.contentDocument.body : this;
                                    (this.afMode || !cleanHtml(n.innerHTML)) && (lt(n, this.afValue, this.afRule), t || updateStatus(0, 1))
                                }, {once: !0})
                            } else pt = st ? u.contentDocument.body : u, (o.o || !cleanHtml(pt.innerHTML)) && lt(pt, it(), h)
                        }
                }
            }
        }
    }
    if (!t) {
        if (d && !i && (D.readyState === "complete" ? y += executeJs(d) : window.addEventListener("load", function (n, t) {
            return function () {
                updateStatus(0, executeJs(t))
            }
        }(tt, d))), !r) for (e in w) oAdvanced[e] && oAdvanced[e].delay && (setTimeout(function (n) {
            var t = {};
            t[n] = w[n];
            Autofill(null, null, null, t)
        }, oAdvanced[e].delay * 1e3, e), delete oAdvanced[e].delay);
        nt.length && chrome.storage.local.get("rules", function (n) {
            var i, t;
            if (!chrome.runtime.lastError) {
                for (i = JSON.parse(n.rules), t = 0; t < nt.length; ++t) i[nt[t].key] = nt[t].obj;
                chrome.storage.local.set({rules: JSON.stringify(i)})
            }
        });
        updateStatus(tt, y);
        D.autofilled = !0;
        setTimeout(function (n) {
            Autofill(n, !0)
        }, 1e3, n)
    }
}

function backupField(n) {
    var i, f, e, r, u, t;
    if (oLS.other.backup && n.inputType && (oET = n.target.matches(sFields) ? n.target : n.target.ownerDocument.defaultView.frameElement, oET) && (i = oET.contentDocument, f = i && i.body ? getHtml(i.body.innerHTML) : oET.value || getHtml(oET.innerHTML), !(f.length < oLS.backup))) {
        for (r = sBackup + sHost, u = !0, t = 0; t < oLS.cats.length; ++t) if (oLS.cats[t].n === r) {
            e = oLS.cats[t].k;
            u = !1;
            break
        }
        if (u) try {
            chrome.runtime.sendMessage({type: "saveCat", data: {backup: !0, cat: {n: r, s: sSite}}}, function (n) {
                saveRule(n.cat)
            })
        } catch (o) {
            console.warn(sBgUpdErr)
        } else saveRule(e)
    }
}

function cleanHtml(n) {
    return n.replace(/\s|<.+?>|&nbsp;/gi, "")
}

function clearHighlight() {
    oHighlighted && (oHighlighted.setAttribute("style", oHighlighted.initialStyle), oHighlighted = undefined)
}

function createObserver(n) {
    n.observer || (n.observer = new MutationObserver(function (n) {
        var t = [];
        n.forEach(function (n) {
            var e = n.addedNodes.length, f, r, i, u;
            if (e) for (f = 0; f < e; ++f) if (r = n.addedNodes[f], i = [], r.nodeType === 1 && r.id !== "autofill-wizard" && (r.nodeName !== "IFRAME" || validIframe(r))) {
                if (r.children && r.children.length) {
                    if (i = queryBySelector(sFillable, r), i.length) {
                        for (u = 0; u < i.length; ++u) (i[u].initialValue || t.indexOf(i[u]) > -1) && i.splice(u, 1);
                        t = t.concat(i)
                    }
                } else r.matches(sFillable) && t.indexOf(r) < 0 && i.push(r);
                i.length && (initFields(i), aFO = aFO.concat(i), bManual ? Autofill(i, !0, !0) : D.autofilled && Autofill(i, !1, !0))
            }
        })
    }), n.observer.observe(n.body || n, {childList: !0, subtree: !0, attributes: !1, characterData: !1}))
}

function debounce(n) {
    var t;
    return function () {
        var i = this, r = arguments, u = function () {
            n.apply(i, r)
        };
        clearTimeout(t);
        t = setTimeout(u, 50)
    }
}

function escapeRegex(n) {
    return n.replace(/([$^.?+*\\|(){}\[\]])/g, "\\$1")
}

function escapeStr(n) {
    return n.replace(/("|\\)/g, "\\$1")
}

function executeJs(n) {
    var i = 0;
    for (var t in n) try {
        eval(n[t]);
        oLS.other.debug && log(t, n[t]);
        ++i
    } catch (r) {
        console.warn("[" + sExtName + "] The following JavaScript code was not executed:\n\n" + n[t] + "\n\nError: " + r.message + "\nFrame: " + D.URL)
    }
    return i
}

function findText(n, t) {
    var u = !1, i = !1, r = function (t, e) {
        for (var o; t;) {
            switch (t.nodeType) {
                case 1:
                    t.lastChild && (t.nodeName !== "SELECT" && n.nodeName !== "IFRAME" && t.nodeName.indexOf("SCRIPT") < 0 || n.nodeName === "IFRAME" && t.nodeName !== "DIV" && t.nodeName.slice(0, 1) !== "H") ? r(t.lastChild, e) : f(t, e);
                    break;
                case 3:
                    if (t.textContent.replace(/\W+/g, "")) if (e.test(t.textContent.trim())) i = !0; else if (n.parentNode.nodeName !== "TD" || n.nodeName === "IFRAME" || u) i = null; else {
                        for (u = !0, o = n.parentNode.previousSibling; o && !o.lastChild;) o = o.previousSibling;
                        o && o.lastChild ? r(o.lastChild, e) : i = null
                    } else f(t, e)
            }
            if (i || i === null) break;
            t = t.previousSibling
        }
    }, f = function (n, t) {
        if (n.parentNode && !n.previousSibling) {
            for (var i = n.parentNode; i && !i.previousSibling;) i = i.parentNode;
            i && i.previousSibling && r(i.previousSibling, t)
        }
    };
    return r(n, t), i || !1
}

function fire(n, t) {
    console.log('fire', n, t, n.value)
    var u = !1, f = D.querySelector("[data-reactroot]") !== null, e, r;
    for (n.getAttribute("jsname") !== null && (e = (n.nextElementSibling && n.nextElementSibling.className || "") + (n.parentNode.previousElementSibling && n.parentNode.previousElementSibling.className || ""), u = e.indexOf("Placeholder") > -1), u || (u = f || n.getAttribute("data-reactid") !== null), t.unshift("focus"), t.push("blur"), r = 0; r < t.length; ++r) f && t[r] !== "input" || n.dispatchEvent(new Event(t[r], {bubbles: t[r] === "input" && u}))
}

function getChecked(n) {
    var i, r, t;
    if (!n.name) return "";
    for (i = D.getElementsByName(n.name), r = "", t = 0; t < i.length; ++t) r += +i[t].checked + "";
    return r
}

function getHtml(n) {
    return n = n.replace(/<script.+?<\/script>/gi, ""), cleanHtml(n) ? n.trim() : ""
}

function getIframe(n) {
    if (!validIframe(n)) return undefined;
    try {
        var t = n.contentDocument, i = t && t.body && queryBySelector(sFields, t.body);
        return i && i.length ? i : t && t.body ? getHtml(t.body.innerHTML) : (createObserver(t), undefined)
    } catch (r) {
        return undefined
    }
}

function getName(n) {
    var t = "^" + escapeRegex(getUniqueAttr(n, "aria-label") || n.name || n.id || getUniqueAttr(n, "aria-labelledby") || getUniqueAttr(n, "aria-describedby") || getUniqueAttr(n, "data-bind") || getUniqueAttr(n, "data-reactid") || getUniqueAttr(n, "ng-model") || getUniqueAttr(n, "title") || getUniqueAttr(n, "placeholder") || (n.src && n.src.indexOf(location.origin) === 0 && n.src !== D.URL ? n.src : "") || "").trim() + "$";
    return t === "^$" && (t = (n.initialClass || n.className || "").trim(), t = t && t.indexOf("quantumWizMenuPaperselectOption") < 0 && D.querySelectorAll("." + t.replace(/ +/g, ".")).length === 1 ? "\\b" + t + "\\b" : getUniqueSelector(n)), t
}

function getSelOptions(n) {
    for (var r = [], i = n.selectedOptions || [], t = 0; t < i.length; ++t) r.push(i[t].value || i[t].text);
    return JSON.stringify(r)
}

function getUniqueAttr(n, t) {
    var i = n.getAttribute(t);
    return i && D.querySelectorAll("[" + t + '="' + escapeStr(i) + '"]').length !== 1 && (i = undefined), i
}

function getUniqueSelector(n) {
    if (n instanceof Element) for (var f, i, r = ["name", "type", "title", "placeholder", "aria-label", "aria-describedby", "aria-labelledby", "ng-model", "data-*"], t = [], e = function (n) {
        var o, c, h, s, e;
        if (n.id) return t.unshift("#" + n.id), !0;
        if (t.unshift(i = n.nodeName.toLowerCase()), f = n.className.replace(/\bisSelected\b/g, "").trim(), f && (t[0] = i += "." + f.replace(/ +/g, "."), u())) return !0;
        for (o = 0; o < r.length; ++o) if (r[o] === "data-*") {
            for (c = [].filter.call(n.attributes, function (n) {
                return n.name.indexOf("data-") === 0
            }), h = 0; h < c.length; ++h) if (t[0] = i += "[" + c[h].name + '="' + escapeStr(c[h].value) + '"]', u()) return !0
        } else if (n[r[o]] && (t[0] = i += "[" + r[o] + '="' + escapeStr(n[r[o]]) + '"]', u())) return !0;
        for (s = n, e = 1; s = s.previousElementSibling;) s.nodeName === n.nodeName && ++e;
        if (t[0] = i += ":nth-of-type(" + e + ")", u()) return !0;
        for (s = n, e = 1; s = s.previousElementSibling;) ++e;
        return (t[0] = i = i.replace(/:nth-of-type\(\d+\)/, e > 1 ? e === n.parentElement.children.length ? ":last-child" : ":nth-child(" + e + ")" : ":first-child"), u()) ? !0 : !1
    }, u = function () {
        return D.querySelectorAll(t.join(">") || null).length === 1
    }; n.parentElement;) {
        if (e(n)) return t.join(" > ");
        n = n.parentElement
    }
}

function highlightField(n) {
    var t;
    if (!n.type) if (n.nodeName === "IFRAME") validIframe(n) ? (t = n.contentDocument, n = t && t.activeElement || null) : n = null, n && !n.matches(sFields) && (n = n.ownerDocument.defaultView.frameElement || null); else while (n) {
        if (n.nodeName === "BODY" || n.getAttribute("contenteditable") === "true") break;
        n = n.parentNode
    }
    return n && (oHighlighted = n.nodeName === "IFRAME" ? t && t.body : n, oHighlighted && (oHighlighted.initialStyle = oHighlighted.getAttribute("style") || "", oHighlighted.style.background = "#cadbf2")), n
}

function injectJquery(n) {
    return new Promise(function (t, i) {
        try {
            chrome.runtime.sendMessage({type: "injectJquery", data: {ver: n || 1}}, function () {
                window.$ && (oLS.other.debug && console.log("[" + sExtName + "] jQuery v" + $().jquery + " loaded."), t())
            })
        } catch (r) {
            i(r)
        }
    })
}

function log(n, t) {
    if (oLS.other.debug) {
        var i = "[" + sExtName + "] Rule " + n.replace("r", "n") + ' in profile "' + (oCats[oLS.rules[n].c] ? oCats[oLS.rules[n].c].n : "Unfiled") + '"';
        typeof t == "string" ? console.log(i + " executed this JavaScript:\n\n" + t + "\n\n") : console.log(i + " autofilled this field:", t)
    }
}

function queryBySelector(n, t) {
    return [].slice.call((t || D).querySelectorAll(n))
}

function R(n, t) {
    return Math.floor(Math.random() * (t - n + 1) + n)
}

function saveRule(n) {
    var t = addRule(n);
    if (t.length) {
        try {
            chrome.runtime.sendMessage({type: "saveRules", data: {backup: !0, rules: t}})
        } catch (i) {
            console.warn(sBgUpdErr)
        }
        oET = undefined
    }
}

function toggle(n, t, i, r) {
    var f = 0, u;
    if (typeof n.checked == "boolean") u = n.checked; else if (r !== null) u = r === "true" ? !0 : !1; else return 0;
    switch (t) {
        case 0:
            u && (n.click(), log(i, n), ++f);
            break;
        case 1:
            u || (n.click(), log(i, n), ++f)
    }
    return f
}

function updateStatus(n, t) {
    chrome.runtime.sendMessage({type: "updateStatus", data: {fields: n, filled: t}})
}

function validIframe(n) {
    try {
        return n.offsetParent && n.clientWidth > 1 && n.clientHeight > 1 && (!n.src || n.src.indexOf(location.origin) === 0 || /^(about|javascript)/i.test(n.src)) && (!n.contentDocument || !n.contentDocument.querySelector("iframe"))
    } catch (t) {
        return !1
    }
}

function handleMessage(n, t, i) {
    var u, r, f;
    switch (n.type) {
        case"autofill":
            bException ? console.warn("[" + sExtName + "] Autofilling is disabled for this page because it is on the Exceptions list.") : oLS && (oForceFill = undefined, n.catnow === oLS.catnow ? Autofill() : D.addEventListener("init", Autofill, {once: !0}));
            break;
        case"clearHighlight":
            clearHighlight();
            break;
        case"create":
            u = oET ? addRule(n.cat) : oET === null ? [] : addRules(n.cat);
            u.length && chrome.runtime.sendMessage({type: "appendRules", data: u});
            i({field: !!oET});
            break;
        case"insertText":
            if (r = r = D.activeElement, r.nodeName === "BODY" || r.nodeName === "IFRAME") return;
            chrome.storage.local.get("textclips", function (t) {
                var u, i;
                if (!chrome.runtime.lastError) for (u = t.textclips, i = 0; i < u.length; ++i) if (n.id === u[i].trim().split("\n")[0].replace(/ *> *|\W/g, "_").toLowerCase()) {
                    if (u[i] = u[i].replace(/\r?\n/g, "\n").replace(/\s*.+\n/, ""), r.isContentEditable) {
                        var e = D.createElement("span"), o = getSelection(), f = o.getRangeAt(0);
                        f.deleteContents();
                        e.innerHTML = u[i].replace(/\n/g, "<br>");
                        f.insertNode(e);
                        f.collapse(!1);
                        f.setEnd(r, 2)
                    } else r.value = r.value.slice(0, r.selectionStart) + u[i] + r.value.slice(r.selectionEnd);
                    break
                }
            });
            break;
        case"showWizard":
            clearHighlight();
            oET = n.data.editable ? D.activeElement.matches(sFillable) ? highlightField(D.activeElement) : null : undefined;
            D.getElementById("autofill-wizard") ? Wizard.updateText(n.data.editable) : self === top && (oLS.editable = n.data.editable, i({}));
            break;
        case"sync":
            f = oLS.other.backup;
            init().then(function () {
                oLS.other.backup !== f && initFields(queryBySelector(sFillable), !0)
            }, function () {
            })
    }
}

var D = document, sExtName = chrome.runtime.getManifest().name, sBackup = "Backup - ",
    sBgUpdErr = "[" + sExtName + "] Extension was recently updated. Please reload this page to resume proper operation.",
    sGForms = "freebirdFormviewerViewItemsItemItem",
    sInputs = "input:not([type=button]):not([type=image]):not([type=reset]):not([type=submit])",
    sFields = sInputs + ",select,textarea,[contenteditable=true]",
    sFillable = sFields + ",iframe,[jsaction][aria-checked],[jsaction][aria-selected]",
    sHost = location.host ? location.host.replace(/^www\d*?\./, "") : location.pathname.replace(/^.+\//, ""),
    sSite = location.host ? sHost + location.pathname : location.pathname.replace(/^.+?\//, ""),
    sSiteHaystack = D.title + "\n" + D.URL + (D.URL.indexOf("http") === 0 ? "\n" + D.URL.replace(/(:\/\/)(www\d*?\.)?/, D.URL.indexOf("://www") < 0 ? "$1www." : "$1") : ""),
    aFO = [], sCatCurrent, oAdvanced, oCats, oForceFill, oLS, oET, oHighlighted, bOpen = !1, bException, bManual,
    handleKeyDown = debounce(function (n) {
        var i, u, t, r;
        if (oLS) for (i = 0; i < oLS.cats.length; ++i) if (oLS.cats[i].h) {
            for (t = !0, u = oLS.cats[i].h.split(" + "), r = 0; r < u.length; ++r) switch (u[r]) {
                case"Ctrl":
                    n.ctrlKey || (t = !1);
                    break;
                case"Shift":
                    n.shiftKey || (t = !1);
                    break;
                case"Alt":
                    n.altKey || (t = !1);
                    break;
                case"Option":
                    n.altKey || (t = !1);
                    break;
                case"Win":
                    n.metaKey || (t = !1);
                    break;
                case"⌘":
                    n.metaKey || (t = !1);
                    break;
                default:
                    u[r].replace(/ /g, "").replace(/^Space$/, " ").toUpperCase() !== n.key.toUpperCase() && (t = !1)
            }
            if (t) {
                try {
                    chrome.runtime.sendMessage({type: "executeHotkey", data: {catnow: i + 5}})
                } catch (f) {
                    alert(sBgUpdErr)
                }
                return
            }
        }
    });
window.innerWidth > 1 && window.innerHeight > 1 && (init().then(function () {
    var n = queryBySelector(sFillable), t;
    updateStatus(n.length, 0);
    initFields(n);
    bManual ? Autofill(n, !0) : (t = oAdvanced[sCatCurrent] && oAdvanced[sCatCurrent].delay ? oAdvanced[sCatCurrent].delay : oLS.other.delay ? oLS.delay : 0, t ? setTimeout(Autofill, t * 1e3) : Autofill(n));
    createObserver(D)
}, function () {
}), chrome.runtime.onMessage.addListener(handleMessage));
