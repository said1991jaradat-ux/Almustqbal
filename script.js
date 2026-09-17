/* ================================================== API ================================================== */ const API_URL = 'https://almustqbal.onrender.com/api/records';


/* ==================================================
   DATA
================================================== */

let dbData = {

    lateness: [],

    uniform: [],

    escape: []

};


let currentAllRecords = [];

let currentAdminReportType = 'daily';


/* ==================================================
   DATE
================================================== */

let currentFormattedDate = '';


document.addEventListener(
    'DOMContentLoaded',
    function () {

        const now = new Date();

        currentFormattedDate =
            now.toLocaleDateString(
                'ar-EG',
                {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }
            );


        document.querySelectorAll(
            '.auto-date'
        ).forEach(function (element) {

            element.value =
                now.toISOString().split('T')[0];

        });


        const currentDateElement =
            document.getElementById(
                'currentDate'
            );

        if (currentDateElement) {

            currentDateElement.textContent =
                currentFormattedDate;

        }


        fetchRecordsFromCloud();

    }
);


/* ==================================================
   FORGOT PASSWORD
================================================== */

function forgotPassword() {

    const modal =
        document.getElementById(
            'forgotPasswordModal'
        );

    if (!modal) {

        console.error(
            'Forgot password modal not found'
        );

        return;

    }


    modal.style.display = 'flex';


    const input =
        document.getElementById(
            'favoriteNumberInput'
        );


    const errorMsg =
        document.getElementById(
            'forgotErrorMsg'
        );


    if (input) {

        input.value = '';

        setTimeout(function () {

            input.focus();

        }, 100);

    }


    if (errorMsg) {

        errorMsg.style.display =
            'none';

        errorMsg.textContent = '';

    }

}


/* ==================================================
   CLOSE FORGOT PASSWORD
================================================== */

function closeForgotPassword() {

    const modal =
        document.getElementById(
            'forgotPasswordModal'
        );


    if (modal) {

        modal.style.display =
            'none';

    }

}


/* ==================================================
   SUBMIT FORGOT PASSWORD
================================================== */

async function submitForgotPassword() {

    const input =
        document.getElementById(
            'favoriteNumberInput'
        );


    const errorMsg =
        document.getElementById(
            'forgotErrorMsg'
        );


    const submitBtn =
        document.getElementById(
            'forgotSubmitBtn'
        );


    const answer =
        input
            ? input.value.trim()
            : '';


    if (errorMsg) {

        errorMsg.style.display =
            'none';

        errorMsg.textContent = '';

    }


    if (!answer) {

        if (errorMsg) {

            errorMsg.textContent =
                'يرجى إدخال رقمك المفضل';

            errorMsg.style.display =
                'block';

        }

        return;

    }


    if (submitBtn) {

        submitBtn.disabled = true;

        submitBtn.innerText =
            'جاري التحقق...';

    }


    try {

        /* =========================================
           التحقق من سؤال الأمان
        ========================================= */

        const response =
            await fetch(
                'https://almustqbal.onrender.com/api/forgot-password',
                {

                    method: 'POST',

                    headers: {

                        'Content-Type':
                            'application/json'

                    },

                    body:
                        JSON.stringify({

                            answer:
                                answer

                        })

                }
            );


        const data =
            await response.json();


        console.log(
            'Forgot password response:',
            data
        );


        /* =========================================
           إجابة خاطئة
        ========================================= */

        if (!response.ok ||
            !data.success) {

            if (errorMsg) {

                errorMsg.textContent =
                    data.message ||
                    'الإجابة غير صحيحة';

                errorMsg.style.display =
                    'block';

            }

            return;

        }


        /* =========================================
           الإجابة صحيحة
        ========================================= */

        const newPassword =
            data.password;


        console.log(
            'تم التحقق من سؤال الأمان وإنشاء كلمة مرور جديدة'
        );


        /* =========================================
           إرسال كلمة المرور عبر EmailJS
        ========================================= */

        try {

            const emailResult =
                await emailjs.send(

                    'service_uh9k24',

                    'template_r4tlcd',

                    {

                        password:
                            newPassword

                    }

                );


            console.log(
                'EmailJS SUCCESS:',
                emailResult
            );


            alert(
                'تم إنشاء كلمة مرور جديدة وإرسالها إلى البريد الإلكتروني بنجاح.'
            );


            closeForgotPassword();


        } catch (emailError) {

            console.error(
                'EMAILJS ERROR:',
                emailError
            );


            alert(
                'تم إنشاء كلمة المرور الجديدة، لكن حدث خطأ أثناء إرسال البريد.\n\n' +
                'EmailJS Status: ' +
                (
                    emailError.status ||
                    'غير معروف'
                ) +
                '\n\n' +
                'EmailJS Text: ' +
                (
                    emailError.text ||
                    emailError.message ||
                    'غير معروف'
                )
            );

        }


    } catch (error) {

        console.error(
            'FORGOT PASSWORD ERROR:',
            error
        );


        if (errorMsg) {

            errorMsg.textContent =
                'تعذر الاتصال بالسيرفر، حاول مرة أخرى.';

            errorMsg.style.display =
                'block';

        }

    }


    finally {

        if (submitBtn) {

            submitBtn.disabled = false;

            submitBtn.innerText =
                'متابعة';

        }

    }

}
/* ==================================================
   FETCH RECORDS
================================================== */

