
/* ==================================================
   API
================================================== */

const API_URL =
    'https://almustqbal.onrender.com/api/records';


/* ==================================================
   ONLINE PRESENCE
================================================== */

const AUTH_BASE_URL =
    'https://almustqbal.onrender.com';

let presenceInterval = null;

let presenceStarted = false;


/* معرف ثابت لهذا الجهاز/المتصفح */

let presenceClientId =
    localStorage.getItem(
        'schoolPresenceClientId'
    );


if (!presenceClientId) {

    presenceClientId =
        (
            crypto.randomUUID
            ? crypto.randomUUID()
            : (
                Date.now().toString(36) +
                Math.random().toString(36).substring(2)
            )
        );

    localStorage.setItem(
        'schoolPresenceClientId',
        presenceClientId
    );

}


/* ==================================================
   DATA
================================================== */

let dbData = {
    lateness: [],
    uniform: [],
    escape: [],
    absence: []
};

let currentAllRecords = [];
let currentAdminReportType = 'daily';
let currentFormattedDate = '';


/* ==================================================
   DATE
================================================== */

function getLocalDateInputValue() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            '0'
        );

    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            '0'
        );

    return `${year}-${month}-${day}`;
}


/* ==================================================
   AUTOMATIC DATE + TIME
   يتم أخذها لحظة الضغط على زر التسجيل
================================================== */

function getAutomaticDateTime() {

    const now = new Date();

    return {

        date:
            now.toLocaleDateString(
                'ar-EG'
            ),

        time:
            now.toLocaleTimeString(
                'ar-EG',
                {
                    hour: '2-digit',
                    minute: '2-digit'
                }
            ),

        createdAt:
            now.toISOString()

    };
}


/* ==================================================
   INITIALIZE
================================================== */

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


        const currentDateElement =
            document.getElementById(
                'currentDate'
            );


        if (currentDateElement) {

            currentDateElement.textContent =
                currentFormattedDate;

        }


        /*
         * هذا يبقى فقط للحفاظ على
         * أي عناصر .auto-date موجودة
         * في الصفحة.
         */

        document
            .querySelectorAll('.auto-date')
            .forEach(
                function (element) {

                    element.value =
                        getLocalDateInputValue();

                }
            );


        fetchRecordsFromCloud();

        setupForgotPasswordEnter();

    }
);


/* ==================================================
   ONLINE PRESENCE FUNCTIONS
================================================== */

function updateOnlineUsersCount(
    count
) {

    const element =
        document.getElementById(
            'onlineUsersCount'
        );


    if (element) {

        element.textContent =
            Number(count) || 0;

    }

}


/* إرسال نبضة للسيرفر */

async function sendPresenceHeartbeat() {

    if (!presenceStarted) {
        return;
    }


    try {

        const response =
            await fetch(
                `${AUTH_BASE_URL}/api/presence/heartbeat`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            clientId:
                                presenceClientId
                        })
                }
            );


        if (!response.ok) {
            return;
        }


        const data =
            await response.json();


        if (
            data &&
            data.success
        ) {

            updateOnlineUsersCount(
                data.count
            );

        }

    } catch (error) {

        console.error(
            'Presence heartbeat error:',
            error
        );

    }

}


/* بدء مراقبة الاتصال */

function startPresenceMonitoring() {

    if (presenceStarted) {
        return;
    }


    presenceStarted = true;


    sendPresenceHeartbeat();


    presenceInterval =
        setInterval(
            sendPresenceHeartbeat,
            20 * 1000
        );

}


/* إيقاف مراقبة الاتصال */

function stopPresenceMonitoring() {

    presenceStarted = false;


    if (presenceInterval) {

        clearInterval(
            presenceInterval
        );

        presenceInterval = null;

    }


    updateOnlineUsersCount(0);

}


/* تسجيل الخروج من نظام المتصلين */

function notifyPresenceLogout() {

    if (!presenceClientId) {
        return;
    }


    const payload =
        JSON.stringify({
            clientId:
                presenceClientId
        });


    try {

        if (
            navigator.sendBeacon
        ) {

            const blob =
                new Blob(
                    [payload],
                    {
                        type:
                            'application/json'
                    }
                );


            navigator.sendBeacon(
                `${AUTH_BASE_URL}/api/presence/logout`,
                blob
            );

        }

    } catch (error) {

        console.error(
            'Presence logout error:',
            error
        );

    }

}


