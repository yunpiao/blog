/**
 * ------------------------------------------------------------------
 * Canvas 交互式网格 (High DPI / Retina Ready)
 * ------------------------------------------------------------------
 * 升级点：
 * 1. 修复了旋转容器导致的鼠标坐标偏移问题 (使用 offsetX/Y)。
 * 2. 保持高分屏 (Retina) 适配。
 * ------------------------------------------------------------------
 */
(function () {
  'use strict';

  function initInteractiveCanvasGrid() {
    const canvas = document.getElementById('interactive-canvas');
    const container = document.getElementById('canvas-container');
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let points = [];
    let mouse = { x: -1000, y: -1000 };

    // 配置参数
    const gap = 32; // 点间距
    const dotRadius = 3;
    const maxDist = 280;
    const maxLen = 24;

    // 初始化画布尺寸 (处理 Retina 屏幕)
    function initCanvas() {
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      // 获取设备像素比 (例如 Retina 屏是 2)
      const dpr = window.devicePixelRatio || 1;

      // 设置 Canvas 的内部物理分辨率 (width/height 属性)
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      // 设置 CSS 显示尺寸 (style 属性)
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      // 缩放绘图上下文，这样我们在绘制时可以继续使用 CSS 像素单位
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // 重新生成点阵
      points = [];
      // 稍微多生成一点覆盖旋转带来的空白边缘
      const cols = Math.floor(width / gap) + 4;
      const rows = Math.floor(height / gap) + 4;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * gap - 20; // 稍微偏移起始点
          const y = r * gap - 20;
          // 生成渐变色
          const hue = 190 + (c / cols) * 100;
          points.push({
            x: x,
            y: y,
            color: 'hsl(' + hue + ', 90%, 60%)'
          });
        }
      }
    }

    // 渲染循环
    function render() {
      const width = parseFloat(canvas.style.width);
      const height = parseFloat(canvas.style.height);

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        // 计算鼠标距离
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let len = 0;
        let angle = 0;
        let alpha = 0.6;

        // 交互计算
        if (dist < maxDist) {
          const factor = Math.pow((maxDist - dist) / maxDist, 2.5);
          len = factor * maxLen;
          angle = Math.atan2(dy, dx);
          alpha = 0.5 + factor * 0.5;
        }

        // 绘制
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;

        ctx.beginPath();
        // 左半圆
        ctx.arc(-len / 2, 0, dotRadius, Math.PI * 0.5, Math.PI * 1.5);
        // 右半圆
        ctx.arc(len / 2, 0, dotRadius, Math.PI * -0.5, Math.PI * 0.5);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    }

    // 初始化
    initCanvas();
    render();

    // 事件监听
    function handleResize() {
      initCanvas();
    }

    function handleMouseMove(e) {
      // 获取 Canvas 在视口中的位置和尺寸
      const rect = canvas.getBoundingClientRect();
      
      // 计算鼠标相对于 Canvas 中心的位置
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      // 由于容器旋转了 -12deg，我们需要将鼠标坐标反向旋转 +12deg
      // 这样才能得到相对于 Canvas 内部坐标系的正确位置
      const angle = 12 * Math.PI / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // 旋转矩阵变换
      const rotatedX = mouseX * cos - mouseY * sin;
      const rotatedY = mouseX * sin + mouseY * cos;

      // 转换回相对于 Canvas 左上角的坐标
      // 注意：我们之前初始化 Canvas 时使用了 offsetWidth/Height，那些是未旋转时的尺寸
      // 这里的 rect.width/height 是旋转后的包围盒尺寸，不太准确。
      // 我们应该直接使用 canvas.offsetWidth/Height (未旋转的 CSS 尺寸)
      const cssWidth = canvas.offsetWidth;
      const cssHeight = canvas.offsetHeight;

      mouse.x = rotatedX + cssWidth / 2;
      mouse.y = rotatedY + cssHeight / 2;
    }

    function handleMouseLeave() {
      mouse.x = -1000;
      mouse.y = -1000;
    }

    window.addEventListener('resize', handleResize);
    // 监听 window 而不是 canvas，这样即使被遮挡也能响应
    window.addEventListener('mousemove', handleMouseMove);
    
    // 可以在鼠标移出窗口时重置
    document.addEventListener('mouseleave', handleMouseLeave);

    // 清理函数
    window.cleanupInteractiveCanvasGrid = function () {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInteractiveCanvasGrid);
  } else {
    initInteractiveCanvasGrid();
  }
})();