async function fetchRecordsFromCloud() {

    try {

        const response =
            await fetch(API_URL);


        if (!response.ok) {

            throw new Error(
                'Failed to load records'
            );

        }


        const records =
            await response.json();


        dbData = {

            lateness: [],

            uniform: [],

            escape: []

        };


        records.forEach(function (record) {

            const mapped = {

                id: record._id,

                student:
                    record.studentName || '',

                grade:
                    record.grade || '',

                section:
                    record.section || '',

                date:
                    record.date || '',

                time:
                    record.time || '',

                reason:
                    record.details || '',

                status:
                    record.details || '',

                createdAt:
                    record.createdAt || null

            };


            if (
                record.type === 'lateness'
            ) {

                dbData.lateness.push(mapped);

            }

            else if (
                record.type === 'uniform'
            ) {

                dbData.uniform.push(mapped);

            }

            else if (
                record.type === 'escape'
            ) {

                dbData.escape.push(mapped);

            }

        });


        renderLogs();

    }

    catch (error) {

        console.error(
            'Error loading records:',
            error
        );

    }

}


/* ==================================================
   RENDER LOGS
================================================== */

function renderLogs() {

    renderCategoryLogs(
        'lateness',
        'latenessLogs'
    );

    renderCategoryLogs(
        'uniform',
        'uniformLogs'
    );

    renderCategoryLogs(
        'escape',
        'escapeLogs'
    );

}


function renderCategoryLogs(
    category,
    elementId
) {

    const container =
        document.getElementById(elementId);


    if (!container) return;


    const records =
        dbData[category] || [];


    if (!records.length) {

        container.innerHTML =
            '<div class="empty-log">لا توجد سجلات</div>';

        return;

    }


    container.innerHTML =
        records
            .slice(0, 5)
            .map(function (record) {

                return `

                    <div class="log-item">

                        <div>

                            <strong>
                                ${escapeHtml(record.student)}
                            </strong>

                            <div>
                                ${escapeHtml(record.date)}
                            </div>

                        </div>

                        <button
                            onclick="deleteRecord('${record.id}')"
                            class="delete-btn">

                            حذف

                        </button>

                    </div>

                `;

            })
            .join('');

}


