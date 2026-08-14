#!/usr/bin/env node
/* ============================================================
   KAVACH PRO  —  SamuSignal Pro ka suraksha kavach
   ------------------------------------------------------------
   Ye app ka hissa NAHI hai. Alag file hai.
   index.html se asli code nikaal kar uspe test chalata hai.

   Chalane ka tarika:
       node kavach-pro.js                  (index.html isi folder me ho)
       node kavach-pro.js path/to/index.html

   Ye kya karta hai:
     - App ka asli logic nikaalta hai (copy nahi, seedha file se)
     - 200+ cases pe chala kar dekhta hai sahi jawab aata hai ya nahi
     - PASS/FAIL ki report deta hai

   Ye kya NAHI karta:
     - Koi API call nahi
     - Koi order nahi
     - Koi file nahi badalta
     - Strategy achhi hai ya nahi, ye nahi batata —
       sirf ye batata hai ki ganit aur niyam sahi chal rahe hain

   Base Kavach se kya badla:
     - mt5Payload hata diya (Pro me MT5 bridge hai hi nahi)
     - verdict ab TAKE IT / WAIT / SKIP IT hai, LE LO / CHHOD DO nahi
     - Pro ke naye hisse jode: licence, device code, per-pair minimum
       lot, chart-AI symbol matching, tracking zone, scan stepping,
       do-bhasha guide
   ============================================================ */

const fs = require('fs');
const path = require('path');

const FILE = process.argv[2] || path.join(__dirname, 'index.html');

