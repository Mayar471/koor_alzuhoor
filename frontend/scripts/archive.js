// /frontend/js/archive.js (المنطق المخصص لصفحة الأرشيف)
// ------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {

    const WORKS_API_URL = '/api/public/works'; 
    const TEAM_API_URL = '/api/team'; 
    const settings= '../data/meta.json';
    const settingsObject = Array.isArray(settings) 
                ? settings.reduce((acc, setting) => { acc[setting.key] = setting.value; return acc; }, {})
                : (settings || {});
    // ------------------------------------------------
    // 1. الترجمة (Translations) - دعم ثلاث لغات
    // ------------------------------------------------
    const translations = {
        'ar': {
            'error_loading_works': 'حدث خطأ في تحميل قائمة الأعمال الأرشيفية.',
            'error_loading_team': 'حدث خطأ في تحميل بيانات فريق العمل.',
            'no_works_archive': 'لا توجد أعمال أرشيفية مميزة (تيكر فقط) لعرضها حالياً.',
            'no_team_members': 'لم يتم العثور على أعضاء فريق العمل.',
            'default_date': 'سنة الإنتاج',
            'loading_works': 'جاري تحميل أعمال الأرشيف...',
            'loading_team': 'جاري تحميل أسماء فريق العمل...',
            'archive_ticker_only': 'أرشيف مميز (تيكر)', 
        },
        'en': {
            'error_loading_works': 'Could not load archive works list.',
            'error_loading_team': 'Could not load team data.',
            'no_works_archive': 'No featured archive works (Ticker only) found.',
            'no_team_members': 'No team members found.',
            'default_date': 'Production Year',
            'loading_works': 'Loading archive works...',
            'loading_team': 'Loading team members...',
            'archive_ticker_only': 'Featured Archive (Ticker)',
        },
        'de': {
            'error_loading_works': 'Archivwerke konnten nicht geladen werden.',
            'error_loading_team': 'Teamdaten konnten nicht geladen werden.',
            'no_works_archive': 'Keine ausgewgetSelecteden Archivwerke (nur Ticker) gefunden.',
            'no_team_members': 'Keine Teammitglieder gefunden.',
            'default_date': 'Produktionsjahr',
            'loading_works': 'Archivwerke werden geladen...',
            'loading_team': 'Teammitglieder werden geladen...',
            'archive_ticker_only': 'Ausgewähltes Archiv (Ticker)',
        }
    };

    /** دالة لجلب النص المترجم حسب المفتاح واللغة الحالية */
    function getTranslatedText(key, lang = document.documentElement.lang) {
        const fallbackLang = 'ar';
        const langData = translations[lang] || translations[fallbackLang];
        return langData[key] || translations[fallbackLang][key] || `[${key} Not Found]`;
    }

    /** دالة لتطبيق إعدادات اللغة الأساسية وترجمة الثوابت */
    function applyLanguageSettings(lang) {
        document.documentElement.lang = lang;
        document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
        document.body.classList.remove('ar', 'en', 'de');
        document.body.classList.add(lang);
        
        // ترجمة العناصر بناءً على خاصية data-lang
        document.querySelectorAll('[data-en], [data-de]').forEach(el => {
            const textKey = `data-${lang}`;
            const newText = el.getAttribute(textKey) || el.getAttribute('data-ar') || el.textContent;

            if (el.tagName.toLowerCase() === 'title') {
                document.title = newText;
            } else if (el.tagName.toLowerCase() !== 'img') {
                el.textContent = newText;
            }
        });
        
        const langDisplay = document.getElementById('current-lang-display');
        if(langDisplay) langDisplay.textContent = lang.toUpperCase();
    }


    // ------------------------------------------------
    // 2. الدالة المركزية لجلب البيانات وعرضها
    // ------------------------------------------------
    async function loadArchiveContent() {
        // تحديث رسائل التحميل الأولية
        document.getElementById('archive-ticker-container').innerHTML = `<p>${getTranslatedText('loading_works')}</p>`;
        document.getElementById('team-container').innerHTML = `<p>${getTranslatedText('loading_team')}</p>`;
        
        try {
            const [worksResponse, teamResponse] = await Promise.all([
                fetch(WORKS_API_URL), 
                fetch(TEAM_API_URL)
            ]);
            
            // جلب البيانات
            const worksData = worksResponse.ok ? await worksResponse.json() : [];
            const teamData = teamResponse.ok ? await teamResponse.json() : [];
            
            // 💡 الفلترة: الأعمال الأرشيفية (is_ticker ONLY)
            const archiveWorks = worksData.filter(work => 
                work.is_ticker && 
                !work.is_festival_work &&
                !work.is_news &&
                !work.is_timeline_event
            );
            
            // العرض والتهيئة
            renderArchiveTickerWorks(archiveWorks);
            renderTeam(teamData); 
            updateFooterContact(settingsObject)
            initializeThemeToggle();
            initializeLanguageDropdown(); 
            initializeMobileNav();
            initializeIntersectionObserver();

        } catch (error) {
            console.error("Error loading content:", error);
            
            const isTeamError = error.message.includes("Team API Error");
            const errorKey = isTeamError ? 'error_loading_team' : 'error_loading_works';
            const containerId = isTeamError ? 'team-container' : 'archive-ticker-container';
            
            const errorMessage = getTranslatedText(errorKey); 
            const dataEn = getTranslatedText(errorKey, 'en'); 
            const dataDe = getTranslatedText(errorKey, 'de'); 
            
            document.getElementById(containerId).innerHTML = `<p class="error-message" data-en="${dataEn}" data-de="${dataDe}">${errorMessage}</p>`;
        }
    }
    
    /** عرض الأعمال الأرشيفية (TICKER ONLY) */
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
    function renderArchiveTickerWorks(works) {
        const container = document.getElementById('archive-ticker-container');
        container.innerHTML = ''; 

        if (!works || works.length === 0) {
            const msg = getTranslatedText('no_works_archive');
            const msgEn = getTranslatedText('no_works_archive', 'en');
            const msgDe = getTranslatedText('no_works_archive', 'de');
            container.innerHTML = `<p data-en="${msgEn}" data-de="${msgDe}">${msg}</p>`;
            return;
        }

        works.forEach(work => {
            // isArchive: true يضمن تنسيق archive-card
            const workCard = createWorkCard(work, true, 'archive_ticker_only'); 
            container.appendChild(workCard);
        });
    }

    /** عرض فريق العمل */
    function renderTeam(teamMembers) {
        const container = document.getElementById('team-container');
        container.innerHTML = '';
        
        if (!teamMembers || teamMembers.length === 0) {
            const msg = getTranslatedText('no_team_members');
            const msgEn = getTranslatedText('no_team_members', 'en');
            const msgDe = getTranslatedText('no_team_members', 'de');
            container.innerHTML = `<p data-en="${msgEn}" data-de="${msgDe}">${msg}</p>`;
            return;
        }

        teamMembers.forEach(member => {
            const currentLang = document.documentElement.lang || 'ar'; 
            const name = member[`name_${currentLang}`] || member.name;
            const role = member[`role_${currentLang}`] || member.role;
            const memberCard = document.createElement('div');
            memberCard.classList.add('team-member', 'fade-in');
            
            memberCard.innerHTML = `
                <div class="member-info">
                    <h4 class="member-name">${name}</h4>
                    <p class="member-role">${role}</p>
                </div>
            `;
            container.appendChild(memberCard);
        });
    }
    
    /** إنشاء بطاقة عمل (باستخدام التنسيق الأرشيفي لبطاقات التيكر) */
    function createWorkCard(work, isArchive, tagKey) {
        const card = document.createElement('a');
        card.href = `single-item.html?id=${work.id}&type=work`;
        card.classList.add('work-card', 'fade-in');
        
        if (isArchive) {
            card.classList.add('archive-card'); 
        }

        const currentLang = document.documentElement.lang || 'ar'; 
        const title = work[`title_${currentLang}`] || work.title_ar;
        const summary = work[`summary_${currentLang}`] || work.summary_ar;
        const imageUrl = work.cover_image_url || 'images/default-cover.jpg'; 
        const imageAlt = work[`cover_image_alt_${currentLang}`] || title;
        const dateDisplay = work[`date_${currentLang}_display`] || work.production_year || getTranslatedText('default_date', currentLang);

        const tagClass = tagKey.replace(/_/g, '-');
        const tagText = getTranslatedText(tagKey, currentLang);
        const tagTextEn = getTranslatedText(tagKey, 'en');
        const tagTextDe = getTranslatedText(tagKey, 'de');

        const archiveTag = `<span class="archive-tag ${tagClass}" data-en="${tagTextEn}" data-de="${tagTextDe}">${tagText}</span>`;

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


    // ------------------------------------------------
    // 3. دوال التهيئة (المظهر واللغة والتنقل) 
    // ------------------------------------------------
    
    function initializeThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const body = document.body;
        const currentTheme = localStorage.getItem('theme') || 'dark-mode';
        
        body.classList.remove('light-mode', 'dark-mode');
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
            // إغلاق القائمة عند النقر على رابط
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
    
    // 1. تعيين اللغة الأساسية والترجمة الثابتة فوراً
    const initialLang = localStorage.getItem('lang') || 'ar';
    applyLanguageSettings(initialLang); 

    // 2. بدء عملية جلب البيانات والعرض
    loadArchiveContent();
});