/* ==================================================
   ESCAPE HTML
================================================== */

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return '';

    }


    return String(value)

        .replace(/&/g, '&amp;')

        .replace(/</g, '&lt;')

        .replace(/>/g, '&gt;')

        .replace(/"/g, '&quot;')

        .replace(/'/g, '&#039;');

}


/* ==================================================
   DELETE RECORD
================================================== */

async function deleteRecord(id) {

    if (
        !confirm(
            'هل أنت متأكد من حذف هذا السجل؟'
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {
                    method: 'DELETE'
                }
            );


        if (!response.ok) {

            throw new Error(
                'Delete failed'
            );

        }


        await fetchRecordsFromCloud();


        alert(
            'تم حذف السجل بنجاح'
        );


    } catch (error) {

        console.error(error);

        alert(
            'حدث خطأ أثناء حذف السجل'
        );

    }

}


/* ==================================================
   ADMIN DASHBOARD
================================================== */

function openAdminDashboard() {

    const modal =
        document.getElementById(
            'adminModal'
        );


    if (!modal) return;


    modal.style.display = 'flex';


    const dateInput =
        document.getElementById(
            'adminReferenceDate'
        );


    if (dateInput) {

        dateInput.value =
            getLocalDateInputValue();

    }


    currentAdminReportType =
        'daily';


    updateAdminTabs();


    loadAllRecordsForAdmin();

}


function closeAdminDashboard() {

    const modal =
        document.getElementById(
            'adminModal'
        );


    if (modal) {

        modal.style.display =
            'none';

    }

}


/* ==================================================
   LOCAL DATE
================================================== */

function getLocalDateInputValue() {

    const now = new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, '0');


    const day =
        String(
            now.getDate()
        ).padStart(2, '0');


    return `${year}-${month}-${day}`;

}


/* ==================================================
   LOAD ADMIN RECORDS
================================================== */

async function loadAllRecordsForAdmin() {

    const body =
        document.getElementById(
            'adminTableBody'
        );


    if (body) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="text-align:center">

                    جاري تحميل التقرير...

                </td>

            </tr>

        `;

    }


    try {

        const response =
            await fetch(API_URL);


        if (!response.ok) {

            throw new Error(
                'Failed to load records'
            );

        }


        currentAllRecords =
            await response.json();


        renderAdminReport();


    } catch (error) {

        console.error(error);


        if (body) {

            body.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        style="text-align:center">

                        حدث خطأ أثناء تحميل البيانات

                    </td>

                </tr>

            `;

        }

    }

}


/* ==================================================
   REPORT TAB
================================================== */

function switchReportTab(type) {

    currentAdminReportType =
        type;


    updateAdminTabs();


    renderAdminReport();

}


/* ==================================================
   UPDATE TABS
================================================== */

function updateAdminTabs() {

    document
        .querySelectorAll(
            '.admin-tab'
        )
        .forEach(function (button) {

            button.classList.remove(
                'active'
            );

            if (
                button.dataset.type ===
                currentAdminReportType
            ) {

                button.classList.add(
                    'active'
                );

            }

        });

}


/* ==================================================
   REPORT RANGE
================================================== */

function getAdminDateRange(
    type,
    dateValue
) {

    const selected =
        dateValue
            ? new Date(
                `${dateValue}T00:00:00`
            )
            : new Date();


    let start;
    let end;


    /* =========================
       DAILY
    ========================= */

    if (type === 'daily') {

        start =
            new Date(selected);

        end =
            new Date(selected);

        end.setDate(
            end.getDate() + 1
        );

    }


    /* =========================
       WEEKLY
       الأحد → السبت
    ========================= */

    else if (type === 'weekly') {

        start =
            new Date(selected);


        const day =
            start.getDay();


        start.setDate(
            start.getDate() - day
        );


        start.setHours(
            0, 0, 0, 0
        );


        end =
            new Date(start);


        end.setDate(
            end.getDate() + 7
        );

    }


    /* =========================
       MONTHLY
    ========================= */

    else {

        start =
            new Date(
                selected.getFullYear(),
                selected.getMonth(),
                1
            );


        end =
            new Date(
                selected.getFullYear(),
                selected.getMonth() + 1,
                1
            );

    }


    return {
        start,
        end
    };

}


/* ==================================================
   FILTER ADMIN RECORDS
================================================== */

function getFilteredAdminRecords() {

    const dateInput =
        document.getElementById(
            'adminReferenceDate'
        );


    const dateValue =
        dateInput &&
        dateInput.value
            ? dateInput.value
            : getLocalDateInputValue();


    const range =
        getAdminDateRange(
            currentAdminReportType,
            dateValue
        );


    return currentAllRecords.filter(
        function (record) {

            if (!record.createdAt) {

                return false;

            }


            const recordDate =
                new Date(
                    record.createdAt
                );


            return (
                recordDate >= range.start &&
                recordDate < range.end
            );

        }
    );

}


/* ==================================================
   REPORT TITLE
================================================== */

