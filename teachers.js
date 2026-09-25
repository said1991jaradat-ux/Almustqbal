/* =========================================================
   TEACHERS MANAGEMENT
   MongoDB Version
   Compatible with server.js

   إضافة:
   حساب الوقت المتبقي لتسليم أعمال اللجان
========================================================= */


/* =========================================================
   API
========================================================= */

const TEACHERS_API_URL =
    'https://almustqbal.onrender.com/api/teachers';


/* =========================================================
   PRESENCE (المتصلون الآن)
========================================================= */

const PRESENCE_BASE_URL =
    'https://almustqbal.onrender.com';

let presenceInterval = null;

let presenceStarted = false;


/* نفس معرف المتصفح المستخدم في صفحة الطلاب */

let presenceClientId =
    localStorage.getItem(
        'schoolPresenceClientId'
    );


if (!presenceClientId) {

    if (
        typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
    ) {

        presenceClientId =
            crypto.randomUUID();

    } else {

        presenceClientId =
            Date.now().toString(36) +
            '-' +
            Math.random()
                .toString(36)
                .substring(2);

    }

    localStorage.setItem(
        'schoolPresenceClientId',
        presenceClientId
    );

}


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


async function sendPresenceHeartbeat() {

    if (!presenceStarted) {

        return;

    }

    try {

        const response =
            await fetch(
                `${PRESENCE_BASE_URL}/api/presence/heartbeat`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        clientId: presenceClientId
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


function startPresenceMonitoring() {

    if (presenceStarted) {

        return;

    }


    presenceStarted =
        true;


    sendPresenceHeartbeat();


    presenceInterval =
        setInterval(
            sendPresenceHeartbeat,
            20000
        );

}


function stopPresenceMonitoring() {

    presenceStarted =
        false;


    if (presenceInterval) {

        clearInterval(
            presenceInterval
        );


        presenceInterval =
            null;

    }


    updateOnlineUsersCount(
        0
    );

}


async function notifyPresenceLogout() {

    if (!presenceClientId) {
        return false;
    }

    const payload = JSON.stringify({
        clientId: presenceClientId
    });

    try {

        const response = await fetch(
            `${PRESENCE_BASE_URL}/api/presence/logout`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: payload,

                keepalive: true
            }
        );

        if (!response.ok) {

            console.error(
                'Presence logout failed:',
                response.status
            );

            return false;
        }

        const data = await response.json();

        if (
            data &&
            data.success
        ) {

            updateOnlineUsersCount(
                data.count
            );

            return true;
        }

    } catch (error) {

        console.error(
            'Presence logout error:',
            error
        );

    }

    return false;
}


document.addEventListener(
    'DOMContentLoaded',
    startPresenceMonitoring
);


window.addEventListener(
    'pagehide',
    function () {

        if (presenceStarted) {

            notifyPresenceLogout();

        }

    }
);


/* =========================================================
   DATA
========================================================= */

let teachersData = {
    absence: [],
    written: [],
    committees: [],
    tardiness: [],
    duty: [],
    notes: []
};


/* =========================================================
   HELPERS
========================================================= */

function getValue(id) {

    const element = document.getElementById(id);

    return element
        ? element.value.trim()
        : '';

}


function setValue(id, value) {

    const element = document.getElementById(id);

    if (element) {

        element.value =
            value !== undefined &&
            value !== null
                ? value
                : '';

    }

}


function escapeHtml(value) {

    if (value === undefined || value === null) {

        return '';

    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


/* =========================================================
   CURRENT DATE / TIME - PALESTINE
========================================================= */

function getCurrentDateTime() {

    const now = new Date();

    const date =
        now.toLocaleDateString(
            'en-CA',
            {
                timeZone: 'Asia/Gaza'
            }
        );

    const time =
        now.toLocaleTimeString(
            'en-GB',
            {
                timeZone: 'Asia/Gaza',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }
        );

    return {
        date,
        time
    };

}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
    url,
    options = {}
) {

    const token =
        localStorage.getItem('schoolAuthToken');

    const headers = {
        ...(options.headers || {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const response =
        await fetch(
            url,
            { ...options, headers }
        );

    let result = null;

    const contentType =
        response.headers.get(
            'content-type'
        );

    if (
        contentType &&
        contentType.includes(
            'application/json'
        )
    ) {

        result =
            await response.json();

    } else {

        const text =
            await response.text();

        try {

            result =
                JSON.parse(text);

        } catch {

            result = {
                message: text
            };

        }

    }


    if (!response.ok) {

        throw new Error(
            result?.message ||
            `HTTP ${response.status}`
        );

    }


    return result;

}


/* =========================================================
   NORMALIZE RECORD
========================================================= */

function normalizeTeacherRecord(record) {

    if (!record) {

        return null;

    }

    const source =
        record.data &&
        typeof record.data === 'object'
            ? record.data
            : record;


    return {

        id:
            record._id ||
            record.id ||
            source._id ||
            source.id ||
            null,

        type:
            record.type ||
            source.type ||
            '',

        ...source,

        createdAt:
            record.createdAt ||
            source.createdAt ||
            null,

        updatedAt:
            record.updatedAt ||
            source.updatedAt ||
            null

    };

}


/* =========================================================
   ARRAY NAME
========================================================= */

function getArrayName(type) {

    switch (type) {

        case 'absence':
            return 'absence';

        case 'written':
            return 'written';

        case 'committee':
        case 'committees':
            return 'committees';

        case 'tardiness':
            return 'tardiness';

        case 'duty':
            return 'duty';

        case 'notes':
            return 'notes';

        default:
            return null;

    }

}


/* =========================================================
   LOAD DATA
========================================================= */

async function loadData() {

    try {

        const result =
            await apiRequest(
                TEACHERS_API_URL
            );


        teachersData = {

            absence: [],
            written: [],
            committees: [],
            tardiness: [],
            duty: [],
            notes: []

        };


        let records = [];


        if (Array.isArray(result)) {

            records = result;

        } else if (
            result &&
            Array.isArray(result.data)
        ) {

            records = result.data;

        } else if (
            result &&
            Array.isArray(result.records)
        ) {

            records = result.records;

        }


        records.forEach(record => {

            const normalized =
                normalizeTeacherRecord(
                    record
                );


            if (!normalized) {

                return;

            }


            const arrayName =
                getArrayName(
                    normalized.type
                );


            if (
                arrayName &&
                teachersData[arrayName]
            ) {

                teachersData[arrayName]
                    .push(normalized);

            }

        });


        return true;

    } catch (error) {

        console.error(
            'Error loading teachers data:',
            error
        );


        alert(
            'تعذر تحميل بيانات المعلمين من السيرفر.'
        );


        return false;

    }

}


/* =========================================================
   CREATE RECORD
========================================================= */

async function createTeacherRecord(
    type,
    data
) {

    return await apiRequest(
        TEACHERS_API_URL,
        {

            method: 'POST',

            headers: {
                'Content-Type':
                    'application/json'
            },

            body:
                JSON.stringify({
                    type,
                    data
                })

        }
    );

}


/* =========================================================
   UPDATE RECORD
========================================================= */

async function updateTeacherRecord(
    id,
    data
) {

    return await apiRequest(
        `${TEACHERS_API_URL}/${id}`,
        {

            method: 'PUT',

            headers: {
                'Content-Type':
                    'application/json'
            },

            body:
                JSON.stringify({
                    data
                })

        }
    );

}


/* =========================================================
   DELETE RECORD
========================================================= */

async function deleteTeacherRecord(
    id
) {

    return await apiRequest(
        `${TEACHERS_API_URL}/${id}`,
        {
            method: 'DELETE'
        }
    );

}


/* =========================================================
   ABSENCE
========================================================= */

async function saveAbsence(event) {

    if (event) {

        event.preventDefault();

    }


    const name =
        getValue('absence-name');

    const date =
        getValue('absence-date');

    const reason =
        getValue('absence-reason');

    const formStatus =
        getValue('absence-form-status');

    const editId =
        getValue('absence-edit-id');


    if (!name) {

        alert(
            'يرجى إدخال اسم المعلم.'
        );

        return;

    }


    const current =
        getCurrentDateTime();


    const data = {

        name,
        date,
        reason,
        formStatus,

        recordedDate:
            current.date,

        recordedTime:
            current.time

    };


    try {

        if (editId) {

            await updateTeacherRecord(
                editId,
                data
            );

        } else {

            await createTeacherRecord(
                'absence',
                data
            );

        }


        await loadData();

        renderAll();

        resetForm('absence');


        alert(
            'تم حفظ بيانات الغياب بنجاح.'
        );

    } catch (error) {

        console.error(error);

        alert(
            'حدث خطأ أثناء حفظ بيانات الغياب.'
        );

    }

}


/* =========================================================
   EDIT ABSENCE
========================================================= */

function editAbsence(id) {

    const record =
        teachersData.absence.find(
            item => item.id === id
        );


    if (!record) {

        return;

    }


    setValue(
        'absence-name',
        record.name
    );

    setValue(
        'absence-date',
        record.date
    );

    setValue(
        'absence-reason',
        record.reason
    );

    setValue(
        'absence-form-status',
        record.formStatus
    );

    setValue(
        'absence-edit-id',
        record.id
    );


    const button =
        document.getElementById(
            'absence-btn'
        );


    if (button) {

        button.textContent =
            'تحديث البيانات';

    }

}


/* =========================================================
   WRITTEN
========================================================= */

async function saveWritten(event) {

    if (event) {

        event.preventDefault();

    }


    const name =
        getValue('written-name');

    const type =
        getValue('written-type');

    const date =
        getValue('written-date');

    const editId =
        getValue('written-edit-id');


    if (!name) {

        alert(
            'يرجى إدخال اسم المعلم.'
        );

        return;

    }


    const current =
        getCurrentDateTime();


    const data = {

        name,

        title:
            type,

        date,

        recordedDate:
            current.date,

        recordedTime:
            current.time

    };


    try {

        if (editId) {

            await updateTeacherRecord(
                editId,
                data
            );

        } else {

            await createTeacherRecord(
                'written',
                data
            );

        }


        await loadData();

        renderAll();

        resetForm('written');


        alert(
            'تم حفظ العمل الكتابي بنجاح.'
        );

    } catch (error) {

        console.error(error);

        alert(
            'حدث خطأ أثناء حفظ العمل الكتابي.'
        );

    }

}


/* =========================================================
   EDIT WRITTEN
========================================================= */

function editWritten(id) {

    const record =
        teachersData.written.find(
            item => item.id === id
        );


    if (!record) {

        return;

    }


    setValue(
        'written-name',
        record.name
    );

    setValue(
        'written-type',
        record.title
    );

    setValue(
        'written-date',
        record.date
    );

    setValue(
        'written-edit-id',
        record.id
    );


    const button =
        document.getElementById(
            'written-btn'
        );


    if (button) {

        button.textContent =
            'تحديث البيانات';

    }

}


/* =========================================================
   COMMITTEE
========================================================= */

async function saveCommittee(event) {

    if (event) {

        event.preventDefault();

    }


    const name =
        getValue('committee-name');

    const title =
        getValue('committee-title');

    const officialBook =
        getValue('committee-official-book');

    const assignedWork =
        getValue('committee-assigned-work');

    const dueDate =
        getValue('committee-due-date');

    const status =
        getValue('committee-status');

    const note =
        getValue('committee-note');

    const editId =
        getValue('committee-edit-id');


    if (!name) {

        alert(
            'يرجى إدخال اسم المعلم.'
        );

        return;

    }


    if (!dueDate) {

        alert(
            'يرجى تحديد تاريخ التسليم.'
        );

        return;

    }


    const current =
        getCurrentDateTime();


    const data = {

        name,
        title,
        officialBook,
        assignedWork,
        dueDate,
        status,
        note,

        recordedDate:
            current.date,

        recordedTime:
            current.time

    };


    try {

        if (editId) {

            await updateTeacherRecord(
                editId,
                data
            );

        } else {

            await createTeacherRecord(
                'committee',
                data
            );

        }


        await loadData();

        renderAll();

        resetForm('committee');


        alert(
            'تم حفظ بيانات اللجنة بنجاح.'
        );

    } catch (error) {

        console.error(error);

        alert(
            'حدث خطأ أثناء حفظ بيانات اللجنة.'
        );

    }

}


/* =========================================================
   EDIT COMMITTEE
========================================================= */

function editCommittee(id) {

    const record =
        teachersData.committees.find(
            item => item.id === id
        );


    if (!record) {

        return;

    }


    setValue(
        'committee-name',
        record.name
    );

    setValue(
        'committee-title',
        record.title
    );

    setValue(
        'committee-official-book',
        record.officialBook
    );

    setValue(
        'committee-assigned-work',
        record.assignedWork
    );

    setValue(
        'committee-due-date',
        record.dueDate
    );

    setValue(
        'committee-status',
        record.status
    );

    setValue(
        'committee-note',
        record.note
    );

    setValue(
        'committee-edit-id',
        record.id
    );


    const button =
        document.getElementById(
            'committee-btn'
        );


    if (button) {

        button.textContent =
            'تحديث البيانات';

    }

}


/* =========================================================
   CALCULATE REMAINING TIME
========================================================= */

function getRemainingTime(dueDate, status) {

    if (!dueDate) {

        return {
            text: 'غير محدد',
            className: 'remaining-unknown'
        };

    }


    const normalizedStatus =
        String(status || '')
            .trim()
            .toLowerCase();


    const completedStatuses = [
        'تم',
        'مكتمل',
        'مكتملة',
        'منجز',
        'منجزة',
        'completed',
        'complete',
        'done'
    ];


    if (
        completedStatuses.includes(
            normalizedStatus
        )
    ) {

        return {
            text: 'تم التسليم',
            className: 'remaining-completed'
        };

    }


    /*
       تاريخ التسليم حتى نهاية اليوم
    */

    const due =
        new Date(
            `${dueDate}T23:59:59`
        );


    if (
        Number.isNaN(
            due.getTime()
        )
    ) {

        return {
            text: 'تاريخ غير صحيح',
            className: 'remaining-unknown'
        };

    }


    const now =
        new Date();


    const difference =
        due.getTime() -
        now.getTime();


    /*
       إذا انتهى موعد التسليم
    */

    if (difference < 0) {

        const days =
            Math.ceil(
                Math.abs(difference) /
                (1000 * 60 * 60 * 24)
            );


        return {

            text:
                `متأخر ${days} ${days === 1 ? 'يوم' : 'أيام'}`,

            className:
                'remaining-overdue'

        };

    }


    /*
       الأيام المتبقية فقط
    */

    const days =
        Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        );


    /*
       موعد اليوم
    */

    if (days <= 0) {

        return {

            text:
                'التسليم اليوم',

            className:
                'remaining-warning'

        };

    }


    /*
       أقل من 3 أيام = تنبيه
    */

    if (days <= 3) {

        return {

            text:
                `متبقي ${days} ${days === 1 ? 'يوم' : 'أيام'}`,

            className:
                'remaining-warning'

        };

    }


    return {

        text:
            `متبقي ${days} ${days === 1 ? 'يوم' : 'أيام'}`,

        className:
            'remaining-normal'

    };

}


/* =========================================================
   RENDER REMAINING TIME
========================================================= */

function renderRemainingTime(
    dueDate,
    status
) {

    const result =
        getRemainingTime(
            dueDate,
            status
        );


    return `
        <span class="remaining-time ${result.className}">
            ${escapeHtml(result.text)}
        </span>
    `;

}


/* =========================================================
   UPDATE ALL REMAINING TIMES
   بدون إعادة رسم الجداول
========================================================= */

function updateRemainingTimes() {

    const elements =
        document.querySelectorAll(
            '[data-due-date]'
        );


    elements.forEach(element => {

        const dueDate =
            element.getAttribute(
                'data-due-date'
            );


        const status =
            element.getAttribute(
                'data-status'
            );


        const result =
            getRemainingTime(
                dueDate,
                status
            );


        element.className =
            `remaining-time ${result.className}`;


        element.textContent =
            result.text;

    });

}


/* =========================================================
   TARDINESS
========================================================= */

async function saveTardiness(event) {

    if (event) {

        event.preventDefault();

    }


    const name =
        getValue('tardiness-name');

    const time =
        getValue('tardiness-time');

    const note =
        getValue('tardiness-note');

    const date =
        getValue('tardiness-date');

    const editId =
        getValue('tardiness-edit-id');


    if (!name) {

        alert(
            'يرجى إدخال اسم المعلم.'
        );

        return;

    }


    const current =
        getCurrentDateTime();


    const data = {

        name,
        time,
        note,
        date,

        recordedDate:
            current.date,

        recordedTime:
            current.time

    };


    try {

        if (editId) {

            await updateTeacherRecord(
                editId,
                data
            );

        } else {

            await createTeacherRecord(
                'tardiness',
                data
            );

        }


        await loadData();

        renderAll();

        resetForm('tardiness');


        alert(
            'تم حفظ بيانات التأخير بنجاح.'
        );

    } catch (error) {

        console.error(error);

        alert(
            'حدث خطأ أثناء حفظ بيانات التأخير.'
        );

    }

}


/* =========================================================
   EDIT TARDINESS
========================================================= */

function editTardiness(id) {

    const record =
        teachersData.tardiness.find(
            item => item.id === id
        );


    if (!record) {

        return;

    }


    setValue(
        'tardiness-name',
        record.name
    );

    setValue(
        'tardiness-time',
        record.time
    );

    setValue(
        'tardiness-note',
        record.note
    );

    setValue(
        'tardiness-date',
        record.date
    );

    setValue(
        'tardiness-edit-id',
        record.id
    );


    const button =
        document.getElementById(
            'tardiness-btn'
        );


    if (button) {

        button.textContent =
            'تحديث البيانات';

    }

}


/* =========================================================
   DUTY
========================================================= */

async function saveDuty(event) {

    if (event) {

        event.preventDefault();

    }


    const name =
        getValue('duty-name');

    const status =
        getValue('duty-status');

    const note =
        getValue('duty-note');

    const date =
        getValue('duty-date');

    const editId =
        getValue('duty-edit-id');


    if (!name) {

        alert(
            'يرجى إدخال اسم المعلم.'
        );

        return;

    }


    const current =
        getCurrentDateTime();


    const data = {

        name,
        status,
        note,
        date,

        recordedDate:
            current.date,

        recordedTime:
            current.time

    };


    try {

        if (editId) {

            await updateTeacherRecord(
                editId,
                data
            );

        } else {

            await createTeacherRecord(
                'duty',
                data
            );

        }


        await loadData();

        renderAll();

        resetForm('duty');


        alert(
            'تم حفظ بيانات المناوبة بنجاح.'
        );

    } catch (error) {

        console.error(error);

        alert(
            'حدث خطأ أثناء حفظ بيانات المناوبة.'
        );

    }

}


/* =========================================================
   EDIT DUTY
========================================================= */

function editDuty(id) {

    const record =
        teachersData.duty.find(
            item => item.id === id
        );


    if (!record) {

        return;

    }


    setValue(
        'duty-name',
        record.name
    );

    setValue(
        'duty-status',
        record.status
    );

    setValue(
        'duty-note',
        record.note
    );

    setValue(
        'duty-date',
        record.date
    );

    setValue(
        'duty-edit-id',
        record.id
    );


    const button =
        document.getElementById(
            'duty-btn'
        );


    if (button) {

        button.textContent =
            'تحديث البيانات';

    }

}


/* =========================================================
   NOTES
========================================================= */

async function saveNotes(event) {

    if (event) {

        event.preventDefault();

    }


    const name =
        getValue('notes-name');

    const date =
        getValue('notes-date');

    const text =
        getValue('notes-text');

    const editId =
        getValue('notes-edit-id');


    if (!name) {

        alert(
            'يرجى إدخال اسم المعلم.'
        );

        return;

    }


    const current =
        getCurrentDateTime();


    const data = {

        name,
        date,
        text,

        recordedDate:
            current.date,

        recordedTime:
            current.time

    };


    try {

        if (editId) {

            await updateTeacherRecord(
                editId,
                data
            );

        } else {

            await createTeacherRecord(
                'notes',
                data
            );

        }


        await loadData();

        renderAll();

        resetForm('notes');


        alert(
            'تم حفظ الملاحظة بنجاح.'
        );

    } catch (error) {

        console.error(error);

        alert(
            'حدث خطأ أثناء حفظ الملاحظة.'
        );

    }

}


/* =========================================================
   EDIT NOTES
========================================================= */

function editNotes(id) {

    const record =
        teachersData.notes.find(
            item => item.id === id
        );


    if (!record) {

        return;

    }


    setValue(
        'notes-name',
        record.name
    );

    setValue(
        'notes-date',
        record.date
    );

    setValue(
        'notes-text',
        record.text
    );

    setValue(
        'notes-edit-id',
        record.id
    );


    const button =
        document.getElementById(
            'notes-btn'
        );


    if (button) {

        button.textContent =
            'تحديث البيانات';

    }

}


/* =========================================================
   DELETE RECORD
========================================================= */

async function deleteRecord(
    type,
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

        await deleteTeacherRecord(
            id
        );


        const arrayName =
            getArrayName(type);


        if (
            arrayName &&
            teachersData[arrayName]
        ) {

            teachersData[arrayName] =
                teachersData[arrayName]
                    .filter(
                        item =>
                            item.id !== id
                    );

        }


        renderAll();


        alert(
            'تم حذف السجل بنجاح.'
        );

    } catch (error) {

        console.error(error);

        alert(
            'حدث خطأ أثناء حذف السجل.'
        );

    }

}


/* =========================================================
   RENDER ABSENCE
========================================================= */

function renderAbsence() {

    const tbody =
        document.getElementById(
            'absence-table-body'
        );


    if (!tbody) {

        return;

    }


    if (
        teachersData.absence.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    لا توجد بيانات
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        teachersData.absence
            .map(record => `

                <tr>

                    <td>
                        ${escapeHtml(record.name)}
                    </td>

                    <td>
                        ${escapeHtml(record.date)}
                    </td>

                    <td>
                        ${escapeHtml(record.reason)}
                    </td>

                    <td>
                        ${escapeHtml(record.formStatus)}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="editAbsence('${record.id}')">
                            تعديل
                        </button>

                        <button
                            type="button"
                            onclick="deleteRecord('absence','${record.id}')">
                            حذف
                        </button>

                    </td>

                </tr>

            `)
            .join('');

}


/* =========================================================
   RENDER WRITTEN
========================================================= */

function renderWritten() {

    const tbody =
        document.getElementById(
            'written-table-body'
        );


    if (!tbody) {

        return;

    }


    if (
        teachersData.written.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4">
                    لا توجد بيانات
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        teachersData.written
            .map(record => `

                <tr>

                    <td>
                        ${escapeHtml(record.name)}
                    </td>

                    <td>
                        ${escapeHtml(record.title)}
                    </td>

                    <td>
                        ${escapeHtml(record.date)}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="editWritten('${record.id}')">
                            تعديل
                        </button>

                        <button
                            type="button"
                            onclick="deleteRecord('written','${record.id}')">
                            حذف
                        </button>

                    </td>

                </tr>

            `)
            .join('');

}


/* =========================================================
   RENDER COMMITTEES
   تمت إضافة عمود الوقت المتبقي
========================================================= */

function renderCommittees() {

    const tbody =
        document.getElementById(
            'committee-table-body'
        );


    if (!tbody) {

        return;

    }


    if (
        teachersData.committees.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    لا توجد بيانات
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        teachersData.committees
            .map(record => {

                const remaining =
                    getRemainingTime(
                        record.dueDate,
                        record.status
                    );


                return `

                    <tr>

                        <td>
                            ${escapeHtml(record.title)}
                        </td>

                        <td>
                            ${escapeHtml(record.name)}
                        </td>

                        <td>
                            ${escapeHtml(record.officialBook)}
                        </td>

                        <td>
                            ${escapeHtml(record.assignedWork)}
                        </td>

                        <td>
                            ${escapeHtml(record.dueDate)}
                        </td>

                        <td>
                            ${escapeHtml(record.status)}
                        </td>

                        <td
                            data-due-date="${escapeHtml(record.dueDate || '')}"
                            data-status="${escapeHtml(record.status || '')}">
                            
                            <span class="remaining-time ${remaining.className}">
                                ${escapeHtml(remaining.text)}
                            </span>

                        </td>

                        <td>
                            ${escapeHtml(record.note)}
                        </td>

                        <td>

                            <button
                                type="button"
                                onclick="editCommittee('${record.id}')">
                                تعديل
                            </button>

                            <button
                                type="button"
                                onclick="deleteRecord('committee','${record.id}')">
                                حذف
                            </button>

                        </td>

                    </tr>

                `;

            })
            .join('');

}


/* =========================================================
   RENDER TARDINESS
========================================================= */

function renderTardiness() {

    const tbody =
        document.getElementById(
            'tardiness-table-body'
        );


    if (!tbody) {

        return;

    }


    if (
        teachersData.tardiness.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    لا توجد بيانات
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        teachersData.tardiness
            .map(record => `

                <tr>

                    <td>
                        ${escapeHtml(record.name)}
                    </td>

                    <td>
                        ${escapeHtml(record.date)}
                    </td>

                    <td>
                        ${escapeHtml(record.time)}
                    </td>

                    <td>
                        ${escapeHtml(record.note)}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="editTardiness('${record.id}')">
                            تعديل
                        </button>

                        <button
                            type="button"
                            onclick="deleteRecord('tardiness','${record.id}')">
                            حذف
                        </button>

                    </td>

                </tr>

            `)
            .join('');

}


/* =========================================================
   RENDER DUTY
========================================================= */

function renderDuty() {

    const tbody =
        document.getElementById(
            'duty-table-body'
        );


    if (!tbody) {

        return;

    }


    if (
        teachersData.duty.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    لا توجد بيانات
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        teachersData.duty
            .map(record => `

                <tr>

                    <td>
                        ${escapeHtml(record.name)}
                    </td>

                    <td>
                        ${escapeHtml(record.date)}
                    </td>

                    <td>
                        ${escapeHtml(record.status)}
                    </td>

                    <td>
                        ${escapeHtml(record.note)}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="editDuty('${record.id}')">
                            تعديل
                        </button>

                        <button
                            type="button"
                            onclick="deleteRecord('duty','${record.id}')">
                            حذف
                        </button>

                    </td>

                </tr>

            `)
            .join('');

}


/* =========================================================
   RENDER NOTES
========================================================= */

function renderNotes() {

    const tbody =
        document.getElementById(
            'notes-table-body'
        );


    if (!tbody) {

        return;

    }


    if (
        teachersData.notes.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4">
                    لا توجد بيانات
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        teachersData.notes
            .map(record => `

                <tr>

                    <td>
                        ${escapeHtml(record.name)}
                    </td>

                    <td>
                        ${escapeHtml(record.date)}
                    </td>

                    <td>
                        ${escapeHtml(record.text)}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="editNotes('${record.id}')">
                            تعديل
                        </button>

                        <button
                            type="button"
                            onclick="deleteRecord('notes','${record.id}')">
                            حذف
                        </button>

                    </td>

                </tr>

            `)
            .join('');

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

    renderAbsence();

    renderWritten();

    renderCommittees();

    renderTardiness();

    renderDuty();

    renderNotes();

    updateDashboard();

    updateRemainingTimes();

}


/* =========================================================
   RESET FORM
========================================================= */

function resetForm(type) {

    const formMap = {

        absence: {
            form: 'absence-form',
            edit: 'absence-edit-id',
            button: 'absence-btn'
        },

        written: {
            form: 'written-form',
            edit: 'written-edit-id',
            button: 'written-btn'
        },

        committee: {
            form: 'committees-form',
            edit: 'committee-edit-id',
            button: 'committee-btn'
        },

        tardiness: {
            form: 'tardiness-form',
            edit: 'tardiness-edit-id',
            button: 'tardiness-btn'
        },

        duty: {
            form: 'duty-form',
            edit: 'duty-edit-id',
            button: 'duty-btn'
        },

        notes: {
            form: 'notes-form',
            edit: 'notes-edit-id',
            button: 'notes-btn'
        }

    };


    const config =
        formMap[type];


    if (!config) {

        return;

    }


    const form =
        document.getElementById(
            config.form
        );


    if (form) {

        form.reset();

    }


    setValue(
        config.edit,
        ''
    );


    const button =
        document.getElementById(
            config.button
        );


    if (button) {

        button.textContent =
            'حفظ';

    }


    if (type === 'committee') {

        const dateField =
            document.getElementById(
                'committee-due-date'
            );


        if (
            dateField &&
            !dateField.value
        ) {

            dateField.value =
                new Date()
                    .toLocaleDateString(
                        'en-CA',
                        {
                            timeZone:
                                'Asia/Gaza'
                        }
                    );

        }

    }

}


/* =========================================================
   TABS
========================================================= */

function switchTab(tabName) {

    document
        .querySelectorAll(
            '.tab-content'
        )
        .forEach(
            element =>
                element.classList.remove(
                    'active'
                )
        );


    document
        .querySelectorAll(
            '.nav-btn'
        )
        .forEach(
            element =>
                element.classList.remove(
                    'active'
                )
        );


    const tab =
        document.getElementById(
            `tab-${tabName}`
        );


    if (tab) {

        tab.classList.add(
            'active'
        );

    }


    document
        .querySelectorAll(
            '.nav-btn'
        )
        .forEach(button => {

            const onclick =
                button.getAttribute(
                    'onclick'
                );


            if (
                onclick &&
                onclick.includes(
                    `switchTab('${tabName}')`
                )
            ) {

                button.classList.add(
                    'active'
                );

            }

        });


    if (
        tabName === 'dashboard'
    ) {

        updateDashboard();

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

let absenceChart = null;

let writtenChart = null;


function updateDashboard() {

    const absenceStat =
        document.getElementById(
            'stat-absence'
        );


    const writtenStat =
        document.getElementById(
            'stat-written'
        );


    const tardinessStat =
        document.getElementById(
            'stat-tardiness'
        );


    const issuesStat =
        document.getElementById(
            'stat-issues'
        );


    if (absenceStat) {

        absenceStat.textContent =
            teachersData.absence.length;

    }


    if (writtenStat) {

        writtenStat.textContent =
            teachersData.written.length;

    }


    if (tardinessStat) {

        tardinessStat.textContent =
            teachersData.tardiness.length;

    }


    if (issuesStat) {

        issuesStat.textContent =
            teachersData.committees.length +
            teachersData.duty.length +
            teachersData.notes.length;

    }


    if (
        typeof Chart !== 'undefined'
    ) {

        const absenceCanvas =
            document.getElementById(
                'absenceChart'
            );


        if (absenceCanvas) {

            if (absenceChart) {

                absenceChart.destroy();

            }


            absenceChart =
                new Chart(
                    absenceCanvas,
                    {

                        type: 'doughnut',

                        data: {

                            labels: [
                                'الغياب'
                            ],

                            datasets: [
                                {

                                    data: [
                                        teachersData.absence.length
                                    ]

                                }
                            ]

                        }

                    }
                );

        }


        const writtenCanvas =
            document.getElementById(
                'writtenChart'
            );


        if (writtenCanvas) {

            if (writtenChart) {

                writtenChart.destroy();

            }


            writtenChart =
                new Chart(
                    writtenCanvas,
                    {

                        type: 'doughnut',

                        data: {

                            labels: [
                                'الأعمال الكتابية'
                            ],

                            datasets: [
                                {

                                    data: [
                                        teachersData.written.length
                                    ]

                                }
                            ]

                        }

                    }
                );

        }

    }

}


/* =========================================================
   EXPORT DATA
   Excel + PDF
========================================================= */

function exportData() {

    const choice = prompt(
        'اختر نوع التصدير:\n\n' +
        '1 - Excel\n' +
        '2 - PDF\n\n' +
        'أدخل رقم الخيار:'
    );


    if (choice === null) {

        return;

    }


    const selected =
        choice.trim();


    if (selected === '1') {

        exportTeachersToExcel();

        return;

    }


    if (selected === '2') {

        exportTeachersToPDF();

        return;

    }


    alert(
        'الخيار غير صحيح.\nيرجى اختيار 1 أو 2.'
    );

}


/* =========================================================
   EXPORT TO EXCEL
========================================================= */

function exportTeachersToExcel() {

    if (
        typeof XLSX === 'undefined'
    ) {

        alert(
            'تعذر تحميل مكتبة Excel.\n' +
            'تأكد من وجود اتصال بالإنترنت ثم أعد المحاولة.'
        );

        return;

    }


    try {

        const workbook =
            XLSX.utils.book_new();


        /* =================================================
           الغياب
        ================================================= */

        const absenceData = [

            [
                'اسم المعلم',
                'التاريخ',
                'سبب الغياب',
                'حالة النموذج'
            ]

        ];


        teachersData.absence.forEach(
            record => {

                absenceData.push([

                    record.name || '',

                    record.date || '',

                    record.reason || '',

                    record.formStatus || ''

                ]);

            }
        );


        const absenceSheet =
            XLSX.utils.aoa_to_sheet(
                absenceData
            );


        XLSX.utils.book_append_sheet(
            workbook,
            absenceSheet,
            'الغياب'
        );


        /* =================================================
           الأعمال الكتابية
        ================================================= */

        const writtenData = [

            [
                'اسم المعلم',
                'العمل / العنوان',
                'التاريخ'
            ]

        ];


        teachersData.written.forEach(
            record => {

                writtenData.push([

                    record.name || '',

                    record.title || '',

                    record.date || ''

                ]);

            }
        );


        const writtenSheet =
            XLSX.utils.aoa_to_sheet(
                writtenData
            );


        XLSX.utils.book_append_sheet(
            workbook,
            writtenSheet,
            'الأعمال الكتابية'
        );


        /* =================================================
           أعمال اللجان
        ================================================= */

        const committeesData = [

            [
                'اللجنة',
                'اسم المعلم',
                'الكتاب الرسمي',
                'العمل المكلف به',
                'تاريخ التسليم',
                'الحالة',
                'الوقت المتبقي',
                'الملاحظات'
            ]

        ];


        teachersData.committees.forEach(
            record => {

                const remaining =
                    getRemainingTime(
                        record.dueDate,
                        record.status
                    );


                committeesData.push([

                    record.title || '',

                    record.name || '',

                    record.officialBook || '',

                    record.assignedWork || '',

                    record.dueDate || '',

                    record.status || '',

                    remaining &&
                    remaining.text
                        ? remaining.text
                        : '',

                    record.note || ''

                ]);

            }
        );


        const committeesSheet =
            XLSX.utils.aoa_to_sheet(
                committeesData
            );


        XLSX.utils.book_append_sheet(
            workbook,
            committeesSheet,
            'أعمال اللجان'
        );


        /* =================================================
           التأخير
        ================================================= */

        const tardinessData = [

            [
                'اسم المعلم',
                'التاريخ',
                'وقت التأخير',
                'الملاحظات'
            ]

        ];


        teachersData.tardiness.forEach(
            record => {

                tardinessData.push([

                    record.name || '',

                    record.date || '',

                    record.time || '',

                    record.note || ''

                ]);

            }
        );


        const tardinessSheet =
            XLSX.utils.aoa_to_sheet(
                tardinessData
            );


        XLSX.utils.book_append_sheet(
            workbook,
            tardinessSheet,
            'التأخير'
        );


        /* =================================================
           المناوبة
        ================================================= */

        const dutyData = [

            [
                'اسم المعلم',
                'التاريخ',
                'الحالة',
                'الملاحظات'
            ]

        ];


        teachersData.duty.forEach(
            record => {

                dutyData.push([

                    record.name || '',

                    record.date || '',

                    record.status || '',

                    record.note || ''

                ]);

            }
        );


        const dutySheet =
            XLSX.utils.aoa_to_sheet(
                dutyData
            );


        XLSX.utils.book_append_sheet(
            workbook,
            dutySheet,
            'المناوبة'
        );


        /* =================================================
           الملاحظات
        ================================================= */

        const notesData = [

            [
                'اسم المعلم',
                'التاريخ',
                'الملاحظات'
            ]

        ];


        teachersData.notes.forEach(
            record => {

                notesData.push([

                    record.name || '',

                    record.date || '',

                    record.note ||
                    record.text ||
                    record.details ||
                    ''

                ]);

            }
        );


        const notesSheet =
            XLSX.utils.aoa_to_sheet(
                notesData
            );


        XLSX.utils.book_append_sheet(
            workbook,
            notesSheet,
            'الملاحظات'
        );


        /* =================================================
           الملخص
        ================================================= */

        const totalRecords =
            teachersData.absence.length +
            teachersData.written.length +
            teachersData.committees.length +
            teachersData.tardiness.length +
            teachersData.duty.length +
            teachersData.notes.length;


        const summaryData = [

            [
                'القسم',
                'عدد السجلات'
            ],

            [
                'الغياب',
                teachersData.absence.length
            ],

            [
                'الأعمال الكتابية',
                teachersData.written.length
            ],

            [
                'أعمال اللجان',
                teachersData.committees.length
            ],

            [
                'التأخير',
                teachersData.tardiness.length
            ],

            [
                'المناوبة',
                teachersData.duty.length
            ],

            [
                'الملاحظات',
                teachersData.notes.length
            ],

            [
                'إجمالي السجلات',
                totalRecords
            ]

        ];


        const summarySheet =
            XLSX.utils.aoa_to_sheet(
                summaryData
            );


        XLSX.utils.book_append_sheet(
            workbook,
            summarySheet,
            'الملخص'
        );


        /* =================================================
           ضبط عرض الأعمدة
        ================================================= */

        const sheets =
            workbook.SheetNames;


        sheets.forEach(
            sheetName => {

                const sheet =
                    workbook.Sheets[
                        sheetName
                    ];


                const range =
                    XLSX.utils.decode_range(
                        sheet['!ref']
                    );


                const widths = [];


                for (
                    let column =
                        range.s.c;

                    column <= range.e.c;

                    column++
                ) {

                    let maxLength = 12;


                    for (
                        let row =
                            range.s.r;

                        row <= range.e.r;

                        row++
                    ) {

                        const cellAddress =
                            XLSX.utils.encode_cell({

                                r: row,

                                c: column

                            });


                        const cell =
                            sheet[
                                cellAddress
                            ];


                        if (
                            cell &&
                            cell.v !== undefined &&
                            cell.v !== null
                        ) {

                            const length =
                                String(
                                    cell.v
                                ).length;


                            if (
                                length >
                                maxLength
                            ) {

                                maxLength =
                                    length;

                            }

                        }

                    }


                    widths.push({

                        wch:
                            Math.min(
                                Math.max(
                                    maxLength + 2,
                                    12
                                ),
                                45
                            )

                    });

                }


                sheet['!cols'] =
                    widths;

            }
        );


        /* =================================================
           اسم الملف
        ================================================= */

        const today =
            new Date()
                .toLocaleDateString(
                    'en-CA',
                    {
                        timeZone:
                            'Asia/Gaza'
                    }
                );


        const fileName =
            `تقرير_إدارة_المعلمين_${today}.xlsx`;


        XLSX.writeFile(
            workbook,
            fileName
        );


    } catch (error) {

        console.error(
            'Excel export error:',
            error
        );


        alert(
            'حدث خطأ أثناء تصدير ملف Excel.'
        );

    }

}


/* =========================================================
   EXPORT TO PDF
   يستخدم نافذة الطباعة في المتصفح
   ثم يمكن اختيار Save as PDF
========================================================= */

function exportTeachersToPDF() {

    try {

        const printWindow =
            window.open(
                '',
                '_blank'
            );


        if (!printWindow) {

            alert(
                'يرجى السماح بالنوافذ المنبثقة حتى يتم إنشاء ملف PDF.'
            );

            return;

        }


        const totalRecords =
            teachersData.absence.length +
            teachersData.written.length +
            teachersData.committees.length +
            teachersData.tardiness.length +
            teachersData.duty.length +
            teachersData.notes.length;


        /* =================================================
           الغياب
        ================================================= */

        const absenceRows =
            teachersData.absence
                .map(
                    record => `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    record.name
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.date
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.reason
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.formStatus
                                )}
                            </td>

                        </tr>

                    `
                )
                .join('');


        /* =================================================
           الأعمال الكتابية
        ================================================= */

        const writtenRows =
            teachersData.written
                .map(
                    record => `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    record.name
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.title
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.date
                                )}
                            </td>

                        </tr>

                    `
                )
                .join('');


        /* =================================================
           أعمال اللجان
        ================================================= */

        const committeeRows =
            teachersData.committees
                .map(
                    record => {

                        const remaining =
                            getRemainingTime(
                                record.dueDate,
                                record.status
                            );


                        return `

                            <tr>

                                <td>
                                    ${escapeHtml(
                                        record.title
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        record.name
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        record.officialBook
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        record.assignedWork
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        record.dueDate
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        record.status
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        remaining &&
                                        remaining.text
                                            ? remaining.text
                                            : ''
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        record.note
                                    )}
                                </td>

                            </tr>

                        `;

                    }
                )
                .join('');


        /* =================================================
           التأخير
        ================================================= */

        const tardinessRows =
            teachersData.tardiness
                .map(
                    record => `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    record.name
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.date
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.time
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.note
                                )}
                            </td>

                        </tr>

                    `
                )
                .join('');


        /* =================================================
           المناوبة
        ================================================= */

        const dutyRows =
            teachersData.duty
                .map(
                    record => `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    record.name
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.date
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.status
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.note
                                )}
                            </td>

                        </tr>

                    `
                )
                .join('');


        /* =================================================
           الملاحظات
        ================================================= */

        const notesRows =
            teachersData.notes
                .map(
                    record => `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    record.name
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.date
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.note ||
                                    record.text ||
                                    record.details ||
                                    ''
                                )}
                            </td>

                        </tr>

                    `
                )
                .join('');


        const today =
            new Date()
                .toLocaleDateString(
                    'ar-PS',
                    {
                        timeZone:
                            'Asia/Gaza'
                    }
                );


        const html = `

<!DOCTYPE html>

<html
    lang="ar"
    dir="rtl"
>

<head>

    <meta charset="UTF-8">

    <title>
        تقرير إدارة المعلمين
    </title>


    <style>

        @page {

            size: A4 landscape;

            margin: 12mm;

        }


        * {

            box-sizing:
                border-box;

        }


        body {

            font-family:
                Arial,
                Tahoma,
                sans-serif;

            direction:
                rtl;

            margin:
                0;

            padding:
                0;

            color:
                #111;

            background:
                white;

        }


        h1 {

            text-align:
                center;

            margin:
                0 0 6px 0;

            font-size:
                24px;

        }


        .date {

            text-align:
                center;

            margin-bottom:
                18px;

            font-size:
                13px;

        }


        .summary {

            display:
                grid;

            grid-template-columns:
                repeat(7, 1fr);

            gap:
                8px;

            margin-bottom:
                20px;

        }


        .summary-box {

            border:
                1px solid #999;

            padding:
                8px;

            text-align:
                center;

            border-radius:
                5px;

            font-size:
                13px;

        }


        .summary-number {

            display:
                block;

            font-size:
                20px;

            font-weight:
                bold;

            margin-top:
                4px;

        }


        h2 {

            font-size:
                18px;

            margin-top:
                25px;

            margin-bottom:
                8px;

            border-bottom:
                2px solid #333;

            padding-bottom:
                5px;

        }


        table {

            width:
                100%;

            border-collapse:
                collapse;

            margin-bottom:
                18px;

            page-break-inside:
                auto;

        }


        thead {

            display:
                table-header-group;

        }


        tr {

            page-break-inside:
                avoid;

            page-break-after:
                auto;

        }


        th,
        td {

            border:
                1px solid #777;

            padding:
                6px;

            text-align:
                center;

            font-size:
                11px;

        }


        th {

            font-weight:
                bold;

        }


        .footer {

            margin-top:
                30px;

            display:
                flex;

            justify-content:
                space-between;

            font-size:
                13px;

        }


        .empty {

            text-align:
                center;

            padding:
                15px;

        }


        @media print {

            body {

                -webkit-print-color-adjust:
                    exact;

                print-color-adjust:
                    exact;

            }

        }

    </style>

</head>


<body>


    <h1>
        تقرير إدارة المعلمين
    </h1>


    <div class="date">

        تاريخ التقرير:
        ${escapeHtml(today)}

    </div>


    <!-- الملخص -->

    <div class="summary">


        <div class="summary-box">

            الغياب

            <span class="summary-number">
                ${teachersData.absence.length}
            </span>

        </div>


        <div class="summary-box">

            الأعمال الكتابية

            <span class="summary-number">
                ${teachersData.written.length}
            </span>

        </div>


        <div class="summary-box">

            أعمال اللجان

            <span class="summary-number">
                ${teachersData.committees.length}
            </span>

        </div>


        <div class="summary-box">

            التأخير

            <span class="summary-number">
                ${teachersData.tardiness.length}
            </span>

        </div>


        <div class="summary-box">

            المناوبة

            <span class="summary-number">
                ${teachersData.duty.length}
            </span>

        </div>


        <div class="summary-box">

            الملاحظات

            <span class="summary-number">
                ${teachersData.notes.length}
            </span>

        </div>


        <div class="summary-box">

            الإجمالي

            <span class="summary-number">
                ${totalRecords}
            </span>

        </div>


    </div>


    <!-- الغياب -->

    <h2>
        سجل غياب المعلمين
    </h2>


    <table>

        <thead>

            <tr>

                <th>
                    اسم المعلم
                </th>

                <th>
                    التاريخ
                </th>

                <th>
                    سبب الغياب
                </th>

                <th>
                    حالة النموذج
                </th>

            </tr>

        </thead>


        <tbody>

            ${
                absenceRows ||
                `
                    <tr>
                        <td
                            colspan="4"
                            class="empty"
                        >
                            لا توجد سجلات
                        </td>
                    </tr>
                `
            }

        </tbody>

    </table>


    <!-- الأعمال الكتابية -->

    <h2>
        الأعمال الكتابية
    </h2>


    <table>

        <thead>

            <tr>

                <th>
                    اسم المعلم
                </th>

                <th>
                    العمل / العنوان
                </th>

                <th>
                    التاريخ
                </th>

            </tr>

        </thead>


        <tbody>

            ${
                writtenRows ||
                `
                    <tr>
                        <td
                            colspan="3"
                            class="empty"
                        >
                            لا توجد سجلات
                        </td>
                    </tr>
                `
            }

        </tbody>

    </table>


    <!-- اللجان -->

    <h2>
        أعمال اللجان
    </h2>


    <table>

        <thead>

            <tr>

                <th>
                    اللجنة
                </th>

                <th>
                    المعلم
                </th>

                <th>
                    الكتاب الرسمي
                </th>

                <th>
                    العمل المكلف به
                </th>

                <th>
                    تاريخ التسليم
                </th>

                <th>
                    الحالة
                </th>

                <th>
                    الوقت المتبقي
                </th>

                <th>
                    الملاحظات
                </th>

            </tr>

        </thead>


        <tbody>

            ${
                committeeRows ||
                `
                    <tr>
                        <td
                            colspan="8"
                            class="empty"
                        >
                            لا توجد سجلات
                        </td>
                    </tr>
                `
            }

        </tbody>

    </table>


    <!-- التأخير -->

    <h2>
        سجل التأخير
    </h2>


    <table>

        <thead>

            <tr>

                <th>
                    اسم المعلم
                </th>

                <th>
                    التاريخ
                </th>

                <th>
                    وقت التأخير
                </th>

                <th>
                    الملاحظات
                </th>

            </tr>

        </thead>


        <tbody>

            ${
                tardinessRows ||
                `
                    <tr>
                        <td
                            colspan="4"
                            class="empty"
                        >
                            لا توجد سجلات
                        </td>
                    </tr>
                `
            }

        </tbody>

    </table>


    <!-- المناوبة -->

    <h2>
        سجل المناوبة
    </h2>


    <table>

        <thead>

            <tr>

                <th>
                    اسم المعلم
                </th>

                <th>
                    التاريخ
                </th>

                <th>
                    الحالة
                </th>

                <th>
                    الملاحظات
                </th>

            </tr>

        </thead>


        <tbody>

            ${
                dutyRows ||
                `
                    <tr>
                        <td
                            colspan="4"
                            class="empty"
                        >
                            لا توجد سجلات
                        </td>
                    </tr>
                `
            }

        </tbody>

    </table>


    <!-- الملاحظات -->

    <h2>
        الملاحظات
    </h2>


    <table>

        <thead>

            <tr>

                <th>
                    اسم المعلم
                </th>

                <th>
                    التاريخ
                </th>

                <th>
                    الملاحظات
                </th>

            </tr>

        </thead>


        <tbody>

            ${
                notesRows ||
                `
                    <tr>
                        <td
                            colspan="3"
                            class="empty"
                        >
                            لا توجد سجلات
                        </td>
                    </tr>
                `
            }

        </tbody>

    </table>


    <div class="footer">

        <div>
            مدير المدرسة: أ. سمير مصلح
        </div>


        <div>
            التوقيع: __________________
        </div>

    </div>


    <script>

        window.onload =
            function() {

                setTimeout(
                    function() {

                        window.print();

                    },
                    500
                );

            };


    <\/script>


</body>

</html>

        `;


        printWindow.document.open();

        printWindow.document.write(
            html
        );

        printWindow.document.close();


    } catch (error) {

        console.error(
            'PDF export error:',
            error
        );


        alert(
            'حدث خطأ أثناء إنشاء تقرير PDF.'
        );

    }

}


/* =========================================================
   IMPORT
========================================================= */

function triggerImport() {

    const input =
        document.getElementById(
            'importFile'
        );


    if (input) {

        input.click();

    }

}


async function importData(event) {

    const file =
        event.target.files?.[0];


    if (!file) {

        return;

    }


    try {

        const text =
            await file.text();


        const imported =
            JSON.parse(text);


        if (
            !confirm(
                'سيتم استيراد البيانات إلى النظام. هل تريد المتابعة؟'
            )
        ) {

            event.target.value = '';

            return;

        }


        const groups = [

            {
                key: 'absence',
                type: 'absence'
            },

            {
                key: 'written',
                type: 'written'
            },

            {
                key: 'committees',
                type: 'committee'
            },

            {
                key: 'tardiness',
                type: 'tardiness'
            },

            {
                key: 'duty',
                type: 'duty'
            },

            {
                key: 'notes',
                type: 'notes'
            }

        ];


        for (
            const group of groups
        ) {

            const records =
                Array.isArray(
                    imported[group.key]
                )
                    ? imported[group.key]
                    : [];


            for (
                const record of records
            ) {

                const cleanRecord = {
                    ...record
                };


                delete cleanRecord.id;

                delete cleanRecord._id;

                delete cleanRecord.type;

                delete cleanRecord.createdAt;

                delete cleanRecord.updatedAt;


                await createTeacherRecord(
                    group.type,
                    cleanRecord
                );

            }

        }


        await loadData();

        renderAll();


        alert(
            'تم استيراد البيانات بنجاح.'
        );

    } catch (error) {

        console.error(error);

        alert(
            'تعذر استيراد الملف. تأكد من صحة ملف JSON.'
        );

    }


    event.target.value = '';

}


/* =========================================================
   PRINT REPORT
========================================================= */

function printTeachersReport() {

    const printWindow =
        window.open(
            '',
            '_blank'
        );


    if (!printWindow) {

        alert(
            'يرجى السماح بالنوافذ المنبثقة للطباعة.'
        );

        return;

    }


    const totalRecords =
        teachersData.absence.length +
        teachersData.written.length +
        teachersData.committees.length +
        teachersData.tardiness.length +
        teachersData.duty.length +
        teachersData.notes.length;


    const committeeRows =
        teachersData.committees
            .map(record => {

                const remaining =
                    getRemainingTime(
                        record.dueDate,
                        record.status
                    );


                return `

                    <tr>

                        <td>
                            ${escapeHtml(record.title)}
                        </td>

                        <td>
                            ${escapeHtml(record.name)}
                        </td>

                        <td>
                            ${escapeHtml(record.officialBook)}
                        </td>

                        <td>
                            ${escapeHtml(record.assignedWork)}
                        </td>

                        <td>
                            ${escapeHtml(record.dueDate)}
                        </td>

                        <td>
                            ${escapeHtml(record.status)}
                        </td>

                        <td>
                            ${escapeHtml(remaining.text)}
                        </td>

                        <td>
                            ${escapeHtml(record.note)}
                        </td>

                    </tr>

                `;

            })
            .join('');


    const html = `

        <!DOCTYPE html>

        <html lang="ar" dir="rtl">

        <head>

            <meta charset="UTF-8">

            <title>
                تقرير إدارة المعلمين
            </title>

            <style>

                body {

                    font-family:
                        Arial,
                        Tahoma,
                        sans-serif;

                    direction: rtl;

                    padding: 30px;

                }


                h1,
                h2 {

                    text-align: center;

                }


                table {

                    width: 100%;

                    border-collapse:
                        collapse;

                    margin-bottom: 30px;

                }


                th,
                td {

                    border:
                        1px solid #999;

                    padding:
                        8px;

                    text-align:
                        center;

                }


                th {

                    background:
                        #eee;

                }


                .summary {

                    display:
                        flex;

                    justify-content:
                        space-around;

                    margin-bottom:
                        30px;

                }


                .summary-box {

                    border:
                        1px solid #999;

                    padding:
                        15px;

                    text-align:
                        center;

                }

            </style>

        </head>

        <body>

            <h1>
                تقرير إدارة المعلمين
            </h1>

            <div class="summary">

                <div class="summary-box">
                    الغياب:
                    ${teachersData.absence.length}
                </div>

                <div class="summary-box">
                    الأعمال الكتابية:
                    ${teachersData.written.length}
                </div>

                <div class="summary-box">
                    اللجان:
                    ${teachersData.committees.length}
                </div>

                <div class="summary-box">
                    التأخير:
                    ${teachersData.tardiness.length}
                </div>

                <div class="summary-box">
                    المناوبة:
                    ${teachersData.duty.length}
                </div>

                <div class="summary-box">
                    الملاحظات:
                    ${teachersData.notes.length}
                </div>

            </div>


            <h2>
                أعمال اللجان
            </h2>

            <table>

                <thead>

                    <tr>

                        <th>اللجنة</th>

                        <th>المعلم</th>

                        <th>الكتاب الرسمي</th>

                        <th>العمل المكلف به</th>

                        <th>تاريخ التسليم</th>

                        <th>الحالة</th>

                        <th>الوقت المتبقي</th>

                        <th>الملاحظات</th>

                    </tr>

                </thead>

                <tbody>

                    ${committeeRows}

                </tbody>

            </table>


            <h2>
                إجمالي السجلات:
                ${totalRecords}
            </h2>

            <script>

                window.onload = function() {

                    window.print();

                };

            <\/script>

        </body>

        </html>

    `;


    printWindow.document.open();

    printWindow.document.write(
        html
    );

    printWindow.document.close();

}


/* =========================================================
   NAVIGATION
========================================================= */

function backToSectionSelection() {

    localStorage.setItem(
        'schoolLoggedIn',
        'true'
    );


    localStorage.removeItem(
        'schoolSection'
    );


    window.location.href =
        'index.html';

}


function teachersLogout() {

    if (presenceStarted) {

        notifyPresenceLogout();

        stopPresenceMonitoring();

    }


    localStorage.removeItem(
        'schoolLoggedIn'
    );


    localStorage.removeItem(
        'schoolAuthToken'
    );


    localStorage.removeItem(
        'schoolSection'
    );


    window.location.href =
        'index.html';

}


/* =========================================================
   AUTO UPDATE REMAINING TIME
   كل دقيقة
========================================================= */

let remainingTimeInterval = null;


function startRemainingTimeUpdater() {

    if (
        remainingTimeInterval
    ) {

        clearInterval(
            remainingTimeInterval
        );

    }


    /*
       تحديث مباشر كل دقيقة
    */

    remainingTimeInterval =
        setInterval(
            function() {

                updateRemainingTimes();

            },
            60000
        );

}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    async function() {

        const loaded =
            await loadData();


        if (loaded) {

            renderAll();

        }


        const importInput =
            document.getElementById(
                'importFile'
            );


        if (importInput) {

            importInput.addEventListener(
                'change',
                importData
            );

        }


        const today =
            new Date()
                .toLocaleDateString(
                    'en-CA',
                    {
                        timeZone:
                            'Asia/Gaza'
                    }
                );


        const dateFields = [

            'absence-date',

            'written-date',

            'committee-due-date',

            'tardiness-date',

            'duty-date',

            'notes-date'

        ];


        dateFields.forEach(
            id => {

                const field =
                    document.getElementById(
                        id
                    );


                if (
                    field &&
                    !field.value
                ) {

                    field.value =
                        today;

                }

            }
        );


        /*
           بدء تحديث الوقت المتبقي
        */

        startRemainingTimeUpdater();

    }
);


/* =========================================================
   PREVENT CTRL + S
========================================================= */

document.addEventListener(
    'keydown',
    function(event) {

        if (
            (
                event.ctrlKey ||
                event.metaKey
            ) &&
            event.key
                .toLowerCase() === 's'
        ) {

            event.preventDefault();

        }

    }
);
