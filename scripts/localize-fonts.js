// Parse Google Fonts CSS, download woff2 files locally, emit app/fonts.css
const fs = require("fs");
const path = require("path");

const css = fs.readFileSync("/tmp/bvp.css", "utf8");
const outDir = "/home/z/my-project/public/fonts";
fs.mkdirSync(outDir, { recursive: true });

// blocks look like: /* subset */\n@font-face { ... font-weight: 400; ... url(...woff2) ... unicode-range: ...; }
const re = /\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]+)\}/g;
let m, blocks = [];
while ((m = re.exec(css))) {
  const subset = m[1];
  const body = m[2];
  const weight = (body.match(/font-weight:\s*(\d+)/) || [])[1];
  const url = (body.match(/url\((https:[^)]+\.woff2)\)/) || [])[1];
  const urange = (body.match(/unicode-range:\s*([^;]+);/) || [])[1];
  if (weight && url) blocks.push({ subset, weight, url, urange });
}
console.log("parsed blocks:", blocks.length);

const outCss = [];
let done = 0;
const jobs = blocks.map((b) => {
  const fname = `be-vietnam-pro-${b.weight}-${b.subset}.woff2`;
  return fetch(b.url)
    .then((r) => r.arrayBuffer())
    .then((buf) => {
      fs.writeFileSync(path.join(outDir, fname), Buffer.from(buf));
      done++;
      outCss.push(
        `/* ${b.subset} */\n` +
        `@font-face {\n` +
        `  font-family: "Be Vietnam Pro";\n` +
        `  font-style: normal;\n` +
        `  font-display: swap;\n` +
        `  font-weight: ${b.weight};\n` +
        `  src: url("/fonts/${fname}") format("woff2");\n` +
        (b.urange ? `  unicode-range: ${b.urange};\n` : "") +
        `}\n`
      );
    });
});

Promise.all(jobs).then(() => {
  fs.writeFileSync("/home/z/my-project/app/fonts.css", outCss.join("\n"));
  console.log(`downloaded ${done} files, wrote app/fonts.css`);
  const sizes = fs.readdirSync(outDir).map((f) => fs.statSync(path.join(outDir, f)).size);
  console.log("total font bytes:", sizes.reduce((a, b) => a + b, 0));
});
