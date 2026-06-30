document.addEventListener('DOMContentLoaded', () => {
    // 取得所有的導航按鈕與畫面
    const navButtons = document.querySelectorAll('.nav-btn');
    const screens = document.querySelectorAll('.screen');
    let previousScreenId = '';
    let riverDualChannelLastTransitionTime = 0;
    let riverBottomScrollDelta = 0;
    let riverBottomTouchCount = 0;
    let riverTextLastTransitionTime = 0;
    let riverText2LastTransitionTime = 0;
    let compareStep = 0;
    let updateCompareCards = null;
    let outro1Throttle = 0;
    let outro2Throttle = 0;
    let outro3Throttle = 0;

    // 切換畫面的核心函數
    function navigateToScreen(targetId) {
        const targetScreen = document.getElementById(targetId);

        if (!targetScreen) {
            console.error(`找不到目標畫面: ${targetId}`);
            return;
        }

        if (targetScreen.classList.contains('active')) return;

        const currentActiveScreens = document.querySelectorAll('.screen.active');
        if (currentActiveScreens.length > 0) {
            previousScreenId = currentActiveScreens[0].id;
        }

        // 將目標畫面放在最上層並開始淡入
        targetScreen.style.zIndex = '15';
        targetScreen.classList.add('active');

        // 將原本的畫面維持在底層，延遲 800ms (等同 CSS 過場時間) 後再移除
        // 這樣能達成完美無縫交疊淡入淡出，不漏黑底
        currentActiveScreens.forEach(screen => {
            if (screen.id !== targetId) {
                screen.style.zIndex = '5';
                setTimeout(() => {
                    screen.classList.remove('active');
                    screen.style.zIndex = '';
                    if (targetScreen.style.zIndex === '15') targetScreen.style.zIndex = '';
                }, 800);
            }
        });

        // 針對各國比較選單設定初始步數，若從後面文字頁回退則設為最末步，否則為第0步
        if (targetId === 'compare-menu-screen') {
            if (currentActiveScreens.length > 0 && currentActiveScreens[0].id === 'post-compare-text-1') {
                compareStep = 3;
            } else {
                compareStep = 0;
            }
            if (typeof updateCompareCards === 'function') {
                updateCompareCards();
            }
        } else {
            targetScreen.scrollTo(0, 0);
        }

        if (targetId === 'river-dual-channel-screen') {
            riverDualChannelLastTransitionTime = Date.now();
            riverBottomScrollDelta = 0;
            riverBottomTouchCount = 0;
        }

        if (targetId === 'river-text-screen') {
            riverTextLastTransitionTime = Date.now();
        }

        if (targetId === 'river-text-screen-2') {
            riverText2LastTransitionTime = Date.now();
        }

        if (targetId === 'training-outro-screen') {
            outro1Throttle = Date.now();
        }

        if (targetId === 'training-outro-screen-2') {
            outro2Throttle = Date.now();
        }

        if (targetId === 'training-outro-screen-3') {
            outro3Throttle = Date.now();
        }

        if (targetId === 'stats-screen') {
            canScrollFromStats = false;
            drawPieChart();
            setTimeout(() => {
                canScrollFromStats = true;
            }, 2100);
        }
    }

    // 為每個按鈕綁定點擊事件
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.getAttribute('data-target');
            if (targetId) {
                navigateToScreen(targetId);
            }
        });
    });

    // ==========================================
    // ==== 封面頁向下捲動 (進入 POV 影片) ====
    // ==========================================
    const coverScreenObj = document.getElementById('cover-screen');
    if (coverScreenObj) {
        const coverVideo = coverScreenObj.querySelector('.bg-video-cover');
        if (coverVideo) {
            let wasCoverActive = coverScreenObj.classList.contains('active');
            if (wasCoverActive) {
                coverVideo.play().catch(e => console.log("Cover video autoplay blocked:", e));
            }
            const coverObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class') {
                        const isActive = coverScreenObj.classList.contains('active');
                        if (isActive && !wasCoverActive) {
                            coverVideo.currentTime = 0;
                            coverVideo.play().catch(e => console.log("Cover video play blocked:", e));
                        } else if (!isActive && wasCoverActive) {
                            coverVideo.pause();
                        }
                        wasCoverActive = isActive;
                    }
                });
            });
            coverObserver.observe(coverScreenObj, { attributes: true });

            // 影片播放完後直接進入下一頁
            coverVideo.addEventListener('ended', () => {
                if (coverScreenObj.classList.contains('active')) {
                    navigateToScreen('interactive-timeline-screen');
                }
            });
        }

        // 監聽滑鼠滾輪
        coverScreenObj.addEventListener('wheel', (e) => {
            if (e.deltaY > 0 && coverScreenObj.classList.contains('active')) {
                navigateToScreen('interactive-timeline-screen');
            }
        }, { passive: true });

        // 支援手機觸控滑動
        let touchStartY = 0;
        coverScreenObj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        coverScreenObj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            // 如果向上滑動距離超過 50px (代表往下看內容)
            if (touchStartY - touchEndY > 50 && coverScreenObj.classList.contains('active')) {
                navigateToScreen('interactive-timeline-screen');
            }
        }, { passive: true });
    }

    // ==========================================
    // ==== 救生員視角 POV 前導頁向下捲動 (進入 POV 影片) ====
    // ==========================================
    const povIntroScreenObj = document.getElementById('pov-intro-screen');
    if (povIntroScreenObj) {
        povIntroScreenObj.addEventListener('wheel', (e) => {
            if (e.deltaY > 0 && povIntroScreenObj.classList.contains('active')) {
                navigateToScreen('pov-video-screen');
            }
        }, { passive: true });

        let touchStartY = 0;
        povIntroScreenObj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        povIntroScreenObj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            if (touchStartY - touchEndY > 50 && povIntroScreenObj.classList.contains('active')) {
                navigateToScreen('pov-video-screen');
            }
        }, { passive: true });
    }

    // ==========================================
    // ==== 救生員視角 POV 影片邏輯 ====
    // ==========================================
    const povVideoScreen = document.getElementById('pov-video-screen');
    const povVideo = document.getElementById('pov-video');
    const skipPovBtn = document.getElementById('skip-pov-btn');

    if (povVideoScreen && povVideo) {
        let wasPovActive = false;
        const povObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isActive = povVideoScreen.classList.contains('active');
                    if (isActive && !wasPovActive) {
                        // 依照要求，跳過開頭，僅保留環繞海邊的片段 (從 0:03 開始)
                        povVideo.currentTime = 3;
                        povVideo.play().catch(e => console.log("瀏覽器阻擋自動播放:", e));
                    } else if (!isActive && wasPovActive) {
                        povVideo.pause();
                    }
                    wasPovActive = isActive;
                }
            });
        });
        povObserver.observe(povVideoScreen, { attributes: true });

        // 監聽播放時間，到達 12 秒時暫停影片 (切在海的末端再多轉一秒)，等待使用者點擊進入救援
        povVideo.addEventListener('timeupdate', () => {
            if (povVideoScreen.classList.contains('active') && povVideo.currentTime >= 12) {
                povVideo.pause();
                // 已移除自動跳轉，保留讓使用者自行點擊 "進入救援" 按鈕
            }
        });

        // 備用：若影片自然播放完畢，也僅暫停
        povVideo.addEventListener('ended', () => {
            if (povVideoScreen.classList.contains('active')) {
                // 已移除自動跳轉
            }
        });

        // 點擊「進入救援」按鈕可跳過影片
        if (skipPovBtn) {
            skipPovBtn.addEventListener('click', () => {
                navigateToScreen('game-screen');
            });
        }

        // 監聽滑鼠滾輪往上滾以返回前導頁
        povVideoScreen.addEventListener('wheel', (e) => {
            if (e.deltaY < 0 && povVideoScreen.classList.contains('active')) {
                navigateToScreen('pov-intro-screen');
            }
        }, { passive: true });

        // 支援手機觸控往下滑以返回前導頁
        let povTouchStartY = 0;
        povVideoScreen.addEventListener('touchstart', (e) => {
            povTouchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        povVideoScreen.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            // 如果向下滑動距離超過 50px (代表想往上滾回前導頁)
            if (touchEndY - povTouchStartY > 50 && povVideoScreen.classList.contains('active')) {
                navigateToScreen('pov-intro-screen');
            }
        }, { passive: true });
    }

    // ==========================================
    // ==== 點擊小遊戲邏輯 (移植自 immersive-news-swim) ====
    // ==========================================
    const gameScreen = document.getElementById('game-screen');
    const startUI = document.getElementById('start-ui');
    const startBtn = document.getElementById('start-btn');
    const gameUI = document.getElementById('game-ui');
    const beachLayer = document.getElementById('beach-layer');
    const oceanBackground = document.querySelector('.ocean-background');
    const surgeWarning = document.getElementById('surge-warning');
    const progressBar = document.getElementById('progress-bar');
    const distanceText = document.getElementById('distance-text');
    const swimmer = document.getElementById('swimmer');
    const lifesaversContainer = document.getElementById('lifesavers-container');
    const clickEffects = document.getElementById('click-effects');
    const diveSplashContainer = document.getElementById('dive-splash-container');
    const skipBtn = document.getElementById('skip-btn');

    const TARGET_DISTANCE = 100;
    let currentDistance = 0;
    let gameState = 'intro';
    let currentDragInterval = null;
    let lifesaverInterval = null;
    let surgeEventTimeout = null;
    let isSurgeMode = false;

    // 監聽 game-screen 是否變為 active，若是則初始化遊戲
    let wasGameScreenActive = gameScreen.classList.contains('active');
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const isActive = gameScreen.classList.contains('active');
                // 只有當 active 狀態發生「切換」時，才執行初始化或停止
                if (isActive && !wasGameScreenActive) {
                    initGame();
                } else if (!isActive && wasGameScreenActive) {
                    stopGameLoops();
                }
                wasGameScreenActive = isActive;
            }
        });
    });
    observer.observe(gameScreen, { attributes: true });

    function initGame() {
        gameState = 'intro';
        currentDistance = 0;
        isSurgeMode = false;
        updateProgressUI();

        startUI.classList.remove('hide');
        gameUI.classList.add('hide');
        surgeWarning.classList.add('hide');
        oceanBackground.classList.remove('surge', 'playing');
        beachLayer.classList.remove('recede');

        swimmer.className = 'swimmer intro-standby';
        swimmer.style.bottom = '5vh';

        lifesaversContainer.innerHTML = '';
        clickEffects.innerHTML = '';
        diveSplashContainer.innerHTML = '';

        clearTimeout(surgeEventTimeout);
        stopGameLoops();
    }

    if (startBtn) {
        startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (gameState !== 'intro') return;

            gameState = 'cutscene';
            startUI.classList.add('hide');
            swimmer.classList.remove('intro-standby');
            swimmer.classList.add('jump-in');

            setTimeout(() => createMegaSplash(), 1800);

            setTimeout(() => {
                gameState = 'playing';
                swimmer.classList.remove('jump-in');
                swimmer.classList.add('playing');
                oceanBackground.classList.add('playing');
                beachLayer.classList.add('recede');
                gameUI.classList.remove('hide');

                startGameLoops();
                scheduleNextSurge(true);
            }, 2200);
        });
    }

    function startGameLoops() {
        currentDragInterval = setInterval(() => {
            let dragForce = 0.15;
            if (isSurgeMode) {
                dragForce = 0.55;
            }
            if (currentDistance > 0) {
                currentDistance -= dragForce;
                if (currentDistance < 0) currentDistance = 0;
            }
            updateProgressUI();
        }, 50);

        setTimeout(() => {
            if (gameState === 'playing' && Math.random() > 0.1) spawnLifesaver();
        }, 1200);

        lifesaverInterval = setInterval(() => {
            if (gameState !== 'playing') return;
            if (Math.random() > 0.3) spawnLifesaver();
        }, 2200);
    }

    function stopGameLoops() {
        clearInterval(currentDragInterval);
        clearInterval(lifesaverInterval);
        clearTimeout(surgeEventTimeout);
    }

    function scheduleNextSurge(isFirst = false) {
        if (gameState !== 'playing') return;
        let nextTime = Math.random() * 4000 + 5000;
        if (isFirst) nextTime = Math.random() * 2000 + 4000;

        surgeEventTimeout = setTimeout(() => {
            if (gameState !== 'playing') return;

            isSurgeMode = true;
            surgeWarning.classList.remove('hide');
            gameScreen.classList.add('screen-shake');
            setTimeout(() => gameScreen.classList.remove('screen-shake'), 600);

            setTimeout(() => {
                isSurgeMode = false;
                surgeWarning.classList.add('hide');
                scheduleNextSurge(false);
            }, 3000);
        }, nextTime);
    }

    function updateProgressUI() {
        let percentage = (currentDistance / TARGET_DISTANCE) * 100;
        if (percentage > 100) percentage = 100;

        progressBar.style.width = `${percentage}%`;
        distanceText.textContent = Math.floor(currentDistance);

        if (gameState === 'playing' || gameState === 'intro') {
            swimmer.style.bottom = `${5 + (percentage * 0.65)}vh`;
        }

        if (currentDistance >= TARGET_DISTANCE && gameState === 'playing') {
            triggerWin();
        }
    }

    function spawnLifesaver() {
        const lifesaver = document.createElement('div');
        lifesaver.classList.add('lifesaver');
        const randomX = Math.random() * 60 + 15;
        lifesaver.style.left = `${randomX}%`;

        lifesaver.innerHTML = `
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;">
                <defs><filter id="buoy-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="2" dy="8" stdDeviation="4" flood-color="#000" flood-opacity="0.25"/></filter></defs>
                <g filter="url(#buoy-shadow)" transform="rotate(15 50 50)">
                    <!-- 黑色繫繩 -->
                    <path d="M 15 49 Q 35 15 65 20 T 85 49" fill="none" stroke="#222" stroke-width="2.5" />
                    <!-- 扣環 -->
                    <circle cx="65" cy="20" r="2" fill="none" stroke="#94a3b8" stroke-width="1.5" />
                    <!-- 紅色波浪形浮標體 -->
                    <path d="M 15 42 L 32 42 C 34 44.5, 38 44.5, 40 42 L 60 42 C 62 44.5, 66 44.5, 68 42 L 85 42 A 7 7 0 0 1 85 56 L 68 56 C 66 53.5, 62 53.5, 60 56 L 40 56 C 38 53.5, 34 53.5, 32 56 L 15 56 A 7 7 0 0 1 15 42 Z" fill="#e11d24" />
                    <!-- 高光邊緣 -->
                    <path d="M 15 43.5 L 85 43.5" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.25" />
                </g>
            </svg>`;

        lifesaver.addEventListener('click', (e) => {
            e.stopPropagation();
            if (gameState !== 'playing') return;
            currentDistance += 15;
            updateProgressUI();
            createFloatingText(e.clientX, e.clientY, "+15m 推進");
            createRipple(e.clientX, e.clientY);
            swimmerDash();

            lifesaver.style.animation = 'none';
            lifesaver.style.transition = 'all 0.2s';
            lifesaver.style.opacity = '0';
            lifesaver.style.transform = 'scale(2.5) rotate(45deg)';
            setTimeout(() => lifesaver.remove(), 200);
        });

        lifesaversContainer.appendChild(lifesaver);
        setTimeout(() => { if (lifesaver.parentElement) lifesaver.remove(); }, 4500);
    }

    function createMegaSplash() {
        const splash = document.createElement('div');
        splash.classList.add('mega-splash');
        diveSplashContainer.appendChild(splash);
        setTimeout(() => splash.remove(), 1000);
    }

    function createFloatingText(x, y, text) {
        const floatText = document.createElement('div');
        floatText.classList.add('floating-text');
        floatText.textContent = text;
        floatText.style.left = `${x}px`;
        floatText.style.top = `${y}px`;
        clickEffects.appendChild(floatText);
        setTimeout(() => floatText.remove(), 1200);
    }

    function swimmerDash() {
        swimmer.classList.add('dash');
        setTimeout(() => {
            if (gameState !== 'playing') return;
            swimmer.classList.remove('dash');
        }, 300);
    }

    function createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.classList.add('ripple');
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        clickEffects.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    if (gameScreen) {
        gameScreen.addEventListener('click', (e) => {
            if (gameState !== 'playing') return;
            currentDistance += 1.0;
            swimmerDash();
            updateProgressUI();
            createRipple(e.clientX, e.clientY);
        });
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (gameState === 'playing' || gameState === 'intro') {
                triggerWin();
            }
        });
    }

    function triggerWin() {
        gameState = 'finished';
        stopGameLoops();
        distanceText.textContent = TARGET_DISTANCE;

        // 短暫延遲後，自動跳轉到海邊情境
        setTimeout(() => {
            navigateToScreen('beach-screen');
        }, 800);
    }

    // ==========================================
    // ==== 海邊敘事滾動切換邏輯 ====
    // ==========================================
    const beachScreenObj = document.getElementById('beach-screen');

    if (beachScreenObj) {
        beachScreenObj.addEventListener('wheel', (e) => {
            if (beachScreenObj.classList.contains('active')) {
                if (e.deltaY > 0 && (beachScreenObj.scrollTop + beachScreenObj.clientHeight >= beachScreenObj.scrollHeight - 10)) {
                    navigateToScreen('rip-current-video-screen');
                }
            }
        }, { passive: true });

        let touchStartY = 0;
        beachScreenObj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        beachScreenObj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            if (beachScreenObj.classList.contains('active')) {
                if (touchStartY - touchEndY > 50 && (beachScreenObj.scrollTop + beachScreenObj.clientHeight >= beachScreenObj.scrollHeight - 10)) {
                    navigateToScreen('rip-current-video-screen');
                }
            }
        }, { passive: true });
    }

    const ripCurrentVideoScreenObj = document.getElementById('rip-current-video-screen');
    if (ripCurrentVideoScreenObj) {
        ripCurrentVideoScreenObj.addEventListener('wheel', (e) => {
            if (ripCurrentVideoScreenObj.classList.contains('active')) {
                if (e.deltaY < 0 && ripCurrentVideoScreenObj.scrollTop <= 5) {
                    navigateToScreen('beach-screen');
                    if (beachScreenObj) {
                        setTimeout(() => {
                            beachScreenObj.scrollTop = beachScreenObj.scrollHeight - beachScreenObj.clientHeight;
                        }, 50);
                    }
                } else if (e.deltaY > 0 && (ripCurrentVideoScreenObj.scrollTop + ripCurrentVideoScreenObj.clientHeight >= ripCurrentVideoScreenObj.scrollHeight - 10)) {
                    navigateToScreen('entry-intro-screen');
                }
            }
        }, { passive: true });

        let touchStartY = 0;
        ripCurrentVideoScreenObj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        ripCurrentVideoScreenObj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            if (ripCurrentVideoScreenObj.classList.contains('active')) {
                if (touchEndY - touchStartY > 50 && ripCurrentVideoScreenObj.scrollTop <= 5) {
                    navigateToScreen('beach-screen');
                    if (beachScreenObj) {
                        setTimeout(() => {
                            beachScreenObj.scrollTop = beachScreenObj.scrollHeight - beachScreenObj.clientHeight;
                        }, 50);
                    }
                } else if (touchStartY - touchEndY > 50 && (ripCurrentVideoScreenObj.scrollTop + ripCurrentVideoScreenObj.clientHeight >= ripCurrentVideoScreenObj.scrollHeight - 10)) {
                    navigateToScreen('entry-intro-screen');
                }
            }
        }, { passive: true });
    }

    const entryIntroScreenObj = document.getElementById('entry-intro-screen');
    if (entryIntroScreenObj) {
        entryIntroScreenObj.addEventListener('wheel', (e) => {
            if (entryIntroScreenObj.classList.contains('active')) {
                if (e.deltaY > 0) {
                    navigateToScreen('scrollable-video-screen');
                } else if (e.deltaY < 0) {
                    navigateToScreen('rip-current-video-screen');
                    if (ripCurrentVideoScreenObj) {
                        setTimeout(() => {
                            ripCurrentVideoScreenObj.scrollTop = ripCurrentVideoScreenObj.scrollHeight - ripCurrentVideoScreenObj.clientHeight;
                        }, 50);
                    }
                }
            }
        }, { passive: true });

        let touchStartY = 0;
        entryIntroScreenObj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        entryIntroScreenObj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            if (entryIntroScreenObj.classList.contains('active')) {
                if (touchStartY - touchEndY > 50) {
                    navigateToScreen('scrollable-video-screen');
                } else if (touchEndY - touchStartY > 50) {
                    navigateToScreen('rip-current-video-screen');
                    if (ripCurrentVideoScreenObj) {
                        setTimeout(() => {
                            ripCurrentVideoScreenObj.scrollTop = ripCurrentVideoScreenObj.scrollHeight - ripCurrentVideoScreenObj.clientHeight;
                        }, 50);
                    }
                }
            }
        }, { passive: true });
    }

    const scrollableVideoScreenObj = document.getElementById('scrollable-video-screen');
    if (scrollableVideoScreenObj) {
        scrollableVideoScreenObj.addEventListener('wheel', (e) => {
            if (scrollableVideoScreenObj.classList.contains('active')) {
                if (e.deltaY < 0 && scrollableVideoScreenObj.scrollTop <= 5) {
                    navigateToScreen('entry-intro-screen');
                } else if (e.deltaY > 0 && scrollableVideoScreenObj.scrollTop + scrollableVideoScreenObj.clientHeight >= scrollableVideoScreenObj.scrollHeight - 10) {
                    navigateToScreen('rescue-board-video-screen');
                }
            }
        }, { passive: true });

        let touchStartY = 0;
        scrollableVideoScreenObj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        scrollableVideoScreenObj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            if (scrollableVideoScreenObj.classList.contains('active')) {
                if (touchEndY - touchStartY > 50 && scrollableVideoScreenObj.scrollTop <= 5) {
                    navigateToScreen('entry-intro-screen');
                } else if (touchStartY - touchEndY > 50 && scrollableVideoScreenObj.scrollTop + scrollableVideoScreenObj.clientHeight >= scrollableVideoScreenObj.scrollHeight - 10) {
                    navigateToScreen('rescue-board-video-screen');
                }
            }
        }, { passive: true });
    }

    const rescueBoardVideoScreenObj = document.getElementById('rescue-board-video-screen');
    if (rescueBoardVideoScreenObj) {
        rescueBoardVideoScreenObj.addEventListener('wheel', (e) => {
            if (rescueBoardVideoScreenObj.classList.contains('active')) {
                if (e.deltaY < 0 && rescueBoardVideoScreenObj.scrollTop <= 5) {
                    navigateToScreen('scrollable-video-screen');
                    if (scrollableVideoScreenObj) {
                        setTimeout(() => {
                            scrollableVideoScreenObj.scrollTop = scrollableVideoScreenObj.scrollHeight - scrollableVideoScreenObj.clientHeight;
                        }, 50);
                    }
                } else if (e.deltaY > 0 && rescueBoardVideoScreenObj.scrollTop + rescueBoardVideoScreenObj.clientHeight >= rescueBoardVideoScreenObj.scrollHeight - 10) {
                    navigateToScreen('rescue-boat-video-screen');
                }
            }
        }, { passive: true });

        let touchStartY = 0;
        rescueBoardVideoScreenObj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        rescueBoardVideoScreenObj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            if (rescueBoardVideoScreenObj.classList.contains('active')) {
                if (touchEndY - touchStartY > 50 && rescueBoardVideoScreenObj.scrollTop <= 5) {
                    navigateToScreen('scrollable-video-screen');
                    if (scrollableVideoScreenObj) {
                        setTimeout(() => {
                            scrollableVideoScreenObj.scrollTop = scrollableVideoScreenObj.scrollHeight - scrollableVideoScreenObj.clientHeight;
                        }, 50);
                    }
                } else if (touchStartY - touchEndY > 50 && rescueBoardVideoScreenObj.scrollTop + rescueBoardVideoScreenObj.clientHeight >= rescueBoardVideoScreenObj.scrollHeight - 10) {
                    navigateToScreen('rescue-boat-video-screen');
                }
            }
        }, { passive: true });
    }

    const rescueBoatVideoScreenObj = document.getElementById('rescue-boat-video-screen');
    if (rescueBoatVideoScreenObj) {
        rescueBoatVideoScreenObj.addEventListener('wheel', (e) => {
            if (rescueBoatVideoScreenObj.classList.contains('active')) {
                if (e.deltaY < 0 && rescueBoatVideoScreenObj.scrollTop <= 5) {
                    navigateToScreen('rescue-board-video-screen');
                    if (rescueBoardVideoScreenObj) {
                        setTimeout(() => {
                            rescueBoardVideoScreenObj.scrollTop = rescueBoardVideoScreenObj.scrollHeight - rescueBoardVideoScreenObj.clientHeight;
                        }, 50);
                    }
                } else if (e.deltaY > 0 && rescueBoatVideoScreenObj.scrollTop + rescueBoatVideoScreenObj.clientHeight >= rescueBoatVideoScreenObj.scrollHeight - 10) {
                    navigateToScreen('training-outro-screen');
                }
            }
        }, { passive: true });

        let touchStartY = 0;
        rescueBoatVideoScreenObj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        rescueBoatVideoScreenObj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            if (rescueBoatVideoScreenObj.classList.contains('active')) {
                if (touchEndY - touchStartY > 50 && rescueBoatVideoScreenObj.scrollTop <= 5) {
                    navigateToScreen('rescue-board-video-screen');
                    if (rescueBoardVideoScreenObj) {
                        setTimeout(() => {
                            rescueBoardVideoScreenObj.scrollTop = rescueBoardVideoScreenObj.scrollHeight - rescueBoardVideoScreenObj.clientHeight;
                        }, 50);
                    }
                } else if (touchStartY - touchEndY > 50 && rescueBoatVideoScreenObj.scrollTop + rescueBoatVideoScreenObj.clientHeight >= rescueBoatVideoScreenObj.scrollHeight - 10) {
                    navigateToScreen('training-outro-screen');
                }
            }
        }, { passive: true });
    }

    let outro1Accumulator = 0;
    let outro1Timeout = null;
    const trainingOutroScreenObj = document.getElementById('training-outro-screen');
    if (trainingOutroScreenObj) {
        trainingOutroScreenObj.addEventListener('wheel', (e) => {
            if (!trainingOutroScreenObj.classList.contains('active')) return;

            if (outro1Timeout) clearTimeout(outro1Timeout);
            outro1Timeout = setTimeout(() => { outro1Accumulator = 0; }, 200);

            if (Date.now() - outro1Throttle < 1000) {
                outro1Accumulator = 0;
                return;
            }

            if (Math.abs(e.deltaY) < 15) return;
            outro1Accumulator += e.deltaY;

            if (Math.abs(outro1Accumulator) >= 120) {
                const direction = outro1Accumulator > 0 ? 1 : -1;
                outro1Accumulator = 0;

                if (direction < 0) {
                    outro1Throttle = Date.now();
                    navigateToScreen('rescue-boat-video-screen');
                    if (rescueBoatVideoScreenObj) {
                        setTimeout(() => {
                            rescueBoatVideoScreenObj.scrollTop = rescueBoatVideoScreenObj.scrollHeight - rescueBoatVideoScreenObj.clientHeight;
                        }, 50);
                    }
                } else if (direction > 0) {
                    outro1Throttle = Date.now();
                    navigateToScreen('training-outro-screen-2');
                }
            }
        }, { passive: true });

        let touchStartY = 0;
        trainingOutroScreenObj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        trainingOutroScreenObj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            if (trainingOutroScreenObj.classList.contains('active')) {
                if (touchEndY - touchStartY > 50) {
                    navigateToScreen('rescue-boat-video-screen');
                    if (rescueBoatVideoScreenObj) {
                        setTimeout(() => {
                            rescueBoatVideoScreenObj.scrollTop = rescueBoatVideoScreenObj.scrollHeight - rescueBoatVideoScreenObj.clientHeight;
                        }, 50);
                    }
                } else if (touchStartY - touchEndY > 50) {
                    navigateToScreen('training-outro-screen-2');
                }
            }
        }, { passive: true });
    }

    let outro2Accumulator = 0;
    let outro2Timeout = null;
    const trainingOutroScreen2Obj = document.getElementById('training-outro-screen-2');
    if (trainingOutroScreen2Obj) {
        trainingOutroScreen2Obj.addEventListener('wheel', (e) => {
            if (!trainingOutroScreen2Obj.classList.contains('active')) return;

            if (outro2Timeout) clearTimeout(outro2Timeout);
            outro2Timeout = setTimeout(() => { outro2Accumulator = 0; }, 200);

            if (Date.now() - outro2Throttle < 1000) {
                outro2Accumulator = 0;
                return;
            }

            if (Math.abs(e.deltaY) < 15) return;
            outro2Accumulator += e.deltaY;

            if (Math.abs(outro2Accumulator) >= 120) {
                const direction = outro2Accumulator > 0 ? 1 : -1;
                outro2Accumulator = 0;

                if (direction < 0) {
                    outro2Throttle = Date.now();
                    if (previousScreenId === 'river-text-screen') {
                        navigateToScreen('river-text-screen');
                    } else {
                        navigateToScreen('training-outro-screen');
                    }
                } else if (direction > 0) {
                    outro2Throttle = Date.now();
                    navigateToScreen('training-outro-screen-3');
                }
            }
        }, { passive: true });

        let touchStartY = 0;
        trainingOutroScreen2Obj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        trainingOutroScreen2Obj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            if (trainingOutroScreen2Obj.classList.contains('active')) {
                if (touchEndY - touchStartY > 50) {
                    if (previousScreenId === 'river-text-screen') {
                        navigateToScreen('river-text-screen');
                    } else {
                        navigateToScreen('training-outro-screen');
                    }
                } else if (touchStartY - touchEndY > 50) {
                    navigateToScreen('training-outro-screen-3');
                }
            }
        }, { passive: true });
    }

    let outro3Accumulator = 0;
    let outro3Timeout = null;
    const trainingOutroScreen3Obj = document.getElementById('training-outro-screen-3');
    if (trainingOutroScreen3Obj) {
        trainingOutroScreen3Obj.addEventListener('wheel', (e) => {
            if (!trainingOutroScreen3Obj.classList.contains('active')) return;

            if (outro3Timeout) clearTimeout(outro3Timeout);
            outro3Timeout = setTimeout(() => { outro3Accumulator = 0; }, 200);

            if (Date.now() - outro3Throttle < 1000) {
                outro3Accumulator = 0;
                return;
            }

            if (Math.abs(e.deltaY) < 15) return;
            outro3Accumulator += e.deltaY;

            if (Math.abs(outro3Accumulator) >= 120) {
                const direction = outro3Accumulator > 0 ? 1 : -1;
                outro3Accumulator = 0;

                if (direction < 0) {
                    outro3Throttle = Date.now();
                    navigateToScreen('training-outro-screen-2');
                } else if (direction > 0) {
                    outro3Throttle = Date.now();
                    navigateToScreen('compare-menu-screen');
                }
            }
        }, { passive: true });

        let touchStartY = 0;
        trainingOutroScreen3Obj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        trainingOutroScreen3Obj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            if (trainingOutroScreen3Obj.classList.contains('active')) {
                if (touchEndY - touchStartY > 50) {
                    navigateToScreen('training-outro-screen-2');
                } else if (touchStartY - touchEndY > 50) {
                    navigateToScreen('compare-menu-screen');
                }
            }
        }, { passive: true });
    }

    const compareMenuScreenObj = document.getElementById('compare-menu-screen');
    if (compareMenuScreenObj) {
        const bg = compareMenuScreenObj.querySelector('.compare-bg-container');
        const stageContainer = compareMenuScreenObj.querySelector('.compare-split-stage');
        const rightPanel = compareMenuScreenObj.querySelector('.compare-right-panel');
        
        const cards = Array.from(rightPanel.querySelectorAll('.compare-country-card'))
            .sort((a, b) => parseInt(a.getAttribute('data-step')) - parseInt(b.getAttribute('data-step')));
        
        const totalSteps = cards.length;
        const isMobile = window.innerWidth <= 900;

        cards.forEach((card) => {
            const randomRotate = isMobile ? 0 : (Math.random() * 3.6 - 1.8).toFixed(2);
            card.style.setProperty('--r', `${randomRotate}deg`);
        });

        let compareLastTransitionTime = 0;
        let stepThrottleTime = 0;
        let wheelAccumulator = 0;
        let wheelTimeout = null;

        updateCompareCards = function() {
            cards.forEach((card, index) => {
                const stepOrder = index + 1;
                card.classList.remove('active-top', 'layer-1', 'layer-deep');
                
                if (compareStep > 0 && stepOrder <= compareStep) {
                    const depth = compareStep - stepOrder;
                    if (depth === 0) {
                        card.classList.add('active-top'); 
                    } else if (depth === 1 && !isMobile) {
                        card.classList.add('layer-1');    
                    } else {
                        card.classList.add('layer-deep');   
                    }
                }
            });
        };

        // Initialize state
        updateCompareCards();

        let touchStartY = 0;
        compareMenuScreenObj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        compareMenuScreenObj.addEventListener('touchend', (e) => {
            if (!compareMenuScreenObj.classList.contains('active')) return;
            let touchEndY = e.changedTouches[0].screenY;
            
            if (Date.now() - stepThrottleTime < 800) return;

            if (touchStartY - touchEndY > 50) {
                // 向下划動（往後翻頁/翻字卡）
                if (compareStep < 3) {
                    compareStep++;
                    stepThrottleTime = Date.now();
                    updateCompareCards();
                } else {
                    if (Date.now() - compareLastTransitionTime > 1000) {
                        compareLastTransitionTime = Date.now();
                        navigateToScreen('post-compare-text-1');
                    }
                }
            } else if (touchEndY - touchStartY > 50) {
                // 向上划動（回退字卡/回退前頁）
                if (compareStep > 0) {
                    compareStep--;
                    stepThrottleTime = Date.now();
                    updateCompareCards();
                } else {
                    if (Date.now() - compareLastTransitionTime > 1000) {
                        compareLastTransitionTime = Date.now();
                        navigateToScreen('training-outro-screen-3');
                    }
                }
            }
        }, { passive: true });

        compareMenuScreenObj.addEventListener('wheel', (e) => {
            if (!compareMenuScreenObj.classList.contains('active')) return;

            // 每次滾動都重新設定清除計時器，若使用者停止滾動 200ms 則歸零累加器
            if (wheelTimeout) clearTimeout(wheelTimeout);
            wheelTimeout = setTimeout(() => {
                wheelAccumulator = 0;
            }, 200);

            // 在切換的 800ms 動畫期間，直接吸收掉所有滾輪數值（防止慣性滾動在動畫結束後瞬間觸發下一次翻頁）
            if (Date.now() - stepThrottleTime < 800) {
                wheelAccumulator = 0;
                return;
            }

            // 過濾極小的滾輪噪訊
            if (Math.abs(e.deltaY) < 15) return;

            wheelAccumulator += e.deltaY;

            // 必須累積達到 120 門檻值（滑鼠滾輪一格或一次果斷的雙指滑動）才觸發翻頁
            if (Math.abs(wheelAccumulator) >= 120) {
                const direction = wheelAccumulator > 0 ? 1 : -1;
                wheelAccumulator = 0; // 歸零

                if (direction > 0) {
                    // 滾輪向下
                    if (compareStep < 3) {
                        compareStep++;
                        stepThrottleTime = Date.now();
                        updateCompareCards();
                    } else {
                        if (Date.now() - compareLastTransitionTime > 1000) {
                            compareLastTransitionTime = Date.now();
                            navigateToScreen('post-compare-text-1');
                        }
                    }
                } else if (direction < 0) {
                    // 滾輪向上
                    if (compareStep > 0) {
                        compareStep--;
                        stepThrottleTime = Date.now();
                        updateCompareCards();
                    } else {
                        if (Date.now() - compareLastTransitionTime > 1000) {
                            compareLastTransitionTime = Date.now();
                            navigateToScreen('training-outro-screen-3');
                        }
                    }
                }
            }
        }, { passive: true });
    }



    const parallaxScreenObj = document.getElementById('parallax-screen');
    if (parallaxScreenObj) {
        parallaxScreenObj.addEventListener('wheel', (e) => {
            if (e.deltaY < 0 && parallaxScreenObj.classList.contains('active') && parallaxScreenObj.scrollTop <= 5) {
                navigateToScreen('training-outro-screen-3');
            }
        }, { passive: true });

        let touchStartY = 0;
        parallaxScreenObj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        parallaxScreenObj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            if (touchEndY - touchStartY > 50 && parallaxScreenObj.classList.contains('active') && parallaxScreenObj.scrollTop <= 5) {
                navigateToScreen('training-outro-screen-3');
            }
        }, { passive: true });
    }

    // ===================================================
    // ==== 各國制度比較後續文章頁面滾動邏輯 (報導者風格) ====
    // ===================================================
    const postCompare1 = document.getElementById('post-compare-text-1');
    if (postCompare1) {
        let lastCompareTransitionTime = 0;

        postCompare1.addEventListener('wheel', (e) => {
            if (!postCompare1.classList.contains('active')) return;
            const scrollTop = postCompare1.scrollTop;

            if (e.deltaY < 0 && scrollTop <= 5) {
                if (Date.now() - lastCompareTransitionTime > 1000) {
                    lastCompareTransitionTime = Date.now();
                    navigateToScreen('compare-menu-screen');
                }
            }
        }, { passive: true });

        let touchStartY = 0;
        postCompare1.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        postCompare1.addEventListener('touchend', (e) => {
            if (!postCompare1.classList.contains('active')) return;
            let touchEndY = e.changedTouches[0].screenY;
            const scrollTop = postCompare1.scrollTop;

            if (touchEndY - touchStartY > 50 && scrollTop <= 5) {
                if (Date.now() - lastCompareTransitionTime > 1000) {
                    lastCompareTransitionTime = Date.now();
                    navigateToScreen('compare-menu-screen');
                }
            }
        }, { passive: true });
    }

    // ==========================================
    // ==== 溪流前導頁向下捲動 (進入雙通道) ====
    // ==========================================
    const riverIntroScreenObj = document.getElementById('river-intro-screen');
    if (riverIntroScreenObj) {
        riverIntroScreenObj.addEventListener('wheel', (e) => {
            if (riverIntroScreenObj.classList.contains('active')) {
                if (e.deltaY > 0) {
                    navigateToScreen('river-dual-channel-screen');
                } else if (e.deltaY < 0) {
                    navigateToScreen('menu-screen');
                }
            }
        }, { passive: true });

        let touchStartY = 0;
        riverIntroScreenObj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        riverIntroScreenObj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            if (riverIntroScreenObj.classList.contains('active')) {
                if (touchStartY - touchEndY > 50) {
                    navigateToScreen('river-dual-channel-screen');
                } else if (touchEndY - touchStartY > 50) {
                    navigateToScreen('menu-screen');
                }
            }
        }, { passive: true });
    }

    const riverDualChannelScreenObj = document.getElementById('river-dual-channel-screen');
    if (riverDualChannelScreenObj) {
        riverDualChannelScreenObj.addEventListener('wheel', (e) => {
            if (riverDualChannelScreenObj.classList.contains('active')) {
                if (Date.now() - riverDualChannelLastTransitionTime < 1000) return;
                const scrollTop = riverDualChannelScreenObj.scrollTop;
                const clientHeight = riverDualChannelScreenObj.clientHeight;
                const scrollHeight = riverDualChannelScreenObj.scrollHeight;
                if (e.deltaY < 0 && scrollTop <= 5) {
                    riverBottomScrollDelta = 0;
                    navigateToScreen('river-intro-screen');
                } else if (e.deltaY > 0 && scrollHeight > clientHeight + 100 && scrollTop + clientHeight >= scrollHeight - 15) {
                    riverBottomScrollDelta += e.deltaY;
                    if (riverBottomScrollDelta >= 500) {
                        riverBottomScrollDelta = 0;
                        navigateToScreen('river-text-screen');
                    }
                } else {
                    riverBottomScrollDelta = 0;
                }
            }
        }, { passive: true });

        let touchStartY = 0;
        riverDualChannelScreenObj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        riverDualChannelScreenObj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            if (riverDualChannelScreenObj.classList.contains('active')) {
                if (Date.now() - riverDualChannelLastTransitionTime < 1000) return;
                const scrollTop = riverDualChannelScreenObj.scrollTop;
                const clientHeight = riverDualChannelScreenObj.clientHeight;
                const scrollHeight = riverDualChannelScreenObj.scrollHeight;
                if (touchEndY - touchStartY > 50 && scrollTop <= 5) {
                    riverBottomTouchCount = 0;
                    navigateToScreen('river-intro-screen');
                } else if (touchStartY - touchEndY > 50 && scrollHeight > clientHeight + 100 && scrollTop + clientHeight >= scrollHeight - 15) {
                    riverBottomTouchCount++;
                    if (riverBottomTouchCount >= 3) {
                        riverBottomTouchCount = 0;
                        navigateToScreen('river-text-screen');
                    }
                } else {
                    riverBottomTouchCount = 0;
                }
            }
        }, { passive: true });
    }

    const riverTextScreenObj = document.getElementById('river-text-screen');
    if (riverTextScreenObj) {
        riverTextScreenObj.addEventListener('wheel', (e) => {
            if (riverTextScreenObj.classList.contains('active')) {
                if (Date.now() - riverTextLastTransitionTime < 1000) return;
                const scrollTop = riverTextScreenObj.scrollTop;
                const clientHeight = riverTextScreenObj.clientHeight;
                const scrollHeight = riverTextScreenObj.scrollHeight;
                if (e.deltaY < 0 && scrollTop <= 5) {
                    navigateToScreen('river-dual-channel-screen');
                    if (riverDualChannelScreenObj) {
                        setTimeout(() => {
                            riverDualChannelScreenObj.scrollTop = riverDualChannelScreenObj.scrollHeight - riverDualChannelScreenObj.clientHeight;
                        }, 50);
                    }
                } else if (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight - 5) {
                    navigateToScreen('training-outro-screen-2');
                }
            }
        }, { passive: true });

        let touchStartY = 0;
        riverTextScreenObj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        riverTextScreenObj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            if (riverTextScreenObj.classList.contains('active')) {
                if (Date.now() - riverTextLastTransitionTime < 1000) return;
                const scrollTop = riverTextScreenObj.scrollTop;
                const clientHeight = riverTextScreenObj.clientHeight;
                const scrollHeight = riverTextScreenObj.scrollHeight;
                if (touchEndY - touchStartY > 50 && scrollTop <= 5) {
                    navigateToScreen('river-dual-channel-screen');
                    if (riverDualChannelScreenObj) {
                        setTimeout(() => {
                            riverDualChannelScreenObj.scrollTop = riverDualChannelScreenObj.scrollHeight - riverDualChannelScreenObj.clientHeight;
                        }, 50);
                    }
                } else if (touchStartY - touchEndY > 50 && scrollTop + clientHeight >= scrollHeight - 5) {
                    navigateToScreen('training-outro-screen-2');
                }
            }
        }, { passive: true });
    }

    const riverTextScreen2Obj = document.getElementById('river-text-screen-2');
    if (riverTextScreen2Obj) {
        riverTextScreen2Obj.addEventListener('wheel', (e) => {
            if (riverTextScreen2Obj.classList.contains('active')) {
                if (Date.now() - riverText2LastTransitionTime < 1000) return;
                const scrollTop = riverTextScreen2Obj.scrollTop;
                const clientHeight = riverTextScreen2Obj.clientHeight;
                const scrollHeight = riverTextScreen2Obj.scrollHeight;
                if (e.deltaY < 0 && scrollTop <= 5) {
                    navigateToScreen('river-text-screen');
                    if (riverTextScreenObj) {
                        setTimeout(() => {
                            riverTextScreenObj.scrollTop = riverTextScreenObj.scrollHeight - riverTextScreenObj.clientHeight;
                        }, 50);
                    }
                } else if (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight - 5) {
                    navigateToScreen('river-screen');
                }
            }
        }, { passive: true });

        let touchStartY = 0;
        riverTextScreen2Obj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        riverTextScreen2Obj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            if (riverTextScreen2Obj.classList.contains('active')) {
                if (Date.now() - riverText2LastTransitionTime < 1000) return;
                const scrollTop = riverTextScreen2Obj.scrollTop;
                const clientHeight = riverTextScreen2Obj.clientHeight;
                const scrollHeight = riverTextScreen2Obj.scrollHeight;
                if (touchEndY - touchStartY > 50 && scrollTop <= 5) {
                    navigateToScreen('river-text-screen');
                    if (riverTextScreenObj) {
                        setTimeout(() => {
                            riverTextScreenObj.scrollTop = riverTextScreenObj.scrollHeight - riverTextScreenObj.clientHeight;
                        }, 50);
                    }
                } else if (touchStartY - touchEndY > 50 && scrollTop + clientHeight >= scrollHeight - 5) {
                    navigateToScreen('river-screen');
                }
            }
        }, { passive: true });
    }

    const riverScreenObj = document.getElementById('river-screen');
    if (riverScreenObj) {
        riverScreenObj.addEventListener('wheel', (e) => {
            if (riverScreenObj.classList.contains('active') && e.deltaY < 0) {
                navigateToScreen('river-text-screen-2');
                if (riverTextScreen2Obj) {
                    setTimeout(() => {
                        riverTextScreen2Obj.scrollTop = riverTextScreen2Obj.scrollHeight - riverTextScreen2Obj.clientHeight;
                    }, 50);
                }
            }
        }, { passive: true });

        let touchStartY = 0;
        riverScreenObj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { pointerEvents: 'none', passive: true });

        riverScreenObj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            if (riverScreenObj.classList.contains('active') && touchEndY - touchStartY > 50) {
                navigateToScreen('river-text-screen-2');
                if (riverTextScreen2Obj) {
                    setTimeout(() => {
                        riverTextScreen2Obj.scrollTop = riverTextScreen2Obj.scrollHeight - riverTextScreen2Obj.clientHeight;
                    }, 50);
                }
            }
        }, { passive: true });
    }

    // ==========================================
    // ==== 報導者 Scrollytelling 數位敘事邏輯 ====
    // ==========================================
    const scrollyContainers = document.querySelectorAll('.scrolly-container');

    scrollyContainers.forEach(container => {
        const steps = container.querySelectorAll('.scrolly-step');
        const bgs = container.querySelectorAll('.scrolly-bg');

        if (steps.length > 0 && bgs.length > 0) {
            // 使用 Intersection Observer 來偵測哪一個文字框滾動到了畫面中間
            const observerOptions = {
                root: container,
                rootMargin: '-30% 0px -30% 0px', // 當區塊進入畫面中間 40% 區域時觸發
                threshold: 0
            };

            const scrollyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.getAttribute('data-index'));

                        // 移除當前容器內所有背景的 active 狀態
                        bgs.forEach(bg => bg.classList.remove('active'));

                        // 根據當前滾動到的文字框，顯示對應的背景
                        if (bgs[index]) {
                            bgs[index].classList.add('active');
                        }

                        // 同時為當前進入的步驟加上 in-view 類別，觸發文字框淡入滑升動畫
                        steps.forEach(step => step.classList.remove('in-view'));
                        entry.target.classList.add('in-view');
                    }
                });
            }, observerOptions);

            steps.forEach(step => {
                scrollyObserver.observe(step);
            });
        }
    });

    // ==========================================
    // ==== 影片自動縮短 (提早 3 秒循環) 邏輯 ====
    // ==========================================
    // 為了避免原片結尾的搖晃或多餘片段，統一讓所有背景與選單影片提早 3 秒重播
    const allLoopingVideos = document.querySelectorAll('video[loop]');
    allLoopingVideos.forEach(video => {
        // POV 視角影片、封面影片與海邊危險左邊前導影片皆在此排除，讓它們完整播放
        if (video.src && (video.src.includes('MVI_1472.MOV') || video.src.includes('海邊第一視角.mp4') || decodeURIComponent(video.src).includes('海邊第一視角.mp4'))) return;
        if (video.src && (video.src.includes('海邊危險左邊') || decodeURIComponent(video.src).includes('海邊危險左邊'))) return;
        if (video.classList.contains('bg-video-cover')) return;

        video.addEventListener('timeupdate', () => {
            // 當影片播放到距離結尾不到 3 秒時，強制跳回開頭
            if (video.duration && video.currentTime >= video.duration - 3) {
                video.currentTime = 0;
            }
        });
    });

    // === 獨立時間軸互動頁 (Interactive Timeline Screen) 邏輯 ===
    const timelineModule = document.getElementById('interactive-timeline-module');
    const timelineScreenObj = document.getElementById('interactive-timeline-screen');
    if (timelineModule && timelineScreenObj) {
        const bg = timelineModule.querySelector('#bg');
        const badge = timelineModule.querySelector('#badge');
        const chatContainer = timelineModule.querySelector('#chat-container');
        const progress = timelineModule.querySelector('#progress');
        const stepDotsEl = timelineModule.querySelector('#stepDots');
        
        // 取得背景影片
        const timelineVideo = timelineModule.querySelector('.bg-video-timeline');
        if (timelineVideo) {
            let wasTimelineActive = timelineScreenObj.classList.contains('active');
            if (wasTimelineActive) {
                timelineVideo.play().catch(e => console.log("Timeline video autoplay blocked:", e));
            }
            const timelineObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class') {
                        const isActive = timelineScreenObj.classList.contains('active');
                        if (isActive && !wasTimelineActive) {
                            timelineVideo.currentTime = 0;
                            timelineVideo.play().catch(e => console.log("Timeline video play blocked:", e));
                        } else if (!isActive && wasTimelineActive) {
                            timelineVideo.pause();
                        }
                        wasTimelineActive = isActive;
                    }
                });
            });
            timelineObserver.observe(timelineScreenObj, { attributes: true });
        }

        const rows = Array.from(timelineModule.querySelectorAll('.message-row'))
            .sort((a, b) => parseInt(a.getAttribute('data-step')) - parseInt(b.getAttribute('data-step')));
        const totalSteps = rows.length;

        if (stepDotsEl && stepDotsEl.children.length === 0) {
            rows.forEach(() => {
                const dot = document.createElement('div');
                dot.className = 'step-dot';
                stepDotsEl.appendChild(dot);
            });
        }
        const dots = Array.from(stepDotsEl.querySelectorAll('.step-dot'));

        const naturalHeights = [];
        rows.forEach(row => {
            row.style.maxHeight = 'none';
            row.style.visibility = 'hidden';
            row.style.position = 'absolute';
            row.style.display = 'flex';
        });
        rows.forEach(row => { naturalHeights.push(row.offsetHeight); });
        rows.forEach(row => {
            row.style.maxHeight = '';
            row.style.visibility = '';
            row.style.position = '';
            row.style.display = '';
        });

        function updateTimeline() {
            const relativeScrollTop = timelineScreenObj.scrollTop;
            const maxModuleScroll = timelineModule.offsetHeight - window.innerHeight;

            // 局部進度條渲染
            progress.style.width = Math.min(100, (relativeScrollTop / maxModuleScroll) * 100) + '%';

            // 控制徽章與側邊圓點的顯現時機
            if (relativeScrollTop > 40) {
                badge.classList.add('visible');
                stepDotsEl.classList.add('visible');
            } else {
                badge.classList.remove('visible');
                stepDotsEl.classList.remove('visible');
            }

            const stepInterval = 340;
            let currentStepTarget = Math.floor(relativeScrollTop / stepInterval) + 1;
            
            if (currentStepTarget > totalSteps) currentStepTarget = totalSteps;

            dots.forEach((dot, i) => {
                dot.classList.remove('active', 'done');
                if (i + 1 < currentStepTarget) dot.classList.add('done');
                else if (i + 1 === currentStepTarget) dot.classList.add('active');
            });

            rows.forEach((row, index) => {
                const stepOrder = index + 1;
                if (stepOrder <= currentStepTarget) {
                    row.classList.add('visible');
                    row.classList.remove('faded-bottom');
                } else {
                    row.classList.remove('visible', 'faded-bottom');
                }
            });

            let startIndex = 0;
            if (currentStepTarget > 0) {
                const maxAllowedHeight = window.innerHeight - 80;
                let currentHeightSum = 0;
                for (let i = currentStepTarget - 1; i >= 0; i--) {
                    let rowHeight = naturalHeights[i] + 14;
                    
                    if (i === currentStepTarget - 1 || currentHeightSum + rowHeight <= maxAllowedHeight) {
                        currentHeightSum += rowHeight;
                    } else {
                        startIndex = i + 1;
                        break;
                    }
                }
            }

            let shiftY = 0;
            rows.forEach((row, index) => {
                const stepOrder = index + 1;
                if (stepOrder <= currentStepTarget) {
                    if (index < startIndex) {
                        row.classList.add('faded-bottom');
                        shiftY += naturalHeights[index] + 14;
                    } else {
                        row.classList.remove('faded-bottom');
                    }
                }
            });

            chatContainer.style.transform = `translateX(-50%) translateY(${shiftY}px)`;
        }

        timelineScreenObj.addEventListener('scroll', () => {
            if (!timelineScreenObj.classList.contains('active')) return;
            updateTimeline();
        });

        // 初始化與在頁面啟動時呼叫一次，確保第一個對話框直接顯示
        updateTimeline();

        // 另外也註冊一個 mutationObserver 監聽 active class 切換，在進入畫面時主動重新計算與渲染
        const activeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && timelineScreenObj.classList.contains('active')) {
                    updateTimeline();
                }
            });
        });
        activeObserver.observe(timelineScreenObj, { attributes: true });

        // Wheel and touch navigation
        timelineScreenObj.addEventListener('wheel', (e) => {
            if (!timelineScreenObj.classList.contains('active')) return;
            const relativeScrollTop = timelineScreenObj.scrollTop;
            const maxScroll = timelineScreenObj.scrollHeight - timelineScreenObj.clientHeight;
            if (e.deltaY < 0 && relativeScrollTop <= 5) {
                navigateToScreen('cover-screen');
            } else if (e.deltaY > 0 && relativeScrollTop >= maxScroll - 10) {
                navigateToScreen('stats-screen');
            }
        }, { passive: true });

        let timelineTouchStartY = 0;
        timelineScreenObj.addEventListener('touchstart', (e) => {
            timelineTouchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        timelineScreenObj.addEventListener('touchend', (e) => {
            if (!timelineScreenObj.classList.contains('active')) return;
            const touchEndY = e.changedTouches[0].screenY;
            const relativeScrollTop = timelineScreenObj.scrollTop;
            const maxScroll = timelineScreenObj.scrollHeight - timelineScreenObj.clientHeight;
            if (touchEndY - timelineTouchStartY > 50 && relativeScrollTop <= 5) {
                navigateToScreen('cover-screen');
            } else if (timelineTouchStartY - touchEndY > 50 && relativeScrollTop >= maxScroll - 10) {
                navigateToScreen('stats-screen');
            }
        }, { passive: true });
    }

    // === 統計頁面 (Stats Screen) 滾動控制與解鎖 ===
    let canScrollFromStats = false;
    const statsScreenObj = document.getElementById('stats-screen');
    if (statsScreenObj) {
        statsScreenObj.addEventListener('wheel', (e) => {
            if (statsScreenObj.classList.contains('active')) {
                if (e.deltaY > 0) {
                    if (canScrollFromStats) {
                        navigateToScreen('menu-screen');
                    }
                } else if (e.deltaY < 0) {
                    if (canScrollFromStats) {
                        navigateToScreen('interactive-timeline-screen');
                        const ts = document.getElementById('interactive-timeline-screen');
                        if (ts) {
                            setTimeout(() => {
                                ts.scrollTop = ts.scrollHeight - ts.clientHeight;
                            }, 50);
                        }
                    }
                }
            }
        }, { passive: true });

        let touchStartY = 0;
        statsScreenObj.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        statsScreenObj.addEventListener('touchend', (e) => {
            let touchEndY = e.changedTouches[0].screenY;
            if (statsScreenObj.classList.contains('active')) {
                if (touchStartY - touchEndY > 50) {
                    if (canScrollFromStats) {
                        navigateToScreen('menu-screen');
                    }
                } else if (touchEndY - touchStartY > 50) {
                    if (canScrollFromStats) {
                        navigateToScreen('interactive-timeline-screen');
                        const ts = document.getElementById('interactive-timeline-screen');
                        if (ts) {
                            setTimeout(() => {
                                ts.scrollTop = ts.scrollHeight - ts.clientHeight;
                            }, 50);
                        }
                    }
                }
            }
        }, { passive: true });
    }

    // === 圓餅圖數據與繪製邏輯 (純藍調設計) ===
    const chartData = [
        { label: '溪河', value: 244, color: '#1e40af' }, // Royal Blue (Darker)
        { label: '近海', value: 137, color: '#2563eb' }, // Royal Blue (Medium)
        { label: '碼頭', value: 38, color: '#3b82f6' },  // Vibrant Blue
        { label: '圳溝', value: 32, color: '#60a5fa' },  // Sky Blue
        { label: '湖潭', value: 28, color: '#93c5fd' },  // Light Blue
        { label: '魚塭', value: 24, color: '#0284c7' },  // Deep Ocean Blue
        { label: '游泳池', value: 11, color: '#0ea5e9' }, // Light Ocean Blue
        { label: '池塘', value: 10, color: '#38bdf8' },  // Bright Cyan-Blue
        { label: '水庫', value: 5, color: '#06b6d4' },   // Vibrant Cyan
        { label: '外海', value: 2, color: '#22d3ee' }    // Neon Cyan
    ];

    function drawPieChart() {
        const svg = document.getElementById('pie-chart');
        const slicesContainer = document.getElementById('pie-slices');
        if (!svg || !slicesContainer) return;

        slicesContainer.innerHTML = '';
        const total = chartData.reduce((sum, item) => sum + item.value, 0);

        let cumulativeAngle = 0;
        const cx = 250;
        const cy = 250;
        const r = 175; // 大圓餅圖設計

        // 同步調整 index.html 裡的甜甜圈內圈半徑，以保持完美比例
        const innerHole = svg.querySelector('#pie-chart-hole');
        if (innerHole) {
            innerHole.setAttribute('r', '95');
        }

        chartData.forEach((item, index) => {
            const percent = item.value / total;
            const angle = percent * 360;

            const x1 = cx + r * Math.cos((cumulativeAngle - 90) * Math.PI / 180);
            const y1 = cy + r * Math.sin((cumulativeAngle - 90) * Math.PI / 180);

            cumulativeAngle += angle;

            const x2 = cx + r * Math.cos((cumulativeAngle - 90) * Math.PI / 180);
            const y2 = cy + r * Math.sin((cumulativeAngle - 90) * Math.PI / 180);

            const largeArcFlag = angle > 180 ? 1 : 0;

            const pathData = `
                M ${cx} ${cy}
                L ${x1} ${y1}
                A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}
                Z
            `;

            const segmentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            segmentGroup.style.opacity = '0';
            segmentGroup.style.transform = 'scale(0.3) rotate(-90deg)';
            segmentGroup.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
            segmentGroup.style.transformOrigin = `${cx}px ${cy}px`;

            // 設定延遲時間，實現扇區依序旋轉飛出的效果
            setTimeout(() => {
                segmentGroup.style.opacity = '1';
                segmentGroup.style.transform = 'scale(1) rotate(0deg)';
            }, index * 120 + 200);

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.setAttribute('fill', item.color);
            path.setAttribute('stroke', '#ffffff');
            path.setAttribute('stroke-width', '3');
            path.style.cursor = 'pointer';
            path.style.transition = 'all 0.3s ease';
            path.style.transformOrigin = `${cx}px ${cy}px`;

            // 讓前兩塊最多人數的區域閃爍
            if (index === 0 || index === 1) {
                path.classList.add('pulse-warning');
            }

            segmentGroup.appendChild(path);

            // === 繪製各區塊文字標籤 ===
            const middleAngle = cumulativeAngle - angle / 2;
            const rad = (middleAngle - 90) * Math.PI / 180;

            if (angle >= 90) {
                // 大區塊：直接將文字標示在扇區內部 (r * 0.65)
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                const lx = cx + r * 0.65 * Math.cos(rad);
                const ly = cy + r * 0.65 * Math.sin(rad);

                text.setAttribute('x', lx.toString());
                text.setAttribute('y', ly.toString());
                text.setAttribute('fill', '#ffffff');
                text.setAttribute('font-size', '12px');
                text.setAttribute('font-weight', 'bold');
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.textContent = item.label;
                text.setAttribute('style', 'text-shadow: 1px 1px 2px rgba(0,0,0,0.95), -1px -1px 2px rgba(0,0,0,0.95); pointer-events: none;');
                segmentGroup.appendChild(text);
            } else if (item.label === '游泳池') {
                // 游泳池小區塊：使用指引線拉到外部標示，避免被遮擋且維持版面美觀
                const x_start = cx + r * 0.85 * Math.cos(rad);
                const y_start = cy + r * 0.85 * Math.sin(rad);
                const x_end = cx + (r + 20) * Math.cos(rad);
                const y_end = cy + (r + 20) * Math.sin(rad);

                // 畫折線/指引線
                const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                const x_horizon = x_end + (Math.cos(rad) > 0 ? 15 : -15); // 水平折線長度
                polyline.setAttribute('points', `${x_start},${y_start} ${x_end},${y_end} ${x_horizon},${y_end}`);
                polyline.setAttribute('stroke', '#64748b'); // 典雅的 slate 灰色指引線
                polyline.setAttribute('stroke-width', '1.5');
                polyline.setAttribute('fill', 'none');
                segmentGroup.appendChild(polyline);

                // 標註文字
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                const x_text = x_horizon + (Math.cos(rad) > 0 ? 5 : -5);
                const y_text = y_end;

                text.setAttribute('x', x_text.toString());
                text.setAttribute('y', y_text.toString());
                text.setAttribute('fill', '#0f172a'); // 配合白色背景的深色文字
                text.setAttribute('font-size', '13px');
                text.setAttribute('font-weight', 'bold');
                text.setAttribute('text-anchor', Math.cos(rad) > 0 ? 'start' : 'end');
                text.setAttribute('dominant-baseline', 'middle');
                text.textContent = `${item.label} (${item.value}人)`;
                text.setAttribute('style', 'pointer-events: none;');
                segmentGroup.appendChild(text);
            }

            slicesContainer.appendChild(segmentGroup);

            // 互動事件：Hover Slices 顯示懸浮提示
            const tooltip = document.getElementById('pie-floating-tooltip');
            
            const showDetails = (e) => {
                if (tooltip) {
                    tooltip.innerHTML = `
                        <div class="floating-tooltip-row">${item.label}：${item.value} 人</div>
                        <div class="floating-tooltip-sub">佔整體 ${(percent * 100).toFixed(1)}%</div>
                    `;
                    tooltip.classList.add('active');
                    tooltip.style.left = `${e.clientX}px`;
                    tooltip.style.top = `${e.clientY}px`;
                }
                
                // 放大對應的 path
                path.style.transform = 'scale(1.05)';
                path.style.filter = 'drop-shadow(0 4px 12px rgba(255, 255, 255, 0.3))';
            };

            const moveDetails = (e) => {
                if (tooltip) {
                    tooltip.style.left = `${e.clientX}px`;
                    tooltip.style.top = `${e.clientY}px`;
                }
            };

            const hideDetails = () => {
                if (tooltip) {
                    tooltip.classList.remove('active');
                }
                
                // 還原 path 狀態
                path.style.transform = 'scale(1)';
                path.style.filter = '';
            };

            path.addEventListener('mouseenter', showDetails);
            path.addEventListener('mousemove', moveDetails);
            path.addEventListener('mouseleave', hideDetails);
        });
    }
});