function getAdminReportTitle() {

    if (
        currentAdminReportType ===
        'daily'
    ) {

        return 'التقرير اليومي';

    }


    if (
        currentAdminReportType ===
        'weekly'
    ) {

        return 'التقرير الأسبوعي';

    }


    return 'التقرير الشهري';

}


/* ==================================================
   REPORT PERIOD
================================================== */

function getAdminPeriodLabel() {

    const dateInput =
        document.getElementById(
            'adminReferenceDate'
        );


    const dateValue =
        dateInput &&
        dateInput.value
            ? dateInput.value
            : getLocalDateInputValue();


    const range =
        getAdminDateRange(
            currentAdminReportType,
            dateValue
        );


    const startText =
        range.start.toLocaleDateString(
            'ar-EG',
            {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }
        );


    const endDate =
        new Date(range.end);


    endDate.setDate(
        endDate.getDate() - 1
    );


    const endText =
        endDate.toLocaleDateString(
            'ar-EG',
            {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }
        );


    if (
        currentAdminReportType ===
        'daily'
    ) {

        return startText;

    }


    return `${startText} — ${endText}`;

}


/* ==================================================
   RENDER ADMIN REPORT
================================================== */

function renderAdminReport() {

    const records =
        getFilteredAdminRecords();


    const titleElement =
        document.getElementById(
            'adminReportTitle'
        );


    const periodElement =
        document.getElementById(
            'adminPeriodLabel'
        );


    if (titleElement) {

        titleElement.textContent =
            getAdminReportTitle();

    }


    if (periodElement) {

        periodElement.textContent =
            getAdminPeriodLabel();

    }


    const total =
        records.length;


    const lateness =
        records.filter(
            r => r.type === 'lateness'
        ).length;


    const uniform =
        records.filter(
            r => r.type === 'uniform'
        ).length;


    const escape =
        records.filter(
            r => r.type === 'escape'
        ).length;


    setText(
        'adminTotalCount',
        total
    );


    setText(
        'adminLatenessCount',
        lateness
    );


    setText(
        'adminUniformCount',
        uniform
    );


    setText(
        'adminEscapeCount',
        escape
    );


    renderAdminTable(records);

}


/* ==================================================
   SET TEXT
================================================== */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


/* ==================================================
   TRANSLATE TYPE
================================================== */

function translateType(type) {

    if (type === 'lateness') {

        return 'التأخير الصباحي';

    }


    if (type === 'uniform') {

        return 'الزي المدرسي';

    }


    if (type === 'escape') {

        return 'الهروب';

    }


    return type || '';

}


/* ==================================================
   ADMIN TABLE
================================================== */

