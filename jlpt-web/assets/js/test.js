document.addEventListener('DOMContentLoaded', async () => {
    // 1. Init Security & State
    preventCheating();
    const userStr = localStorage.getItem('jlpt_user');
    const targetLevel = localStorage.getItem('jlpt_target_level');
    
    if (!userStr || !targetLevel) {
        window.location.href = 'dashboard.html';
        return;
    }

    document.getElementById('levelIndicator').textContent = `${targetLevel} Practice Test`;
    
    let questions = [];
    let answers = JSON.parse(localStorage.getItem('jlpt_test_answers')) || {};
    let currentPage = 0;
    const PER_PAGE = 10;
    
    // 2. Fetch Data
    try {
        const res = await fetch(`data/${targetLevel}.json`);
        const data = await res.json();
        questions = data.questions;
        
        // Timer Logic
        initTimer(data.timerMinutes);
        
        // Initial Render
        document.getElementById('loadingIndicator').style.display = 'none';
        renderPage(currentPage);
    } catch (e) {
        document.getElementById('loadingIndicator').textContent = "Failed to load test data. Ensure JSON files are built.";
        console.error(e);
    }
    
    // 3. Render Engine
    function renderPage(pageIndex) {
        const wrapper = document.getElementById('questionWrapper');
        wrapper.innerHTML = '';
        
        const start = pageIndex * PER_PAGE;
        const end = Math.min(start + PER_PAGE, questions.length);
        const pageQuestions = questions.slice(start, end);
        
        pageQuestions.forEach((q, idx) => {
            const block = document.createElement('div');
            block.className = 'question-block fade-in';
            
            // Question text
            let html = `<div class="question-text">${q.id}. ${q.question}</div>`;
            
            // Image Placeholder Logic
            if (q.image) {
                html += `
                <div class="media-placeholder image-placeholder lazy-media" data-src="${q.image}" data-type="image">
                    <span>Image Loading...</span>
                </div>`;
            }
            
            // Audio Placeholder Logic
            if (q.audio) {
                html += `
                <div class="audio-wrapper lazy-media" data-src="${q.audio}" data-type="audio">
                     <button class="audio-play-btn" disabled>▶</button>
                     <span>Audio loading...</span>
                </div>`;
            }
            
            // Shuffled Options
            const shuffledOptions = shuffleArray([...q.options]);
            
            html += `<ul class="options-list">`;
            shuffledOptions.forEach(opt => {
                const isChecked = answers[q.id] === opt ? 'checked' : '';
                html += `
                <li class="option-item">
                    <label class="option-label">
                        <input type="radio" name="q_${q.id}" value="${opt}" ${isChecked}>
                        ${opt}
                    </label>
                </li>`;
            });
            html += `</ul>`;
            
            block.innerHTML = html;
            wrapper.appendChild(block);
            
            // Bind radio change
            block.querySelectorAll(`input[name="q_${q.id}"]`).forEach(radio => {
                radio.addEventListener('change', (e) => {
                    answers[q.id] = e.target.value;
                    localStorage.setItem('jlpt_test_answers', JSON.stringify(answers));
                });
            });
        });
        
        updatePagination(pageIndex, Math.ceil(questions.length / PER_PAGE));
        initLazyLoading();
    }
    
    // 4. Pagination
    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            renderPage(currentPage);
            window.scrollTo({top: 0});
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        const totalPages = Math.ceil(questions.length / PER_PAGE);
        if (currentPage < totalPages - 1) {
            currentPage++;
            renderPage(currentPage);
            window.scrollTo({top: 0});
        }
    });

    document.getElementById('submitBtn').addEventListener('click', submitTest);

    function updatePagination(pageIndex, totalPages) {
        document.getElementById('progressIndicator').textContent = `Page ${pageIndex + 1} of ${totalPages}`;
        document.getElementById('prevBtn').style.display = pageIndex === 0 ? 'none' : 'inline-block';
        
        if (pageIndex === totalPages - 1) {
            document.getElementById('nextBtn').style.display = 'none';
            document.getElementById('submitBtn').style.display = 'inline-block';
        } else {
            document.getElementById('nextBtn').style.display = 'inline-block';
            document.getElementById('submitBtn').style.display = 'none';
        }
    }
    
    // 5. Timer System
    function initTimer(durationMinutes) {
        const now = Date.now();
        let endTime = localStorage.getItem('jlpt_timer_end');
        
        if (!endTime) {
            endTime = now + (durationMinutes * 60 * 1000);
            localStorage.setItem('jlpt_timer_end', endTime);
        }
        
        const badge = document.getElementById('timerBadge');
        
        const interval = setInterval(() => {
            const left = parseInt(endTime) - Date.now();
            
            if (left <= 0) {
                clearInterval(interval);
                badge.textContent = "00:00:00";
                alert("Time is up! Submitting test automatically.");
                submitTest();
                return;
            }
            
            const hours = Math.floor(left / (1000 * 60 * 60));
            const mins = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((left % (1000 * 60)) / 1000);
            
            badge.textContent = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
        }, 1000);
    }
    
    function pad(num) {
        return num.toString().padStart(2, '0');
    }
    
    // 6. Submit Logic
    function submitTest() {
        // Save final answers, redirect to result
        localStorage.setItem('jlpt_test_answers', JSON.stringify(answers));
        window.location.href = 'result.html';
    }

    // 7. Security (Anti-Cheating)
    function preventCheating() {
        document.addEventListener('contextmenu', e => e.preventDefault());
        
        let cheatCount = 0;
        window.addEventListener('blur', () => {
            cheatCount++;
            const warning = document.getElementById('cheatWarning');
            warning.style.display = 'block';
            warning.innerText = `Warning: Tab switching detected (${cheatCount} times). This is logged.`;
            setTimeout(() => { warning.style.display = 'none'; }, 5000);
        });
    }

    // 8. Util
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 9. Lazy Loading System (Images and Audio)
    function initLazyLoading() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.2
        };

        const mediaObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const src = el.getAttribute('data-src');
                    const type = el.getAttribute('data-type');
                    
                    if (type === 'image') {
                        const img = new Image();
                        img.src = src;
                        img.alt = "JLPT Question Image";
                        img.style.maxWidth = "100%";
                        img.style.borderRadius = "var(--border-radius)";
                        img.className = "fade-in";
                        
                        img.onload = () => {
                            el.parentNode.replaceChild(img, el);
                        };
                        img.onerror = () => {
                            el.innerHTML = `<span style="color:red">Failed to load image</span>`;
                        };
                    } 
                    else if (type === 'audio') {
                        const audio = new Audio();
                        
                        // We do not play it automatically, we wait for click
                        const btn = el.querySelector('.audio-play-btn');
                        const span = el.querySelector('span');
                        
                        span.textContent = "Audio ready";
                        btn.disabled = false;
                        
                        const handlePlay = () => {
                            if (!audio.src) audio.src = src; // Lazy assign source mapping
                            if (audio.paused) {
                                audio.play();
                                btn.textContent = '⏸';
                            } else {
                                audio.pause();
                                btn.textContent = '▶';
                            }
                        };
                        
                        btn.addEventListener('click', handlePlay);
                        
                        audio.onended = () => { btn.textContent = '▶'; };
                        audio.onerror = () => { span.textContent = "Error loading audio"; btn.disabled = true; };
                    }
                    
                    observer.unobserve(el);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.lazy-media').forEach(mediaEl => {
            mediaObserver.observe(mediaEl);
        });
    }
});
