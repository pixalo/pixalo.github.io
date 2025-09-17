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

// Add timer - runs every 2 seconds
game.timer(() => {
    game.log('Every 2 seconds');
}, 2000);

game.updateTimers(() => {
    game.log('I was executed after 1 second.');
}, 1000);

await game.delay(5000);
`,
`// Start Game
game.on('start', () => {
    console.log('Game started!');
});
game.start();

// Stop Game
game.on('stop', () => {
    console.log('Game stopped!');
});
game.stop();

// Resets the engine state, clearing all entities, events, and timers.
game.on('reset', () => {
    console.log('The game was reset.');
});
game.reset();`,
`// High quality JPEG with download
const shot = game.shot({
    format  : 'jpeg',
    quality : 1,
    download: true,
    filename: 'game-screenshot'
});

game.log('Result', shot);

// Clean up blob URL when done
shot.revoke();
`,
`// Wait for multiple asset loads
const results = await game.wait(
    game.delay(1000),
    game.loadAsset(
        'image', 'player', 'player.png'
    ),
    game.loadAsset('audio', 'bgm', 'music.mp3'),
);`,
`// Responsive
game.on('resize', () => {
    player.style({
        x: (game.baseWidth - player.width) / 2,
        y: (game.baseHeight - player.height) / 2
    });
});`
];
let currentPreviewCode = -1;

function nextPreviewCode () {
    currentPreviewCode++;

    if (currentPreviewCode >= previewListCodes.length)
        currentPreviewCode = 0;

    return currentPreviewCode;
}
function renderRandomPreviewCode () {
    const $codebox = $('#main-codebox');
    const nextCode = nextPreviewCode();
    const highlightedCode = hljs.highlight(previewListCodes[nextCode], {
        language: 'javascript'
    }).value;

    $codebox.html(`<pre><code class="language-javascript">${highlightedCode}</code></pre>`);

    const $code = $codebox.find('code');
    const code  = $code.get(0);

    hljs.lineNumbersBlock(code);

    requestAnimationFrame(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        $codebox.animate({
            scrollTop: $codebox.height()
        }, {
            duration: 2000,
            async complete () {
                await new Promise(resolve => setTimeout(resolve, 2000));
                $codebox.animate({scrollTop: 0}, {
                    duration: 500,
                    complete: () => setTimeout(
                        renderRandomPreviewCode, 2000
                    )
                });
            }
        });
    });
}

$(document).ready(function () {
    renderRandomPreviewCode();

    $('#toggle-menu').click(function () {
        const menu = $('#mb-menu');

        menu.toggleClass("opened");
        $(this).toggleClass("opened");
    });

    $('#back-to-top').click(function () {
        $('body').animate({
            scrollTop: 0
        }, 1000)
    });
});