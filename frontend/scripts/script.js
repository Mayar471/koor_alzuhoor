// /frontend/js/script.js
// ------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {

    const API_PATHS = {
        news: '/api/public/works?filter=news',
        featuredWorks: '/api/public/works?filter=featured',
        timelineEvents: '/api/public/works?filter=timeline',
        about: '../data/about.json',
        settings: '../data/meta.json',
    };

    // ------------------------------------------------
    // 1. الدالة المركزية: جلب ودمج البيانات
    // ------------------------------------------------
    async function loadAndRenderContent() {
        const paths = API_PATHS;
        
        const fetchPromises = Object.entries(paths).map(([key, url]) =>
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        console.warn(`Warning: Failed to load ${key} from ${url}`);
                        return [key, key === 'settings' ? [] : {}]; 
                    }
                    return response.json().then(data => [key, data]);
                })
                .catch(error => {
                    console.error(`Error loading ${key}:`, error);
                    return [key, key === 'settings' ? [] : {}];
                })
        );

        try {
            const results = await Promise.all(fetchPromises);
            const combinedData = Object.fromEntries(results);

            const settingsObject = Array.isArray(combinedData.settings) 
                ? combinedData.settings.reduce((acc, setting) => { acc[setting.key] = setting.value; return acc; }, {})
                : (combinedData.settings || {});
            
            const allData = {
                news: combinedData.news || [],
                featuredWorks: combinedData.featuredWorks || [],
                timelineEvents: combinedData.timelineEvents || [],
                about: combinedData.about || {},
                settings: settingsObject
            };
            
            renderNewsTicker(allData.news);
            renderFeaturedWorks(allData.featuredWorks);
            renderTimeline(allData.timelineEvents);
            renderAboutSection(allData.about);
            updateFooterContact(allData.settings);

            initializeThemeToggle();
            initializeLanguageSwitch(allData); 
            initializeMobileNav();
            initializeIntersectionObserver();

        } catch (error) {
            console.error("Critical error:", error);
        }
    }

    function renderNewsTicker(news) {
    const slider = document.getElementById("news-ticker-slider");
    if (!slider) return;

    const items = news.filter(n => n.is_ticker || n.is_news);
    if (items.length === 0) {
        slider.innerHTML = `<div class="ticker-item">لا توجد أخبار حالياً.</div>`;
        return;
    }

    const lang = document.documentElement.lang;

    slider.innerHTML = items.map(item => `
        <div class="ticker-item">
            <a href="single-item.html?id=${item.id}&type=work">
                <i class="fas fa-bullhorn"></i>
                ${item[`title_${lang}`] || item.title_ar}
            </a>
        </div>
    `).join("");

    let index = 0;
    const tickerItems = slider.querySelectorAll(".ticker-item");

    tickerItems.forEach(t => t.style.display = "none");
    tickerItems[0].style.display = "inline-flex";

    setInterval(() => {
        tickerItems[index].style.display = "none";
        index = (index + 1) % tickerItems.length;
        tickerItems[index].style.display = "inline-flex";
    }, 3000);
}

    function renderFeaturedWorks(works) {
        const container = document.getElementById('works-preview-container');
        if (!container) return;

        if (works.length === 0) {
             container.innerHTML = `<p style="width:100%; text-align:center;">لا توجد أعمال مميزة حالياً.</p>`;
             return;
        }

        const currentLang = document.documentElement.lang;
        // عرض أول 3 أعمال فقط
        container.innerHTML = works.slice(0, 3).map(work => {
            const title = work[`title_${currentLang}`] || work.title_ar;
            const summary = work[`summary_${currentLang}`] || work.summary_ar;
            const imageUrl = work.cover_image_url || 'images/default-cover.jpg'; 
            const dateDisplay = work[`date_${currentLang}_display`] || work.production_year;

            return `
                <a href="single-item.html?id=${work.id}&type=work" class="work-card fade-in">
                    <div class="card-image-wrapper">
                        <img src="${imageUrl}" alt="${title}" class="card-image">
                    </div>
                    <div class="card-content">
                        <h3 class="card-title">${title}</h3>
                        <p class="card-summary">${summary}</p>
                        <div class="card-meta">
                            <span class="card-date"><i class="fas fa-calendar-alt"></i> ${dateDisplay}</span>
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    }

    function renderTimeline(events) {
        const container = document.getElementById('timeline-container');
        if (!container) return;
        
        events.sort((a, b) => new Date(a.publication_date) - new Date(b.publication_date));

        if (events.length === 0) {
             container.innerHTML = `<p style="text-align:center;">الجدول الزمني فارغ حالياً.</p>`;
             return;
        }

        const currentLang = document.documentElement.lang;
        container.innerHTML = events.map((event, index) => {
            const title = event[`title_${currentLang}`] || event.title_ar;
            const content = event[`summary_${currentLang}`] || event.summary_ar;
            const year = event.production_year || (event.publication_date ? event.publication_date.substring(0, 4) : '----');
            // التناوب: زوجي يسار، فردي يمين
            const positionClass = index % 2 === 0 ? 'left' : 'right';

            return `
                <div class="timeline-item fade-in ${positionClass}">
                    <div class="timeline-content">
                        <h3>${title}</h3>
                        <p>${content}</p>
                        <span class="year">${year}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderAboutSection(aboutData) {
        const section = document.getElementById('about');
        if (!section) return;
        if (!aboutData.description_ar && !aboutData.descriptionAr) return;
        
        const currentLang = document.documentElement.lang;
        
        const desc = aboutData[`description_${currentLang}`] || aboutData.description_ar || aboutData.descriptionAr;
        const vis = aboutData[`vision_${currentLang}`] || aboutData.vision_ar || aboutData.visionAr;
        const photo = aboutData.team_photo_url || aboutData.teamPhotoUrl || 'images/team_photo.jpg';

        const summaryText = desc.length > 250 ? desc.substring(0, 250) + '...' : desc;

        const textP = document.getElementById('about-summary-text');
        if (textP) textP.innerHTML = summaryText;
        
        const visionP = document.getElementById('about-vision');
        if (visionP) visionP.innerHTML = vis;
        
        const img = section.querySelector('.about-image-side img');
        if (img) img.src = photo;
    }

    function updateFooterContact(settings) {
        const emailLi = document.getElementById('footer-contact-email');
        const locationLi = document.getElementById('footer-contact-location');
        
        const email = settings.contact.email || (Array.isArray(settings) ? settings.find(s=>s.key==='email')?.value : '');
        const addressAr = settings.address_ar || (Array.isArray(settings) ? settings.find(s=>s.key==='address_ar')?.value : '');

        if (emailLi) {
            emailLi.innerHTML = `<i class="fas fa-envelope"></i> ${email || 'info@kooralzuhur.com'}`;
        }
        
        if (locationLi) {
            locationLi.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${addressAr || 'سوريا - سلمية'}`;
        }
    }

    // ------------------------------------------------
    // 3. دوال الترجمة والتهيئة
    // ------------------------------------------------

    function translateStaticElements(lang) {
        const elements = document.querySelectorAll('[data-en]');
        
        elements.forEach(el => {
            if (lang === 'ar') {
                if (el.hasAttribute('data-ar')) {
                    el.textContent = el.getAttribute('data-ar');
                } 
                return;
            }

            let text = '';
            if (lang === 'de' && el.hasAttribute('data-de')) {
                text = el.getAttribute('data-de');
            } else {
                text = el.getAttribute('data-en');
            }

            if (text) el.textContent = text;
        });
    }

    function initializeThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const body = document.body;
        const savedTheme = localStorage.getItem('theme') || 'dark-mode';
        body.classList.add(savedTheme);

        // وظيفة لتحديث فيديو الـ Hero بشكل آمن
        const updateHeroVideo = (theme) => {
            const video = document.getElementById('hero-video');
            if (video) {
                const source = video.querySelector('source');
                if (source) {
                    // نستخدم الفيديو الأساسي للوضع الليلي، وفيديو _light للوضع النهاري
                    const defaultVid = 'images/logo_vid.mp4';
                    const lightVid = 'images/logo_vid_light.mp4';
                    
                    const newSrc = theme === 'dark-mode' ? defaultVid : lightVid;
                    
                    // لن نغير المصدر إلا إذا كان مختلفاً حقاً لتجنب الوميض
                    if (!source.src.includes(newSrc)) {
                        source.src = newSrc;
                        video.load(); 
                        video.play().catch(e => console.log("Video autoplay blocked or file missing:", e));
                    }
                }
            }
        };

        // تحديث الفيديو عند التحميل
        updateHeroVideo(savedTheme);

        if(themeToggle) {
            themeToggle.addEventListener('click', () => {
                if (body.classList.contains('light-mode')) {
                    body.classList.replace('light-mode', 'dark-mode');
                    localStorage.setItem('theme', 'dark-mode');
                    updateHeroVideo('dark-mode');
                } else {
                    body.classList.replace('dark-mode', 'light-mode');
                    localStorage.setItem('theme', 'light-mode');
                    updateHeroVideo('light-mode');
                }
            });
        }
    }
// حفظ النصوص العربية الأصلية مرة واحدة
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-en]").forEach(el => {
        if (!el.hasAttribute("data-ar")) {
            el.setAttribute("data-ar", el.textContent.trim());
        }
    });
});

   function initializeLanguageSwitch(allData) {
    const langWrapper = document.getElementById('lang-dropdown-wrapper');
    const langButton = document.getElementById('lang-menu-button');
    const langDisplay = document.getElementById('current-lang-display');

    const supportedLangs = ['ar', 'en', 'de'];

    let currentLang = localStorage.getItem('lang') || 'ar';
    if (!supportedLangs.includes(currentLang)) currentLang = 'ar';

    // حفظ النص العربي الأصلي
    document.querySelectorAll('[data-en]').forEach(el => {
        if (!el.hasAttribute('data-ar')) {
            el.setAttribute('data-ar', el.textContent.trim());
        }
    });

    const applyLanguage = (lang) => {
        // ضبط لغة الصفحة
        document.documentElement.lang = lang;
        document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
        localStorage.setItem('lang', lang);

        if (langDisplay) langDisplay.textContent = lang.toUpperCase();

        document.body.classList.remove('ar', 'en', 'de');
        document.body.classList.add(lang);

        // ترجمة النصوص الثابتة
        translateStaticElements(lang);

        // ⚠️ الأهم: إعادة رسم البيانات الديناميكية
        renderNewsTicker(allData.news);
        renderFeaturedWorks(allData.featuredWorks);
        renderTimeline(allData.timelineEvents);
        renderAboutSection(allData.about);
        updateFooterContact(allData.settings);
    };

    // تطبيق اللغة المحفوظة عند بداية الصفحة
    applyLanguage(currentLang);

    // فتح / إغلاق قائمة اللغات
    if (langButton && langWrapper) {
        langButton.addEventListener('click', (e) => {
            e.stopPropagation();
            langWrapper.classList.toggle('open');
        });

        document.addEventListener('click', () => {
            langWrapper.classList.remove('open');
        });
    }

    // اختيار لغة
    const langOptions = document.querySelectorAll('#lang-dropdown-content .lang-option');
    // اختيار لغة جديدة
langOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        e.preventDefault();
        
        const newLang = option.getAttribute('data-lang');

        if (newLang !== currentLang) {
            localStorage.setItem('lang', newLang);

            // إعادة تحميل الصفحة تلقائياً
            window.location.reload();
        }

        langWrapper.classList.remove('open');
    });
});

}


    function initializeMobileNav() {
        const btn = document.getElementById('nav-toggle-btn');
        const nav = document.getElementById('main-nav');
        if(btn && nav) {
            btn.addEventListener('click', () => {
                nav.classList.toggle('active');
            });
        }
    }

    function initializeIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        });
        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    }

    // بدء التنفيذ
    loadAndRenderContent();
});