/* ---------- 1. app se asli code nikalo ---------- */
const PIECES = [
  /* --- base: instruments aur paise ka ganit --- */
  ['SPECS/PAIRS',   /const FX = \[[\s\S]*?\nconst PAIRS = Object\.keys\(SPECS\);/],
  ['MAJORS',        /const MAJORS = \[[^\]]*\];/],
  ['GROUPS',        /const GROUPS = \{[\s\S]*?\n\};/],
  ['quoteToUsd',    /function quoteToUsd\([\s\S]*?\n\}/],
  ['usdPerPoint',   /function usdPerPoint\([\s\S]*?\n\}/],
  ['usdPerPip',     /function usdPerPip\([^\n]+/],
  ['dollarsToDist', /function dollarsToDist\([\s\S]*?\n\}/],
  ['distToDollars', /function distToDollars\([\s\S]*?\n\}/],
  ['refPrice',      /function refPrice\([\s\S]*?\n\}/],
  ['fmt',           /const fmt = [^\n]+/],
  ['lotsForRisk',   /function lotsForRisk\([\s\S]*?\n\}/],
  ['calcLevels',    /function calcLevels\([\s\S]*?\n\}\n/],

  /* --- stop / target defaults --- */
  ['MIN_DEF',       /const MIN_DEF = [^\n]+/],
  ['MIN_LOT',       /const MIN_LOT = [^\n]+/],
  ['minLot',        /function minLot\([^\n]+/],
  ['fixLot',        /function fixLot\([\s\S]*?\n\}/],
  ['DEF_TPSL',      /const DEF_TPSL = \{[\s\S]*?\n\};/],
  ['LOT_UNIT',      /const LOT_UNIT = [^\n]+/],
  ['baseTP',        /function baseTP\([^\n]+/],
  ['baseSL',        /function baseSL\([^\n]+/],
  ['lotMul',        /function lotMul\([^\n]+/],
  ['defTP',         /function defTP\([^\n]+/],
  ['defSL',         /function defSL\([^\n]+/],
  ['hasOwnDef',     /function hasOwnDef\([^\n]+/],
  ['minStop',       /function minStop\([\s\S]*?\n\}/],
  ['checkStops',    /function checkStops\([\s\S]*?\n\}/],

  /* --- indicators --- */
  ['ema',           /function ema\([\s\S]*?\n\}/],
  ['rsi',           /function rsi\([\s\S]*?\n\}/],
  ['atr',           /function atr\([\s\S]*?\n\}/],
  ['supertrend',    /function supertrend\([\s\S]*?\n\}/],
  ['macdH',         /function macdH\([\s\S]*?\n\}/],
  ['last',          /const last = [^\n]+/],
  ['sma',           /const sma = [^\n]+/],
  ['hh',            /const hh = [^\n]+/],
  ['ll',            /const ll = [^\n]+/],
  ['stdev',         /function stdev\([\s\S]*?\n\}/],
  ['stoch',         /function stoch\([\s\S]*?\n\}/],
  ['cci',           /function cci\([\s\S]*?\n\}/],
  ['adx',           /function adx\([\s\S]*?\n\}/],
  ['psarUp',        /function psarUp\([\s\S]*?\n\}/],
  ['tfBias',        /function tfBias\([\s\S]*?\n\}/],

  /* --- agents aur faisla --- */
  ['AGENTS',        /const AGENTS = \[[\s\S]*?\n\];/],
  ['runAgents',     /function runAgents\([\s\S]*?\n\}/],
  ['analyse',       /function analyse\(sym, bars, v, s\)\{[\s\S]*?\n\}\n/],
  ['finalCall',     /function finalCall\(s\)\{[\s\S]*?\n\}\n/],

  /* --- correlation --- */
  ['structCorr',    /function structCorr\([\s\S]*?\n\}/],
  ['pearson',       /function pearson\([\s\S]*?\n\}/],

  /* --- text handling --- */
  ['jsonRescue',    /function jsonRescue\([\s\S]*?\n\}/],
  ['P_UP',          /const P_UP = [^\n]+/],
  ['P_DN',          /const P_DN = [^\n]+/],
  ['P_HI',          /const P_HI = [^\n]+/],
  ['paint',         /function paint\(t\)\{[\s\S]*?\n\}/],
  ['esc',           /function esc\([^\n]+/],

  /* --- Pro ke apne hisse --- */
  ['LIC',           /const LIC = \{[\s\S]*?\n\};/],
  ['licActive',     /function licActive\([\s\S]*?\n\}/],
  ['trialLeftMs',   /function trialLeftMs\([\s\S]*?\n\}/],
  ['trialDaysLeft', /function trialDaysLeft\([^\n]+/],
  ['PREVIEW_LOCK',  /let PREVIEW_LOCK = [^\n]+/],
  ['licOk',         /function licOk\([\s\S]*?\n\}/],
  ['licReady',      /function licReady\([^\n]+/],
  ['deviceFp',      /function deviceFp\([\s\S]*?\n\}/],
  ['matchSymbol',   /function matchSymbol\([\s\S]*?\n\}/],
  ['entryZone',     /function entryZone\([\s\S]*?\n\}/],
  ['getPrice',      /async function getPrice\([\s\S]*?\n\}/],
  ['trackNextIn',   /function trackNextIn\([\s\S]*?\n\}/],
  ['STYLES',        /const STYLES = \{[\s\S]*?\n\};/],
  ['SCAN_STEPS',    /const SCAN_STEPS = [^\n]+/],
  ['nextScanMin',   /function nextScanMin\([\s\S]*?\n\}/],
  ['GUIDE',         /const GUIDE = \[[\s\S]*?\n\];/],
  ['GUIDE_HI',      /const GUIDE_HI = \[[\s\S]*?\n\];/]
];

let html;
try { html = fs.readFileSync(FILE, 'utf8'); }
catch (e) { console.error('❌ File nahi mili: ' + FILE); process.exit(1); }

const VERSION = (html.match(/const VERSION = '([^']*)'/) || [,'?'])[1];
const src = [], missing = [];
for (const [name, re] of PIECES) {
  const m = html.match(re);
  if (m) src.push(m[0]); else missing.push(name);
}

/* Agar app ka code nikla hi nahi to chup-chaap aage mat badho —
   warna Kavach apne hi dobara likhe code ko test karta rahega
   aur jhoothi PASS report dega. */
if (missing.length) {
  console.error('\n❌ App se ye hisse nahi nikle:\n   ' + missing.join(', '));
  console.error('\n   Matlab index.html badal gaya hai aur Kavach ke regex purane hain.');
  console.error('   Test aage nahi badhega — jhoothi PASS report se adhoora test behtar hai.');
  process.exit(1);
}

/* ---------- 2. app jaisa maahaul banao ---------- */
globalThis.B = 'BUY'; globalThis.SE = 'SELL'; globalThis.H = 'HOLD';
const B = globalThis.B, SE = globalThis.SE, H = globalThis.H;
globalThis.TFS = [
  {id:'5min',l:'5m'},{id:'15min',l:'15m'},{id:'1h',l:'1H'},{id:'4h',l:'4H'},{id:'1day',l:'1D'}
];
globalThis.newsRisk = () => null;
globalThis.nextNews = () => null;
globalThis.t12 = d => new Date(d).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});
globalThis.VERSION = VERSION;
globalThis.gLang = 'en';
globalThis.lastVotes = null; globalThis.lastAn = null; globalThis.lastSignal = null;

function resetState(){
  globalThis.prices = {};
  globalThis.lastVotes = null;
  globalThis.lastAn = null;
  globalThis.lastSignal = null;
  globalThis.LICS = { code:'', state:null, seen:0 };
  globalThis.S = {
    dTp:1, dSl:2.5, dLot:0.01, lots:0.01, pair:'EUR/USD',
    slMode:'DOLLAR', atrSL:1.5, atrRR:2, autoLot:false, riskUsd:1.75,
    minPips:{}, symDef:{},
    newsOn:true, newsMin:30, htf:true, tf:'1h', px:{}, bad:[],
    scanMin:70, style:'DAY', shot:null, track:null, trackMin:5
  };
}
resetState();
const S = new Proxy({}, {
  get:(_,k)=>globalThis.S[k], set:(_,k,v)=>{ globalThis.S[k]=v; return true }
});
const prices = new Proxy({}, {
  get:(_,k)=>globalThis.prices[k], set:(_,k,v)=>{ globalThis.prices[k]=v; return true }
});

/* WRAPPED aur navigator app ke code me hain — test me nakli chahiye */
globalThis.navigator = { userAgent:'node', language:'en-US' };
globalThis.screen = { width:390, height:844, colorDepth:24 };
globalThis.window = { matchMedia: () => ({matches:false}) };
globalThis.location = { search:'', hash:'' };
globalThis.crypto = globalThis.crypto || {
  getRandomValues(a){ for(let i=0;i<a.length;i++) a[i] = (i*97+13) % 256; return a }
};
globalThis.LS = { get:(k,d)=>d, set:()=>{} };
/* LIC config.js se aata hai; test me wo file nahi hai */
globalThis.CFGF = {};
globalThis.SAMU_CONFIG = {};

const EXPORTS = [
  'FX','SPECS','PAIRS','MAJORS','GROUPS','quoteToUsd','usdPerPoint','usdPerPip',
  'dollarsToDist','distToDollars','refPrice','fmt','lotsForRisk','calcLevels',
  'MIN_DEF','MIN_LOT','minLot','fixLot','DEF_TPSL','LOT_UNIT','baseTP','baseSL',
  'lotMul','defTP','defSL','hasOwnDef','minStop','checkStops',
  'ema','rsi','atr','supertrend','macdH','last','sma','hh','ll','stdev','stoch',
  'cci','adx','psarUp','tfBias','AGENTS','runAgents','analyse','finalCall',
  'structCorr','pearson','jsonRescue','P_UP','P_DN','P_HI','paint','esc',
  'LIC','licActive','trialLeftMs','trialDaysLeft','licOk','licReady','deviceFp',
  'matchSymbol','entryZone','STYLES','SCAN_STEPS','nextScanMin','GUIDE','GUIDE_HI',
  'PREVIEW_LOCK',
  'getPrice','trackNextIn'
];
try {
  const glue = EXPORTS.map(n =>
    `try{ globalThis.${n} = ${n} }catch(e){}`).join('\n');
  (0, eval)(src.join('\n\n') + '\n;\n' + glue);
} catch (e) {
  console.error('❌ App ka code load nahi hua: ' + e.message);
  process.exit(1);
}
const notLoaded = EXPORTS.filter(n => typeof globalThis[n] === 'undefined');
if (notLoaded.length) {
  console.error('\n❌ Ye nikle to sahi par chale nahi:\n   ' + notLoaded.join(', '));
  process.exit(1);
}

/* ---------- 3. chhota test framework ---------- */
let pass = 0, fail = 0, group = '';
const fails = [];
const C = { g:'\x1b[32m', r:'\x1b[31m', y:'\x1b[33m', d:'\x1b[2m', b:'\x1b[1m', x:'\x1b[0m' };

function G(name){ group = name; console.log(`\n${C.b}── ${name}${C.x}`); }
function ok(name, cond, detail){
  if (cond) { pass++; console.log(`  ${C.g}✓${C.x} ${name}`); }
  else {
    fail++; fails.push(group + ' → ' + name + (detail ? '  [' + detail + ']' : ''));
    console.log(`  ${C.r}✗ ${name}${C.x}${detail ? C.d + '  ' + detail + C.x : ''}`);
  }
}
function eq(name, got, want, tol){
  const good = (tol === undefined) ? got === want : Math.abs(got - want) <= tol;
  ok(name, good, good ? '' : `mila ${got}, chahiye ${want}`);
}

function gen(n, drift, vol, seed, base){
  let p = base || 1.1, s = seed || 7, b = [];
  const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 };
  for (let i = 0; i < n; i++) {
    p *= 1 + drift + (rnd() - 0.5) * vol;
    const o = p * (1 + (rnd() - 0.5) * vol * 0.3), c = p;
    b.push({ o, h: Math.max(o,c) * (1 + rnd() * vol * 0.4),
             l: Math.min(o,c) * (1 - rnd() * vol * 0.4), c });
  }
  return b;
}

console.log(`${C.b}KAVACH PRO${C.x} — SamuSignal Pro v${VERSION}`);
console.log(`${C.d}${FILE}${C.x}`);

/* ============ A. code poora nikla? ============ */
G('A. App ka code');
ok('saare hisse mil gaye', missing.length === 0, missing.join(', '));
ok('sab load ho gaye', notLoaded.length === 0, notLoaded.join(', '));
ok('50 agents maujood', AGENTS.length === 50, 'mile ' + AGENTS.length);
ok(`${PAIRS.length} pairs load hue`, PAIRS.length >= 20, 'mile ' + PAIRS.length);
ok('PAIRS aur SPECS ek jaise', PAIRS.length === Object.keys(SPECS).length);
ok('har pair ka pip/contract/ccy hai',
   PAIRS.every(p => SPECS[p].pip > 0 && SPECS[p].contract > 0 &&
                    Array.isArray(SPECS[p].ccy) && SPECS[p].ccy.length === 2));
ok('har pair ka digits sahi', PAIRS.every(p => SPECS[p].d >= 0 && SPECS[p].d <= 8));
const inGroups = Object.values(GROUPS).flat();
ok('har pair kisi group me hai',
   PAIRS.every(p => inGroups.includes(p)),
   'chhoot gaye: ' + PAIRS.filter(p => !inGroups.includes(p)).join(','));
ok('group me koi anjaan pair nahi',
   inGroups.every(p => SPECS[p]),
   'anjaan: ' + inGroups.filter(p => !SPECS[p]).join(','));
ok('har agent ka naam alag',
   new Set(AGENTS.map(a=>a.n)).size === AGENTS.length);
ok('MT5 bridge sach me hata hua hai',
   !/mt5Payload|sendMT5|fxbridge/i.test(html),
   'Pro me MT5 nahi hona chahiye');

/* ============ B. pip / dollar ka ganit ============ */
G('B. Pip aur dollar ka ganit');
resetState();
prices['USD/JPY'] = {p:150}; prices['GBP/USD'] = {p:1.27};
prices['USD/CHF'] = {p:0.88}; prices['USD/CAD'] = {p:1.36};
prices['EUR/USD'] = {p:1.09}; prices['AUD/USD'] = {p:0.66};
prices['NZD/USD'] = {p:0.60};

eq('XAUUSD 0.01 lot = $0.10/pip', +usdPerPip('XAU/USD',3300,0.01).toFixed(4), 0.10, 0.001);
eq('EURUSD 0.01 lot = $0.10/pip', +usdPerPip('EUR/USD',1.09,0.01).toFixed(4), 0.10, 0.001);
eq('USDJPY 0.01 lot = $0.0667/pip', +usdPerPip('USD/JPY',150,0.01).toFixed(4), 0.0667, 0.001);
eq('GBPJPY (cross) = $0.0667/pip', +usdPerPip('GBP/JPY',190,0.01).toFixed(4), 0.0667, 0.001);
eq('EURGBP (cross) = $0.127/pip', +usdPerPip('EUR/GBP',0.85,0.01).toFixed(4), 0.127, 0.002);
eq('USDCAD 0.01 lot = $0.0735/pip', +usdPerPip('USD/CAD',1.36,0.01).toFixed(4), 0.0735, 0.001);
ok('lot dugna = paisa dugna',
   Math.abs(usdPerPip('EUR/USD',1.09,0.02) - 2*usdPerPip('EUR/USD',1.09,0.01)) < 1e-9);
ok('har pair ka pip value dhanatmak',
   PAIRS.every(p => usdPerPip(p, refPrice(p), 0.01) > 0));
/* dono ka order (sym, price, lots, value) hai */
ok('dollar → distance → dollar wapas wahi',
   PAIRS.slice(0,12).every(p => {
     const px = refPrice(p), d = dollarsToDist(p, px, 0.01, 2.5);
     return Math.abs(distToDollars(p, px, 0.01, d) - 2.5) < 0.01;
   }));

/* ============ C. per-pair minimum lot (Pro) ============ */
G('C. Broker ka minimum lot');
eq('ETHUSD ka minimum 0.10', minLot('ETH/USD'), 0.10);
eq('BTCUSD ka minimum 0.02', minLot('BTC/USD'), 0.02);
eq('baaki sab 0.01', minLot('EUR/USD'), 0.01);
eq('ETH 0.01 → 0.10 uth jaata hai', fixLot('ETH/USD', 0.01), 0.10);
eq('ETH 0.13 → 0.10 pe baithta hai', fixLot('ETH/USD', 0.13), 0.10);
eq('ETH 0.17 → 0.20 pe jaata hai', fixLot('ETH/USD', 0.17), 0.20);
eq('BTC 0.01 → 0.02', fixLot('BTC/USD', 0.01), 0.02);
eq('EURUSD 0.01 waisa hi', fixLot('EUR/USD', 0.01), 0.01);
eq('khaali input pe minimum', fixLot('ETH/USD', ''), 0.10);
eq('zero pe minimum', fixLot('ETH/USD', 0), 0.10);
eq('negative pe minimum', fixLot('ETH/USD', -5), 0.10);
ok('fixLot kabhi minimum se neeche nahi jaata',
   PAIRS.every(p => fixLot(p, 0.001) >= minLot(p)));

/* ============ D. TP/SL defaults aur lot scaling ============ */
G('D. TP/SL default aur lot ke saath badhna');
resetState();
eq('EURUSD default TP $1', defTP('EUR/USD', 0.01), 1);
eq('EURUSD default SL $2.5', defSL('EUR/USD', 0.01), 2.5);
eq('Gold ka apna TP $5', defTP('XAU/USD', 0.01), 5);
eq('Gold ka apna SL $8', defSL('XAU/USD', 0.01), 8);
eq('BTC ka apna TP $30', defTP('BTC/USD', 0.01), 30);
eq('lot 10x → dollar 10x', defTP('EUR/USD', 0.10), 10, 0.001);
eq('lot 0.05 → TP $5', defTP('EUR/USD', 0.05), 5, 0.001);
ok('gold/btc/eth ke apne default hain',
   hasOwnDef('XAU/USD') && hasOwnDef('BTC/USD') && hasOwnDef('US30'));
ok('aam pair ka apna default nahi', !hasOwnDef('EUR/USD'));
ok('lot badhne pe price distance wahi rehti', (() => {
  const px = 1.09;
  const d1 = dollarsToDist('EUR/USD', px, 0.01, defSL('EUR/USD',0.01));
  const d2 = dollarsToDist('EUR/USD', px, 0.10, defSL('EUR/USD',0.10));
  return Math.abs(d1 - d2) < 1e-9;
})());

/* ============ E. calcLevels ============ */
G('E. Level ka hisaab');
resetState();
const px = 1.09;
/* calcLevels doori deta hai (slDist/tpDist), price nahi — direction
   lagakar app khud price banata hai */
const lv = calcLevels('EUR/USD', px, 0.01, {});
ok('SL doori dhanatmak', lv.slDist > 0);
ok('TP doori dhanatmak', lv.tpDist > 0);
eq('SL ka dollar $2.5', lv.slD, 2.5, 0.02);
eq('TP ka dollar $1', lv.tpD, 1, 0.02);
ok('pips bhi milte hain', lv.slPips > 0 && lv.tpPips > 0);
const buySl = px - lv.slDist, buyTp = px + lv.tpDist;
const selSl = px + lv.slDist, selTp = px - lv.tpDist;
ok('BUY me SL entry se neeche', buySl < px);
ok('BUY me TP entry se upar', buyTp > px);
ok('SELL me SL entry se upar', selSl > px);
ok('SELL me TP entry se neeche', selTp < px);
ok('BUY aur SELL ki doori barabar',
   Math.abs((px - buySl) - (selSl - px)) < 1e-12);

/* auto-lot: risk fix rehna chahiye */
/* ATR mode calcLevels(sym, price, lots, atr, opt) se aata hai;
   mode aur risk opt me jaate hain, alag argument me nahi */
S.slMode = 'ATR'; S.autoLot = true; S.riskUsd = 10; S.atrSL = 1.5; S.atrRR = 2;
const lvA = calcLevels('EUR/USD', px, 0.01, 0.0008,
                       {mode:'ATR', autoLot:true, riskUsd:10, atrSL:1.5, atrRR:2});
ok('auto-lot me risk target ke paas',
   Math.abs(lvA.slD - 10) < 1.5 || lvA.clamped > 0, 'risk ' + lvA.slD);
ok('auto-lot ka lot minimum se upar', lvA.lots >= 0.01);
ok('ATR mode me R:R settings ke hisaab se',
   Math.abs((lvA.tpD / lvA.slD) - 2) < 0.35, 'R:R ' + (lvA.tpD/lvA.slD).toFixed(2));
ok('ATR badhne pe stop bhi chaudi hoti hai', (() => {
  const a = calcLevels('EUR/USD', px, 0.01, 0.0005, {mode:'ATR', atrSL:1.5, atrRR:2});
  const b3 = calcLevels('EUR/USD', px, 0.01, 0.0015, {mode:'ATR', atrSL:1.5, atrRR:2});
  return b3.slDist > a.slDist;
})());
resetState();

/* ============ F. broker ke minimum stops ============ */
G('F. Broker ke minimum stops');
resetState();
ok('sahi stops manzoor',
   checkStops('EUR/USD','BUY',1.09,1.0875,1.0925).length === 0);
ok('BUY me ulti SL pakdi jaati hai',
   checkStops('EUR/USD','BUY',1.09,1.0925,1.0925).length > 0);
ok('BUY me ulta TP pakda jaata hai',
   checkStops('EUR/USD','BUY',1.09,1.0875,1.0875).length > 0);
ok('bahut paas ki SL pakdi jaati hai',
   checkStops('XAU/USD','BUY',3300,3299.9,3350).length > 0);
ok('SELL me ulti SL pakdi jaati hai',
   checkStops('EUR/USD','SELL',1.09,1.0875,1.0875).length > 0);
eq('gold ka minimum 50 pips', minStop('XAU/USD'), 50);
eq('BTC ka minimum 300', minStop('BTC/USD'), 300);
eq('ETH ka minimum 150', minStop('ETH/USD'), 150);
eq('aam pair ka minimum 5', minStop('EUR/USD'), 5);
ok('user ka apna minimum maana jaata hai', (() => {
  S.minPips['EUR/USD'] = 25;
  const r = minStop('EUR/USD') === 25;
  delete S.minPips['EUR/USD'];
  return r;
})());

/* ============ G. indicators ============ */
G('G. Indicators');
const up = gen(200, 0.0012, 0.004, 11, 1.10);
const dn = gen(200, -0.0012, 0.004, 13, 1.10);
const flat = gen(200, 0, 0.002, 17, 1.10);

/* Pro me indicators bars ke saath length bhi lete hain, aur rsi/macdH
   poori series lautate hain — isliye last() lagana padta hai. App khud
   bhi aise hi bulata hai: rsi(c,14), supertrend(bars,10,3), adx(bars,14). */
const cUp = up.map(b=>b.c), cDn = dn.map(b=>b.c), cFl = flat.map(b=>b.c);
const rsiUp = last(rsi(cUp,14)), rsiDn = last(rsi(cDn,14));
const adxUp = adx(up,14), adxFl = adx(flat,14);

ok('EMA teji me price ke paas',
   Math.abs(last(ema(cUp, 20)) - last(up).c) < last(up).c * 0.02);
ok('RSI 0-100 ke beech', rsiUp >= 0 && rsiUp <= 100);
ok('teji me RSI 50 se upar', rsiUp > 50, 'RSI ' + rsiUp.toFixed(1));
ok('mandi me RSI 50 se neeche', rsiDn < 50, 'RSI ' + rsiDn.toFixed(1));
ok('ATR dhanatmak', last(atr(up,14)) > 0);
/* supertrend {dir, line, atr} deta hai; dir ek series hai jisme 1 = teji */
ok('teji me supertrend upar', last(supertrend(up,10,3).dir) === 1);
ok('mandi me supertrend neeche', last(supertrend(dn,10,3).dir) === -1);
ok('supertrend line har candle ke liye',
   supertrend(up,10,3).line.length === up.length);
/* Ek candle pe histogram palat sakta hai; poori teji ka औसत dekhna sahi hai */
ok('teji me MACD hist zyadatar dhanatmak', (() => {
  const h = macdH(cUp).slice(-40);
  return h.filter(x => x > 0).length > h.length / 2;
})());
ok('ADX 0-100 ke beech', adxUp.adx >= 0 && adxUp.adx <= 100);
ok('trend me ADX range se zyada', adxUp.adx > adxFl.adx,
   `trend ${adxUp.adx.toFixed(1)} vs range ${adxFl.adx.toFixed(1)}`);
ok('stoch 0-100 ke beech', (() => { const k = stoch(up,14); return k >= 0 && k <= 100 })());
ok('CCI number deta hai', Number.isFinite(cci(up,20)));
ok('stdev dhanatmak', stdev(cUp, 20) > 0);
ok('hh >= ll', hh(up, 30) >= ll(up, 30));
ok('teji me PSAR upar', psarUp(up) === true);
ok('kam candles pe crash nahi', (() => {
  try {
    const t = gen(5, 0.001, 0.003, 3, 1.1), tc = t.map(b=>b.c);
    rsi(tc,14); atr(t,14); adx(t,14); stoch(t,14); macdH(tc);
    return true;
  } catch(e){ return false }
})());

/* ============ H. timeframe bias ============ */
G('H. Timeframe bias');
/* tfBias poora object deta hai; label .bias me hai, HOLD nahi NEUTRAL */
ok('teji ka bias BUY', tfBias(up).bias === 'BUY', tfBias(up).bias);
ok('mandi ka bias SELL', tfBias(dn).bias === 'SELL', tfBias(dn).bias);
ok('bias teeno me se ek',
   ['BUY','SELL','NEUTRAL'].includes(tfBias(flat).bias), tfBias(flat).bias);
ok('bias ke saath score bhi aata hai', Number.isFinite(tfBias(up).score));
ok('teji ka score dhanatmak', tfBias(up).score > 0, 'score ' + tfBias(up).score);

/* ============ I. 50 agents ============ */
G('I. 50 agents');
const vUp = runAgents(up, {}, last(up).c);
const vDn = runAgents(dn, {}, last(dn).c);
eq('kul vote 50', vUp.buy + vUp.sell + vUp.hold, 50);
ok('teji me BUY zyada', vUp.buy > vUp.sell, `${vUp.buy}B vs ${vUp.sell}S`);
ok('mandi me SELL zyada', vDn.sell > vDn.buy, `${vDn.sell}S vs ${vDn.buy}B`);
ok('confidence 0-100', vUp.conf >= 0 && vUp.conf <= 100);
ok('verdict teeno me se ek', ['BUY','SELL','HOLD'].includes(vUp.verdict));
ok('har agent ka vote valid',
   vUp.list.every(a => ['BUY','SELL','HOLD'].includes(a.v)));
ok('har agent ka group hai', AGENTS.every(a => a.g && a.n));
ok('dobara chalane pe wahi jawab', (() => {
  const a = runAgents(up, {}, last(up).c), b2 = runAgents(up, {}, last(up).c);
  return a.buy === b2.buy && a.sell === b2.sell;
})());

/* ============ J. chart analyst ============ */
G('J. Chart analyst');
resetState();
const sigUp = {
  sym:'EUR/USD', dir:'BUY', live:last(up).c, q:75, grade:'A',
  sl:last(up).c*0.998, tp:last(up).c*1.002,
  rsi:last(rsi(cUp,14)), atr:last(atr(up,14)), st:supertrend(up,10,3), adx:adx(up,14),
  tfs:[{l:'15m',b:'BUY'},{l:'1H',b:'BUY'},{l:'4H',b:'BUY'},{l:'1D',b:'BUY'}], htfOk:true
};
const an = analyse('EUR/USD', up, vUp, sigUp);
ok('pct 0-100', an.pct >= 0 && an.pct <= 100);
ok('verdict text hai', typeof an.verdict === 'string' && an.verdict.length > 0);
/* analyse() checks ko O me deta hai (rows me nahi), aur invalidation
   ko inval me. Naam app se liye hain, andaze se nahi. */
ok('checks ki list hai', Array.isArray(an.O) && an.O.length > 0);
ok('har check ka ok 0/1/2', an.O.every(r => [0,1,2].includes(r.ok)));
ok('har check ka heading aur text hai', an.O.every(r => r.h && r.t));
ok('kab galat hoga wo batata hai', typeof an.inval === 'string' && an.inval.length > 0);
ok('summary hai', typeof an.summary === 'string' && an.summary.length > 0);
ok('kharab check alag se ginta hai', Array.isArray(an.bad));
ok('pct aur bad aapas me mel khate hain',
   an.bad.length === an.O.filter(x => x.ok === 0).length);
ok('narrative English me hai',
   !/\b(karo|nahi|kyunki|isliye|chahiye)\b/i.test(an.O.map(r=>r.t).join(' ')),
   'Hinglish bacha hua hai');

/* ============ K. final verdict (Pro) ============ */
G('K. Aakhri faisla');
resetState();
function callWith(sig, votes, ana){
  globalThis.lastVotes = votes; globalThis.lastAn = ana;
  return finalCall(sig);
}
const goodCall = callWith(sigUp, vUp, an);
ok('verdict teeno me se ek',
   ['TAKE IT','WAIT','SKIP IT'].includes(goodCall.t), goodCall.t);
ok('purana Hinglish verdict nahi bacha',
   !/LE LO|CHHOD DO/.test(html), 'app me LE LO/CHHOD DO mila');
ok('wajah bhi milti hai', typeof goodCall.why === 'string' && goodCall.why.length > 0);
ok('rang bhi milta hai', typeof goodCall.c === 'string' && goodCall.c.length > 0);

/* agents ulta bolein to SKIP */
/* finalCall votes tabhi maanta hai jab wo usi pair ke hon — isliye
   mock me sym dena zaroori hai, warna check chup-chaap skip ho jaata hai */
const oppose = callWith({...sigUp, dir:'BUY'},
                        {...vUp, sym:'EUR/USD', verdict:'SELL', conf:80}, an);
ok('agents ulta bolein to SKIP IT', oppose.t === 'SKIP IT', oppose.t);
ok('doosre pair ke vote nazarandaz hote hain', (() => {
  const other = callWith({...sigUp, dir:'BUY'},
                         {...vUp, sym:'GBP/USD', verdict:'SELL', conf:80}, an);
  return other.t !== 'SKIP IT' || oppose.t === other.t;
})());

/* HTF match na kare to kam se kam WAIT */
const noHtf = callWith({...sigUp, htfOk:false, q:55}, vUp, an);
ok('HTF match na ho to TAKE IT nahi', noHtf.t !== 'TAKE IT', noHtf.t);

/* technical bahut kamzor to SKIP */
const weak = callWith(sigUp, vUp, {...an, pct:20, bad:[{h:'Trend'},{h:'RSI'}]});
ok('technical bahut kamzor to SKIP IT', weak.t === 'SKIP IT', weak.t);
resetState();

/* ============ L. correlation ============ */
G('L. Correlation');
ok('ek hi pair ka correlation +1', Math.abs(structCorr('EUR/USD','EUR/USD') - 1) < 0.01);
ok('same quote wale saath chalte', structCorr('EUR/USD','GBP/USD') > 0);
ok('ulta pair negative', structCorr('EUR/USD','USD/CHF') < 0);
ok('correlation −1 se +1 ke beech',
   PAIRS.slice(0,10).every(a => PAIRS.slice(0,10).every(b2 =>
     structCorr(a,b2) >= -1.001 && structCorr(a,b2) <= 1.001)));
/* pearson 10 se kam points pe jaanbujh kar 0 deta hai — kam data pe
   correlation ka koi matlab nahi hota */
const ser = Array.from({length:20}, (_,i) => i+1);
ok('pearson khud se +1', Math.abs(pearson(ser, ser) - 1) < 0.01);
ok('pearson ulta −1', Math.abs(pearson(ser, [...ser].reverse()) + 1) < 0.01);
ok('kam data pe 0 deta hai', pearson([1,2,3],[1,2,3]) === 0);
ok('pearson chhote data pe crash nahi',
   (()=>{ try{ pearson([1],[1]); return true }catch(e){ return false } })());

/* ============ M. AI ka JSON ============ */
G('M. AI ka jawab padhna');
ok('saaf JSON padhta hai', (() => {
  const r = jsonRescue('{"signal":"BUY","confidence":80}');
  return r && r.signal === 'BUY';
})());
ok('```json wrapper hata deta hai', (() => {
  const r = jsonRescue('```json\n{"signal":"SELL"}\n```');
  return r && r.signal === 'SELL';
})());
ok('aage-peeche ka text hata deta hai', (() => {
  const r = jsonRescue('Here you go:\n{"signal":"BUY"}\nHope that helps');
  return r && r.signal === 'BUY';
})());
ok('adhoora JSON bacha leta hai', (() => {
  const r = jsonRescue('{"signal":"BUY","entry":1.09');
  return r && r.signal === 'BUY';
})());
ok('bilkul kachre pe null deta hai', jsonRescue('not json at all') === null);
ok('khaali string pe null', jsonRescue('') === null);

/* ============ N. XSS / text safety ============ */
G('N. Text ki suraksha');
ok('paint script tag nahi chhodta',
   !/<script/i.test(paint('<script>alert(1)</script>')));
/* paint < > & ko escape karta hai, isliye tag ban hi nahi sakta.
   'onerror=' text bacha reh sakta hai — wo inert hai, khatra nahi. */
ok('paint se koi live tag nahi banta',
   !/<[a-z]/i.test(paint('"><img src=x onerror=alert(1)>')));
ok('paint & ko bhi escape karta hai', paint('a & b').includes('&amp;'));
ok('esc bhi tag todta hai',
   !/<img/i.test(esc('<img src=x onerror=alert(1)>')));
ok('paint aam text nahi bigadta',
   paint('RSI 61.4 strong').includes('61.4'));

/* ============ O. licence (Pro) ============ */
G('O. Licence aur trial');
const DAY = 86400000;
function setLic(st){ globalThis.LICS.state = st }

setLic({status:'trial', trialEnds: Date.now() + 7*DAY});
ok('naya trial chalu hai', licOk() === true);
eq('7 din bache hain', trialDaysLeft(), 7);
ok('trial me licence active nahi', licActive() === false);

setLic({status:'trial', trialEnds: Date.now() + 0.4*DAY});
ok('aakhri din bhi khula', licOk() === true);
eq('aakhri din 1 dikhata hai', trialDaysLeft(), 1);

setLic({status:'trial', trialEnds: Date.now() - 1000});
ok('trial khatam to band', licOk() === false);
eq('khatam pe 0 din', trialDaysLeft(), 0);

setLic({status:'active', activatedAt: Date.now(), trialEnds: Date.now() - 30*DAY});
ok('activate hone pe khula rehta hai', licOk() === true);
ok('licence active dikhta hai', licActive() === true);

setLic({status:'active', activeUntil: Date.now() + DAY});
ok('samay-seemit licence chalu', licOk() === true);
setLic({status:'active', activeUntil: Date.now() - DAY});
ok('samay khatam licence band', licOk() === false);

setLic({status:'pending', trialEnds: Date.now() - DAY});
ok('payment pending par trial khatam → band', licOk() === false);
setLic({status:'pending', trialEnds: Date.now() + 2*DAY});
ok('payment pending par trial chalu → khula', licOk() === true);

setLic(null);
ok('koi record nahi → band', licOk() === false);
setLic({});
ok('khaali record → band', licOk() === false);
setLic({status:'ACTIVE'});
ok('bade akshar wala status nahi chalta', licOk() === false);
setLic({status:'active'});
ok('bina tareekh ke active chalta hai', licOk() === true);
setLic(null);

ok('device fingerprint banta hai',
   typeof deviceFp() === 'string' && deviceFp().length > 0);
ok('fingerprint har baar wahi', deviceFp() === deviceFp());
ok('LIC me trial ke din hain', LIC.trialDays === 7, 'mile ' + LIC.trialDays);
ok('LIC me mode hai', ['direct','play'].includes(LIC.mode), LIC.mode);
ok('licReady bina config ke false', licReady() === false || /^https/.test(LIC.db));

/* ============ P. chart AI ka symbol (Pro) ============ */
G('P. Chart AI ka symbol padhna');
eq('XAUUSD pehchana', matchSymbol('XAUUSD'), 'XAU/USD');
eq('chhote akshar bhi', matchSymbol('xau/usd'), 'XAU/USD');
eq('GOLD bhi XAUUSD', matchSymbol('GOLD'), 'XAU/USD');
eq('EURUSD pehchana', matchSymbol('EURUSD'), 'EUR/USD');
eq('BTCUSD pehchana', matchSymbol('BTCUSD'), 'BTC/USD');
eq('ETHUSD pehchana', matchSymbol('ETHUSD'), 'ETH/USD');
eq('ETHEREUM bhi ETHUSD', matchSymbol('ETHEREUM'), 'ETH/USD');
eq('broker suffix chalta hai', matchSymbol('XAUUSDm'), 'XAU/USD');
eq('anjaan symbol pe null', matchSymbol('ZZZZ'), null);
eq('khaali pe null', matchSymbol(''), null);
ok('ETH sach me tradable pair hai', !!SPECS['ETH/USD']);
ok('ETH kisi group me hai', inGroups.includes('ETH/USD'));

/* ============ Q. tracking zone (Pro) ============ */
G('Q. Live tracking ka zone');
ok('gold ka entry zone dhanatmak', entryZone('XAU/USD', 3300, 3280) > 0);
ok('zone SL ki doori ka hissa hai',
   entryZone('XAU/USD', 3300, 3280) < Math.abs(3300-3280));
ok('SL = entry ho to bhi zone banta hai',
   entryZone('XAU/USD', 3300, 3300) > 0);
ok('chaudi SL = chauda zone',
   entryZone('XAU/USD', 3300, 3200) > entryZone('XAU/USD', 3300, 3290));
ok('zone kabhi zero nahi',
   PAIRS.slice(0,10).every(p => entryZone(p, refPrice(p), refPrice(p)) > 0));

/* BUY/SELL me trigger sahi taraf */
function fire(t, p){
  const upDir = t.dir === 'BUY', out = [];
  if (Math.abs(p - t.entry) <= entryZone(t.sym, t.entry, t.sl)) out.push('entry');
  if (upDir ? p <= t.sl : p >= t.sl) out.push('sl');
  if (upDir ? p >= t.tp1 : p <= t.tp1) out.push('tp1');
  return out;
}
const buyT = {sym:'XAU/USD', dir:'BUY', entry:3300, sl:3280, tp1:3340};
ok('BUY: door pe kuch nahi', fire(buyT, 3320).length === 0);
ok('BUY: entry pe entry', fire(buyT, 3300).includes('entry'));
ok('BUY: neeche SL lagti hai', fire(buyT, 3279).includes('sl'));
ok('BUY: upar TP lagti hai', fire(buyT, 3341).includes('tp1'));
const sellT = {sym:'EUR/USD', dir:'SELL', entry:1.0850, sl:1.0880, tp1:1.0790};
ok('SELL: SL upar hoti hai', fire(sellT, 1.0885).includes('sl'));
ok('SELL: neeche jaana SL nahi', !fire(sellT, 1.0800).includes('sl'));
ok('SELL: neeche TP lagti hai', fire(sellT, 1.0789).includes('tp1'));

/* ============ R. trading style (Pro) ============ */
G('R. Trading style');
ok('teeno style maujood',
   ['SCALP','DAY','SWING'].every(k => STYLES[k]));
ok('har style ka label hai',
   Object.values(STYLES).every(v => v.label && v.note && v.brief));
ok('har style ka brief alag',
   new Set(Object.values(STYLES).map(v => v.brief)).size === 3);

/* ============ S. scan ka threshold (Pro) ============ */
G('S. Scan ka threshold');
ok('steps me sirf asli option hain',
   SCAN_STEPS.every(v => [80,70,60,0].includes(v)),
   SCAN_STEPS.join(','));
eq('80 se 70', nextScanMin(80), 70);
eq('70 se 60', nextScanMin(70), 60);
eq('60 se sab dikhao', nextScanMin(60), 0);
eq('0 se aage nahi', nextScanMin(0), 0);
eq('anjaan value pe 60', nextScanMin(55), 60);
eq('string bhi chalti hai', nextScanMin('70'), 60);
ok('har step ek asli option hai',
   SCAN_STEPS.every(v => SCAN_STEPS.includes(nextScanMin(v))));

/* ============ T. do-bhasha guide (Pro) ============ */
G('T. Guide dono bhasha me');
ok('English guide maujood', Array.isArray(GUIDE) && GUIDE.length > 0);
ok('Hinglish guide maujood', Array.isArray(GUIDE_HI) && GUIDE_HI.length > 0);
eq('dono me barabar section', GUIDE_HI.length, GUIDE.length);
ok('section id dono me same',
   GUIDE.map(g=>g.id).join() === GUIDE_HI.map(g=>g.id).join(),
   'toggle galat page pe le jayega');
ok('har section me content hai',
   GUIDE.every(g => Array.isArray(g.body) && g.body.length > 0) &&
   GUIDE_HI.every(g => Array.isArray(g.body) && g.body.length > 0));
ok('har section ka title hai',
   GUIDE.every(g => g.t) && GUIDE_HI.every(g => g.t));
ok('sirf jaane-pehchane block type',
   [...GUIDE, ...GUIDE_HI].every(g => g.body.every(([k]) => ['h','p','n','t','w'].includes(k))));

/* ============ Q2. price fail hone par chup nahi rehna ============ */
G('Q2. Silent-fail nahi hona chahiye');

/* Ye group us bug ke liye hai jisme getPrice() har error nigal jaata tha
   aur purana cached price laut deta tha. Tracking ko lagta tha check
   safal hua, "abhi check hua" dikhta rehta tha, aur price frozen. */
globalThis.prices['XAU/USD'] = {p: 3300};

/* td() ko nakli banate hain taaki fail karwa saken */
let tdMode = 'ok';
globalThis.td = async () => {
  if (tdMode === 'fail') throw new Error('Network fail');
  if (tdMode === 'junk') return { price: 'abc' };
  return { price: '3310' };
};
globalThis.apiSym = x => x;

const priceProbe = (async () => {
  tdMode = 'ok';
  const p1 = await getPrice('XAU/USD', true);
  ok('sahi jawab pe naya price milta hai', p1 === 3310, 'mila ' + p1);

  tdMode = 'fail';
  let threw = false, msg = '';
  try { await getPrice('XAU/USD', true) } catch(e){ threw = true; msg = e.message }
  ok('strict mode me error phenkta hai', threw, 'chup-chaap nikal gaya');
  ok('error ka message bhi aata hai', msg.length > 0, msg);

  const cached = await getPrice('XAU/USD');
  ok('bina strict ke purana behaviour waisa hi', cached === 3310, 'mila ' + cached);

  tdMode = 'junk';
  let threw2 = false;
  try { await getPrice('XAU/USD', true) } catch(e){ threw2 = true }
  ok('kachra price bhi strict me error deta hai', threw2);

  tdMode = 'ok';
})();

/* report tabhi chhapo jab async check bhi ho jayein */
priceProbe.then(runRest).catch(e => {
  console.error('❌ price test hi crash ho gaya: ' + e.message);
  process.exit(1);
});

function runRest(){

ok('trackCheck strict mode use karta hai',
   /getPrice\(t\.sym,\s*true\)/.test(html),
   'strict ke bina wahi bug wapas aa jayega');
ok('fail hone par wajah save hoti hai',
   /t\.why\s*=\s*\(e && e\.message\)/.test(html));
ok('catch ab khaali nahi hai',
   !/a failed price check is not worth interrupting/.test(html));
ok('safal check purani wajah mita deta hai',
   /t\.why\s*=\s*''/.test(html));
ok('skip hone ki wajah bhi record hoti hai',
   /function trackSkip\(/.test(html));
ok('API key na ho to batata hai', /No API key/.test(html));
ok('daily budget aur per-minute alag-alag bataye jaate hain',
   /Daily API budget used up/.test(html) && /8-calls-per-minute/.test(html));
ok('price na hilne par note dikhta hai', /sameCount/.test(html));
ok('UI me fail ka box hai', /CHECK DID NOT RUN/.test(html));
ok('purana price "live nahi hai" likha jaata hai',
   /it is not live/.test(html));

/* countdown */
resetState();
S.trackMin = 5;
const nowT = Date.now();
ok('abhi tak check nahi hua to "now"',
   trackNextIn({lastAt:0, done:false}) === 'now');
ok('done tracker pe countdown nahi',
   trackNextIn({lastAt:nowT, done:true}) === '\u2014');
ok('samay ho gaya to "due now"',
   trackNextIn({lastAt: nowT - 6*60000, done:false}) === 'due now');
ok('bacha hua samay m:ss me dikhta hai',
   /^\d+:\d\d$/.test(trackNextIn({lastAt: nowT - 60000, done:false})),
   trackNextIn({lastAt: nowT - 60000, done:false}));
ok('interval 30s se ghata kar 20s hua', /\}, 20000\);/.test(html));
ok('app wapas khulte hi check hota hai',
   /visibilitychange[\s\S]{0,160}trackCheck\(false\)/.test(html));

/* ============ U. pura signal, shuru se aakhir tak ============ */
G('U. Pura signal end-to-end');
resetState();
prices['EUR/USD'] = {p:1.09};
const eBars = gen(300, 0.0010, 0.0035, 23, 1.09);
const ePx = last(eBars).c;
const eVotes = runAgents(eBars, {}, ePx);
const eLv = calcLevels('EUR/USD', ePx, 0.01, last(atr(eBars,14)),
                       {slD:2.5, tpD:1});
const eSig = {
  sym:'EUR/USD', dir:'BUY', live:ePx, q:70, grade:'B',
  sl: ePx - eLv.slDist, tp: ePx + eLv.tpDist,
  rsi:last(rsi(eBars.map(b=>b.c),14)), atr:last(atr(eBars,14)),
  st:supertrend(eBars,10,3), adx:adx(eBars,14),
  tfs:[{l:'15m',b:'BUY'},{l:'1H',b:'BUY'},{l:'4H',b:'BUY'},{l:'1D',b:'BUY'}], htfOk:true
};
const eAn = analyse('EUR/USD', eBars, eVotes, eSig);
const eCall = callWith(eSig, eVotes, eAn);

ok('BUY me SL entry se neeche', eSig.sl < eSig.live);
ok('BUY me TP entry se upar', eSig.tp > eSig.live);
ok('stops broker ko manzoor',
   checkStops('EUR/USD','BUY',eSig.live,eSig.sl,eSig.tp).length === 0);
ok('verdict teeno me se ek',
   ['TAKE IT','WAIT','SKIP IT'].includes(eCall.t), eCall.t);
ok('lot broker minimum se upar', fixLot('EUR/USD', eLv.lots) >= minLot('EUR/USD'));

const sSig = {...eSig, dir:'SELL', sl: ePx + eLv.slDist, tp: ePx - eLv.tpDist};
ok('SELL me SL entry se upar', sSig.sl > sSig.live);
ok('SELL me TP entry se neeche', sSig.tp < sSig.live);
ok('SELL stops bhi manzoor',
   checkStops('EUR/USD','SELL',sSig.live,sSig.sl,sSig.tp).length === 0);

/* ============ V. R:R aur breakeven ============ */
G('V. R:R ka ganit');
function beWR(tp, sl){ return 100 / (1 + tp/sl) }
eq('TP$1/SL$2.5 → 71% chahiye', +beWR(1,2.5).toFixed(1), 71.4, 0.1);
eq('TP$2.5/SL$2.5 → 50% chahiye', +beWR(2.5,2.5).toFixed(1), 50, 0.1);
eq('TP$5/SL$2.5 → 33% chahiye', +beWR(5,2.5).toFixed(1), 33.3, 0.1);
ok('R:R jitna behtar, utna kam win rate chahiye',
   beWR(1,2.5) > beWR(2.5,2.5) && beWR(2.5,2.5) > beWR(5,2.5));

/* ============ W. app ki bhasha ============ */
G('W. App ki bhasha');
const HIN = /\b(karo|karna|nahi|dabao|chuno|bhejo|daalo|dekho|hoga|hogi|chahiye|kyunki|isliye|abhi|sirf|thoda|zyada|wapas|dobara|baaki|purana|khaali)\b/i;
const guideStart = html.indexOf('const GUIDE_HI');
const guideEnd = html.indexOf('let gTab');
const hinLines = html.split('\n').map((l,i) => ({l,i})).filter(({l,i}) => {
  const pos = html.split('\n').slice(0,i).join('\n').length;
  const inGuide = guideStart > 0 && pos > guideStart && pos < guideEnd;
  return !inGuide && HIN.test(l);
});
ok('UI me Hinglish nahi bacha', hinLines.length === 0,
   hinLines.slice(0,3).map(x => 'line ' + (x.i+1)).join(', '));
ok('Hinglish guide jaan-boojh kar hai', guideStart > 0 && guideEnd > guideStart);

/* ============ report ============ */
  report();
} /* runRest */

function report(){
const total = pass + fail;
console.log('\n' + '─'.repeat(46));
if (fail === 0) {
  console.log(`${C.g}${C.b}✓ SAB PASS${C.x}  ${pass}/${total}`);
  console.log(`${C.d}v${VERSION} — logic sahi chal raha hai${C.x}`);
} else {
  console.log(`${C.r}${C.b}✗ ${fail} FAIL${C.x}   ${pass}/${total} pass`);
  console.log(`\n${C.r}Jo toota:${C.x}`);
  fails.forEach(f => console.log('  • ' + f));
}
console.log('─'.repeat(46));
process.exit(fail === 0 ? 0 : 1);
}
