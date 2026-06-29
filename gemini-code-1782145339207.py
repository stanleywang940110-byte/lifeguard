import re

# 讀取 HTML
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

left_svg = '''
                            <svg class="wt-waves" width="40" height="40" viewBox="0 0 100 100">
                                <circle cx="50" cy="80" r="5" fill="currentColor" class="wave wave-0" />
                                <path d="M 30 65 Q 50 45 70 65" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" class="wave wave-1" />
                                <path d="M 15 50 Q 50 15 85 50" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" class="wave wave-2" />
                                <path d="M 0 35 Q 50 -15 100 35" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" class="wave wave-3" />
                            </svg>
                            <svg viewBox="0 0 60 140" width="45" height="110">
                                <rect x="25" y="0" width="10" height="35" rx="3" fill="#1a1a1a" />
                                <rect x="23" y="10" width="14" height="4" fill="#333" />
                                <rect x="42" y="15" width="12" height="10" rx="2" fill="#2a2a2a" />
                                <rect x="5" y="25" width="50" height="115" rx="8" fill="#222" stroke="#111" stroke-width="2"/>
                                <rect x="12" y="35" width="36" height="20" rx="3" fill="#0f172a" />
                                <text x="30" y="50" font-family="monospace" font-size="10" fill="#4da6ff" text-anchor="middle" font-weight="bold">CH.1</text>
                                <rect x="-2" y="45" width="7" height="25" rx="2" fill="#4da6ff" />
                                <line x1="20" y1="70" x2="40" y2="70" stroke="#111" stroke-width="3" stroke-linecap="round" />
                                <line x1="16" y1="80" x2="44" y2="80" stroke="#111" stroke-width="3" stroke-linecap="round" />
                                <line x1="16" y1="90" x2="44" y2="90" stroke="#111" stroke-width="3" stroke-linecap="round" />
                                <line x1="20" y1="100" x2="40" y2="100" stroke="#111" stroke-width="3" stroke-linecap="round" />
                                <rect x="15" y="125" width="30" height="15" rx="2" fill="#151515" />
                            </svg>
'''

right_svg = '''
                            <svg class="wt-waves" viewBox="0 0 100 100" width="28" height="28" xmlns="http://www.w3.org/2000/svg" style="color: #ff9632;">
                                <path class="wave wave-3" d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round"/>
                                <path class="wave wave-2" d="M 30 70 A 20 20 0 0 1 70 70" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round"/>
                                <circle class="wave wave-1" cx="50" cy="90" r="10" fill="currentColor"/>
                            </svg>
                            <svg viewBox="0 0 100 250" width="45" height="110" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.5));">
                                <rect x="28" y="10" width="8" height="15" rx="2" fill="#333" />
                                <rect x="30" y="25" width="4" height="25" fill="#222" />
                                <rect x="65" y="30" width="16" height="14" rx="3" fill="#2a2a2a" />
                                <rect x="68" y="28" width="10" height="4" fill="#111" />
                                <rect x="15" y="50" width="70" height="180" rx="6" fill="#1e1e1e" stroke="#111" stroke-width="2"/>
                                <rect x="9" y="80" width="10" height="40" rx="3" fill="#ff9632" />
                                <rect x="25" y="65" width="50" height="35" rx="4" fill="#0f172a" />
                                <text x="50" y="88" font-family="monospace" font-size="16" fill="#ff9632" text-anchor="middle" font-weight="bold">CH.2</text>
                                <rect x="34" y="120" width="36" height="4" rx="1" fill="#000" />
                                <rect x="34" y="128" width="36" height="4" rx="1" fill="#000" />
                                <rect x="34" y="136" width="36" height="4" rx="1" fill="#000" />
                                <rect x="34" y="144" width="36" height="4" rx="1" fill="#000" />
                                <rect x="34" y="152" width="36" height="4" rx="1" fill="#000" />
                                <rect x="34" y="160" width="36" height="4" rx="1" fill="#000" />
                                <rect x="34" y="168" width="36" height="4" rx="1" fill="#000" />
                                <rect x="28" y="190" width="48" height="40" rx="3" fill="#2a2a2a" />
                                <rect x="30" y="192" width="44" height="36" rx="2" fill="#1a1a1a" />
                                <path d="M 35 195 L 69 195 C 72 195 72 225 69 225 L 35 225 C 32 225 32 195 35 195" fill="#222" />
                            </svg>
'''

new_structure = f'''
                <div class="fixed-avatar avatar-left">
                    <div class="wt-avatar msg-left">
                        {left_svg}
                    </div>
                </div>
                <div class="fixed-avatar avatar-right">
                    <div class="wt-avatar msg-right">
                        {right_svg}
                    </div>
                </div>

                <div class="chat-flow">
                    <div class="chat-row msg-left msg-step-1">
                        <div class="wt-bubble">總部，前方發現有泳客溺水！</div>
                    </div>
                    <div class="chat-row msg-right msg-step-3">
                        <div class="wt-bubble">收到，已通報支援。</div>
                    </div>
                    <div class="chat-row msg-left msg-step-2">
                        <div class="wt-bubble">注意看他已經在往外漂了！</div>
                    </div>
                    <div class="chat-row msg-right msg-step-4">
                        <div class="wt-bubble">那邊有流，他會一直出去啦！請盡速救援！</div>
                    </div>
                </div>
'''

# 精確替換 walkie-talkie-container 內部的內容，絕不跨越到外部的 </section>
pattern = re.compile(r'<div class="walkie-talkie-container">.*?</div>', re.DOTALL)
new_html = pattern.sub(f'<div class="walkie-talkie-container">{new_structure}</div>', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print('Index HTML replaced safely.')

# 處理 CSS
with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# 移除舊的樣式
css = re.sub(r'\.wt-message\s*\{[\s\S]*?\}\s*', '', css)
css = re.sub(r'\.wt-message\.msg-left\s*\{[\s\S]*?\}\s*', '', css)
css = re.sub(r'\.wt-message\.msg-right\s*\{[\s\S]*?\}\s*', '', css)

new_css_rules = '''
.fixed-avatar {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0;
    animation: wtFadeInSlide 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.avatar-left { left: 5%; animation-delay: 1s; }
.avatar-right { right: 5%; animation-delay: 2.5s; }

.chat-flow {
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 65%;
    max-width: 450px;
    z-index: 2;
}

.chat-row {
    display: flex;
    opacity: 0;
    animation: wtFadeInSlide 0.5s ease-out forwards;
}

.chat-row.msg-left { justify-content: flex-start; }
.chat-row.msg-right { justify-content: flex-end; }

/* 訊息時間軸延遲 */
.msg-step-1 { animation-delay: 1.5s; }
.msg-step-2 { animation-delay: 3.0s; }
.msg-step-3 { animation-delay: 4.5s; }
.msg-step-4 { animation-delay: 6.0s; }
'''

if '.fixed-avatar' not in css:
    css += "\n" + new_css_rules

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print('Style CSS updated.')