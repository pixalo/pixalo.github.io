/**
 * Copyright (c) 2025 Pixalo
 * @Repository: https://github.com/pixalo
 * @License: MIT
 */

const previewListCodes = [
    `const game = new Pixalo('#canvas', {
    fps    : 60,
    width  : window.innerWidth,
    height : window.innerHeight,
    quality: window.devicePixelRatio
});

game.start();
`,
    `game.timeout(() => {
    game.log('I was executed after 1 second.');
}, 1000);

game.timer(() => {
    game.log('Every 2 seconds');
}, 2000);

game.updateTimers(() => {
    game.log('I was executed after 1 second.');
}, 1000);

await game.delay(5000);
`,
    `game.on('start', () => {
    console.log('Game started!');
});
game.start();

game.on('stop', () => {
    console.log('Game stopped!');
});
game.stop();

game.on('reset', () => {
    console.log('The game was reset.');
});
game.reset();
`,
    `const shot = game.shot({
    format  : 'jpeg',
    quality : 1,
    download: true,
    filename: 'game-screenshot'
});

game.log('Result', shot);
shot.revoke();
`,
    `const results = await game.wait(
    game.delay(1000),
    game.loadAsset(
        'image', 'player', 'player.png'
    ),
    game.loadAsset('audio', 'bgm', 'music.mp3'),
);
`,
    `game.on('resize', () => {
    player.style({
        x: (game.baseWidth - player.width) / 2,
        y: (game.baseHeight - player.height) / 2
    });
});`
];
let currentPreviewCode = -1;

const OWNER  = 'pixalo';
const REPO   = 'pixalo';
const BRANCH = 'main';

function nextPreviewCode () {
    currentPreviewCode++;
    if (currentPreviewCode >= previewListCodes.length) currentPreviewCode = 0;
    return currentPreviewCode;
}

function renderRandomPreviewCode () {
    const $codebox = $('#main-codebox');
    if (!$codebox.length) return;

    const nextCode = nextPreviewCode();
    const highlightedCode = hljs.highlight(previewListCodes[nextCode], { language: 'javascript' }).value;

    $codebox.html(`<pre><code class="language-javascript">${highlightedCode}</code></pre>`);
    hljs.lineNumbersBlock($codebox.find('code').get(0));

    requestAnimationFrame(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        $codebox.animate({ scrollTop: $codebox.height() }, {
            duration: 2000,
            async complete () {
                await new Promise(resolve => setTimeout(resolve, 2000));
                $codebox.animate({ scrollTop: 0 }, {
                    duration: 500,
                    complete: () => setTimeout(renderRandomPreviewCode, 2000)
                });
            }
        });
    });
}

function playGames () {
    const params = new URLSearchParams(location.search);
    const play   = params.get('play');
    const iframe = $('#play-game');
    if (!play) {
        iframe.replaceWith(`<div class="container">
            <div class="empty-state">Missing <code>?play=…</code> parameter.</div>
        </div>`);
        return;
    }
    iframe.attr('src', play);
}

