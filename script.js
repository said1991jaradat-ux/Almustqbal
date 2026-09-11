// عنوان الخادم الخلفي (Backend API)
const API_URL = 'https://quizzical-bell1.onrender.com/api/records';

// الهيكل الأساسي للبيانات المؤقتة للواجهة
let dbData = {
    lateness: [],
    uniform: [],
    escape: []
};

let currentFormattedDate = '';
let currentAllRecords = [];

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    // تهيئة EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init("uwkpzIF4_LuhwuelG");
    }

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentFormattedDate = today.toLocaleDateString('ar-EG', options);
    
    // التأكد من إظهار التاريخ في العنصر المخصص بالترويسة
    const dateDisplay = document.getElementById('currentDateDisplay');
    if (dateDisplay) {
        dateDisplay.innerText = `اليوم والتاريخ: ${currentFormattedDate}`;
    }
    
    document.querySelectorAll('.auto-date').forEach(input => {
        input.value = currentFormattedDate;
    });

    await fetchRecordsFromCloud();
});

// دالة إرسال بريد استعادة كلمة المرور عبر EmailJS مع دعم الرابط
function forgotPassword() {
    const resetLink = "https://almustqbal-school-site.onrender.com/reset-password.html"; 

    const templateParams = {
        to_email: "sameer.m.musleh@gmail.com",
        message: "تم طلب استعادة كلمة المرور الخاصة بنظام متابعة الطلاب - مدرسة ذكور المستقبل الصالح.",
        reset_link: resetLink
    };

    if (typeof emailjs === 'undefined') {
        alert('مكتبة EmailJS غير محملة في الصفحة.');
        return;
    }

    emailjs.send('service_uh9k24u', 'template_wgygsdn', templateParams)
        .then(function(response) {
            alert('تم إرسال بريد استعادة كلمة المرور بنجاح إلى بريدك.');
        }, function(error) {
            console.error('خطأ في الإرسال:', error);
            alert('فشل إرسال البريد، يرجى التحقق من صحة Template ID في لوحة تحكم EmailJS.');
        });
}

// دالة لجلب السجلات من الخادم السحابي وتوزيعها على التصنيفات
async function fetchRecordsFromCloud() {
    try {
        const response = await fetch(API_URL);
        const records = await response.json();
        
        dbData = { lateness: [], uniform: [], escape: [] };
        
        records.forEach(record => {
            if (dbData[record.type]) {
                dbData[record.type].push({
                    id: record._id,
                    date: record.date,
                    time: record.time,
                    student: record.studentName,
                    grade: record.grade,
                    section: record.section,
                    reason: record.details,
                    status: record.details
                });
            }
        });

        renderLogs();
    } catch (err) {
        console.error('خطأ في جلب البيانات من الخادم:', err);
    }
}

// عرض السجلات المباشرة أسفل كل بند
function renderLogs() {
    const lateContainer = document.getElementById('latenessLogs');
    if (lateContainer) {
        lateContainer.innerHTML = dbData.lateness.slice(-5).reverse().map((item) => `
            <div class="log-item">
                <span><strong>${item.student}</strong> (${item.grade}/${item.section}) - ${item.time}</span>
                <button class="delete-btn" onclick="deleteRecord('${item.id}')">✕</button>
            </div>
        `).join('') || '<small>لا توجد سجلات حديثة</small>';
    }

    const uniformContainer = document.getElementById('uniformLogs');
    if (uniformContainer) {
        uniformContainer.innerHTML = dbData.uniform.slice(-5).reverse().map((item) => `
            <div class="log-item">
                <span><strong>${item.student}</strong> - ${item.status}</span>
                <button class="delete-btn" onclick="deleteRecord('${item.id}')">✕</button>
            </div>
        `).join('') || '<small>لا توجد سجلات حديثة</small>';
    }

    const escapeContainer = document.getElementById('escapeLogs');
    if (escapeContainer) {
        escapeContainer.innerHTML = dbData.escape.slice(-5).reverse().map((item) => `
            <div class="log-item">
                <span><strong>${item.student}</strong> (${item.grade}/${item.section}) - ${item.time}</span>
                <button class="delete-btn" onclick="deleteRecord('${item.id}')">✕</button>
            </div>
        `).join('') || '<small>لا توجد سجلات حديثة</small>';
    }
}

// حذف سجل محدد من الخادم
async function deleteRecord(id) {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                await fetchRecordsFromCloud();
            } else {
                alert('فشل عملية الحذف من الخادم');
            }
        } catch (err) {
            console.error('خطأ في الاتصال:', err);
            alert('حدث خطأ أثناء الحذف!');
        }
    }
}

// حذف سجل من لوحة الإدارة
async function adminDeleteRecord(id) {
    await deleteRecord(id);
    await loadAllRecordsForAdmin();
}

