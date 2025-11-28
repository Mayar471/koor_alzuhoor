// /frontend/admin/js/index.js (مصحح بالكامل)

const API_BASE_URL = 'http://localhost:3000/api';

const worksList = document.getElementById('works-list');
const loadingSpinner = document.getElementById('loading-spinner');
const contentTitle = document.getElementById('content-title');
const statusMessage = document.getElementById('status-message-index'); 

// **********************************************
// ********** منطق المصادقة والتسجيل الخروج **********
// **********************************************

let currentFilter = 'all'; 
let currentSearch = '';

(function checkAuthAndSetup() {
    const token = localStorage.getItem('adminToken');
    const adminName = localStorage.getItem('adminName') || 'المدير';

    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('admin-name').textContent = adminName;
    
    fetchWorks();
})();


document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminName');
    window.location.href = 'login.html';
});


// **********************************************
// ********** الدوال المساعدة (رسائل الحالة) **********
// **********************************************

// دالة لعرض رسائل الحالة الاحترافية
function displayStatusMessage(message, type = 'success') {
    if (!statusMessage) {
        console.error('Status message element not found.'); 
        alert(message); 
        return;
    }
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`; 
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 5000); 
}

// دالة تحويل نوع المنشور إلى وسم (Tag)
function getWorkType(work) {
    // نتحقق من القيم كـ Truthy (يعني يقبل 1 و true)
    if (work.is_featured) return `<span class="tag tag-featured">مميز</span>`;
    if (work.is_festival_work) return `<span class="tag tag-festival">مهرجان</span>`;
    if (work.is_news) return `<span class="tag tag-news">خبر</span>`;
    if (work.is_timeline_event) return `<span class="tag tag-timeline">حدث زمني</span>`;
    if (work.is_ticker) return `<span class="tag tag-ticker">وثيقة </span>`;
    if (work.is_article) return `<span class="tag tag-article">مقال </span>`;
    return `<span class="tag tag-general">عام</span>`;
}


// **********************************************
// ********** منطق الحذف (DELETE) **********
// **********************************************

async function deleteWorkHandler(e) {
    const workId = e.currentTarget.getAttribute('data-id');
    const token = localStorage.getItem('adminToken');

    if (!confirm(`هل أنت متأكد من حذف المنشور ذو المعرف ${workId}؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
        return; 
    }
    
    e.currentTarget.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/works/${workId}`, { 
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            displayStatusMessage(`تم حذف المنشور ${workId} بنجاح.`, 'success'); 
            fetchWorks(); 
        } else {
            const data = await response.json();
            displayStatusMessage(`فشل الحذف: ${data.message || 'حدث خطأ غير معروف.'}`, 'error'); 
            e.currentTarget.disabled = false;
        }
    } catch (error) {
        displayStatusMessage('فشل الاتصال بالخادم أثناء الحذف.', 'error');
        console.error('Delete Error:', error);
        e.currentTarget.disabled = false;
    }
}


// **********************************************
// ********** منطق جلب وعرض البيانات **********
// **********************************************

function renderWorksTable(works) {
    worksList.innerHTML = ''; 

    if (works.length === 0) {
        worksList.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">لا توجد منشورات مطابقة للمعايير المحددة.</td></tr>`;
        return;
    }

    works.forEach((work, index) => {
        // معالجة التاريخ
        let displayDate = 'غير محدد';
        if (work.publication_date) {
            const dateObj = new Date(work.publication_date);
            displayDate = dateObj.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
        } else if (work.production_year) {
            displayDate = work.production_year;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${work.title_ar}</td>
            <td>${getWorkType(work)}</td>
            <td>${displayDate}</td> 
            <td class="action-buttons">
                <a href="add_work.html?id=${work.id}" class="edit-btn" data-id="${work.id}">تعديل <i class="fas fa-edit"></i></a>
                <button class="delete-btn" data-id="${work.id}">حذف <i class="fas fa-trash"></i></button>
            </td>
        `;
        
        row.querySelector('.delete-btn').addEventListener('click', deleteWorkHandler);
        worksList.appendChild(row);
    });
}

// دالة جلب المنشورات من الـ API
// /frontend/admin/js/index.js (تعديل دالة fetchWorks فقط)

async function fetchWorks() {
    loadingSpinner.style.display = 'block'; 
    worksList.innerHTML = '';

    const token = localStorage.getItem('adminToken');
    if (!token) {
        loadingSpinner.style.display = 'none';
        return;
    }

    let url = `${API_BASE_URL}/works`; 

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                 alert('انتهت صلاحية الجلسة.');
                 localStorage.removeItem('adminToken');
                 window.location.href = 'login.html';
                 return;
            }
            throw new Error(`فشل جلب البيانات: ${response.statusText}`);
        }
        
        const works = await response.json();
        
        // --- الفلترة المحلية ---
        let filteredWorks = works;

        // 1. تطبيق البحث 
        if (currentSearch) {
            const searchLower = currentSearch.toLowerCase();
            filteredWorks = filteredWorks.filter(work => 
                work.title_ar && work.title_ar.toLowerCase().includes(searchLower)
            );
        }

        // 2. تطبيق التصفية (الحل الجذري للتسميات)
        if (currentFilter !== 'all') {
            // ⚠️ خريطة تربط اسم الفلتر (من الزر) باسم العمود (في قاعدة البيانات)
            const filterMapping = {
                'featured': 'is_featured',
                'news': 'is_news',
                'festival': 'is_festival_work',   // 👈 التصحيح هنا
                'timeline': 'is_timeline_event',   // 👈 والتصحيح هنا
                'ticker': 'is_ticker',
                'article':'is_article'
            };

            const filterKey = filterMapping[currentFilter];
            
            // التأكد من أن العمود موجود والقيمة تساوي 1 أو true
            if (filterKey) {
                filteredWorks = filteredWorks.filter(work => work[filterKey] == 1); 
            }
        }
        
        renderWorksTable(filteredWorks);

    } catch (error) {
        worksList.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--error-color);">خطأ في الاتصال بالخادم.</td></tr>`;
        console.error('Fetch Error:', error);
    } finally {
        loadingSpinner.style.display = 'none'; 
    }
}

// **********************************************
// ********** منطق الفلترة والبحث **********
// **********************************************

function updateContentTitle() {
    const titles = {
        all: 'المنشورات العامة',
        featured: 'أهم الأعمال ',
        festival: 'منشورات مهرجان الماغوط',
        news: 'آخر الأخبار',
        timeline: 'منشورات الخط الزمني',
        ticker :'الأرشيف',
        article :'المقالات'
    };
    
    if (currentSearch) {
         contentTitle.innerHTML = `<i class="fas fa-search"></i> نتائج البحث عن: "${currentSearch}"`;
    } else {
        contentTitle.innerHTML = `<i class="fas fa-list-ul"></i> ${titles[currentFilter] || titles['all']}`;
    }
}


// معالجة أزرار الفلترة الجانبية
document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        currentFilter = e.currentTarget.getAttribute('data-filter');
        currentSearch = ''; 
        document.getElementById('search-input').value = ''; 
        updateContentTitle();
        fetchWorks();
    });
});

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-btn');

// دالة لمعالجة البحث
function handleSearch(e) {
    e.preventDefault();
    currentSearch = searchInput.value.trim();
    currentFilter = 'all'; 
    
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    
    // تحديث العنوان
    if (currentSearch) {
        contentTitle.innerHTML = `<i class="fas fa-search"></i> نتائج البحث عن: "${currentSearch}"`;
    } else {
        document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
        contentTitle.innerHTML = `<i class="fas fa-list-ul"></i> المنشورات العامة`;
    }

    fetchWorks();
}

searchButton.addEventListener('click', handleSearch);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch(e);
    }
});