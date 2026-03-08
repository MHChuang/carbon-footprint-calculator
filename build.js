// ============================================================
// 建置腳本 — 編譯 JSX、壓縮 JS/CSS，輸出至 dist/
// ============================================================

const fs = require('fs');
const path = require('path');

async function build() {
    const distDir = path.join(__dirname, 'dist');

    // 建立 dist 結構
    const dirs = ['dist', 'dist/js', 'dist/css'];
    dirs.forEach(d => {
        const p = path.join(__dirname, d);
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    });

    console.log('📦 開始建置...');

    // --- 1. 編譯 JSX → JS ---
    console.log('  ⚙️  編譯 JSX...');
    const babel = require('@babel/core');
    const jsxSource = fs.readFileSync(path.join(__dirname, 'js', 'App.jsx'), 'utf8');
    const babelResult = babel.transformSync(jsxSource, {
        presets: ['@babel/preset-react'],
        filename: 'App.jsx'
    });
    let compiledJS = babelResult.code;

    // --- 2. 壓縮 JS (config.js + App.js) ---
    console.log('  ⚙️  壓縮 JavaScript...');
    const { minify } = require('terser');

    const configSource = fs.readFileSync(path.join(__dirname, 'js', 'config.js'), 'utf8');
    const configMin = await minify(configSource, {
        compress: { drop_console: true },
        mangle: true,
        output: { comments: false }
    });
    fs.writeFileSync(path.join(distDir, 'js', 'config.js'), configMin.code);

    const appMin = await minify(compiledJS, {
        compress: { drop_console: true },
        mangle: true,
        output: { comments: false }
    });
    fs.writeFileSync(path.join(distDir, 'js', 'App.js'), appMin.code);

    // --- 3. 壓縮 CSS ---
    console.log('  ⚙️  壓縮 CSS...');
    const CleanCSS = require('clean-css');
    const cssSource = fs.readFileSync(path.join(__dirname, 'css', 'style.css'), 'utf8');
    const cssMin = new CleanCSS({ level: 2 }).minify(cssSource);
    fs.writeFileSync(path.join(distDir, 'css', 'style.css'), cssMin.styles);

    // --- 4. 生成部署用 index.html (移除 Babel，改載入編譯後的 JS) ---
    console.log('  ⚙️  生成 index.html...');
    const deployHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>旅遊碳足跡計算系統 | 國家公園低碳生態旅遊</title>
    <meta name="description" content="國家公園低碳生態旅遊碳足跡計算系統，依據四大類型碳足跡計算模組，模擬計算遊程碳排放量與低碳評等。">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>
</head>
<body>
    <div id="root"><\/div>
    <script src="js/config.js"><\/script>
    <script src="js/App.js"><\/script>
</body>
</html>`;
    fs.writeFileSync(path.join(distDir, 'index.html'), deployHtml);

    console.log('✅ 建置完成！輸出至 dist/ 目錄');
    console.log(`   dist/index.html`);
    console.log(`   dist/css/style.css (${(cssMin.styles.length / 1024).toFixed(1)} KB)`);
    console.log(`   dist/js/config.js  (${(configMin.code.length / 1024).toFixed(1)} KB)`);
    console.log(`   dist/js/App.js     (${(appMin.code.length / 1024).toFixed(1)} KB)`);
}

build().catch(err => {
    console.error('❌ 建置失敗:', err);
    process.exit(1);
});