// إظهار/إخفاء السبب الآخر
function toggleOtherReason(val) {
    const otherGroup = document.getElementById('otherReasonGroup');
    if (otherGroup) {
        otherGroup.classList.toggle('hidden', val !== 'أخرى');
    }
}

// 1. تسجيل تأخير
async function addLateness(e) {
    e.preventDefault();
    const reasonVal = document.getElementById('lateReason').value;
    const finalReason = reasonVal === 'أخرى' ? document.getElementById('otherReasonText').value : reasonVal;

    const newRecord = {
        type: 'lateness',
        studentName: document.getElementById('lateStudent').value.trim(),
        grade: document.getElementById('lateGrade').value,
        section: document.getElementById('lateSection').value,
        time: document.getElementById('lateTime').value,
        date: currentFormattedDate,
        details: finalReason
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRecord)
        });

        if (response.ok) {
            await fetchRecordsFromCloud();
            alert('تم حفظ حالة التأخير بنجاح في السحابة!');
            document.getElementById('latenessForm').reset();
            document.querySelectorAll('.auto-date').forEach(i => i.value = currentFormattedDate);
        } else {
            alert('فشل حفظ البيانات');
        }
    } catch (err) {
        console.error(err);
        alert('خطأ في الاتصال بالخادم!');
    }
}

// 2. تسجيل زي
async function addUniform(e) {
    e.preventDefault();
    const newRecord = {
        type: 'uniform',
        studentName: document.getElementById('uniformStudent').value.trim(),
        grade: document.getElementById('uniformGrade').value,
        section: document.getElementById('uniformSection').value,
        time: '--',
        date: currentFormattedDate,
        details: document.getElementById('uniformStatus').value
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRecord)
        });

        if (response.ok) {
            await fetchRecordsFromCloud();
            alert('تم حفظ حالة الزي بنجاح في السحابة!');
            document.getElementById('uniformForm').reset();
            document.querySelectorAll('.auto-date').forEach(i => i.value = currentFormattedDate);
        } else {
            alert('فشل حفظ البيانات');
        }
    } catch (err) {
        console.error(err);
        alert('خطأ في الاتصال بالخادم!');
    }
}

// 3. تسجيل هروب
async function addEscape(e) {
    e.preventDefault();
    const newRecord = {
        type: 'escape',
        studentName: document.getElementById('escapeStudent').value.trim(),
        grade: document.getElementById('escapeGrade').value,
        section: document.getElementById('escapeSection').value,
        time: document.getElementById('escapeTime').value,
        date: currentFormattedDate,
        details: 'حالة هروب'
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRecord)
        });

        if (response.ok) {
            await fetchRecordsFromCloud();
            alert('تم حفظ حالة الهروب بنجاح في السحابة!');
            document.getElementById('escapeForm').reset();
            document.querySelectorAll('.auto-date').forEach(i => i.value = currentFormattedDate);
        } else {
            alert('فشل حفظ البيانات');
        }
    } catch (err) {
        console.error(err);
        alert('خطأ في الاتصال بالخادم!');
    }
}

