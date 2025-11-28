// scripts/single-item.js
// ------------------------------------------------
// ملف شامل لصفحة تفاصيل العنصر (Single Item Page)
// يتضمن: جلب البيانات، منطق الترجمة، ومنطق تبديل الوضع (Dark/Light Mode)
// ------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    
    // تعريف الثوابت
    const WORKS_API_BASE_URL = '/api/public/works'; 
    const META_FILE = '../data/meta.json'; 
    const settings= '../data/meta.json';
    const settingsObject = Array.isArray(settings) 
                ? settings.reduce((acc, setting) => { acc[setting.key] = setting.value; return acc; }, {})
                : (settings || {});
    // قراءة اللغة المحفوظة
    let currentLang = localStorage.getItem('lang') || 'ar'; 
    const supportedLangs = ['ar', 'en', 'de'];
    if (!supportedLangs.includes(currentLang)) currentLang = 'ar';

    const container = document.getElementById('item-content-container');
    
    // ************************************************
    // ********** 1. دوال التحكم بالوضع (THEME TOGGLE) **********
    // ************************************************
    
    // دالة مساعدة لتحديث أيقونة الثيم (قمر/شمس)
    function updateThemeIcon(isLightMode) {
        // نعتمد على الزر نفسه لاحتواء الأيقونة، وبما أن الأيقونة لا تحمل ID، سنعتمد على الوصول لها كأول عنصر داخلي
        const toggleBtn = document.getElementById('theme-toggle');
        const icon = toggleBtn ? toggleBtn.querySelector('i.fas') : null; 
        
        if (icon) {
            // isLightMode == true يعني نحن في الوضع النهاري، ويجب عرض أيقونة القمر للتحويل لليلي
            if (isLightMode) {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            } else {
                // isLightMode == false يعني نحن في الوضع الليلي، ويجب عرض أيقونة الشمس للتحويل للنهاري
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }
    }

    function initializeThemeToggle() {
        // ⚠️ مهم: تم تعديل الـ ID ليتوافق مع HTML المُرسل: 'theme-toggle'
        const toggleBtn = document.getElementById('theme-toggle');
        const body = document.body;
        
        // 1. تطبيق الوضع المحفوظ عند التحميل
        const savedTheme = localStorage.getItem('theme');
        // الافتراضي هو الوضع الليلي (Dark Mode)
        const isLightMode = savedTheme === 'light-mode';
        
        if (isLightMode) {
            body.classList.add('light-mode');
        } else {
            body.classList.remove('light-mode');
        }
        updateThemeIcon(isLightMode); // تحديث الأيقونة حسب الوضع الحالي

        // 2. إضافة مستمع الحدث للزر
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                const currentIsLightMode = body.classList.contains('light-mode');
                
                // تبديل الكلاس وتحديث localStorage
                if (currentIsLightMode) {
                    // التبديل إلى الليلي
                    body.classList.remove('light-mode');
                    localStorage.setItem('theme', 'dark-mode');
                    updateThemeIcon(false); // تم التبديل لليلي
                } else {
                    // التبديل إلى النهاري
                    body.classList.add('light-mode');
                    localStorage.setItem('theme', 'light-mode');
                    updateThemeIcon(true); // تم التبديل للنهاري
                }
            });
        } else {
             // طباعة رسالة خطأ في الـ Console في حال عدم العثور على الزر
             console.error("Theme toggle button with ID 'theme-toggle' not found in the DOM.");
        }
    }

    // ************************************************
    // ********** 2. دوال التحكم باللغة والترجمة *********
    // ************************************************
    
    function updatePageDirection(lang) {
        document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
        document.body.classList.remove('ar', 'en', 'de');
        document.body.classList.add(lang);
    }
    
    function updateLanguageDisplay(lang) {
        const langDisplay = document.getElementById('current-lang-display');
        if (langDisplay) {
             langDisplay.textContent = lang.toUpperCase();
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
    function translateAllContent(lang) {
        // ترجمة العناصر الثابتة باستخدام data attributes
        document.querySelectorAll('[data-en], [data-de]').forEach(el => {
            // حفظ النص العربي الأصلي
            if (!el.hasAttribute('data-ar')) {
                el.setAttribute('data-ar', el.textContent.trim());
            }

            let text = el.getAttribute(`data-${lang}`);
            if (!text && lang === 'ar') { // fallback for AR if not explicitly set
                text = el.getAttribute('data-ar');
            } else if (!text && lang !== 'ar') { // fallback for EN/DE if not explicitly set
                 text = el.getAttribute('data-en');
            }
            
            if (text) el.textContent = text;
        });
        
        // ترجمة حقول المحتوى الديناميكية
        if (window.itemData) { 
            const item = window.itemData;
            
            const titleEl = document.getElementById('item-title');
            const summaryEl = document.getElementById('item-summary');
            const contentBodyEl = document.getElementById('item-content-body');
            
            if (titleEl) titleEl.textContent = item[`title_${lang}`] || item.title_ar;
            if (summaryEl) summaryEl.textContent = item[`summary_${lang}`] || item.summary_ar || '';
            if (contentBodyEl) contentBodyEl.innerHTML = item[`content_${lang}`] || item.content_ar || item.summary_ar || 'لا يوجد محتوى تفصيلي متوفر.';
            
            document.title = (lang === 'ar' ? 'كور الزهور - ' : 'Koor Al-Zuhur - ') + (titleEl ? titleEl.textContent : 'تفاصيل');
        }
        
        updateLanguageDisplay(lang);
    }

    function setLanguage(newLang) {
        localStorage.setItem('lang', newLang);
        currentLang = newLang;
        updatePageDirection(newLang);
        translateAllContent(newLang); 
    }
    
    // دالة تهيئة القائمة المنسدلة للغات
    function initializeLanguageDropdown() {
        const langWrapper = document.getElementById('lang-dropdown-wrapper');
        const langButton = document.getElementById('lang-menu-button'); 
        const langOptions = document.querySelectorAll('#lang-dropdown-content .lang-option');

        updatePageDirection(currentLang);

        if (langButton && langWrapper) {
            langButton.addEventListener('click', (e) => {
                e.preventDefault(); 
                e.stopPropagation();
                langWrapper.classList.toggle('open');
            });

            document.addEventListener('click', (e) => {
                // إغلاق القائمة إذا تم الضغط خارجها
                if (langWrapper && !langWrapper.contains(e.target)) {
                    langWrapper.classList.remove('open');
                }
            });
        }

        langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                const newLang = option.getAttribute('data-lang');
                if (newLang !== currentLang) {
                    setLanguage(newLang); 
                }
                if (langWrapper) langWrapper.classList.remove('open');
            });
        });
        updateLanguageDisplay(currentLang);
    }

    // ************************************************
    // ********** 3. دوال التنقل (Navigation) **********
    // ************************************************
    
    function initializeMobileNav() {
        const navToggleBtn = document.getElementById('nav-toggle-btn');
        const mainNav = document.getElementById('main-nav');
        const body = document.body;

        if (navToggleBtn && mainNav) {
            navToggleBtn.addEventListener('click', () => {
                mainNav.classList.toggle('active'); 
                body.classList.toggle('nav-open'); 
            });
            // إغلاق القائمة عند الضغط على رابط
            mainNav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mainNav.classList.remove('active');
                    body.classList.remove('nav-open');
                });
            });
        }
    }

   // ************************************************
