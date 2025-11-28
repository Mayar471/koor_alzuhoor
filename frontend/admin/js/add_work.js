// /frontend/admin/js/add_work.js

// تعريف الرابط الأساسي للسيرفر (بدون /api) لإظهار الصور
const SERVER_URL = 'http://localhost:3000'; 
const API_BASE_URL = 'http://localhost:3000/api';

const workForm = document.getElementById('work-form');
const statusMessage = document.getElementById('status-message');
const titleArInput = document.getElementById('title_ar');
const submitBtn = document.getElementById('submit-btn');
const pageTitle = document.getElementById('page-title');

// العناصر
const coverImageInput = document.getElementById('coverImage');
const additionalImagesInput = document.getElementById('additionalImages');
const coverPreviewContainer = document.getElementById('cover-image-preview-container');
const additionalPreviewContainer = document.getElementById('additional-images-preview-container');

// الحالة
const urlParams = new URLSearchParams(window.location.search);
const workId = urlParams.get('id');
let isEditMode = workId !== null;

// تخزين حالة الصور الحالية (القديمة)
let currentWorkImages = { 
    cover_image_url: null, 
    images: [] // مصفوفة لتخزين كائنات الصور من جدول work_images
}; 

// 🛑 دالة مساعدة جديدة: لتحويل URL إلى كائن File (مطلوبة لمنطق الحذف/الإضافة الكلي)
async function urlToFile(url, filename, mimeType){
    // نحتاج إلى الحصول على البايتات من السيرفر عبر fetch
    const response = await fetch(url);
    const blob = await response.blob();
    // إنشاء كائن File من الـ Blob
    return new File([blob], filename, { type: mimeType || blob.type });
}


// --- دوال مساعدة ---
function displayStatusMessage(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
    setTimeout(() => { statusMessage.style.display = 'none'; }, 5000);
}

// --- دالة المعاينة (الأساسية) ---
function renderImagePreviews(isEdit = false) {
    // 1. معاينة صورة الغلاف
    coverPreviewContainer.innerHTML = '';
    
    // أ) جديد تم اختياره الآن
    if (coverImageInput.files && coverImageInput.files[0]) {
        const file = coverImageInput.files[0];
        coverPreviewContainer.innerHTML = `
            <div class="image-preview new-image">
                <img src="${URL.createObjectURL(file)}" alt="غلاف جديد">
                <span class="image-label">جديد</span>
            </div>`;
    } 
    // ب) قديم محفوظ في الداتا بيز
    else if (isEdit && currentWorkImages.cover_image_url) {
        // ⚠️ تصحيح الرابط: نستخدم SERVER_URL + المسار المحفوظ (الذي يبدأ بـ /uploads)
        coverPreviewContainer.innerHTML = `
            <div class="image-preview existing-image">
                <img src="${SERVER_URL}${currentWorkImages.cover_image_url}" alt="الغلاف الحالي">
                <span class="image-label">الحالي</span>
            </div>`;
    }

    // 2. معاينة الصور الإضافية (المعرض)
    additionalPreviewContainer.innerHTML = '';

    // أ) الصور القديمة (من الداتا بيز)
    if (isEdit && Array.isArray(currentWorkImages.images)) {
        currentWorkImages.images.forEach((imgObj, index) => {
            // إذا لم يتم وضع علامة "محذوف" عليها، اعرضها
            if (!imgObj.deleted) {
                const imgDiv = document.createElement('div');
                imgDiv.className = 'image-preview existing-image';
                // ⚠️ تصحيح الرابط هنا أيضاً
                imgDiv.innerHTML = `
                    <img src="${SERVER_URL}${imgObj.image_url}" alt="${imgObj.alt_ar || 'صورة'}">
                    <button type="button" class="remove-btn existing-remove" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                    <span class="image-label">محفوظة</span>
                `;
                additionalPreviewContainer.appendChild(imgDiv);

                // حدث الحذف للصورة القديمة
                imgDiv.querySelector('.remove-btn').addEventListener('click', () => {
                    // نضع علامة أن هذه الصورة تم حذفها
                    currentWorkImages.images[index].deleted = true;
                    // نعيد الرسم لإخفائها
                    renderImagePreviews(true);
                });
            }
        });
    }
    
    // ب) الصور الجديدة (التي يتم رفعها الآن)
    if (additionalImagesInput.files) {
        Array.from(additionalImagesInput.files).forEach((file, i) => {
            const newImgDiv = document.createElement('div');
            newImgDiv.className = 'image-preview new-image';
            newImgDiv.innerHTML = `
                <img src="${URL.createObjectURL(file)}" alt="جديدة">
                <button type="button" class="remove-btn new-remove">
                    <i class="fas fa-times"></i>
                </button>
                <span class="image-label">جديدة</span>
            `;
            additionalPreviewContainer.appendChild(newImgDiv);

            // حدث الحذف للصورة الجديدة (DataTransfer)
            newImgDiv.querySelector('.remove-btn').addEventListener('click', () => {
                const dt = new DataTransfer();
                const files = additionalImagesInput.files;
                for (let j = 0; j < files.length; j++) {
                    if (j !== i) dt.items.add(files[j]);
                }
                additionalImagesInput.files = dt.files;
                renderImagePreviews(isEditMode);
            });
        });
    }
}

