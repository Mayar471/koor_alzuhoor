// /frontend/js/works.js (الكود الكامل والمصحَّح)
// ------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {

    const WORKS_API_URL = '/api/public/works'; 
    const META_FILE = '../data/meta.json'; 
    
    // **********************************************
    // ********** دوال وبيانات الترجمة **********
    // **********************************************
    const translations = {
        'ar': {
            'error_loading': 'حدث خطأ في تحميل قائمة الأعمال.',
            'no_works': 'لا توجد أعمال لعرضها حالياً.',
            'default_date': 'سنة الإنتاج',
            'loading_works': 'جاري تحميل الأعمال...'
        },
        'en': {
            'error_loading': 'Could not load works list.',
            'no_works': 'No works found at the moment.',
            'default_date': 'Production Year',
            'loading_works': 'Loading works...'
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
            const fallbackKey = 'data-ar'; // Fallback to AR if current lang data is missing
            
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
    
    /** 💡 دالة لتطبيق إعدادات اللغة الأساسية وترجمة الثوابت */
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
            // نستخدم رسالة التحميل المترجمة
            const container = document.getElementById('all-works-container');
            container.innerHTML = `<p data-en="${getTranslatedText('loading_works', 'en')}">${getTranslatedText('loading_works')}</p>`;
            
            const [worksResponse, metaResponse] = await Promise.all([
                fetch(WORKS_API_URL), 
                fetch(META_FILE)
            ]);
            
            if (!worksResponse.ok) {
                 throw new Error(`Failed to fetch works data. Status: ${worksResponse.status}`);
            }
            
            const worksData = await worksResponse.json();
            const metaData = metaResponse.ok ? await metaResponse.json() : {};
            

            const combinedData = { works: worksData, meta: metaData };
            
            // 💡 الآن: renderWorksGrid ستستخدم اللغة التي تم تعيينها في applyLanguageSettings
            renderWorksGrid(combinedData.works);
            
            // تهيئة عناصر التفاعل
            initializeThemeToggle();
            initializeLanguageDropdown(); 
            initializeMobileNav();
            initializeIntersectionObserver();
            updateFooterContact(metaData)

        } catch (error) {
            console.error("Error loading all works:", error);
            const container = document.getElementById('all-works-container');
            const errorMessage = getTranslatedText('error_loading'); 
            const dataEn = getTranslatedText('error_loading', 'en'); 
            container.innerHTML = `<p class="error-message" data-en="${dataEn}">${errorMessage}</p>`;
        }
    }
    
    // **********************************************
    // ********** 2. دوال العرض والتصفية **********
    // **********************************************
    
    function renderWorksGrid(works) {
        const container = document.getElementById('all-works-container');
        container.innerHTML = ''; 

        if (!works || works.length === 0) {
            const noWorksMessage = getTranslatedText('no_works');
            const dataEn = getTranslatedText('no_works', 'en');
            container.innerHTML = `<p data-en="${dataEn}">${noWorksMessage}</p>`;
            return;
        }

        works.forEach(work => {
            // التصفية: إظهار الأعمال التي ليست أخبار وليست أحداثاً زمنية وليست أعمال مهرجان
            if(!work.is_news && !work.is_timeline_event && !work.is_festival_work){
                const workCard = createWorkCard(work);
                container.appendChild(workCard);
            }
        });
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
    function createWorkCard(work) {
        const card = document.createElement('a');
        card.href = `single-item.html?id=${work.id}&type=work`;
        card.classList.add('work-card', 'fade-in');
        
        // 💡 يتم جلب اللغة من DOM (التي تم تعيينها بواسطة applyLanguageSettings)
        const currentLang = document.documentElement.lang || 'ar'; 
        
        // 💡 استخدام الحقول المترجمة حسب اللغة الحالية
        const title = work[`title_${currentLang}`] || work.title_ar;
        const summary = work[`summary_${currentLang}`] || work.summary_ar;
        const imageUrl = work.cover_image_url || 'images/default-cover.jpg'; 
        const imageAlt = work[`cover_image_alt_${currentLang}`] || title;
        const dateDisplay = work[`date_${currentLang}_display`] || work.production_year || getTranslatedText('default_date', currentLang);

        card.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${imageUrl}" alt="${imageAlt}" class="card-image">
            </div>
            <div class="card-content">
                <h3 class="card-title">${title}</h3>
                <p class="card-summary">${summary}</p>
                <div class="card-meta">
                    <span class="card-date"><i class="fas fa-calendar-alt"></i> ${dateDisplay}</span>
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
    
    /** 💡 دالة تهيئة القائمة المنسدلة للغة ومنطق التبديل/الإعادة تحميل (مطابقة لـ script.js) */
    function initializeLanguageDropdown() {
        const langWrapper = document.getElementById('lang-dropdown-wrapper');
        const langMenuButton = document.getElementById('lang-menu-button');
        const currentLang = localStorage.getItem('lang') || 'ar';
        
        // 1. منطق فتح وإغلاق القائمة المنسدلة
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
        
        // 2. منطق اختيار لغة جديدة (إعادة تحميل الصفحة)
        const langOptions = document.querySelectorAll('#lang-dropdown-content .lang-option');
        langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                
                const newLang = option.getAttribute('data-lang');
                
                if (newLang !== currentLang) {
                    localStorage.setItem('lang', newLang);
                    // إعادة تحميل الصفحة لتطبيق التغيير بالكامل
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
    
    // 1. تعيين اللغة الأساسية والترجمة الثابتة فوراً قبل أي عملية جلب
    const initialLang = localStorage.getItem('lang') || 'ar';
    applyLanguageSettings(initialLang); 
    // 2. بدء عملية جلب البيانات والعرض
    loadAllWorks();
});