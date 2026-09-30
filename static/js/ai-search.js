const chat = document.getElementById("blog-ai-chat");
const status = document.getElementById("ai-search-status");
const error = document.getElementById("ai-search-error");
const retry = document.getElementById("ai-search-retry");
const examples = document.getElementById("ai-search-examples");

const translations = {
    loadingAriaLabel: "正在加载",
    errorPrefix: "请求失败：",
    chatTitle: "问问博客",
    chatPlaceholder: "输入你想了解的问题…",
    chatInputAriaLabel: "你的问题",
    sendButtonLabel: "提问",
    sendButtonAriaLabel: "提交问题",
    chatEmptyTitle: "你想了解什么？",
    chatEmptyDescription: "试试上方的问题，或输入自己的问题，从博客文章中寻找答案。",
    userAvatar: "你",
    assistantAvatar: "AI",
    unknownError: "搜索服务暂时不可用，请稍后重新提问。",
    clearHistoryAriaLabel: "清空当前对话",
    closeAriaLabel: "关闭",
    historyTitle: "最近的对话",
    newChatButton: "新对话",
    clearChatButton: "清空对话",
    toggleSidebarTitle: "展开或收起对话列表",
    deleteChatTitle: "删除这段对话",
    noChatsYet: "还没有对话",
    yesterday: "昨天",
    justNow: "刚刚",
    minuteAgo: "{n} 分钟前",
    minutesAgo: "{n} 分钟前",
    hourAgo: "{n} 小时前",
    hoursAgo: "{n} 小时前",
    poweredBy: "技术支持",
    loadingMessages: ["正在查找相关文章…", "正在阅读文章内容…", "正在整理回答…"],
};

async function initialize() {
    error.hidden = true;
    status.hidden = false;
    retry.disabled = true;
    let timer;

    try {
        const endpoint = new URL(chat.getAttribute("api-url"));
        if (endpoint.protocol !== "https:" || !/^[a-z0-9-]+\.search\.ai\.cloudflare\.com$/.test(endpoint.hostname)) {
            throw new Error("Invalid AI Search endpoint");
        }
        const moduleURL = new URL("/assets/v0.0.43/search-snippet.chat.es.js", endpoint);
        await Promise.race([
            import(moduleURL.href),
            new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error("AI Search component load timeout")), 15000);
            }),
        ]);
        if (!customElements.get("chat-page-snippet")) {
            throw new Error("AI Search component was not registered");
        }
        chat.translations = translations;
        chat.chatQueryRewrite = { enabled: false };
        // 固定版本的聊天组件有 280px 侧栏，小屏只保留当前对话。
        const responsiveStyle = document.createElement("style");
        responsiveStyle.textContent = `
            @media (max-width: 768px) {
                .chat-sidebar, .toggle-sidebar-button { display: none; }
                .chat-page-header { gap: 0.5rem; }
                .chat-page-header-actions .clear-button { font-size: 0.875rem; padding: 0.5rem; }
                .chat-page-header-actions .clear-button svg { width: 20px; height: 20px; }
            }
        `;
        chat.shadowRoot.append(responsiveStyle);
        chat.hidden = false;
        examples.hidden = false;
        status.hidden = true;
    } catch (cause) {
        console.error("AI Search component could not be loaded", cause);
        status.hidden = true;
        error.hidden = false;
    } finally {
        clearTimeout(timer);
        retry.disabled = false;
    }
}

retry.addEventListener("click", () => window.location.reload());
examples.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-question]");
    if (!button) return;
    const buttons = examples.querySelectorAll("button");
    buttons.forEach((item) => { item.disabled = true; });
    try {
        await chat.sendMessage(button.dataset.question);
    } finally {
        buttons.forEach((item) => { item.disabled = false; });
    }
});

initialize();