// --- تعبئة الفورم عند التعديل ---
function populateForm(work) {
    pageTitle.textContent = `تعديل: ${work.title_ar}`;
    submitBtn.textContent = 'حفظ التعديلات';

    // تعبئة الحقول النصية
    document.getElementById('title_ar').value = work.title_ar || '';
    document.getElementById('summary_ar').value = work.summary_ar || '';
    document.getElementById('content_ar').value = work.content_ar || '';
    document.getElementById('title_en').value = work.title_en || '';
    document.getElementById('summary_en').value = work.summary_en || '';
    document.getElementById('content_en').value = work.content_en || '';
    document.getElementById('title_de').value = work.title_de || '';
    document.getElementById('summary_de').value = work.summary_de || '';
    document.getElementById('content_de').value = work.content_de || '';
    document.getElementById('production_year').value = work.production_year || '';
    document.getElementById('facebook_link').value = work.facebook_link || '';
    document.getElementById('instagram_link').value = work.instagram_link || '';

    if (work.publication_date) {
        const date = new Date(work.publication_date);
        document.getElementById('publication_date').value = date.toISOString().split('T')[0];
    }

    // Checkboxes
    document.getElementById('is_featured').checked = (work.is_featured == 1);
    document.getElementById('is_festival_work').checked = (work.is_festival_work == 1);
    document.getElementById('is_news').checked = (work.is_news == 1);
    document.getElementById('is_timeline_event').checked = (work.is_timeline_event == 1);
    document.getElementById('is_ticker').checked = (work.is_ticker == 1);
    document.getElementById('is_article').checked = (work.is_article == 1);
    // ⚠️ تخزين الصور في المتغير العام
    // work.images هنا تأتي كمصفوفة من Backend بفضل include: [WorkImage]
    currentWorkImages = {
        cover_image_url: work.cover_image_url,
        images: work.images || [] 
    };

    renderImagePreviews(true);
    submitBtn.disabled = false;
}

