document.addEventListener('DOMContentLoaded', function() {
    // 为每个代码块添加复制按钮
    document.querySelectorAll('pre').forEach(function(block) {
        // 创建复制按钮容器
        var buttonContainer = document.createElement('div');
        buttonContainer.className = 'copy-button-container';
        
        // 创建复制按钮
        var button = document.createElement('button');
        button.className = 'copy-button';
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        
        // 添加点击事件
        button.addEventListener('click', function() {
            var code = block.querySelector('code') || block;
            var text = code.innerText;
            
            // 创建临时文本区域
            var textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                // 执行复制
                document.execCommand('copy');
                // 更新按钮状态
                button.classList.add('copied');
                button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                
                // 2秒后恢复原状
                setTimeout(function() {
                    button.classList.remove('copied');
                    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
                }, 2000);
            } catch (err) {
                console.error('复制失败:', err);
            }
            
            // 移除临时文本区域
            document.body.removeChild(textArea);
        });
        
        // 将按钮添加到代码块
        buttonContainer.appendChild(button);
        block.appendChild(buttonContainer);
    });
});