// ********** 4. دالة العرض (Rendering Function) **********
// ************************************************
    
function renderItemDetails(item) {
    window.itemData = item; 
    
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) { 
        loadingSpinner.style.display = 'none'; 
    }

    // يجب قراءة اللغة الحالية لضمان جلب النص البديل (alt) الصحيح للمعرض
    const currentLang = localStorage.getItem('lang') || 'ar';
    
    // 1. تحضير الصور (المعرض)
    let galleryHtml = '';
    if (item.images && item.images.length > 0) {
        galleryHtml = item.images.map(img => {
            // ✅ تم تصحيح المشكلة: استخدام الحقل alt_language المناسب
            const altText = img[`alt_${currentLang}`] || img.alt_ar || 'Gallery Image';
            return `<img src="${img.image_url}" alt="${altText}" class="gallery-image ">`;
        }).join('');
    }

    // 2. تحضير الصورة الرئيسية
    const coverImg = item.cover_image_url || 'images/default-cover.jpg';

    // 3. تحضير الروابط الاجتماعية (افتراضياً غير موجودة في تفاصيل العمل، ولكن للحفاظ على الكود)
    let socialHtml = `
    
         <a href="${item.facebook_link}" class="contact-link-wrapper" target="_blank" rel="noopener noreferrer">
         <div class="icon-wrapper"><i class="fab fa-facebook-f"></i></div>
            <a href="${item.instagram_link}" class="contact-link-wrapper" target="_blank" rel="noopener noreferrer">
         <div class="icon-wrapper"><i class="fab fa-instagram"></i></div>
    `;
    // يمكنك إضافة منطق الروابط هنا إن لزم الأمر

    // 4. بناء الهيكل الجديد
    const htmlContent = `
        <img src="${coverImg}" alt="${item.title_ar}" class="main-cover-image ">
        
        <div class="item-meta-data">
            <h1 id="item-title" class="item-title">${item.title_ar}</h1>
            
            <div class="item-info-bar">
                <span><i class="fas fa-calendar-alt"></i> <span id="item-year">${item.production_year || '----'}</span></span>
                ${item.is_festival_work ? '<span><i class="fas fa-theater-masks"></i> مهرجان الماغوط</span>' : ''}
                ${item.is_ticker ? '<span><i class="fas fa-history"></i> أرشيف</span>' : ''}
            </div>

            ${item.summary_ar ? `<div id="item-summary" class="item-summary">${item.summary_ar}</div>` : ''}
        </div>

        ${galleryHtml ? `<div class="item-gallery-section">${galleryHtml}</div>` : ''}

        <div id="item-content-body" class="item-content-body">
            ${item.content_ar || item.summary_ar || '<p>لا يوجد تفاصيل إضافية.</p>'}
        </div>

        ${socialHtml ? `<div class="item-social-links">${socialHtml}</div>` : ''}

        <a href="javascript:history.back()" class="back-button" data-en="Go Back" data-de="Zurück">عودة للسابق</a>
    `;

    if (container) {
        container.innerHTML = htmlContent;
    }

    translateAllContent(currentLang); 
}

    // ************************************************
    // ********** 5. دالة التهيئة والتحميل *************
    // ************************************************
    
    async function loadItemDetails() {
        // ⚠️ يجب تهيئة عناصر الهيدر (اللغة والوضع والتنقل) أولاً
        initializeThemeToggle(); 
        initializeLanguageDropdown(); 
        initializeMobileNav();
        updateFooterContact(settingsObject);
        const urlParams = new URLSearchParams(window.location.search);
        const itemId = parseInt(urlParams.get('id')); 

        if (!container) {
             const loadingSpinner = document.getElementById('loading-spinner');
             if (loadingSpinner) loadingSpinner.style.display = 'none';
             return;
        }

        if (isNaN(itemId)) { 
            container.innerHTML = `<h2 class="error-message" data-en="Invalid Item ID.">عذراً، معرّف العنصر غير صالح.</h2>`;
            translateAllContent(currentLang); 
            return;
        }
        
        const loadingSpinner = document.getElementById('loading-spinner');
        if (loadingSpinner) loadingSpinner.style.display = 'block';

        try {
            const [itemResponse, metaResponse] = await Promise.all([
                fetch(`${WORKS_API_BASE_URL}/${itemId}`), 
                fetch(META_FILE)
            ]);
            
            if (!itemResponse.ok) {
                 if (loadingSpinner) loadingSpinner.style.display = 'none';
                 throw new Error(`Failed to fetch item ID ${itemId}. Status: ${itemResponse.status}`);
            }
            
            const item = await itemResponse.json();
            const actualItem = Array.isArray(item) ? item[0] : item;

            if (!actualItem) {
                if (loadingSpinner) loadingSpinner.style.display = 'none';
                container.innerHTML = `<h2 class="error-message" data-en="Item Not Found.">عذراً، لم يتم العثور على العنصر.</h2>`;
                translateAllContent(currentLang);
                return;
            }

            renderItemDetails(actualItem);

        } catch (error) {
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            console.error('Error loading item details:', error);
            container.innerHTML = `<h2 class="error-message" data-en="An error occurred while loading.">حدث خطأ أثناء تحميل البيانات. تحقق من اتصال API.</h2>`;
            translateAllContent(currentLang);
        }
    }

    // بدء العملية
    loadItemDetails();
    
});