// البحث وطباعة تقرير شامل لطالب معين
function searchStudentReport() {
    const searchName = document.getElementById('searchInput').value.trim();
    if (!searchName) {
        alert('يرجى إدخال اسم الطالب للبحث');
        return;
    }

    const studentLate = dbData.lateness.filter(r => r.student.includes(searchName));
    const studentUniform = dbData.uniform.filter(r => r.student.includes(searchName));
    const studentEscape = dbData.escape.filter(r => r.student.includes(searchName));

    if (studentLate.length === 0 && studentUniform.length === 0 && studentEscape.length === 0) {
        alert('لم يتم العثور على أي سجلات بهذا الاسم');
        return;
    }

    const firstRecord = studentLate[0] || studentUniform[0] || studentEscape[0];

    let reportHTML = `
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>تقرير الطالب: ${searchName}</title>
            <style>
                body { font-family: Tahoma, Arial, sans-serif; direction: rtl; padding: 20px; color: #000; }
                .header { text-align: center; margin-bottom: 30px; }
                h2, h3 { margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 25px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 14px; }
                th { background-color: #f2f2f2; }
                .footer { display: flex; justify-content: space-between; margin-top: 60px; font-weight: bold; font-size: 16px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>مدرسة ذكور المستقبل الصالح الأساسية العليا</h2>
                <h3>تقرير السلوك والانضباط المدرسي</h3>
                <p><strong>مدير المدرسة:</strong> أ. سمير مصلح</p>
                <p>تاريخ الإصدار: ${currentFormattedDate}</p>
                <hr>
                <p>اسم الطالب: <strong>${searchName}</strong> | الصف: ${firstRecord.grade} | الشعبة: ${firstRecord.section}</p>
            </div>
    `;

    if (studentLate.length > 0) {
        reportHTML += `<h4>أولاً: سجل التأخير الصباحي (${studentLate.length}):</h4>`;
        reportHTML += `<table><tr><th>التاريخ</th><th>وقت التأخير</th><th>السبب</th></tr>`;
        studentLate.forEach(r => {
            reportHTML += `<tr><td>${r.date}</td><td>${r.time}</td><td>${r.reason}</td></tr>`;
        });
        reportHTML += `</table>`;
    }

    if (studentUniform.length > 0) {
        reportHTML += `<h4>ثانياً: سجل عدم الالتزام بالزي (${studentUniform.length}):</h4>`;
        reportHTML += `<table><tr><th>التاريخ</th><th>الحالة</th></tr>`;
        studentUniform.forEach(r => {
            reportHTML += `<tr><td>${r.date}</td><td>${r.status}</td></tr>`;
        });
        reportHTML += `</table>`;
    }

    if (studentEscape.length > 0) {
        reportHTML += `<h4>ثالثاً: سجل حالات الهروب (${studentEscape.length}):</h4>`;
        reportHTML += `<table><tr><th>التاريخ</th><th>وقت الهروب</th></tr>`;
        studentEscape.forEach(r => {
            reportHTML += `<tr><td>${r.date}</td><td>${r.time}</td></tr>`;
        });
        reportHTML += `</table>`;
    }

    reportHTML += `
            <div class="footer">
                <span>توقيع مدير المدرسة: __________________</span>
                <span>خاتم المدرسة</span>
            </div>
        </body>
        </html>
    `;

    openPrintWindow(reportHTML);
}

// طباعة تقرير فئة معينة في نافذة منفصلة ونظيفة
function printCategoryReport(type, titleText) {
    const items = dbData[type];
    if (!items || items.length === 0) {
        alert('لا توجد سجلات متاحة لهذه الفئة حالياً.');
        return;
    }

    let reportHTML = `
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>${titleText}</title>
            <style>
                body { font-family: Tahoma, Arial, sans-serif; direction: rtl; padding: 20px; color: #000; }
                .header { text-align: center; margin-bottom: 30px; }
                h2, h3 { margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 25px; }
                th, td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 14px; }
                th { background-color: #f2f2f2; }
                .footer { display: flex; justify-content: space-between; margin-top: 60px; font-weight: bold; font-size: 16px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>مدرسة ذكور المستقبل الصالح الأساسية العليا</h2>
                <h3>${titleText}</h3>
                <p><strong>مدير المدرسة:</strong> أ. سمير مصلح</p>
                <p>تاريخ الإصدار: ${currentFormattedDate}</p>
                <hr>
                <p>الإجمالي الكلي: <strong>${items.length} حالة</strong></p>
            </div>
    `;

    if (type === 'lateness') {
        reportHTML += `<table><tr><th>التاريخ</th><th>الوقت</th><th>اسم الطالب</th><th>الصف والشعبة</th><th>السبب</th></tr>`;
        items.forEach(r => {
            reportHTML += `<tr><td>${r.date}</td><td>${r.time}</td><td>${r.student}</td><td>${r.grade} / ${r.section}</td><td>${r.reason}</td></tr>`;
        });
        reportHTML += `</table>`;
    } else if (type === 'uniform') {
        reportHTML += `<table><tr><th>التاريخ</th><th>اسم الطالب</th><th>الصف والشعبة</th><th>حالة الزي</th></tr>`;
        items.forEach(r => {
            reportHTML += `<tr><td>${r.date}</td><td>${r.student}</td><td>${r.grade} / ${r.section}</td><td>${r.status}</td></tr>`;
        });
        reportHTML += `</table>`;
    } else if (type === 'escape') {
        reportHTML += `<table><tr><th>التاريخ</th><th>وقت الهروب</th><th>اسم الطالب</th><th>الصف والشعبة</th></tr>`;
        items.forEach(r => {
            reportHTML += `<tr><td>${r.date}</td><td>${r.time}</td><td>${r.student}</td><td>${r.grade} / ${r.section}</td></tr>`;
        });
        reportHTML += `</table>`;
    }

    reportHTML += `
            <div class="footer">
                <span>توقيع مدير المدرسة: __________________</span>
                <span>خاتم المدرسة</span>
            </div>
        </body>
        </html>
    `;

    openPrintWindow(reportHTML);
}

