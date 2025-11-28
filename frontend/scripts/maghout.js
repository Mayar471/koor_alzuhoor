// /frontend/js/maghout.js (الكود المصحح ليتناسب مع منطق الفلترة الجديد)
// ------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {

    const WORKS_API_URL = '/api/public/works'; 
    const META_FILE = '../data/meta.json'; 
    const settings= '../data/meta.json';
    const settingsObject = Array.isArray(settings) 
                ? settings.reduce((acc, setting) => { acc[setting.key] = setting.value; return acc; }, {})
                : (settings || {});
    // **********************************************
    // ********** دوال وبيانات الترجمة **********
    // **********************************************
    const translations = {
        'ar': {
            'error_loading': 'حدث خطأ في تحميل قائمة الأعمال.',
            'no_works_archive': 'لا توجد أعمال أرشيفية (مهرجان/تيكر) لعرضها حالياً.',
            'no_works_regular': 'لا توجد أعمال مهرجانية أخرى لعرضها حالياً.', 
            'default_date': 'سنة الإنتاج',
            'loading_works': 'جاري تحميل الأعمال...',
            'archive_festival_ticker': 'أرشيف مهرجان مميز', 
            'archive_festival_only': 'عمل مهرجان' 
        },
        'en': {
            'error_loading': 'Could not load works list.',
            'no_works_archive': 'No archived works (Festival/Ticker) found.',
            'no_works_regular': 'No other festival works found.',
            'default_date': 'Production Year',
            'loading_works': 'Loading works...',
            'archive_festival_ticker': 'Featured Festival Archive',
            'archive_festival_only': 'Festival Work'
        }
    };

    /** دالة لجلب النص المترجم حسب المفتاح واللغة الحالية */
    function getTranslatedText(key, lang = document.documentElement.lang) {
        const fallbackLang = 'ar';
        if (translations[lang] && translations[lang][key]) {
            return translations[lang][key];
        }
        return translations[fallbackLang][key] || 'Text Not Found';
    }

    /** ترجمة النصوص الثابتة في الـ HTML (باستخدام data-lang) */
    function translateStaticElements(lang) {
        const elements = document.querySelectorAll('[data-en], [data-de]');
        elements.forEach(el => {
            const textKey = `data-${lang}`;
            const fallbackKey = 'data-ar'; 
            
            const newText = el.getAttribute(textKey) || el.getAttribute(fallbackKey) || el.textContent;

            if (el.tagName.toLowerCase() === 'title') {
                document.title = newText;
            } else if (el.tagName.toLowerCase() !== 'img') {
                el.textContent = newText;
            }
        });
        
        const langDisplay = document.getElementById('current-lang-display');
        if(langDisplay) langDisplay.textContent = lang.toUpperCase();
    }
    
    /** دالة لتطبيق إعدادات اللغة الأساسية وترجمة الثوابت */
    function applyLanguageSettings(lang) {
        document.documentElement.lang = lang;
        document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
        document.body.classList.remove('ar', 'en', 'de');
        document.body.classList.add(lang);
        
        translateStaticElements(lang);
    }

    // **********************************************
    // ********** 1. الدالة المركزية لجلب البيانات وعرضها **********
    // **********************************************
    async function loadAllWorks() {
        try {
            const regularContainer = document.getElementById('regular-works-container');
            regularContainer.innerHTML = `<p data-en="${getTranslatedText('loading_works', 'en')}">${getTranslatedText('loading_works')}</p>`;
            
            const [worksResponse, metaResponse] = await Promise.all([
                fetch(WORKS_API_URL), 
                fetch(META_FILE)
            ]);
            
            if (!worksResponse.ok) {
                 throw new Error(`Failed to fetch works data. Status: ${worksResponse.status}`);
            }
            
            const worksData = await worksResponse.json();
            
            // 💡 1. الفلترة الجديدة: الأعمال الأرشيفية (is_festival_work AND is_ticker)
            const archiveWorks = worksData.filter(work => work.is_festival_work && work.is_ticker);
            
            // 💡 2. الفلترة الجديدة: الأعمال العادية (is_festival_work ONLY)
            const regularWorks = worksData.filter(work => 
                work.is_festival_work &&        // يجب أن يكون عمل مهرجان
                !work.is_ticker &&              // يجب ألا يكون تيكر (لفصله عن الأرشيف)
                !work.is_news && 
                !work.is_timeline_event
            );
            
            // أي عمل لا يقع ضمن المجموعتين أعلاه لن يتم عرضه

            renderArchiveWorks(archiveWorks);
            renderRegularWorks(regularWorks);
            updateFooterContact(settingsObject)

            // تهيئة عناصر التفاعل
            initializeThemeToggle();
            initializeLanguageDropdown(); 
            initializeMobileNav();
            initializeIntersectionObserver();

        } catch (error) {
            console.error("Error loading all works:", error);
            const container = document.getElementById('regular-works-container');
            const errorMessage = getTranslatedText('error_loading'); 
            const dataEn = getTranslatedText('error_loading', 'en'); 
            container.innerHTML = `<p class="error-message" data-en="${dataEn}">${errorMessage}</p>`;
        }
    }
    
    // **********************************************
    // ********** 2. دوال العرض والتصفية **********
    // **********************************************
    
    /** عرض الأعمال الأرشيفية (عرض طولي بالكامل) */
    function renderArchiveWorks(works) {
        const container = document.getElementById('archive-works-container');
        const section = document.getElementById('archive-works-section');
        container.innerHTML = ''; 

        if (!works || works.length === 0) {
            section.style.display = 'none'; 
            return;
        }

        section.style.display = 'block'; 
        works.forEach(work => {
            const workCard = createWorkCard(work, true); // إرسال علامة (isArchive: true)
            container.appendChild(workCard);
        });
    }

    /** عرض الأعمال العادية (بنظام الشبكة) */
    function renderRegularWorks(works) {
        const container = document.getElementById('regular-works-container');
        container.innerHTML = ''; 

        if (!works || works.length === 0) {
            const noWorksMessage = getTranslatedText('no_works_regular');
            const dataEn = getTranslatedText('no_works_regular', 'en');
            container.innerHTML = `<p data-en="${dataEn}">${noWorksMessage}</p>`;
            return;
        }

        works.forEach(work => {
            const workCard = createWorkCard(work, false); // إرسال علامة (isArchive: false)
            container.appendChild(workCard);
        });
    }

    function createWorkCard(work, isArchive) {
        const card = document.createElement('a');
        card.href = `single-item.html?id=${work.id}&type=work`;
        card.classList.add('work-card', 'fade-in');
        
        // تطبيق كلاس خاص للتنسيق الأرشيفي
        if (isArchive) {
            card.classList.add('archive-card'); 
        }

        const currentLang = document.documentElement.lang || 'ar'; 
        
        const title = work[`title_${currentLang}`] || work.title_ar;
        const summary = work[`summary_${currentLang}`] || work.summary_ar;
        const imageUrl = work.cover_image_url || 'images/default-cover.jpg'; 
        const imageAlt = work[`cover_image_alt_${currentLang}`] || title;
        const dateDisplay = work[`date_${currentLang}_display`] || work.production_year || getTranslatedText('default_date', currentLang);

        // تحديد التسمية الأرشيفية حسب المنطق الجديد
        let archiveTag = '';
        if (isArchive) {
            // الحالة الوحيدة للأرشيف هي: is_festival_work && is_ticker
            let tagKey = 'archive_festival_ticker';
            archiveTag = `<span class="archive-tag archive-festival-ticker">${getTranslatedText(tagKey, currentLang)}</span>`;
        } else if (work.is_festival_work) {
            // إذا كان في القسم العادي ولكنه عمل مهرجان فقط
            let tagKey = 'archive_festival_only';
             archiveTag = `<span class="archive-tag archive-festival-only">${getTranslatedText(tagKey, currentLang)}</span>`;
        }


        card.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${imageUrl}" alt="${imageAlt}" class="card-image">
            </div>
            <div class="card-content">
                <h3 class="card-title">${title}</h3>
                <p class="card-summary">${summary}</p>
                <div class="card-meta">
                    <span class="card-date"><i class="fas fa-calendar-alt"></i> ${dateDisplay}</span>
                    ${archiveTag}
                </div>
            </div>
        `;
        return card;
    }
    
    // **********************************************
    // ********** 3. دوال التبديل (المظهر واللغة) **********
    // **********************************************
    
    function initializeThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const body = document.body;
        const currentTheme = localStorage.getItem('theme') || 'dark-mode';
        body.classList.add(currentTheme);

        themeToggle.addEventListener('click', () => {
            const newTheme = body.classList.contains('light-mode') ? 'dark-mode' : 'light-mode';
            body.classList.remove('light-mode', 'dark-mode');
            body.classList.add(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
    
    function initializeLanguageDropdown() {
        const langWrapper = document.getElementById('lang-dropdown-wrapper');
        const langMenuButton = document.getElementById('lang-menu-button');
        const currentLang = document.documentElement.lang || 'ar';
        
        if (langMenuButton && langWrapper) {
            langMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                langWrapper.classList.toggle('open'); 
            });

            document.addEventListener('click', (e) => {
                if (!langWrapper.contains(e.target)) {
                    langWrapper.classList.remove('open');
                }
            });
        }
        
        const langOptions = document.querySelectorAll('#lang-dropdown-content .lang-option');
        langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                
                const newLang = option.getAttribute('data-lang');
                
                if (newLang !== currentLang) {
                    localStorage.setItem('lang', newLang);
                    window.location.reload(); 
                }

                langWrapper.classList.remove('open');
            });
        });
    }

    function initializeMobileNav() {
        const navToggleBtn = document.getElementById('nav-toggle-btn');
        const mainNav = document.getElementById('main-nav');
        const body = document.body;
        if (navToggleBtn && mainNav) {
            navToggleBtn.addEventListener('click', () => {
                mainNav.classList.toggle('active'); 
                body.classList.toggle('nav-open'); 
            });
            mainNav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mainNav.classList.remove('active');
                    body.classList.remove('nav-open');
                });
            });
        }
    }
    function updateFooterContact(settings) {
        const emailLi = document.getElementById('footer-contact-email');
        const locationLi = document.getElementById('footer-contact-location');
        
        const email = settings.email || (Array.isArray(settings) ? settings.find(s=>s.key==='email')?.value : '');
        const addressAr = settings.address_ar || (Array.isArray(settings) ? settings.find(s=>s.key==='address_ar')?.value : '');

        if (emailLi) {
            emailLi.innerHTML = `<i class="fas fa-envelope"></i> ${email || 'kooralzohoor@gmail.com'}`;
        }
        
        if (locationLi) {
            locationLi.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${addressAr || 'سوريا - سلمية'}`;
        }
    }
    function initializeIntersectionObserver() {
        const elementsToAnimate = document.querySelectorAll('.fade-in');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        elementsToAnimate.forEach(element => observer.observe(element));
    }


    // **********************************************
    // ********** نقطة البداية **********
    // **********************************************
    
    // 1. تعيين اللغة الأساسية والترجمة الثابتة فوراً
    const initialLang = localStorage.getItem('lang') || 'ar';
    applyLanguageSettings(initialLang); 

    // 2. بدء عملية جلب البيانات والعرض
    loadAllWorks();
});