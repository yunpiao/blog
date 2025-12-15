// 隐藏彩蛋入口 - Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A
(function() {
  const sequence = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
  ];
  let pos = 0;

  document.addEventListener('keydown', function(e) {
    // 忽略输入框内的按键
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) {
      return;
    }

    if (e.code === sequence[pos]) {
      pos++;
      if (pos === sequence.length) {
        pos = 0;
        window.location.href = '/__typing__/';
      }
    } else {
      pos = 0;
    }
  });
})();