async function fetchPath (path = '') {
    const url = `https://api.pixalo.xyz/gh/${path}?ref=${BRANCH}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    return res.json();
}

async function fetchFile (download_url) {
    const res = await fetch(download_url);
    if (!res.ok) throw new Error(res.status);
    return res.text();
}

function sortFolderFirst (a, b) {
    if (a.type === 'dir' && b.type !== 'dir') return -1;
    if (a.type !== 'dir' && b.type === 'dir') return 1;
    return a.name.localeCompare(b.name);
}

function buildTree (list, $parent) {
    list.sort(sortFolderFirst);
    list.forEach(item => {
        if (item.name === 'assets' || item.name === 'games') return;

        const $li = $(`<li></li>`);
        const extension = item.name.slice(item.name.lastIndexOf('.') + 1);
        const niceName  = item.name.replace('.' + extension, '').replace(/^./, m => m.toUpperCase());
        const $span = $(`<span data-path="${item.path}" data-type="${item.type}" data-extension="${extension}" data-html-url="${item.html_url}">${niceName}</span>`);

        if (item.type === 'dir') $span.prepend('<i class="caret"></i>');
        $li.append($span);
        $parent.append($li);

        if (item.type === 'dir') {
            const $ul = $(`<ul style="display:none"></ul>`);
            $li.append($ul);
        }
    });
}

function renderExampleCode (code, extension, filePath) {
    const folderPath = filePath.split('/').slice(0, -1).join('/');
    const hasHtmlFileInFolder = $(`#tree span[data-path^="${folderPath}/"][data-extension="html"]`).length > 0;
    const allowPreview = extension === 'html' || !hasHtmlFileInFolder;

    let tabsHTML = `<div class="tab-buttons">
    <button class="tab-btn active" data-tab="code">Code</button>`;
    if (allowPreview)
        tabsHTML += `<button class="tab-btn" data-tab="preview">Preview</button>`;
    tabsHTML += `</div>`;

    const cleaned = code.replace(/\/\*\*\s*\*\s*Copyright \(c\)[\s\S]*?\*\/\s*/, '').trim();
    const highlightedCode = hljs.highlight(cleaned, {language: extension}).value;

    const $docBody = $(`${tabsHTML}
    <div class="tab-container mt-10">
        <div class="tab-content active" id="code">
            <div class="doc-code" id="exampleCode"></div>
        </div>
        ${allowPreview ? '<div class="tab-content" id="preview"></div>' : ''}
    </div>`);

    $docBody.find('.tab-btn').on('click', function () {
        const tab = $(this).data('tab');

        $('.tab-btn').removeClass('active');
        $('.tab-content').removeClass('active');
        $(this).addClass('active');
        $(`#${tab}`).addClass('active');

        destroyPreviewResources();

        if (tab === 'preview') {
            handlePreviewCode($docBody, code, extension);
        }
    });

    $('.doc-body').html($docBody);
    $('#exampleCode').html(`<pre><code class="language-${extension}">${highlightedCode}</code></pre>`);
    hljs.lineNumbersBlock($('#exampleCode').find('code').get(0));
}
function handlePreviewCode ($docBody, code, extension) {
    const $container = $docBody.find('#preview').empty();
    let html = extension !== 'html' && extension === 'js' ? `<!doctype html>
<html><head><meta charset="utf-8"><style>body,html{margin:0;width:100%;height:100%;overflow:hidden}canvas{display:block;width:100%;height:100%}</style></head>
<body><canvas id="canvas"></canvas><script type="module">${code}<\/script></body></html>` : code;

    const blob = new Blob([html], {type:'text/html'});
    const url = URL.createObjectURL(blob);
    $container.html(`<iframe id="preview-example" src="${url}" style="width:100%;height:100%;border:none"></iframe>`);
}

function destroyPreviewResources () {
    const $iframe = $('#preview-example');
    if ($iframe.length) {
        const src = $iframe.attr('src');
        if (src && src.startsWith('blob:')) URL.revokeObjectURL(src);
        $iframe.remove();
    }
}

// Main Codes
$(document).ready(function () {
    renderRandomPreviewCode();

    if ($('#play-game').length)
        playGames();

    $('#toggle-menu').click(function () {
        $('#mb-menu').toggleClass('opened');
        $(this).toggleClass('opened');
    });

    $('#back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 1000);
    });
});

