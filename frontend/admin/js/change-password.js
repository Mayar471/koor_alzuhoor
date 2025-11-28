// /frontend/admin/js/change-password.js

const API_BASE_URL = 'http://localhost:3000/api';
const form = document.getElementById('password-form');
const statusMessage = document.getElementById('status-message');
const submitBtn = document.getElementById('submit-btn');

// 1. التحقق من المصادقة
(function checkAuthAndSetup() {
    const token = localStorage.getItem('adminToken');
    const adminName = localStorage.getItem('adminName') || 'المدير';

    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('admin-name').textContent = adminName;
})();

// 2. تسجيل الخروج
document.getElementById('logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'login.html';
});

// 3. دالة عرض الرسائل
function displayStatusMessage(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
    setTimeout(() => { statusMessage.style.display = 'none'; }, 5000);
}

// 4. إرسال النموذج
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // تحقق من تطابق كلمة المرور
    if (newPassword !== confirmPassword) {
        displayStatusMessage('كلمة المرور الجديدة وتأكيدها غير متطابقين!', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'جارٍ التغيير...';

    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            displayStatusMessage('✅ تم تغيير كلمة المرور بنجاح.', 'success');
            form.reset();
        } else {
            displayStatusMessage(data.message || 'فشل تغيير كلمة المرور.', 'error');
        }
    } catch (error) {
        displayStatusMessage('حدث خطأ في الاتصال.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'تغيير كلمة المرور';
    }
});
// أضف هذا الكود في نهاية ملف login.js ونهاية ملف change-password.js

// منطق زر إظهار كلمة المرور (Toggle Password Visibility)
document.querySelectorAll('.toggle-btn').forEach(button => {
    button.addEventListener('click', () => {
        // تحديد حقل الإدخال المستهدف بناءً على data-target
        const targetId = button.getAttribute('data-target');
        const passwordInput = document.getElementById(targetId);
        const icon = button.querySelector('i');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash'); // إظهار أيقونة إخفاء
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye'); // إظهار أيقونة إظهار
        }
    });
});