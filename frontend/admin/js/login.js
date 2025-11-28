// /frontend/admin/js/login.js (النسخة النهائية المصححة بالكامل)

const API_URL = 'http://localhost:3000/api/auth/login'; // المنفذ الذي يعمل عليه الخادم

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    
    errorMessage.textContent = ''; // مسح رسالة الخطأ السابقة
    errorMessage.style.display = 'none'; // 🛑 إخفاء الرسالة قبل البدء في حالة النجاح
    
    document.getElementById('login-btn').disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        // 🛑 منطق التعامل مع الاستجابة: نتحقق من response.ok أولاً
        if (response.ok) {
            const data = await response.json();
            
            // نجاح تسجيل الدخول: تخزين التوكن
            localStorage.setItem('adminToken', data.token);
            
            // تصحيح المشكلة: نستخدم ?. و ?? لضمان عدم حدوث خطأ إذا كان data.admin غير موجود 
            const adminName = data.admin?.full_name ?? 'المدير';
            localStorage.setItem('adminName', adminName); 

            // توجيه المستخدم إلى الصفحة الرئيسية للوحة التحكم
            window.location.href = 'index.html'; 
        } else {
            // فشل تسجيل الدخول (استجابة 4xx أو 5xx)
            let data;
            
            try {
                // محاولة قراءة JSON لاصطياد رسالة الخطأ المخصصة
                data = await response.json();
            } catch (e) {
                // إذا فشل قراءة JSON، نعتمد على رسالة افتراضية
                console.error("Failed to parse JSON for error response:", e);
                data = { message: `فشل التحقق. حالة السيرفر: ${response.status}.` };
            }
            
            // عرض رسالة الخطأ القادمة من السيرفر أو الرسالة الافتراضية
            errorMessage.textContent = data.message || 'فشل في تسجيل الدخول. تحقق من البيانات.';
            // ⭐️⭐️ الحل النهائي: إظهار رسالة الخطأ ⭐️⭐️
            errorMessage.style.display = 'block'; 
        }

    } catch (error) {
        // يتم الوصول إلى هنا إذا فشل الاتصال بالخادم بالكامل
        errorMessage.textContent = 'حدث خطأ في الاتصال بالخادم.';
        errorMessage.style.display = 'block'; // ⭐️⭐️ إظهار الرسالة
        console.error('Login Error:', error);
    } finally {
        document.getElementById('login-btn').disabled = false;
    }
});


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