// Documents
$(document).ready(function () {
    const $docsWrapper  = $('.docs-wrapper');
    if (!$docsWrapper.length) return;

    const MODE = $docsWrapper.data('mode');
    const PATH = 'examples';

    (async () => {
        try {
            const rootList = await fetchPath(PATH);
            $('.tree-loader').remove();
            buildTree(rootList, $('#tree > ul'));
        } catch (e) {
            console.error(e);
            $('.tree-loader').html('<li class="failed-tree">Failed to load tree</li>');
        }
    })();

    $('#tree').on('click', 'span[data-type="dir"]', async function (e) {
        e.stopPropagation();
        const $span  = $(this);
        const $caret = $span.find('.caret');
        const $ul    = $span.next('ul');
        const path   = $span.data('path');

        if ($ul.hasClass('loaded')) {
            $caret.toggleClass('open');
            $ul.slideToggle(200);
            return;
        }

        $caret.hide().after(`<i class="loader"></i>`);
        try {
            const list = await fetchPath(path);
            buildTree(list, $ul);
            $ul.addClass('loaded');
            $caret.addClass('open');
            $ul.slideDown(200);
        } catch (err) {
            console.error(err);
        } finally {
            $span.find('.loader').remove();
            $caret.show();
        }
    });
    $('#tree').on('click', 'span[data-type="file"]', async function () {
        const $this = $(this);
        $('#tree span').removeClass('active');
        $this.addClass('active');

        const url  = $this.data('path');
        const name = $this.text();
        const html_url  = $this.data('html-url');
        const extension = $this.data('extension');

        $('.doc-header').html(`
            <div>
                <h2 id="exampleTitle">${name}</h2>
            </div>
            <div>
                <a href="${html_url}" target="_blank" class="glass-morphism button cl-white flex align-items align-center gap-10 font-13" style="padding: 0 15px;">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M10 1.25C5.16562 1.25 1.25 5.16562 1.25 10C1.25 13.8719 3.75469 17.1422 7.23281 18.3016C7.67031 18.3781 7.83437 18.1156 7.83437 17.8859C7.83437 17.6781 7.82344 16.9891 7.82344 16.2563C5.625 16.6609 5.05625 15.7203 4.88125 15.2281C4.78281 14.9766 4.35625 14.2 3.98438 13.9922C3.67812 13.8281 3.24063 13.4234 3.97344 13.4125C4.6625 13.4016 5.15469 14.0469 5.31875 14.3094C6.10625 15.6328 7.36406 15.2609 7.86719 15.0312C7.94375 14.4625 8.17344 14.0797 8.425 13.8609C6.47813 13.6422 4.44375 12.8875 4.44375 9.54062C4.44375 8.58906 4.78281 7.80156 5.34062 7.18906C5.25313 6.97031 4.94687 6.07344 5.42812 4.87031C5.42812 4.87031 6.16094 4.64063 7.83437 5.76719C8.53438 5.57031 9.27813 5.47187 10.0219 5.47187C10.7656 5.47187 11.5094 5.57031 12.2094 5.76719C13.8828 4.62969 14.6156 4.87031 14.6156 4.87031C15.0969 6.07344 14.7906 6.97031 14.7031 7.18906C15.2609 7.80156 15.6 8.57812 15.6 9.54062C15.6 12.8984 13.5547 13.6422 11.6078 13.8609C11.925 14.1344 12.1984 14.6594 12.1984 15.4797C12.1984 16.65 12.1875 17.5906 12.1875 17.8859C12.1875 18.1156 12.3516 18.3891 12.7891 18.3016C14.5261 17.7152 16.0355 16.5988 17.1048 15.1096C18.1741 13.6204 18.7495 11.8333 18.75 10C18.75 5.16562 14.8344 1.25 10 1.25Z"></path></svg>
                    Show in GitHub
                </a>
            </div>
        `);
        $('#exampleCode').text('');
        $('#guide-doc').remove();

        const $caret = $this.find('.caret');
        $caret.hide();
        $this.prepend(`<i class="loader"></i>`);

        try {
            const content = await fetchFile(`https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${url}`);

            destroyPreviewResources();

            if (MODE === 'examples') {
                renderExampleCode(content, extension, url);
            }
        } catch (err) {
            $('#exampleDesc').text('File not found');
            $('#exampleCode').text('// ' + err);
        } finally {
            $this.find('.loader').remove();
            $caret.show();
        }
    });
});