function renderAdminTable(records) {

    const body =
        document.getElementById(
            'adminTableBody'
        );


    if (!body) return;


    if (!records.length) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="no-data">

                    لا توجد سجلات في هذه الفترة

                </td>

            </tr>

        `;

        return;

    }


    const sorted =
        [...records].sort(
            function (a, b) {

                return new Date(
                    b.createdAt
                ) - new Date(
                    a.createdAt
                );

            }
        );


    body.innerHTML =
        sorted.map(
            function (record) {

                const recordDate =
                    record.createdAt
                        ? new Date(
                            record.createdAt
                        ).toLocaleDateString(
                            'ar-EG'
                        )
                        : record.date || '';


                const details =
                    record.details || '';


                return `

                    <tr>

                        <td>
                            ${escapeHtml(recordDate)}
                        </td>

                        <td>
                            <span class="report-type">
                                ${escapeHtml(
                                    translateType(
                                        record.type
                                    )
                                )}
                            </span>
                        </td>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    record.studentName
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(
                                record.grade
                            )}
                            /
                            ${escapeHtml(
                                record.section
                            )}
                        </td>

                        <td>

                            ${
                                escapeHtml(
                                    record.time || ''
                                )
                            }

                            <br>

                            <small>
                                ${
                                    escapeHtml(
                                        details
                                    )
                                }
                            </small>

                        </td>

                        <td>

                            <button
                                class="admin-delete-btn"
                                onclick="adminDeleteRecord('${record._id}')">

                                حذف

                            </button>

                        </td>

                    </tr>

                `;

            }
        ).join('');

}


/* ==================================================
   ADMIN DELETE
================================================== */

async function adminDeleteRecord(id) {

    if (
        !confirm(
            'هل أنت متأكد من حذف هذا السجل؟'
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {
                    method: 'DELETE'
                }
            );


        if (!response.ok) {

            throw new Error(
                'Delete failed'
            );

        }


        await fetchRecordsFromCloud();

        await loadAllRecordsForAdmin();


        alert(
            'تم حذف السجل بنجاح'
        );


    } catch (error) {

        console.error(error);

        alert(
            'حدث خطأ أثناء حذف السجل'
        );

    }

}


/* ==================================================
   CHANGE REPORT DATE
================================================== */

function changeAdminReportDate() {

    renderAdminReport();

}


/* ==================================================
   PRINT ADMIN REPORT
================================================== */

function printAdminReport() {

    const records =
        getFilteredAdminRecords();


    const title =
        getAdminReportTitle();


    const period =
        getAdminPeriodLabel();


    const total =
        records.length;


    const lateness =
        records.filter(
            r => r.type === 'lateness'
        ).length;


    const uniform =
        records.filter(
            r => r.type === 'uniform'
        ).length;


    const escape =
        records.filter(
            r => r.type === 'escape'
        ).length;


    const rows =
        records.map(
            function (record) {

                const recordDate =
                    record.createdAt
                        ? new Date(
                            record.createdAt
                        ).toLocaleDateString(
                            'ar-EG'
                        )
                        : record.date || '';


                return `

                    <tr>

                        <td>
                            ${escapeHtml(recordDate)}
                        </td>

                        <td>
                            ${escapeHtml(
                                translateType(
                                    record.type
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.studentName
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.grade
                            )}
                            /
                            ${escapeHtml(
                                record.section
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.time
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.details
                            )}
                        </td>

                    </tr>

                `;

            }
        ).join('');


    const printWindow =
        window.open(
            '',
            '_blank',
            'width=1200,height=800'
        );


    if (!printWindow) {

        alert(
            'يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.'
        );

        return;

    }


    printWindow.document.write(`

        <!DOCTYPE html>

        <html lang="ar" dir="rtl">

        <head>

            <meta charset="UTF-8">

            <title>
                ${escapeHtml(title)}
            </title>

            <style>

                body {
                    font-family: Arial, sans-serif;
                    direction: rtl;
                    padding: 30px;
                }

                h1 {
                    text-align: center;
                }

                .period {
                    text-align: center;
                    margin-bottom: 25px;
                    color: #555;
                }

                .summary {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 25px;
                }

                .box {
                    flex: 1;
                    border: 1px solid #ddd;
                    padding: 15px;
                    text-align: center;
                    border-radius: 8px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th,
                td {
                    border: 1px solid #ccc;
                    padding: 10px;
                    text-align: center;
                }

                th {
                    background: #eeeeee;
                }

                @media print {

                    button {
                        display: none;
                    }

                }

            </style>

        </head>

        <body>

            <h1>
                مدرسة ذكور المستقبل الصالح الأساسية العليا
            </h1>

            <h2 style="text-align:center">
                ${escapeHtml(title)}
            </h2>

            <div class="period">
                ${escapeHtml(period)}
            </div>


            <div class="summary">

                <div class="box">
                    <strong>إجمالي الحالات</strong>
                    <br>
                    ${total}
                </div>

                <div class="box">
                    <strong>التأخير</strong>
                    <br>
                    ${lateness}
                </div>

                <div class="box">
                    <strong>الزي المدرسي</strong>
                    <br>
                    ${uniform}
                </div>

                <div class="box">
                    <strong>الهروب</strong>
                    <br>
                    ${escape}
                </div>

            </div>


            <table>

                <thead>

                    <tr>

                        <th>التاريخ</th>

                        <th>نوع الحالة</th>

                        <th>اسم الطالب</th>

                        <th>الصف / الشعبة</th>

                        <th>الوقت</th>

                        <th>التفاصيل</th>

                    </tr>

                </thead>

                <tbody>

                    ${rows}

                </tbody>

            </table>


            <script>

                window.onload = function() {

                    window.print();

                };

            <\/script>

        </body>

        </html>

    `);


    printWindow.document.close();

}


/* ==================================================
   OTHER REASONS
================================================== */

function toggleOtherReason() {

    const reason =
        document.getElementById(
            'latenessReason'
        );


    const other =
        document.getElementById(
            'otherReason'
        );


    if (!reason || !other) return;


    if (
        reason.value === 'other'
    ) {

        other.style.display =
            'block';

    } else {

        other.style.display =
            'none';

    }

}


/* ==================================================
   ADD LATENESS
================================================== */

async function addLateness(event) {

    if (event) {

        event.preventDefault();

    }


    const student =
        getValue('latenessStudent');


    const grade =
        getValue('latenessGrade');


    const section =
        getValue('latenessSection');


    const reasonElement =
        document.getElementById(
            'latenessReason'
        );


    const reason =
        reasonElement
            ? reasonElement.value
            : '';


    const other =
        getValue('otherReason');


    const finalReason =
        reason === 'other'
            ? other
            : reason;


    const time =
        getValue('latenessTime');


    const date =
        getValue('latenessDate')
        || getLocalDateInputValue();


    if (!student) {

        alert(
            'يرجى إدخال اسم الطالب'
        );

        return;

    }


    try {

        await saveRecord({

            type: 'lateness',

            studentName: student,

            grade: grade,

            section: section,

            time: time,

            date: date,

            details: finalReason

        });


        alert(
            'تم تسجيل التأخير بنجاح'
        );


        const form =
            document.getElementById(
                'latenessForm'
            );


        if (form) {

            form.reset();

        }


        setAutoDate(
            'latenessDate'
        );


        await fetchRecordsFromCloud();


    } catch (error) {

        console.error(error);

        alert(
            'حدث خطأ أثناء حفظ السجل'
        );

    }

}


/* ==================================================
   ADD UNIFORM
================================================== */

async function addUniform(event) {

    if (event) {

        event.preventDefault();

    }


    const student =
        getValue('uniformStudent');


    const grade =
        getValue('uniformGrade');


    const section =
        getValue('uniformSection');


    const status =
        getValue('uniformStatus');


    const date =
        getValue('uniformDate')
        || getLocalDateInputValue();


    if (!student) {

        alert(
            'يرجى إدخال اسم الطالب'
        );

        return;

    }


    try {

        await saveRecord({

            type: 'uniform',

            studentName: student,

            grade: grade,

            section: section,

            time: '',

            date: date,

            details: status

        });


        alert(
            'تم تسجيل الحالة بنجاح'
        );


        const form =
            document.getElementById(
                'uniformForm'
            );


        if (form) {

            form.reset();

        }


        setAutoDate(
            'uniformDate'
        );


        await fetchRecordsFromCloud();


    } catch (error) {

        console.error(error);

        alert(
            'حدث خطأ أثناء حفظ السجل'
        );

    }

}


/* ==================================================
   ADD ESCAPE
================================================== */

async function addEscape(event) {

    if (event) {

        event.preventDefault();

    }


    const student =
        getValue('escapeStudent');


    const grade =
        getValue('escapeGrade');


    const section =
        getValue('escapeSection');


    const time =
        getValue('escapeTime');


    const date =
        getValue('escapeDate')
        || getLocalDateInputValue();


    if (!student) {

        alert(
            'يرجى إدخال اسم الطالب'
        );

        return;

    }


    try {

        await saveRecord({

            type: 'escape',

            studentName: student,

            grade: grade,

            section: section,

            time: time,

            date: date,

            details: 'هروب'

        });


        alert(
            'تم تسجيل حالة الهروب بنجاح'
        );


        const form =
            document.getElementById(
                'escapeForm'
            );


        if (form) {

            form.reset();

        }


        setAutoDate(
            'escapeDate'
        );


        await fetchRecordsFromCloud();


    } catch (error) {

        console.error(error);

        alert(
            'حدث خطأ أثناء حفظ السجل'
        );

    }

}


/* ==================================================
   SAVE RECORD
================================================== */

async function saveRecord(data) {

    const response =
        await fetch(
            API_URL,
            {

                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body: JSON.stringify(data)

            }
        );


    if (!response.ok) {

        throw new Error(
            'Save failed'
        );

    }


    return await response.json();

}


/* ==================================================
   HELPERS
================================================== */

function getValue(id) {

    const element =
        document.getElementById(id);


    return element
        ? element.value.trim()
        : '';

}


function setAutoDate(id) {

    const element =
        document.getElementById(id);


    if (element) {

        element.value =
            getLocalDateInputValue();

    }

}


/* ==================================================
   SEARCH STUDENT
================================================== */

function searchStudentReport() {

    const input =
        document.getElementById(
            'searchStudent'
        );


    if (!input) return;


    const search =
        input.value.trim().toLowerCase();


    if (!search) {

        alert(
            'يرجى إدخال اسم الطالب'
        );

        return;

    }


    const records =
        currentAllRecords.length
            ? currentAllRecords
            : [];


    const found =
        records.filter(
            function (record) {

                return (
                    record.studentName &&
                    record.studentName
                        .toLowerCase()
                        .includes(search)
                );

            }
        );


    if (!found.length) {

        alert(
            'لا توجد سجلات لهذا الطالب'
        );

        return;

    }


    const rows =
        found.map(
            function (record) {

                return `

                    <tr>

                        <td>
                            ${escapeHtml(
                                record.date
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                translateType(
                                    record.type
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.studentName
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.grade
                            )}
                            /
                            ${escapeHtml(
                                record.section
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.time
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.details
                            )}
                        </td>

                    </tr>

                `;

            }
        ).join('');


    const win =
        window.open(
            '',
            '_blank'
        );


    win.document.write(`

        <html lang="ar" dir="rtl">

        <head>

            <meta charset="UTF-8">

            <title>
                تقرير الطالب
            </title>

            <style>

                body {
                    font-family:Arial;
                    padding:30px;
                    direction:rtl;
                }

                table {
                    width:100%;
                    border-collapse:collapse;
                }

                th, td {
                    border:1px solid #ccc;
                    padding:10px;
                    text-align:center;
                }

                th {
                    background:#eee;
                }

            </style>

        </head>

        <body>

            <h1>
                تقرير الطالب
            </h1>

            <table>

                <thead>

                    <tr>

                        <th>التاريخ</th>
                        <th>النوع</th>
                        <th>الطالب</th>
                        <th>الصف / الشعبة</th>
                        <th>الوقت</th>
                        <th>التفاصيل</th>

                    </tr>

                </thead>

                <tbody>

                    ${rows}

                </tbody>

            </table>

        </body>

        </html>

    `);


    win.document.close();

    win.print();

}


/* ==================================================
   CATEGORY REPORT
================================================== */

function printCategoryReport(category) {

    const records =
        dbData[category] || [];


    const title =
        translateType(category);


    const rows =
        records.map(
            function (record) {

                return `

                    <tr>

                        <td>
                            ${escapeHtml(
                                record.date
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.student
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.grade
                            )}
                            /
                            ${escapeHtml(
                                record.section
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.time
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                record.reason ||
                                record.status
                            )}
                        </td>

                    </tr>

                `;

            }
        ).join('');


    const win =
        window.open(
            '',
            '_blank'
        );


    win.document.write(`

        <html lang="ar" dir="rtl">

        <head>

            <meta charset="UTF-8">

            <title>
                ${escapeHtml(title)}
            </title>

            <style>

                body {
                    font-family:Arial;
                    direction:rtl;
                    padding:30px;
                }

                table {
                    width:100%;
                    border-collapse:collapse;
                }

                th,td {
                    border:1px solid #ccc;
                    padding:10px;
                    text-align:center;
                }

                th {
                    background:#eee;
                }

            </style>

        </head>

        <body>

            <h1>
                ${escapeHtml(title)}
            </h1>

            <table>

                <thead>

                    <tr>

                        <th>التاريخ</th>
                        <th>الطالب</th>
                        <th>الصف / الشعبة</th>
                        <th>الوقت</th>
                        <th>التفاصيل</th>

                    </tr>

                </thead>

                <tbody>

                    ${rows}

                </tbody>

            </table>

        </body>

        </html>

    `);


    win.document.close();

    win.print();

}