/* عند إغلاق الصفحة */

window.addEventListener(
    'beforeunload',
    function () {

        if (presenceStarted) {

            notifyPresenceLogout();

        }

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

    const input =
        document.getElementById(
            'favoriteNumberInput'
        );

    const errorMsg =
        document.getElementById(
            'forgotErrorMsg'
        );


    if (!modal) {

        console.error(
            'Forgot password modal not found'
        );

        return;

    }


    modal.style.display =
        'flex';


    if (input) {

        input.value = '';

        setTimeout(
            function () {

                input.focus();

            },
            100
        );

    }


    if (errorMsg) {

        errorMsg.textContent =
            '';

        errorMsg.style.display =
            'none';

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

        errorMsg.textContent =
            '';

        errorMsg.style.display =
            'none';

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

        submitBtn.disabled =
            true;

        submitBtn.innerText =
            'جاري التحقق...';

    }


    try {

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


        if (
            !response.ok ||
            !data.success
        ) {

            if (errorMsg) {

                errorMsg.textContent =
                    data.message ||
                    'الإجابة غير صحيحة';

                errorMsg.style.display =
                    'block';

            }

            return;

        }


        const newPassword =
            data.password;


        if (!newPassword) {

            throw new Error(
                'لم تصل كلمة المرور الجديدة من السيرفر'
            );

        }


        try {

            const emailResult =
                await emailjs.send(
                    'service_uh9k24u',
                    'template_r4tlcdl',
                    {
                        password:
                            newPassword
                    }
                );


            console.log(
                'EMAILJS SUCCESS:',
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
                error.message ||
                'تعذر الاتصال بالسيرفر، حاول مرة أخرى.';

            errorMsg.style.display =
                'block';

        }

    } finally {

        if (submitBtn) {

            submitBtn.disabled =
                false;

            submitBtn.innerText =
                'متابعة';

        }

    }

}


/* ==================================================
   ENTER IN SECURITY INPUT
================================================== */

function setupForgotPasswordEnter() {

    const input =
        document.getElementById(
            'favoriteNumberInput'
        );


    if (
        !input ||
        input.dataset.enterReady === '1'
    ) {

        return;

    }


    input.dataset.enterReady =
        '1';


    input.addEventListener(
        'keydown',
        function (event) {

            if (
                event.key ===
                'Enter'
            ) {

                event.preventDefault();

                submitForgotPassword();

            }

        }
    );

}


/* ==================================================
   FETCH RECORDS
================================================== */

async function fetchRecordsFromCloud() {

    try {

        const response =
            await fetch(
                API_URL
            );


        if (!response.ok) {

            throw new Error(
                'Failed to load records'
            );

        }


        const records =
            await response.json();


        if (!Array.isArray(records)) {

            throw new Error(
                'Invalid records response'
            );

        }


        currentAllRecords =
            records;


        dbData = {

            lateness: [],

            uniform: [],

            escape: [],

            absence: []

        };


        records.forEach(
            function (record) {

                const mapped = {

                    id:
                        record._id,

                    student:
                        record.studentName ||
                        '',

                    grade:
                        record.grade ||
                        '',

                    section:
                        record.section ||
                        '',

                    date:
                        record.date ||
                        '',

                    time:
                        record.time ||
                        '',

                    reason:
                        record.details ||
                        '',

                    status:
                        record.details ||
                        '',

                    createdAt:
                        record.createdAt ||
                        null

                };


                if (
                    record.type ===
                    'lateness'
                ) {

                    dbData.lateness.push(
                        mapped
                    );

                }


                else if (
                    record.type ===
                    'uniform'
                ) {

                    dbData.uniform.push(
                        mapped
                    );

                }


                else if (
                    record.type ===
                    'escape'
                ) {

                    dbData.escape.push(
                        mapped
                    );

                }


                else if (
                    record.type ===
                    'absence'
                ) {

                    dbData.absence.push(
                        mapped
                    );

                }

            }
        );


        renderLogs();


        const adminModal =
            document.getElementById(
                'adminModal'
            );


        const adminTableBody =
            document.getElementById(
                'adminTableBody'
            );


        if (
            adminModal &&
            adminTableBody
        ) {

            renderAdminReport();

        }


    } catch (error) {

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


    renderCategoryLogs(
        'absence',
        'absenceLogs'
    );

}


function renderCategoryLogs(
    category,
    elementId
) {

    const container =
        document.getElementById(
            elementId
        );


    if (!container) {

        return;

    }


    const records =
        dbData[category] ||
        [];


    if (!records.length) {

        container.innerHTML =
            '<div class="empty-log">لا توجد سجلات</div>';

        return;

    }


    const latestRecords =
        [...records]
            .sort(
                function (a, b) {

                    const dateA =
                        getRecordDateObject(
                            a
                        );


                    const dateB =
                        getRecordDateObject(
                            b
                        );


                    if (
                        !dateA ||
                        !dateB
                    ) {

                        return 0;

                    }


                    return dateB - dateA;

                }
            )
            .slice(
                0,
                5
            );


    container.innerHTML =
        latestRecords
            .map(
                function (record) {

                    const timeText =
                        record.time
                            ? ` - ${escapeHtml(record.time)}`
                            : '';


                    return `

                        <div class="log-item">

                            <div>

                                <strong>
                                    ${escapeHtml(
                                        record.student
                                    )}
                                </strong>

                                <div>
                                    ${escapeHtml(
                                        record.date
                                    )}${timeText}
                                </div>

                            </div>

                            <button
                                onclick="deleteRecord('${record.id}')"
                                class="delete-btn">

                                حذف

                            </button>

                        </div>

                    `;

                }
            )
            .join('');

}


/* ==================================================
   ESCAPE HTML
================================================== */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return '';

    }


    return String(value)

        .replace(
            /&/g,
            '&amp;'
        )

        .replace(
            /</g,
            '&lt;'
        )

        .replace(
            />/g,
            '&gt;'
        )

        .replace(
            /"/g,
            '&quot;'
        )

        .replace(
            /'/g,
            '&#039;'
        );

}


/* ==================================================
   DELETE RECORD
================================================== */

async function deleteRecord(
    id
) {

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
                    method:
                        'DELETE'
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

        console.error(
            error
        );


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


    if (!modal) {

        return;

    }


    modal.style.display =
        'flex';


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


    renderAdminReport();


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
            await fetch(
                API_URL
            );


        if (!response.ok) {

            throw new Error(
                'Failed to load records'
            );

        }


        const records =
            await response.json();


        if (!Array.isArray(records)) {

            throw new Error(
                'Invalid response'
            );

        }


        currentAllRecords =
            records;


        renderAdminReport();


    } catch (error) {

        console.error(
            error
        );


        if (body) {

            body.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        style="
                            text-align:center;
                            color:red;
                            padding:15px;
                        ">

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

function switchReportTab(
    type
) {

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
        .forEach(
            function (button) {

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

            }
        );

}


/* ==================================================
   REPORT DATE RANGE
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


    if (
        type ===
        'daily'
    ) {

        start =
            new Date(
                selected
            );


        start.setHours(
            0,
            0,
            0,
            0
        );


        end =
            new Date(
                start
            );


        end.setDate(
            end.getDate() + 1
        );

    }


    else if (
        type ===
        'weekly'
    ) {

        start =
            new Date(
                selected
            );


        start.setHours(
            0,
            0,
            0,
            0
        );


        const day =
            start.getDay();


        start.setDate(
            start.getDate() - day
        );


        end =
            new Date(
                start
            );


        end.setDate(
            end.getDate() + 7
        );

    }


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
   RECORD DATE
================================================== */

function getRecordDateObject(
    record
) {

    if (
        record.createdAt
    ) {

        const created =
            new Date(
                record.createdAt
            );


        if (
            !isNaN(
                created.getTime()
            )
        ) {

            return created;

        }

    }


    if (
        record.date
    ) {

        const localDate =
            new Date(
                `${record.date}T00:00:00`
            );


        if (
            !isNaN(
                localDate.getTime()
            )
        ) {

            return localDate;

        }

    }


    return null;

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

            const recordDate =
                getRecordDateObject(
                    record
                );


            if (!recordDate) {

                return false;

            }


            return (
                recordDate >=
                    range.start &&
                recordDate <
                    range.end
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
                year:
                    'numeric',
                month:
                    'long',
                day:
                    'numeric'
            }
        );


    if (
        currentAdminReportType ===
        'daily'
    ) {

        return startText;

    }


    const endDate =
        new Date(
            range.end
        );


    endDate.setDate(
        endDate.getDate() - 1
    );


    const endText =
        endDate.toLocaleDateString(
            'ar-EG',
            {
                year:
                    'numeric',
                month:
                    'long',
                day:
                    'numeric'
            }
        );


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
            function (r) {

                return (
                    r.type ===
                    'lateness'
                );

            }
        ).length;


    const uniform =
        records.filter(
            function (r) {

                return (
                    r.type ===
                    'uniform'
                );

            }
        ).length;


    const escape =
        records.filter(
            function (r) {

                return (
                    r.type ===
                    'escape'
                );

            }
        ).length;


    const absence =
        records.filter(
            function (r) {

                return (
                    r.type ===
                    'absence'
                );

            }
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


    setText(
        'adminAbsenceCount',
        absence
    );


    renderAdminTable(
        records
    );

}


/* ==================================================
   SET TEXT
================================================== */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* ==================================================
   TRANSLATE TYPE
================================================== */

function translateType(
    type
) {

    if (
        type ===
        'lateness'
    ) {

        return 'التأخير الصباحي';

    }


    if (
        type ===
        'uniform'
    ) {

        return 'الزي المدرسي';

    }


    if (
        type ===
        'escape'
    ) {

        return 'الهروب';

    }


    if (
        type ===
        'absence'
    ) {

        return 'الغياب';

    }


    return type || '';

}


/* ==================================================
   ADMIN TABLE
================================================== */

function renderAdminTable(
    records
) {

    const body =
        document.getElementById(
            'adminTableBody'
        );


    if (!body) {

        return;

    }


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

                const dateA =
                    getRecordDateObject(
                        a
                    );


                const dateB =
                    getRecordDateObject(
                        b
                    );


                if (
                    !dateA ||
                    !dateB
                ) {

                    return 0;

                }


                return dateB - dateA;

            }
        );


    body.innerHTML =
        sorted
            .map(
                function (record) {

                    const recordDateObject =
                        getRecordDateObject(
                            record
                        );


                    const recordDate =
                        recordDateObject
                            ? recordDateObject.toLocaleDateString(
                                'ar-EG'
                            )
                            : record.date ||
                              '';


                    const details =
                        record.details ||
                        '';


                    const time =
                        record.time ||
                        '';


                    const grade =
                        record.grade ||
                        '';


                    const section =
                        record.section ||
                        '';


                    const gradeSection =
                        grade ||
                        section
                            ? `${grade} / ${section}`
                            : '--';


                    return `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    recordDate
                                )}
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
                                        record.studentName ||
                                        ''
                                    )}

                                </strong>

                            </td>


                            <td>

                                ${escapeHtml(
                                    gradeSection
                                )}

                            </td>


                            <td>

                                ${escapeHtml(
                                    time
                                )}

                                <br>

                                <small>

                                    ${escapeHtml(
                                        details
                                    )}

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
            )
            .join('');

}


/* ==================================================
   ADMIN DELETE
================================================== */

async function adminDeleteRecord(
    id
) {

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
                    method:
                        'DELETE'
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

        console.error(
            error
        );


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
            function (r) {
                return r.type === 'lateness';
            }
        ).length;

    const uniform =
        records.filter(
            function (r) {
                return r.type === 'uniform';
            }
        ).length;

    const escape =
        records.filter(
            function (r) {
                return r.type === 'escape';
            }
        ).length;

    const absence =
        records.filter(
            function (r) {
                return r.type === 'absence';
            }
        ).length;


    const rows =
        records
            .map(
                function (record) {

                    const recordDateObject =
                        getRecordDateObject(record);

                    const recordDate =
                        recordDateObject
                            ? recordDateObject.toLocaleDateString('ar-EG')
                            : record.date || '';

                    const grade =
                        record.grade || '';

                    const section =
                        record.section || '';

                    const gradeSection =
                        grade || section
                            ? `${grade} / ${section}`
                            : '--';

                    return `
                        <tr>

                            <td>
                                ${escapeHtml(recordDate)}
                            </td>

                            <td>
                                ${escapeHtml(
                                    translateType(record.type)
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.studentName || ''
                                )}
                            </td>

                            <td>
                                ${escapeHtml(gradeSection)}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.time || ''
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.details || ''
                                )}
                            </td>

                        </tr>
                    `;

                }
            )
            .join('');


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

                @page {
                    size: A4;
                    margin: 15mm;
                }

                body {
                    font-family: Arial, sans-serif;
                    direction: rtl;
                    padding: 20px;
                    color: #000;
                }

                h1,
                h2 {
                    text-align: center;
                    margin: 5px 0;
                }

                h1 {
                    font-size: 24px;
                }

                h2 {
                    font-size: 20px;
                }

                .manager {
                    text-align: center;
                    font-size: 16px;
                    margin: 8px 0 15px;
                    font-weight: bold;
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
                    flex-wrap: wrap;
                }

                .box {
                    flex: 1;
                    min-width: 130px;
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

                .print-signature {
                    margin-top: 70px;
                    padding-top: 20px;
                    border-top: 1px solid #ccc;

                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;

                    font-size: 16px;
                    font-weight: bold;
                }

                .signature-line {
                    min-width: 240px;
                    text-align: center;
                }

            </style>

        </head>

        <body>

            <h1>
                مدرسة ذكور المستقبل الصالح الأساسية العليا
            </h1>

            <h2>
                ${escapeHtml(title)}
            </h2>

            <div class="manager">
                مدير المدرسة: أ. سمير مصلح
            </div>

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

                <div class="box">
                    <strong>الغياب</strong>
                    <br>
                    ${absence}
                </div>

            </div>

            <table>

                <thead>

                    <tr>
                        <th>التاريخ</th>
                        <th>نوع الحالة</th>
                        <th>اسم الطالب</th>
                        <th>الصف / الشعبة</th>
                        <th>وقت التسجيل</th>
                        <th>التفاصيل</th>
                    </tr>

                </thead>

                <tbody>

                    ${rows}

                </tbody>

            </table>

            <div class="print-signature">

                <div>
                    مدير المدرسة: أ. سمير مصلح
                </div>

                <div class="signature-line">
                    التوقيع: __________________
                </div>

            </div>

            <script>

                window.onload = function () {
                    window.print();
                };

            <\/script>

        </body>

        </html>
    `);

    printWindow.document.close();
}

