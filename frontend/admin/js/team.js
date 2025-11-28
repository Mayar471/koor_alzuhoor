// /frontend/admin/js/team.js

const API_BASE_URL = 'http://localhost:3000/api';

const teamList = document.getElementById('team-list');
const loadingSpinner = document.getElementById('loading-spinner');
const addMemberForm = document.getElementById('add-member-form');
const submitMemberBtn = document.getElementById('submit-member-btn');
const statusMessage = document.getElementById('status-message-team'); 

// **********************************************
// ********** منطق المصادقة والتسجيل الخروج **********
// **********************************************

(function checkAuthAndSetup() {
    const token = localStorage.getItem('adminToken');
    const adminName = localStorage.getItem('adminName') || 'المدير';

    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    document.getElementById('admin-name').textContent = adminName;
    
    fetchTeamMembers();
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

// **********************************************
// ********** 1. منطق جلب وعرض البيانات (GET) **********
// **********************************************

function renderTeamTable(members) {
    teamList.innerHTML = ''; 

    if (members.length === 0) {
        teamList.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">لا يوجد أعضاء في الفريق حاليًا.</td></tr>`;
        return;
    }

    members.forEach((member, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${member.name}</td>
            <td>${member.role || '<span class="tag tag-general">لا يوجد دور محدد</span>'}</td>
            <td class="action-buttons">
                <button class="delete-btn" data-id="${member.id}">حذف <i class="fas fa-trash"></i></button>
            </td>
        `;
        
        row.querySelector('.delete-btn').addEventListener('click', deleteMemberHandler);
        teamList.appendChild(row);
    });
}

async function fetchTeamMembers() {
    loadingSpinner.style.display = 'block'; 
    teamList.innerHTML = '';

    // لا نحتاج لـ Token لجلب البيانات هنا لأن مسار GET تركناه مفتوحاً في الراوتر
    let url = `${API_BASE_URL}/team`; 

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`فشل جلب البيانات: ${response.statusText}`);
        }
        
        const members = await response.json();
        renderTeamTable(members);

    } catch (error) {
        teamList.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--error-color);">خطأ في الاتصال بالخادم.</td></tr>`;
        console.error('Fetch Team Error:', error);
    } finally {
        loadingSpinner.style.display = 'none'; 
    }
}


// **********************************************
// ********** 2. منطق الإضافة (POST) **********
// **********************************************

addMemberForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('adminToken');
    if (!token) {
        displayStatusMessage('يرجى تسجيل الدخول أولاً.', 'error');
        return;
    }

    const name = document.getElementById('member-name').value.trim();
    const role = document.getElementById('member-role').value.trim();

    if (!name) {
        displayStatusMessage('يرجى إدخال اسم العضو.', 'error');
        return;
    }

    submitMemberBtn.disabled = true;
    submitMemberBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جارٍ الحفظ...';

    try {
        const response = await fetch(`${API_BASE_URL}/team`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, role })
        });

        const data = await response.json();

        if (response.ok) {
            displayStatusMessage(data.message || 'تمت إضافة العضو بنجاح.', 'success');
            addMemberForm.reset();
            fetchTeamMembers(); // إعادة جلب وعرض البيانات المحدثة
        } else {
            // يشمل خطأ 400 (حقل إلزامي مفقود) و 500 (خطأ سيرفر)
            displayStatusMessage(`فشل الإضافة: ${data.message || data.errorDetails || 'خطأ غير معروف.'}`, 'error');
        }

    } catch (error) {
        displayStatusMessage('فشل الاتصال بالخادم أثناء الإضافة.', 'error');
        console.error('Create Member Error:', error);
    } finally {
        submitMemberBtn.disabled = false;
        submitMemberBtn.innerHTML = '<i class="fas fa-save"></i> حفظ العضو';
    }
});


// **********************************************
// ********** 3. منطق الحذف (DELETE) **********
// **********************************************

async function deleteMemberHandler(e) {
    const memberId = e.currentTarget.getAttribute('data-id');
    const token = localStorage.getItem('adminToken');

    if (!confirm(`هل أنت متأكد من حذف العضو ذو المعرف ${memberId}؟`)) {
        return; 
    }
    
    e.currentTarget.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/team/${memberId}`, { 
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            displayStatusMessage(`تم حذف العضو ${memberId} بنجاح.`, 'success'); 
            fetchTeamMembers(); 
        } else {
            const data = await response.json();
            // يشمل خطأ 404 (غير موجود) و 500 (خطأ سيرفر)
            displayStatusMessage(`فشل الحذف: ${data.message || 'حدث خطأ غير معروف.'}`, 'error'); 
            e.currentTarget.disabled = false;
        }
    } catch (error) {
        displayStatusMessage('فشل الاتصال بالخادم أثناء الحذف.', 'error');
        console.error('Delete Member Error:', error);
        e.currentTarget.disabled = false;
    }
}