// js/contact.js (الكود النهائي والمصحح بالكامل)

document.addEventListener('DOMContentLoaded', () => {
    
    // تعريف الثوابت
    const META_PATH = '../data/meta.json';
    const container = document.getElementById('contact-info-container');
    
    // قراءة اللغة المحفوظة والتحقق منها
    let currentLang = localStorage.getItem('lang') || 'ar'; 
    const supportedLangs = ['ar', 'en', 'de'];
    if (!supportedLangs.includes(currentLang)) currentLang = 'ar';


    // ************************************************
    // ********** 1. دوال التحكم بالوضع (THEME TOGGLE) **********
    // ************************************************
    
    function updateThemeIcon(isLightMode) {
        const toggleBtn = document.getElementById('theme-toggle');
        const icon = toggleBtn ? toggleBtn.querySelector('i.fas') : null; 
        
        if (icon) {
            if (isLightMode) {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            } else {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }
    }

    function initializeThemeToggle() {
        const toggleBtn = document.getElementById('theme-toggle');
        const isLightMode = localStorage.getItem('theme') === 'light';
        if (isLightMode) {
            document.body.classList.add('light-mode');
        }
        updateThemeIcon(isLightMode); 

        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault(); 
                const body = document.body;
                body.classList.toggle('light-mode');
                
                const isNowLight = body.classList.contains('light-mode');
                localStorage.setItem('theme', isNowLight ? 'light' : 'dark');
                updateThemeIcon(isNowLight);
            });
        }
    }
    
    // ************************************************
    // ********** 2. دالة التحكم بالقائمة المنسدلة للغة (مع التحميل التلقائي) **********
    // ************************************************
    
    function initializeLanguageSwitch() {
        // IDs تم تصحيحها بالكامل
        const langWrapper = document.getElementById('lang-dropdown-wrapper');
        const langMenuButton = document.getElementById('lang-menu-button'); 
        const langCurrentDisplay = document.getElementById('current-lang-display');
        const langOptions = document.querySelectorAll('#lang-dropdown-content .lang-option');
        const langCodeMap = { ar: 'AR', en: 'EN', de: 'DE' };
        
        // 1. تطبيق اللغة الأولية عند التحميل
        document.documentElement.lang = currentLang;
        document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
        
        if (langCurrentDisplay) {
             langCurrentDisplay.textContent = langCodeMap[currentLang];
        }

        // 2. منطق فتح وإغلاق القائمة المنسدلة
        if (langMenuButton && langWrapper) {
            langMenuButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                langWrapper.classList.toggle('open');
            });
            
            document.addEventListener('click', (e) => {
                 if (langWrapper && !langWrapper.contains(e.target)) {
                    langWrapper.classList.remove('open');
                }
            });
        }

        // 3. منطق اختيار لغة جديدة (التحميل التلقائي)
        langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const newLang = option.getAttribute('data-lang');

                if (newLang !== currentLang) {
                    // 1. حفظ اللغة
                    localStorage.setItem('lang', newLang);

                    // 2. إعادة تحميل الصفحة تلقائياً
                    window.location.reload();
                    
                    // لن يتم تنفيذ أي كود بعد هذا السطر
                }

                langWrapper.classList.remove('open'); 
            });
        });
        
        // 4. تطبيق الترجمة على العناصر الثابتة عند التحميل (يتم استدعاؤها مرة واحدة)
        translateAllContent(currentLang);
    }
    
    // ************************************************
    // ********** 3. الدالة المركزية والدوام المساعدة **********
    // ************************************************
    
    async function loadContactInfo() {
        let metaData = {};
        
        // يجب تهيئة تبديل الوضع أولاً وقراءة اللغة
        initializeThemeToggle(); 

        try {
            const response = await fetch(META_PATH);
            
            if (!response.ok) {
                 throw new Error(`Failed to fetch meta data.`);
            }

            metaData = await response.json();
            
            // عرض تفاصيل التواصل والسوشيال ميديا في نفس المكان
            renderContactItems(metaData.contact, container); 
            
        } catch (error) {
            console.error("Error loading contact info:", error);
            container.innerHTML = `<p class=\"error-message\" data-en=\"Could not load contact information.\" data-de=\"Kontaktinformationen konnten nicht geladen werden.\">حدث خطأ في تحميل معلومات التواصل.</p>`;
            translateAllContent(currentLang); 
        } finally {
            // تهيئة عناصر التفاعل المشتركة
            initializeLanguageSwitch(); // لا نمرر البيانات لأنها لن تستخدم مع إعادة التحميل
            initializeMobileNav();
            initializeIntersectionObserver();
        }
    }
    
    // دالة مساعدة لتطبيق الترجمة على الصفحة بأكملها (العناصر ذات data-en/data-de)
    function translateAllContent(lang) {
        const translatableElements = document.querySelectorAll('[data-en], [data-de]');
        translatableElements.forEach(el => {
            
            // حفظ النص الأصلي (العربي) عند أول تحميل لكي نعود إليه
            if (!el.hasAttribute('data-lang-original')) {
                 el.setAttribute('data-lang-original', el.textContent);
            }
            
            const originalText = el.getAttribute('data-lang-original');
            const enText = el.getAttribute('data-en');
            const deText = el.getAttribute('data-de');

            if (lang === 'en' && enText) {
                el.textContent = enText;
            } else if (lang === 'de' && deText) {
                el.textContent = deText;
            } else {
                // العودة للعربي
                el.textContent = originalText;
            }
        });
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }

    // دالة عرض عناصر التواصل (تم إضافة روابط السوشيال ميديا إليها)
    function renderContactItems(contactData, targetContainer) {
        if (!contactData || Object.keys(contactData).length === 0) {
            targetContainer.innerHTML = `<p class=\"error-message\" data-en=\"No contact details available.\" data-de=\"Keine Kontaktdaten verfügbar.\">لا توجد تفاصيل تواصل متاحة.</p>`;
            return;
        }

        const lang = localStorage.getItem('lang') || 'ar'; 
        let html = '';

        // 1. تعريف عناصر التواصل الأساسية
        const primaryItems = [
            { key: 'email', icon: 'fas fa-envelope', type: 'email', title: { ar: 'البريد الإلكتروني', en: 'Email', de: 'E-Mail' } },
            { key: 'phone', icon: 'fas fa-phone', type: 'phone', title: { ar: 'هاتف / واتساب', en: 'Phone / WhatsApp', de: 'Telefon / WhatsApp' } },
            { key: 'location', icon: 'fas fa-map-marker-alt', type: 'location', title: { ar: 'الموقع', en: 'Location', de: 'Standort' } },
        ];

        // 2. تعريف عناصر التواصل الاجتماعي (التي ستظهر في القائمة)
        const socialItems = [
            { key: 'facebook', icon: 'fab fa-facebook-f', type: 'social', title: { ar: 'فيسبوك', en: 'Facebook', de: 'Facebook' } },
            { key: 'instagram', icon: 'fab fa-instagram', type: 'social', title: { ar: 'إنستغرام', en: 'Instagram', de: 'Instagram' } },
        ];
   

        const allItems = [...primaryItems, ...socialItems];

        allItems.forEach(item => {
            const key = item.key;
            let value = contactData[key]; 
            let link = '#';
            let displayValue = '';
            
            const title = item.title[lang] || item.title.ar;

            // تحديد القيمة ورابط الارتباط حسب نوع العنصر
            if (item.type === 'email' && value) {
                link = `mailto:${value}`;
                displayValue = value;
            } else if (item.type === 'phone' && value) {
                // نفتح رابط الواتساب في نافذة جديدة
                link = `https://wa.me/${value.replace(/\s/g, '')}`;
                displayValue = value;
            } else if (item.type === 'location' && typeof contactData.location === 'object') {
                // قراءة الموقع المترجم من كائن البيانات
                displayValue = contactData.location[lang] || contactData.location.ar; 
                // رابط بحث على خرائط جوجل
                link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayValue)}`;
            } else if (item.type === 'social' && contactData[key + 'Link']) {
                // استخدام الروابط الخاصة بالسوشيال ميديا (مثل facebookLink)
                link = contactData[key + 'Link'];
                displayValue = contactData[key + 'Name'] || key; // عرض الاسم بدلاً من الرابط الطويل
            }
            
            // عرض العنصر إذا كانت قيمته أو رابطته موجودة
            if (displayValue && link !== '#') {
                html += `
                    <div class="contact-item fade-in">
                        <a href="${link}" class="contact-link-wrapper" target="_blank" rel="noopener noreferrer">
                            <div class="icon-wrapper"><i class="${item.icon}"></i></div>
                            <div class="contact-details">
                                <span class="contact-title">${title}</span>
                                <span class="contact-value">${displayValue}</span>
                            </div>
                        </a>
                    </div>
                `;
            }
        });
        
        targetContainer.innerHTML = html;
        // نطبق الترجمة على رسالة الخطأ في حالة عدم توفر بيانات
        translateAllContent(lang); 
    }
    
    // دوال الملاحة والتحريك تبقى كما هي
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
        }, {
            threshold: 0.1
        });

        elementsToAnimate.forEach(element => observer.observe(element));
    }
    
    // بدء تحميل الصفحة
    loadContactInfo();
});