/* ==================================================
   OTHER REASON
================================================== */

function toggleOtherReason() {

    const reason =
        document.getElementById(
            'latenessReason'
        );


    const otherGroup =
        document.getElementById(
            'otherReasonGroup'
        );


    if (
        !reason ||
        !otherGroup
    ) {

        return;

    }


    if (
        reason.value ===
        'other'
    ) {

        otherGroup.style.display =
            'block';

    }

    else {

        otherGroup.style.display =
            'none';

    }

}


/* ==================================================
   ADD LATENESS
   بدون إدخال وقت أو تاريخ يدوي
================================================== */

async function addLateness(
    event
) {

    if (event) {

        event.preventDefault();

    }


    const student =
        getValue(
            'latenessStudent'
        );


    const grade =
        getValue(
            'latenessGrade'
        );


    const section =
        getValue(
            'latenessSection'
        );


    const reasonElement =
        document.getElementById(
            'latenessReason'
        );


    const reason =
        reasonElement
            ? reasonElement.value
            : '';


    const other =
        getValue(
            'otherReasonText'
        );


    const finalReason =
        reason === 'other'
            ? other
            : reason;


    if (!student) {

        alert(
            'يرجى إدخال اسم الطالب'
        );

        return;

    }


    const dateTime =
        getAutomaticDateTime();


    try {

        await saveRecord({

            type:
                'lateness',

            studentName:
                student,

            grade:
                grade,

            section:
                section,

            date:
                dateTime.date,

            time:
                dateTime.time,

            details:
                finalReason

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


        toggleOtherReason();


        await fetchRecordsFromCloud();


    } catch (error) {

        console.error(
            error
        );


        alert(
            'حدث خطأ أثناء حفظ السجل'
        );

    }

}


/* ==================================================
   ADD UNIFORM
   بدون إدخال وقت أو تاريخ يدوي
================================================== */

async function addUniform(
    event
) {

    if (event) {

        event.preventDefault();

    }


    const student =
        getValue(
            'uniformStudent'
        );


    const grade =
        getValue(
            'uniformGrade'
        );


    const section =
        getValue(
            'uniformSection'
        );


    const status =
        getValue(
            'uniformStatus'
        );


    if (!student) {

        alert(
            'يرجى إدخال اسم الطالب'
        );

        return;

    }


    const dateTime =
        getAutomaticDateTime();


    try {

        await saveRecord({

            type:
                'uniform',

            studentName:
                student,

            grade:
                grade,

            section:
                section,

            date:
                dateTime.date,

            time:
                dateTime.time,

            details:
                status

        });


        alert(
            'تم تسجيل حالة الزي بنجاح'
        );


        const form =
            document.getElementById(
                'uniformForm'
            );


        if (form) {

            form.reset();

        }


        await fetchRecordsFromCloud();


    } catch (error) {

        console.error(
            error
        );


        alert(
            'حدث خطأ أثناء حفظ السجل'
        );

    }

}


/* ==================================================
   ADD ESCAPE
   بدون إدخال وقت أو تاريخ يدوي
================================================== */

async function addEscape(
    event
) {

    if (event) {

        event.preventDefault();

    }


    const student =
        getValue(
            'escapeStudent'
        );


    const grade =
        getValue(
            'escapeGrade'
        );


    const section =
        getValue(
            'escapeSection'
        );


    if (!student) {

        alert(
            'يرجى إدخال اسم الطالب'
        );

        return;

    }


    const dateTime =
        getAutomaticDateTime();


    try {

        await saveRecord({

            type:
                'escape',

            studentName:
                student,

            grade:
                grade,

            section:
                section,

            date:
                dateTime.date,

            time:
                dateTime.time,

            details:
                'هروب'

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


        await fetchRecordsFromCloud();


    } catch (error) {

        console.error(
            error
        );


        alert(
            'حدث خطأ أثناء حفظ السجل'
        );

    }

}


/* ==================================================
   ADD ABSENCE
================================================== */

async function addAbsence(
    event
) {

    if (event) {

        event.preventDefault();

    }


    const student =
        getValue(
            'absenceStudent'
        );


    const grade =
        getValue(
            'absenceGrade'
        );


    const section =
        getValue(
            'absenceSection'
        );


    if (!student) {

        alert(
            'يرجى إدخال اسم الطالب'
        );

        return;

    }


    const dateTime =
        getAutomaticDateTime();


    try {

        await saveRecord({

            type:
                'absence',

            studentName:
                student,

            grade:
                grade,

            section:
                section,

            date:
                dateTime.date,

            time:
                dateTime.time,

            details:
                'غياب'

        });


        alert(
            'تم تسجيل الغياب بنجاح'
        );


        const form =
            document.getElementById(
                'absenceForm'
            );


        if (form) {

            form.reset();

        }


        await fetchRecordsFromCloud();


    } catch (error) {

        console.error(
            error
        );


        alert(
            'حدث خطأ أثناء حفظ الغياب'
        );

    }

}


/* ==================================================
   SAVE RECORD
================================================== */

async function saveRecord(
    data
) {

    const response =
        await fetch(
            API_URL,
            {

                method:
                    'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body:
                    JSON.stringify(
                        data
                    )

            }
        );


    if (!response.ok) {

        let message =
            'Save failed';


        try {

            const errorData =
                await response.json();


            message =
                errorData.message ||
                message;

        } catch (e) {

            // ignore

        }


        throw new Error(
            message
        );

    }


    return await response.json();

}


/* ==================================================
   HELPERS
================================================== */

function getValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    return element
        ? element.value.trim()
        : '';

}


function setAutoDate(
    id
) {

    const element =
        document.getElementById(
            id
        );


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
        document.getElementById('searchStudent');

    if (!input) {
        return;
    }

    const search =
        input.value.trim().toLowerCase();

    if (!search) {

        alert(
            'يرجى إدخال اسم الطالب'
        );

        return;
    }

    const found =
        currentAllRecords.filter(
            function (record) {

                const name =
                    record.studentName || '';

                return name
                    .toLowerCase()
                    .includes(search);

            }
        );


    if (!found.length) {

        alert(
            'لا توجد سجلات لهذا الطالب'
        );

        return;
    }


    const rows =
        found
            .map(
                function (record) {

                    const grade =
                        record.grade || '';

                    const section =
                        record.section || '';

                    const gradeSection =
                        grade || section
                            ? `${grade} / ${section}`
                            : '--';

                    return `
                        <tr>

                            <td>
                                ${escapeHtml(
                                    record.date || ''
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    translateType(record.type)
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.studentName || ''
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    gradeSection
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.time || ''
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.details || ''
                                )}
                            </td>

                        </tr>
                    `;

                }
            )
            .join('');


    const win =
        window.open(
            '',
            '_blank',
            'width=1200,height=800'
        );


    if (!win) {

        alert(
            'يرجى السماح بالنوافذ المنبثقة للتقرير.'
        );

        return;
    }


    win.document.write(`

        <!DOCTYPE html>

        <html lang="ar" dir="rtl">

        <head>

            <meta charset="UTF-8">

            <title>
                تقرير الطالب
            </title>

            <style>

                @page {
                    size: A4;
                    margin: 15mm;
                }

                body {
                    font-family: Arial, sans-serif;
                    direction: rtl;
                    padding: 20px;
                    color: #000;
                }

                h1,
                h2 {
                    text-align: center;
                }

                h1 {
                    font-size: 24px;
                }

                h2 {
                    font-size: 20px;
                }

                .manager {
                    text-align: center;
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 20px;
                }

                .student-name {
                    text-align: center;
                    margin-bottom: 20px;
                    font-size: 17px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 25px;
                }

                th,
                td {
                    border: 1px solid #ccc;
                    padding: 10px;
                    text-align: center;
                }

                th {
                    background: #eee;
                }

                .print-signature {
                    margin-top: 70px;
                    padding-top: 20px;
                    border-top: 1px solid #ccc;

                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;

                    font-size: 16px;
                    font-weight: bold;
                }

                .signature-line {
                    min-width: 240px;
                    text-align: center;
                }

            </style>

        </head>

        <body>

            <h1>
                مدرسة ذكور المستقبل الصالح الأساسية العليا
            </h1>

            <h2>
                تقرير الطالب
            </h2>

            <div class="manager">
                مدير المدرسة: أ. سمير مصلح
            </div>

            <div class="student-name">

                اسم الطالب:
                <strong>
                    ${escapeHtml(
                        found[0].studentName || ''
                    )}
                </strong>

            </div>

            <table>

                <thead>

                    <tr>

                        <th>التاريخ</th>
                        <th>النوع</th>
                        <th>الطالب</th>
                        <th>الصف / الشعبة</th>
                        <th>وقت التسجيل</th>
                        <th>التفاصيل</th>

                    </tr>

                </thead>

                <tbody>

                    ${rows}

                </tbody>

            </table>

            <div class="print-signature">

                <div>
                    مدير المدرسة: أ. سمير مصلح
                </div>

                <div class="signature-line">
                    التوقيع: __________________
                </div>

            </div>

        </body>

        </html>

    `);


    win.document.close();


    setTimeout(
        function () {
            win.print();
        },
        300
    );

}


/* ==================================================
   CATEGORY REPORT
================================================== */

function printCategoryReport(category) {

    const records =
        dbData[category] || [];


    if (!records.length) {

        alert(
            'لا توجد سجلات لهذه الفئة حالياً.'
        );

        return;
    }


    const title =
        translateType(category);


    const rows =
        records
            .map(
                function (record) {

                    const grade =
                        record.grade || '';

                    const section =
                        record.section || '';

                    const gradeSection =
                        grade || section
                            ? `${grade} / ${section}`
                            : '--';

                    return `
                        <tr>

                            <td>
                                ${escapeHtml(
                                    record.date || ''
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.student || ''
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    gradeSection
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.time || ''
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.reason ||
                                    record.status ||
                                    ''
                                )}
                            </td>

                        </tr>
                    `;

                }
            )
            .join('');


    const win =
        window.open(
            '',
            '_blank',
            'width=1200,height=800'
        );


    if (!win) {

        alert(
            'يرجى السماح بالنوافذ المنبثقة للتقرير.'
        );

        return;
    }


    win.document.write(`

        <!DOCTYPE html>

        <html lang="ar" dir="rtl">

        <head>

            <meta charset="UTF-8">

            <title>
                ${escapeHtml(title)}
            </title>

            <style>

                @page {
                    size: A4;
                    margin: 15mm;
                }

                body {
                    font-family: Arial, sans-serif;
                    direction: rtl;
                    padding: 20px;
                    color: #000;
                }

                h1,
                h2 {
                    text-align: center;
                }

                h1 {
                    font-size: 24px;
                }

                h2 {
                    font-size: 20px;
                    margin-bottom: 8px;
                }

                .manager {
                    text-align: center;
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 20px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 25px;
                }

                th,
                td {
                    border: 1px solid #ccc;
                    padding: 10px;
                    text-align: center;
                }

                th {
                    background: #eee;
                }

                .print-signature {
                    margin-top: 70px;
                    padding-top: 20px;
                    border-top: 1px solid #ccc;

                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;

                    font-size: 16px;
                    font-weight: bold;
                }

                .signature-line {
                    min-width: 240px;
                    text-align: center;
                }

            </style>

        </head>

        <body>

            <h1>
                مدرسة ذكور المستقبل الصالح الأساسية العليا
            </h1>

            <h2>
                ${escapeHtml(title)}
            </h2>

            <div class="manager">
                مدير المدرسة: أ. سمير مصلح
            </div>

            <table>

                <thead>

                    <tr>

                        <th>التاريخ</th>
                        <th>الطالب</th>
                        <th>الصف / الشعبة</th>
                        <th>وقت التسجيل</th>
                        <th>التفاصيل</th>

                    </tr>

                </thead>

                <tbody>

                    ${rows}

                </tbody>

            </table>

            <div class="print-signature">

                <div>
                    مدير المدرسة: أ. سمير مصلح
                </div>

                <div class="signature-line">
                    التوقيع: __________________
                </div>

            </div>

            <script>

                window.onload = function () {
                    window.print();
                };

            <\/script>

        </body>

        </html>

    `);


    win.document.close();


    setTimeout(
        function () {
            win.print();
        },
        300
    );

}




/* ==================================================
   EXPORT BACKUP
================================================== */

async function exportData() {

    try {

        let records =
            currentAllRecords;


        if (
            !Array.isArray(records) ||
            records.length === 0
        ) {

            const response =
                await fetch(
                    API_URL
                );


            if (!response.ok) {

                throw new Error(
                    'Failed to fetch records'
                );

            }


            records =
                await response.json();

        }


        if (
            !Array.isArray(records)
        ) {

            throw new Error(
                'Invalid records data'
            );

        }


        const backup = {

            exportDate:
                new Date().toISOString(),

            school:
                'مدرسة ذكور المستقبل الصالح الأساسية العليا',

            records:
                records

        };


        const json =
            JSON.stringify(
                backup,
                null,
                2
            );


        const blob =
            new Blob(
                [json],
                {
                    type:
                        'application/json;charset=utf-8'
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                'a'
            );


        link.href =
            url;


        link.download =
            `نسخة-احتياطية-الانضباط-${getLocalDateInputValue()}.json`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        alert(
            'تم تصدير النسخة الاحتياطية بنجاح.'
        );


    } catch (error) {

        console.error(
            'Export error:',
            error
        );


        alert(
            'حدث خطأ أثناء تصدير النسخة الاحتياطية.'
        );

    }

}


/* ==================================================
   IMPORT BACKUP
================================================== */

async function importData(
    event
) {

    const file =
        event &&
        event.target &&
        event.target.files
            ? event.target.files[0]
            : null;


    if (!file) {

        return;

    }


    try {

        const text =
            await file.text();


        const parsed =
            JSON.parse(
                text
            );


        const records =
            Array.isArray(parsed)
                ? parsed
                : parsed.records;


        if (
            !Array.isArray(records)
        ) {

            throw new Error(
                'ملف النسخة الاحتياطية غير صحيح'
            );

        }


        const confirmed =
            confirm(
                `سيتم استيراد ${records.length} سجل إلى قاعدة البيانات.\n\nهل تريد المتابعة؟`
            );


        if (!confirmed) {

            event.target.value =
                '';

            return;

        }


        let importedCount =
            0;


        for (
            const record
            of records
        ) {

            const payload = {

                type:
                    record.type,

                studentName:
                    record.studentName ||
                    record.student ||
                    '',

                grade:
                    record.grade ||
                    '',

                section:
                    record.section ||
                    '',

                time:
                    record.time ||
                    '',

                date:
                    record.date ||
                    getLocalDateInputValue(),

                details:
                    record.details ||
                    record.reason ||
                    record.status ||
                    ''

            };


            if (
                !payload.type ||
                !payload.studentName
            ) {

                continue;

            }


            await saveRecord(
                payload
            );


            importedCount++;

        }


        await fetchRecordsFromCloud();


        alert(
            `تم استرجاع ${importedCount} سجل بنجاح.`
        );


    } catch (error) {

        console.error(
            'Import error:',
            error
        );


        alert(
            'حدث خطأ أثناء استرجاع النسخة الاحتياطية.\n\n' +
            (
                error.message ||
                'الملف غير صالح'
            )
        );

    }


    finally {

        if (
            event &&
            event.target
        ) {

            event.target.value =
                '';

        }

    }

}