// --- جلب البيانات ---
async function fetchWorkData(id, token) {
    displayStatusMessage('جارٍ التحميل...', 'info');
    try {
        const response = await fetch(`${API_BASE_URL}/works/${id}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('فشل الجلب');
        const work = await response.json();
        populateForm(work);
        displayStatusMessage('تم التحميل', 'success');
    } catch (error) {
        console.error(error);
    }
}

// --- الإعداد الأولي ---
(function checkAuthAndSetup() {
    const token = localStorage.getItem('adminToken');
    const adminName = localStorage.getItem('adminName') || 'المدير';
    if (!token) { window.location.href = 'login.html'; return; }
    document.getElementById('admin-name').textContent = adminName;

    if (isEditMode) {
        fetchWorkData(workId, token);
    } else {
        pageTitle.textContent = 'إضافة منشور جديد';
        submitBtn.textContent = 'حفظ المنشور';
        submitBtn.disabled = true;
    }
})();

// --- أحداث ---
document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault(); localStorage.clear(); window.location.href = 'login.html';
});

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`content-${lang}`).classList.add('active');
    });
});
document.querySelector('.tab-btn').click();

// تفعيل الزر
titleArInput.addEventListener('input', () => {
    if (titleArInput.value.trim().length > 0 || isEditMode) submitBtn.disabled = false;
    else submitBtn.disabled = true;
});

// تحديث المعاينة عند اختيار ملفات
coverImageInput.addEventListener('change', () => renderImagePreviews(isEditMode));
additionalImagesInput.addEventListener('change', () => renderImagePreviews(isEditMode));


// --- الإرسال (Submit) ---
workForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'جارٍ الحفظ...';
    statusMessage.style.display = 'none';

    const formData = new FormData(workForm);
    const token = localStorage.getItem('adminToken');

    // 1. إصلاح Checkboxes (يبقى كما هو)
    formData.set('is_featured', document.getElementById('is_featured').checked ? '1' : '0');
    formData.set('is_festival_work', document.getElementById('is_festival_work').checked ? '1' : '0');
    formData.set('is_news', document.getElementById('is_news').checked ? '1' : '0');
    formData.set('is_timeline_event', document.getElementById('is_timeline_event').checked ? '1' : '0');
    formData.set('is_ticker', document.getElementById('is_ticker').checked ? '1' : '0');
    formData.set('is_article', document.getElementById('is_article').checked ? '1' : '0');
    // 🛑 2. منطق إرسال جميع صور المعرض كـ Files (القديمة والمتبقية والجديدة)
    
    // أ) جمع الصور القديمة المتبقية وتحويلها إلى File
    let remainingOldFiles = [];
    if (isEditMode && Array.isArray(currentWorkImages.images)) {
        const remainingUrls = currentWorkImages.images
            .filter(img => !img.deleted);

        // تحويل كل URL إلى Promise لتحويله إلى File
        const filePromises = remainingUrls.map(async imgObj => {
            try {
                // نستخدم URL الكامل لجلب الملف
                const fullUrl = `${SERVER_URL}${imgObj.image_url}`; 
                // اسم الملف القديم يمكن استخلاصه من الرابط
                const filename = imgObj.image_url.substring(imgObj.image_url.lastIndexOf('/') + 1);

                // هنا يتم جلب الملف وإعادة إنشائه كـ File
                return await urlToFile(fullUrl, filename);
            } catch (error) {
                console.error(`Failed to re-create file from URL: ${imgObj.image_url}`, error);
                return null; // تجاهل الملف الذي يفشل تحميله
            }
        });
        
        // انتظار جميع عمليات التحويل
        const files = await Promise.all(filePromises);
        remainingOldFiles = files.filter(file => file !== null);
    }
    
    // ب) تجهيز FormData الجديدة لـ additionalImages
    // بما أننا لا نستطيع الدمج في حقل إدخال الملفات، نجهز FormData جديدة:
    
    // نحذف الحقل القديم لنتأكد من إرسال الملفات التي نريدها فقط
    formData.delete('additionalImages'); 
    
    // إضافة الملفات القديمة التي تم تحويلها
    remainingOldFiles.forEach(file => {
        formData.append('additionalImages', file);
    });
    
    // إضافة الملفات الجديدة المرفوعة من حقل الإدخال
    if (additionalImagesInput.files) {
        Array.from(additionalImagesInput.files).forEach(file => {
            formData.append('additionalImages', file);
        });
    }

    // 🛑 3. حذف باقي حقول الصور القديمة (لم نعد نستخدمها)
    formData.delete('remaining_images_urls');


    let url = isEditMode ? `${API_BASE_URL}/works/${workId}` : `${API_BASE_URL}/works`;
    let method = isEditMode ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            body: formData,
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
            displayStatusMessage('✅ تم الحفظ بنجاح', 'success');
            if (!isEditMode) {
                workForm.reset();
                currentWorkImages = { cover_image_url: null, images: [] };
                renderImagePreviews(false);
                submitBtn.disabled = true;
            } else {
                // بعد نجاح التعديل، يجب أن نضمن إعادة تحميل البيانات
                // لتحديث currentWorkImages
                await fetchWorkData(workId, token); 
            }
        } else {
            displayStatusMessage(data.message || 'خطأ', 'error');
        }
    } catch (error) {
        console.error(error);
        displayStatusMessage('فشل الاتصال', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isEditMode ? 'حفظ التعديلات' : 'حفظ المنشور';
    }
});