// دالة مساعدة لفتح نافذة الطباعة المستقلة
function openPrintWindow(htmlContent) {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

// تصدير نسخة احتياطية
async function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dbData));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `سجلات_المدرسة_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// استرجاع نسخة احتياطية
function importData(event) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            alert('تم قراءة ملف النسخة الاحتياطية بنجاح!');
        } catch(err) {
            alert('الملف غير صالح!');
        }
    };
    reader.readAsText(event.target.files[0]);
}

// فتح لوحة الإدارة وجلب البيانات فوراً
async function openAdminDashboard() {
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.style.display = 'block';
        
        const tbody = document.getElementById('adminTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:15px;">جاري تحميل السجلات من السحابة...</td></tr>`;
        }

        await loadAllRecordsForAdmin();
    } else {
        alert('عنصر شاشة الإدارة غير موجود في الصفحة!');
    }
}

// إغلاق لوحة الإدارة تماماً
function closeAdminDashboard() {
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// جلب كافة السجلات ورسمها فوراً
async function loadAllRecordsForAdmin() {
    try {
        const response = await fetch(API_URL);
        currentAllRecords = await response.json();
        renderAdminTable(currentAllRecords);
    } catch (err) {
        console.error('خطأ في جلب بيانات الإدارة:', err);
        const tbody = document.getElementById('adminTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red; padding:15px;">حدث خطأ أثناء جلب البيانات من الخادم.</td></tr>`;
        }
    }
}

// دالة ترجمة أنواع السجلات لعرضها بشكل صحيح
function translateType(type) {
    if (type === 'lateness' || type === 'تأخير') return 'تأخير صباحي';
    if (type === 'uniform' || type === 'زي') return 'الزي المدرسي';
    if (type === 'escape' || type === 'هروب') return 'حالة هروب';
    return type || 'سجل عام';
}

// تبديل تبويبات التقارير
function switchReportTab(type) {
    const title = document.getElementById('adminReportTitle');
    
    if (type === 'daily') {
        if (title) title.innerText = `التقرير اليومي`;
    } else if (type === 'weekly') {
        if (title) title.innerText = 'التقرير الأسبوعي';
    } else if (type === 'monthly') {
        if (title) title.innerText = 'التقرير الشهري الشامل';
    }

    renderAdminTable(currentAllRecords);
}

// رسم جدول الإدارة المباشر والمضمون
function renderAdminTable(records) {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;

    if (!records || records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:15px; border:1px solid #ddd;">لا توجد سجلات مطابقة حالياً.</td></tr>`;
        return;
    }

    let html = '';
    for (let i = 0; i < records.length; i++) {
        let r = records[i];
        let recordId = r._id || r.id || '';
        let recDate = r.date || '--';
        let recType = translateType(r.type);
        let studentName = r.studentName || r.student || 'غير محدد';
        let gradeSec = (r.grade || '--') + ' / ' + (r.section || '--');
        let detailsVal = r.details || r.reason || r.status || '--';
        let timeVal = r.time ? '(' + r.time + ')' : '';

        html += '<tr>';
        html += '<td style="border:1px solid #ddd; padding:8px; text-align:center;">' + recDate + '</td>';
        html += '<td style="border:1px solid #ddd; padding:8px; text-align:center;">' + recType + '</td>';
        html += '<td style="border:1px solid #ddd; padding:8px; text-align:center;">' + studentName + '</td>';
        html += '<td style="border:1px solid #ddd; padding:8px; text-align:center;">' + gradeSec + '</td>';
        html += '<td style="border:1px solid #ddd; padding:8px; text-align:center;">' + detailsVal + ' ' + timeVal + '</td>';
        html += '<td style="border:1px solid #ddd; padding:8px; text-align:center;"><button onclick="adminDeleteRecord(\'' + recordId + '\')" style="background:#dc3545; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:3px;">حذف</button></td>';
        html += '</tr>';
    }

    tbody.innerHTML = html;
}
async function forgotPassword() {
    // يمكنك جعل الكود يطلب إدخال الإيميل أو تعبئته تلقائياً
    const emailInput = prompt("الرجاء إدخال البريد الإلكتروني المصرّح له للاستعادة:", "sameer.m.musleh@gmail.com");
    if (!emailInput) return;

    try {
        // لاحظ هنا تم استخدام رابط سيرفرك على Render مباشرة
        const response = await fetch('https://almustqbal-school-site.onrender.com/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInput })
        });

        const data = await response.json();
        
        if (data.success) {
            alert('تم توليد كلمة مرور جديدة وتحديثها في قاعدة البيانات، وإرسالها إلى بريدك الإلكتروني بنجاح!');
        } else {
            alert(data.message || 'فشل إرسال الطلب، تأكد من صحة البريد الإلكتروني.');
        }
    } catch (err) {
        console.error('خطأ في الاتصال:', err);
        alert('حدث خطأ أثناء الاتصال بالخادم.');
    }
}
