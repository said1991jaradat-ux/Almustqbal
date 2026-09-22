
/* =========================================================
   نظام متابعة وإدارة المعلمين
   teachers.js
========================================================= */

"use strict";


/* =========================================================
   STORAGE
========================================================= */

const TEACHERS_STORAGE_KEY = "teachersManagementData";

let teachersData = {
    absence: [],
    written: [],
    committees: [],
    tardiness: [],
    duty: [],
    notes: []
};


/* =========================================================
   CHARTS
========================================================= */

let absenceChart = null;
let writtenChart = null;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    loadData();

    setTodayDates();

    renderAll();

    toggleCommitteeNote();

    toggleDutyNote();

    initializeIcons();

});


/* =========================================================
   LUCIDE ICONS
========================================================= */

function initializeIcons() {

    if (window.lucide) {
        lucide.createIcons();
    }

}


/* =========================================================
   LOAD DATA
========================================================= */

function loadData() {

    try {

        const saved =
            localStorage.getItem(
                TEACHERS_STORAGE_KEY
            );

        if (!saved) {
            return;
        }

        const parsed =
            JSON.parse(saved);

        teachersData = {

            absence:
                Array.isArray(parsed.absence)
                    ? parsed.absence
                    : [],

            written:
                Array.isArray(parsed.written)
                    ? parsed.written
                    : [],

            committees:
                Array.isArray(parsed.committees)
                    ? parsed.committees
                    : [],

            tardiness:
                Array.isArray(parsed.tardiness)
                    ? parsed.tardiness
                    : [],

            duty:
                Array.isArray(parsed.duty)
                    ? parsed.duty
                    : [],

            notes:
                Array.isArray(parsed.notes)
                    ? parsed.notes
                    : []

        };

    } catch (error) {

        console.error(
            "خطأ في تحميل بيانات المعلمين:",
            error
        );

    }

}


/* =========================================================
   SAVE DATA
========================================================= */

function saveData() {

    try {

        localStorage.setItem(
            TEACHERS_STORAGE_KEY,
            JSON.stringify(teachersData)
        );

    } catch (error) {

        console.error(
            "خطأ في حفظ بيانات المعلمين:",
            error
        );

        alert(
            "تعذر حفظ البيانات على هذا الجهاز."
        );

    }

}


/* =========================================================
   GENERATE ID
========================================================= */

function generateId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );

}


/* =========================================================
   DATE
========================================================= */

function getToday() {

    const date = new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


/* =========================================================
   CURRENT DATE + TIME
========================================================= */

function getCurrentDateTime() {

    const now = new Date();

    return {

        date: getToday(),

        time:
            now.toLocaleTimeString(
                "ar-PS",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            ),

        createdAt:
            now.toISOString()

    };

}


/* =========================================================
   SET TODAY DATES
========================================================= */

function setTodayDates() {

    const dateIds = [

        "absence-date",

        "written-date",

        "tardiness-date",

        "duty-date",

        "notes-date"

    ];

    const today =
        getToday();

    dateIds.forEach(function (id) {

        const element =
            document.getElementById(id);

        if (
            element &&
            !element.value
        ) {

            element.value =
                today;

        }

    });

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    const parts =
        dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


/* =========================================================
   DAY NAME
========================================================= */

function getDayName(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(
            dateString + "T00:00:00"
        );

    const days = [

        "الأحد",
        "الاثنين",
        "الثلاثاء",
        "الأربعاء",
        "الخميس",
        "الجمعة",
        "السبت"

    ];

    return days[
        date.getDay()
    ];

}


/* =========================================================
   FORMAT DATE WITH DAY
========================================================= */

function formatDateWithDay(dateString) {

    if (!dateString) {
        return "";
    }

    return `
        ${getDayName(dateString)}
        -
        ${formatDate(dateString)}
    `;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   TAB SYSTEM
========================================================= */

function switchTab(tabName) {

    const tabs =
        document.querySelectorAll(
            ".tab-content"
        );

    tabs.forEach(function (tab) {

        tab.classList.remove(
            "active"
        );

    });


    const buttons =
        document.querySelectorAll(
            ".nav-btn"
        );

    buttons.forEach(function (button) {

        button.classList.remove(
            "active"
        );

    });


    const selectedTab =
        document.getElementById(
            "tab-" + tabName
        );

    if (selectedTab) {

        selectedTab.classList.add(
            "active"
        );

    }


    const selectedButton =
        Array.from(buttons)
            .find(function (button) {

                return button.getAttribute(
                    "onclick"
                ) ===
                `switchTab('${tabName}')`;

            });


    if (selectedButton) {

        selectedButton.classList.add(
            "active"
        );

    }


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });


    initializeIcons();

}


/* =========================================================
   ABSENCE
========================================================= */

function saveAbsence(event) {

    event.preventDefault();


    const name =
        document.getElementById(
            "absence-name"
        ).value.trim();

    const date =
        document.getElementById(
            "absence-date"
        ).value;

    const reason =
        document.getElementById(
            "absence-reason"
        ).value;

    const formStatus =
        document.getElementById(
            "absence-form-status"
        ).value;

    const editId =
        document.getElementById(
            "absence-edit-id"
        ).value;


    if (!name || !date) {

        alert(
            "يرجى إدخال اسم المعلم والتاريخ."
        );

        return;

    }


    if (editId) {

        const index =
            teachersData.absence.findIndex(
                item =>
                    item.id === editId
            );

        if (index !== -1) {

            teachersData.absence[index] = {

                ...teachersData.absence[index],

                name,

                date,

                reason,

                formStatus

            };

        }

    } else {

        const now =
            getCurrentDateTime();

        teachersData.absence.unshift({

            id:
                generateId(),

            name,

            date,

            reason,

            formStatus,

            recordedDate:
                now.date,

            recordedTime:
                now.time,

            createdAt:
                now.createdAt

        });

    }


    saveData();

    renderAll();

    resetForm(
        "absence"
    );

    alert(

        editId

            ? "تم تعديل بيانات الغياب بنجاح."

            : "تم حفظ بيانات الغياب بنجاح."

    );

}


/* =========================================================
   RENDER ABSENCE
========================================================= */

function renderAbsence() {

    const tbody =
        document.getElementById(
            "absence-table-body"
        );

    if (!tbody) {
        return;
    }


    if (
        teachersData.absence.length === 0
    ) {

        tbody.innerHTML =
            emptyRow(
                5,
                "لا توجد بيانات غياب مسجلة."
            );

        return;

    }


    tbody.innerHTML =
        teachersData.absence

            .map(function (item) {

                return `

                    <tr>

                        <td>
                            ${escapeHtml(
                                item.name
                            )}
                        </td>

                        <td>
                            ${formatDateWithDay(
                                item.date
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.reason
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.formStatus
                            )}
                        </td>

                        <td>
                            ${actionButtons(
                                "absence",
                                item.id
                            )}
                        </td>

                    </tr>

                `;

            })

            .join("");


    initializeIcons();

}


/* =========================================================
   EDIT ABSENCE
========================================================= */

function editAbsence(id) {

    const item =
        teachersData.absence.find(
            record =>
                record.id === id
        );

    if (!item) {
        return;
    }


    document.getElementById(
        "absence-edit-id"
    ).value =
        item.id;


    document.getElementById(
        "absence-name"
    ).value =
        item.name;


    document.getElementById(
        "absence-date"
    ).value =
        item.date;


    document.getElementById(
        "absence-reason"
    ).value =
        item.reason;


    document.getElementById(
        "absence-form-status"
    ).value =
        item.formStatus;


    document.getElementById(
        "absence-btn"
    ).innerHTML =
        '<i data-lucide="save"></i> تحديث البيانات';


    switchTab(
        "absence"
    );

    initializeIcons();

}


/* =========================================================
   WRITTEN WORK
========================================================= */

function saveWritten(event) {

    event.preventDefault();


    const name =
        document.getElementById(
            "written-name"
        ).value.trim();

    const type =
        document.getElementById(
            "written-type"
        ).value;

    const date =
        document.getElementById(
            "written-date"
        ).value;

    const editId =
        document.getElementById(
            "written-edit-id"
        ).value;


    if (!name || !date) {

        alert(
            "يرجى إدخال اسم المعلم وتاريخ التسليم."
        );

        return;

    }


    if (editId) {

        const index =
            teachersData.written.findIndex(
                item =>
                    item.id === editId
            );

        if (index !== -1) {

            teachersData.written[index] = {

                ...teachersData.written[index],

                name,

                type,

                date

            };

        }

    } else {

        const now =
            getCurrentDateTime();

        teachersData.written.unshift({

            id:
                generateId(),

            name,

            type,

            date,

            recordedDate:
                now.date,

            recordedTime:
                now.time,

            createdAt:
                now.createdAt

        });

    }


    saveData();

    renderAll();

    resetForm(
        "written"
    );

    alert(

        editId

            ? "تم تعديل بيانات العمل الكتابي."

            : "تم تسجيل العمل الكتابي بنجاح."

    );

}


/* =========================================================
   RENDER WRITTEN
========================================================= */

function renderWritten() {

    const tbody =
        document.getElementById(
            "written-table-body"
        );

    if (!tbody) {
        return;
    }


    if (
        teachersData.written.length === 0
    ) {

        tbody.innerHTML =
            emptyRow(
                4,
                "لا توجد أعمال كتابية مسجلة."
            );

        return;

    }


    tbody.innerHTML =
        teachersData.written

            .map(function (item) {

                return `

                    <tr>

                        <td>
                            ${escapeHtml(
                                item.name
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.type
                            )}
                        </td>

                        <td>
                            ${formatDateWithDay(
                                item.date
                            )}
                        </td>

                        <td>
                            ${actionButtons(
                                "written",
                                item.id
                            )}
                        </td>

                    </tr>

                `;

            })

            .join("");


    initializeIcons();

}


/* =========================================================
   EDIT WRITTEN
========================================================= */

function editWritten(id) {

    const item =
        teachersData.written.find(
            record =>
                record.id === id
        );

    if (!item) {
        return;
    }


    document.getElementById(
        "written-edit-id"
    ).value =
        item.id;


    document.getElementById(
        "written-name"
    ).value =
        item.name;


    document.getElementById(
        "written-type"
    ).value =
        item.type;


    document.getElementById(
        "written-date"
    ).value =
        item.date;


    document.getElementById(
        "written-btn"
    ).innerHTML =
        '<i data-lucide="save"></i> تحديث التسليم';


    switchTab(
        "written"
    );

    initializeIcons();

}


/* =========================================================
   COMMITTEES
========================================================= */

function saveCommittee(event) {

    event.preventDefault();


    const id =
        document.getElementById(
            "committee-edit-id"
        ).value;


    const name =
        document.getElementById(
            "committee-name"
        ).value.trim();


    const title =
        document.getElementById(
            "committee-title"
        ).value.trim();


    const status =
        document.getElementById(
            "committee-status"
        ).value;


    const note =
        document.getElementById(
            "committee-note"
        ).value.trim();


    if (!name || !title) {

        alert(
            "يرجى إدخال اسم المعلم واسم اللجنة."
        );

        return;

    }


    if (
        status === "غير ملتزم" &&
        !note
    ) {

        alert(
            "يرجى كتابة الملاحظة أو سبب عدم الالتزام."
        );

        document.getElementById(
            "committee-note"
        ).focus();

        return;

    }


    const now =
        getCurrentDateTime();


    const record = {

        id:
            id ||
            generateId(),

        name,

        title,

        status,

        note,

        date:
            now.date,

        time:
            now.time,

        createdAt:
            now.createdAt

    };


    if (id) {

        const index =
            teachersData.committees.findIndex(
                item =>
                    item.id === id
            );

        if (index !== -1) {

            teachersData.committees[index] = {

                ...teachersData.committees[index],

                ...record

            };

        }

    } else {

        teachersData.committees.unshift(
            record
        );

    }


    saveData();

    renderAll();

    resetForm(
        "committee"
    );


    alert(

        id

            ? "تم تعديل تقييم اللجنة بنجاح."

            : "تم حفظ تقييم اللجنة بنجاح."

    );

}


/* =========================================================
   TOGGLE COMMITTEE NOTE
========================================================= */

function toggleCommitteeNote() {

    const statusElement =
        document.getElementById(
            "committee-status"
        );

    const group =
        document.getElementById(
            "committee-note-group"
        );

    const note =
        document.getElementById(
            "committee-note"
        );


    if (
        !statusElement ||
        !group ||
        !note
    ) {
        return;
    }


    const status =
        statusElement.value;


    if (
        status === "غير ملتزم"
    ) {

        group.style.display =
            "block";

        note.required =
            true;

    } else {

        group.style.display =
            "none";

        note.required =
            false;

        note.value =
            "";

    }

}


/* =========================================================
   RENDER COMMITTEES
========================================================= */

function renderCommittees() {

    const tbody =
        document.getElementById(
            "committee-table-body"
        );

    if (!tbody) {
        return;
    }


    if (
        teachersData.committees.length === 0
    ) {

        tbody.innerHTML =
            emptyRow(
                5,
                "لا توجد بيانات للجان."
            );

        return;

    }


    tbody.innerHTML =
        teachersData.committees

            .map(function (item) {

                return `

                    <tr>

                        <td>
                            ${escapeHtml(
                                item.name
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.title
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.status
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.note ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${actionButtons(
                                "committee",
                                item.id
                            )}
                        </td>

                    </tr>

                `;

            })

            .join("");


    initializeIcons();

}


/* =========================================================
   EDIT COMMITTEE
========================================================= */

function editCommittee(id) {

    const item =
        teachersData.committees.find(
            record =>
                record.id === id
        );

    if (!item) {
        return;
    }


    document.getElementById(
        "committee-edit-id"
    ).value =
        item.id;


    document.getElementById(
        "committee-name"
    ).value =
        item.name;


    document.getElementById(
        "committee-title"
    ).value =
        item.title;


    document.getElementById(
        "committee-status"
    ).value =
        item.status;


    document.getElementById(
        "committee-note"
    ).value =
        item.note || "";


    toggleCommitteeNote();


    document.getElementById(
        "committee-btn"
    ).innerHTML =
        '<i data-lucide="save"></i> تحديث التقييم';


    switchTab(
        "committees"
    );

    initializeIcons();

}


/* =========================================================
   DUTY NOTE
========================================================= */

function toggleDutyNote() {

    const statusElement =
        document.getElementById(
            "duty-status"
        );

    const group =
        document.getElementById(
            "duty-note-group"
        );

    const note =
        document.getElementById(
            "duty-note"
        );


    if (
        !statusElement ||
        !group ||
        !note
    ) {
        return;
    }


    const status =
        statusElement.value;


    if (

        status === "غير ملتزم" ||

        status === "تأخر عن موقع المناوبة"

    ) {

        group.style.display =
            "block";

        note.required =
            true;

    } else {

        group.style.display =
            "none";

        note.required =
            false;

        note.value =
            "";

    }

}


/* =========================================================
   TARDINESS
========================================================= */

function saveTardiness(event) {

    event.preventDefault();


    const id =
        document.getElementById(
            "tardiness-edit-id"
        ).value;


    const name =
        document.getElementById(
            "tardiness-name"
        ).value.trim();


    const arrivalTime =
        document.getElementById(
            "tardiness-time"
        ).value;


    const noteElement =
        document.getElementById(
            "tardiness-note"
        );


    const note =
        noteElement
            ? noteElement.value.trim()
            : "";


    if (!name || !arrivalTime) {

        alert(
            "يرجى إدخال اسم المعلم ووقت الحضور."
        );

        return;

    }


    const now =
        getCurrentDateTime();


    const record = {

        id:
            id ||
            generateId(),

        name,

        date:
            now.date,

        time:
            arrivalTime,

        note,

        recordedDate:
            now.date,

        recordedTime:
            now.time,

        createdAt:
            now.createdAt

    };


    if (id) {

        const index =
            teachersData.tardiness.findIndex(
                item =>
                    item.id === id
            );

        if (index !== -1) {

            teachersData.tardiness[index] = {

                ...teachersData.tardiness[index],

                ...record

            };

        }

    } else {

        teachersData.tardiness.unshift(
            record
        );

    }


    saveData();

    renderAll();

    resetForm(
        "tardiness"
    );


    alert(

        id

            ? "تم تعديل حالة التأخير."

            : "تم تسجيل حالة التأخير بنجاح."

    );

}


/* =========================================================
   RENDER TARDINESS
========================================================= */

function renderTardiness() {

    const tbody =
        document.getElementById(
            "tardiness-table-body"
        );

    if (!tbody) {
        return;
    }


    if (
        teachersData.tardiness.length === 0
    ) {

        tbody.innerHTML =
            emptyRow(
                5,
                "لا توجد حالات تأخير مسجلة."
            );

        return;

    }


    tbody.innerHTML =
        teachersData.tardiness

            .map(function (item) {

                return `

                    <tr>

                        <td>
                            ${escapeHtml(
                                item.name
                            )}
                        </td>

                        <td>
                            ${formatDateWithDay(
                                item.date
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.time
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.note ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${actionButtons(
                                "tardiness",
                                item.id
                            )}
                        </td>

                    </tr>

                `;

            })

            .join("");


    initializeIcons();

}


/* =========================================================
   EDIT TARDINESS
========================================================= */

function editTardiness(id) {

    const item =
        teachersData.tardiness.find(
            record =>
                record.id === id
        );

    if (!item) {
        return;
    }


    document.getElementById(
        "tardiness-edit-id"
    ).value =
        item.id;


    document.getElementById(
        "tardiness-name"
    ).value =
        item.name;


    const dateElement =
        document.getElementById(
            "tardiness-date"
        );

    if (dateElement) {

        dateElement.value =
            item.date;

    }


    document.getElementById(
        "tardiness-time"
    ).value =
        item.time;


    const noteElement =
        document.getElementById(
            "tardiness-note"
        );

    if (noteElement) {

        noteElement.value =
            item.note || "";

    }


    document.getElementById(
        "tardiness-btn"
    ).innerHTML =
        '<i data-lucide="save"></i> تحديث التأخير';


    switchTab(
        "tardiness"
    );

    initializeIcons();

}


/* =========================================================
   DUTY
========================================================= */

function saveDuty(event) {

    event.preventDefault();


    const id =
        document.getElementById(
            "duty-edit-id"
        ).value;


    const name =
        document.getElementById(
            "duty-name"
        ).value.trim();


    const status =
        document.getElementById(
            "duty-status"
        ).value;


    const noteElement =
        document.getElementById(
            "duty-note"
        );


    const note =
        noteElement
            ? noteElement.value.trim()
            : "";


    if (!name) {

        alert(
            "يرجى إدخال اسم المعلم."
        );

        return;

    }


    if (

        (
            status === "غير ملتزم" ||

            status === "تأخر عن موقع المناوبة"

        ) &&

        !note

    ) {

        alert(
            "يرجى كتابة الملاحظة أو سبب المخالفة."
        );

        if (noteElement) {

            noteElement.focus();

        }

        return;

    }


    const now =
        getCurrentDateTime();


    const record = {

        id:
            id ||
            generateId(),

        name,

        date:
            now.date,

        time:
            now.time,

        status,

        note,

        recordedDate:
            now.date,

        recordedTime:
            now.time,

        createdAt:
            now.createdAt

    };


    if (id) {

        const index =
            teachersData.duty.findIndex(
                item =>
                    item.id === id
            );

        if (index !== -1) {

            teachersData.duty[index] = {

                ...teachersData.duty[index],

                ...record

            };

        }

    } else {

        teachersData.duty.unshift(
            record
        );

    }


    saveData();

    renderAll();

    resetForm(
        "duty"
    );


    alert(

        id

            ? "تم تعديل سجل المناوبة بنجاح."

            : "تم تسجيل المناوبة بنجاح."

    );

}


/* =========================================================
   RENDER DUTY
========================================================= */

function renderDuty() {

    const tbody =
        document.getElementById(
            "duty-table-body"
        );

    if (!tbody) {
        return;
    }


    if (
        teachersData.duty.length === 0
    ) {

        tbody.innerHTML =
            emptyRow(
                5,
                "لا توجد سجلات مناوبة."
            );

        return;

    }


    tbody.innerHTML =
        teachersData.duty

            .map(function (item) {

                return `

                    <tr>

                        <td>
                            ${escapeHtml(
                                item.name
                            )}
                        </td>

                        <td>
                            ${formatDateWithDay(
                                item.date
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.status
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.note ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${actionButtons(
                                "duty",
                                item.id
                            )}
                        </td>

                    </tr>

                `;

            })

            .join("");


    initializeIcons();

}


/* =========================================================
   EDIT DUTY
========================================================= */

function editDuty(id) {

    const item =
        teachersData.duty.find(
            record =>
                record.id === id
        );

    if (!item) {
        return;
    }


    document.getElementById(
        "duty-edit-id"
    ).value =
        item.id;


    document.getElementById(
        "duty-name"
    ).value =
        item.name;


    const dateElement =
        document.getElementById(
            "duty-date"
        );

    if (dateElement) {

        dateElement.value =
            item.date;

    }


    document.getElementById(
        "duty-status"
    ).value =
        item.status;


    const noteElement =
        document.getElementById(
            "duty-note"
        );

    if (noteElement) {

        noteElement.value =
            item.note || "";

    }


    toggleDutyNote();


    document.getElementById(
        "duty-btn"
    ).innerHTML =
        '<i data-lucide="save"></i> تحديث المناوبة';


    switchTab(
        "duty"
    );

    initializeIcons();

}


/* =========================================================
   NOTES
========================================================= */

function saveNote(event) {

    event.preventDefault();


    const name =
        document.getElementById(
            "notes-name"
        ).value.trim();


    const date =
        document.getElementById(
            "notes-date"
        ).value;


    const text =
        document.getElementById(
            "notes-text"
        ).value.trim();


    const editId =
        document.getElementById(
            "notes-edit-id"
        ).value;


    if (
        !name ||
        !date ||
        !text
    ) {

        alert(
            "يرجى إكمال جميع بيانات الملاحظة."
        );

        return;

    }


    if (editId) {

        const index =
            teachersData.notes.findIndex(
                item =>
                    item.id === editId
            );

        if (index !== -1) {

            teachersData.notes[index] = {

                ...teachersData.notes[index],

                name,

                date,

                text

            };

        }

    } else {

        const now =
            getCurrentDateTime();

        teachersData.notes.unshift({

            id:
                generateId(),

            name,

            date,

            text,

            recordedDate:
                now.date,

            recordedTime:
                now.time,

            createdAt:
                now.createdAt

        });

    }


    saveData();

    renderAll();

    resetForm(
        "notes"
    );


    alert(

        editId

            ? "تم تعديل الملاحظة."

            : "تم حفظ الملاحظة بنجاح."

    );

}


/* =========================================================
   RENDER NOTES
========================================================= */

function renderNotes() {

    const tbody =
        document.getElementById(
            "notes-table-body"
        );

    if (!tbody) {
        return;
    }


    if (
        teachersData.notes.length === 0
    ) {

        tbody.innerHTML =
            emptyRow(
                4,
                "لا توجد ملاحظات إدارية."
            );

        return;

    }


    tbody.innerHTML =
        teachersData.notes

            .map(function (item) {

                return `

                    <tr>

                        <td>
                            ${escapeHtml(
                                item.name
                            )}
                        </td>

                        <td>
                            ${formatDateWithDay(
                                item.date
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.text
                            )}
                        </td>

                        <td>
                            ${actionButtons(
                                "notes",
                                item.id
                            )}
                        </td>

                    </tr>

                `;

            })

            .join("");


    initializeIcons();

}


/* =========================================================
   EDIT NOTE
========================================================= */

function editNote(id) {

    const item =
        teachersData.notes.find(
            record =>
                record.id === id
        );

    if (!item) {
        return;
    }


    document.getElementById(
        "notes-edit-id"
    ).value =
        item.id;


    document.getElementById(
        "notes-name"
    ).value =
        item.name;


    document.getElementById(
        "notes-date"
    ).value =
        item.date;


    document.getElementById(
        "notes-text"
    ).value =
        item.text;


    document.getElementById(
        "notes-btn"
    ).innerHTML =
        '<i data-lucide="save"></i> تحديث الملاحظة';


    switchTab(
        "notes"
    );

    initializeIcons();

}


/* =========================================================
   EMPTY TABLE
========================================================= */

function emptyRow(
    colspan,
    message
) {

    return `

        <tr>

            <td
                colspan="${colspan}"
                style="
                    text-align:center;
                    padding:30px;
                    color:#6c757d;
                "
            >

                ${escapeHtml(
                    message
                )}

            </td>

        </tr>

    `;

}


/* =========================================================
   ACTION BUTTONS
========================================================= */

function actionButtons(type, id) {

    const safeType = escapeHtml(type);
    const safeId = escapeHtml(id);

    return `

        <div
            style="
                display:flex;
                gap:6px;
                justify-content:center;
                align-items:center;
            "
        >

            <button
                type="button"
                class="btn btn-outline"
                onclick="editRecord('${safeType}','${safeId}')"
                title="تعديل"
                style="
                    min-width:42px;
                    padding:8px 10px;
                "
            >

                <i data-lucide="edit-3"></i>

            </button>


            <button
                type="button"
                class="btn"
                onclick="deleteRecord('${safeType}','${safeId}')"
                title="حذف"
                style="
                    min-width:42px;
                    padding:8px 10px;
                    color:#fff;
                    background:#dc3545;
                    border-color:#dc3545;
                "
            >

                <i data-lucide="trash-2"></i>

            </button>

        </div>

    `;
}

/* =========================================================
   EDIT RECORD ROUTER
========================================================= */

function editRecord(
    type,
    id
) {

    switch (type) {

        case "absence":
            editAbsence(id);
            break;

        case "written":
            editWritten(id);
            break;

        case "committee":
            editCommittee(id);
            break;

        case "tardiness":
            editTardiness(id);
            break;

        case "duty":
            editDuty(id);
            break;

        case "notes":
            editNote(id);
            break;

    }

}

/* =========================================================
   DELETE RECORD
========================================================= */

function deleteRecord(type, id) {

    /* تصحيح اسم قسم اللجان */
    const dataType =
        type === "committee"
            ? "committees"
            : type;

    /* التأكد من وجود القسم */
    if (!teachersData[dataType]) {

        console.error(
            "نوع السجل غير موجود:",
            type
        );

        alert("تعذر العثور على نوع السجل.");
        return;
    }


    /* تأكيد الحذف */
    const confirmed = confirm(
        "هل أنت متأكد من حذف هذا السجل؟\n\nلا يمكن التراجع عن عملية الحذف."
    );


    if (!confirmed) {
        return;
    }


    /* البحث عن السجل */
    const oldLength =
        teachersData[dataType].length;


    teachersData[dataType] =
        teachersData[dataType].filter(
            function (item) {

                return String(item.id) !==
                       String(id);

            }
        );


    /* التأكد أن السجل تم حذفه */
    if (
        teachersData[dataType].length ===
        oldLength
    ) {

        alert(
            "لم يتم العثور على السجل المطلوب حذفه."
        );

        return;
    }


    /* حفظ البيانات */
    saveData();


    /* تحديث جميع الجداول والإحصائيات */
    renderAll();


    /* تحديث الأيقونات */
    initializeIcons();


    alert(
        "تم حذف السجل بنجاح."
    );

}
/* =========================================================
   RESET FORM
========================================================= */

function resetForm(type) {

    let formId = "";

    let editId = "";

    let buttonId = "";


    switch (type) {

        case "absence":

            formId =
                "absence-form";

            editId =
                "absence-edit-id";

            buttonId =
                "absence-btn";

            break;


        case "written":

            formId =
                "written-form";

            editId =
                "written-edit-id";

            buttonId =
                "written-btn";

            break;


        case "committee":

            formId =
                "committees-form";

            editId =
                "committee-edit-id";

            buttonId =
                "committee-btn";

            break;


        case "tardiness":

            formId =
                "tardiness-form";

            editId =
                "tardiness-edit-id";

            buttonId =
                "tardiness-btn";

            break;


        case "duty":

            formId =
                "duty-form";

            editId =
                "duty-edit-id";

            buttonId =
                "duty-btn";

            break;


        case "notes":

            formId =
                "notes-form";

            editId =
                "notes-edit-id";

            buttonId =
                "notes-btn";

            break;

    }


    const form =
        document.getElementById(
            formId
        );


    if (form) {

        form.reset();

    }


    const hidden =
        document.getElementById(
            editId
        );


    if (hidden) {

        hidden.value =
            "";

    }


    const button =
        document.getElementById(
            buttonId
        );


    const buttonTexts = {

        absence:
            '<i data-lucide="plus"></i> حفظ البيانات',

        written:
            '<i data-lucide="plus"></i> تسجيل التسليم',

        committee:
            '<i data-lucide="plus"></i> حفظ التقييم',

        tardiness:
            '<i data-lucide="plus"></i> تسجيل التأخير',

        duty:
            '<i data-lucide="plus"></i> رصد المناوبة',

        notes:
            '<i data-lucide="plus"></i> حفظ الملاحظة'

    };


    if (button) {

        button.innerHTML =
            buttonTexts[type];

    }


    setTodayDates();

    toggleCommitteeNote();

    toggleDutyNote();

    initializeIcons();

}




function backToSectionSelection() {

    // نبقي تسجيل الدخول محفوظًا
    localStorage.setItem(
        'schoolLoggedIn',
        'true'
    );

    // إزالة اختيار قسم المعلمين فقط
    localStorage.removeItem(
        'schoolSection'
    );

    // العودة إلى الصفحة الرئيسية
    window.location.href = 'index.html';
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

    initializeIcons();

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    const absenceCount =
        teachersData.absence.length;


    const writtenCount =
        teachersData.written.length;


    const tardinessCount =
        teachersData.tardiness.length;


    const issuesCount =

        teachersData.committees.filter(
            item =>
                item.status ===
                "غير ملتزم"
        ).length

        +

        teachersData.duty.filter(
            item =>
                item.status ===
                "غير ملتزم" ||

                item.status ===
                "تأخر عن موقع المناوبة"
        ).length;


    setText(
        "stat-absence",
        absenceCount
    );


    setText(
        "stat-written",
        writtenCount
    );


    setText(
        "stat-tardiness",
        tardinessCount
    );


    setText(
        "stat-issues",
        issuesCount
    );


    updateAbsenceChart();

    updateWrittenChart();

}


/* =========================================================
   SET TEXT
========================================================= */

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


/* =========================================================
   ABSENCE CHART
========================================================= */

function updateAbsenceChart() {

    const canvas =
        document.getElementById(
            "absenceChart"
        );


    if (!canvas) {
        return;
    }


    const reasons = {

        "مرضي":
            0,

        "عارض":
            0,

        "بدون عذر":
            0

    };


    teachersData.absence.forEach(
        function (item) {

            if (

                Object.prototype.hasOwnProperty
                    .call(
                        reasons,
                        item.reason
                    )

            ) {

                reasons[
                    item.reason
                ]++;

            }

        }
    );


    if (absenceChart) {

        absenceChart.destroy();

    }


    if (
        typeof Chart ===
        "undefined"
    ) {

        return;

    }


    absenceChart =
        new Chart(
            canvas,
            {

                type:
                    "doughnut",

                data: {

                    labels:
                        Object.keys(
                            reasons
                        ),

                    datasets: [

                        {

                            data:
                                Object.values(
                                    reasons
                                ),

                            borderWidth:
                                2

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            position:
                                "bottom",

                            labels: {

                                font: {

                                    family:
                                        "Tajawal"

                                }

                            }

                        }

                    }

                }

            }
        );

}


/* =========================================================
   WRITTEN CHART
========================================================= */

function updateWrittenChart() {

    const canvas =
        document.getElementById(
            "writtenChart"
        );


    if (!canvas) {
        return;
    }


    const types = {

        "الخطط السنوية":
            0,

        "التحضير اليومي":
            0,

        "الحضور والغياب للطلبة":
            0,

        "خطط علاجية":
            0,

        "تحليل اختبار":
            0

    };


    teachersData.written.forEach(
        function (item) {

            if (

                Object.prototype.hasOwnProperty
                    .call(
                        types,
                        item.type
                    )

            ) {

                types[
                    item.type
                ]++;

            }

        }
    );


    if (writtenChart) {

        writtenChart.destroy();

    }


    if (
        typeof Chart ===
        "undefined"
    ) {

        return;

    }


    writtenChart =
        new Chart(
            canvas,
            {

                type:
                    "bar",

                data: {

                    labels:
                        Object.keys(
                            types
                        ),

                    datasets: [

                        {

                            label:
                                "عدد الأعمال",

                            data:
                                Object.values(
                                    types
                                ),

                            borderWidth:
                                1

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            ticks: {

                                precision:
                                    0

                            }

                        }

                    },

                    plugins: {

                        legend: {

                            display:
                                false

                        }

                    }

                }

            }
        );

}


/* =========================================================
   EXPORT DATA
========================================================= */

function exportData() {

    const exportObject = {

        app:
            "نظام متابعة وإدارة المعلمين",

        version:
            "1.0",

        exportedAt:
            new Date().toISOString(),

        data:
            teachersData

    };


    const json =
        JSON.stringify(
            exportObject,
            null,
            4
        );


    const blob =
        new Blob(

            [json],

            {

                type:
                    "application/json;charset=utf-8"

            }

        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    const today =
        getToday();


    link.href =
        url;


    link.download =
        `بيانات_المعلمين_${today}.json`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );


    alert(
        "تم تصدير بيانات المعلمين بنجاح."
    );

}


/* =========================================================
   TRIGGER IMPORT
========================================================= */

function triggerImport() {

    const input =
        document.getElementById(
            "importFile"
        );


    if (input) {

        input.value =
            "";

        input.click();

    }

}


/* =========================================================
   IMPORT DATA
========================================================= */

function importData(event) {

    const file =
        event.target.files &&
        event.target.files[0];


    if (!file) {
        return;
    }


    if (

        !file.name
            .toLowerCase()
            .endsWith(".json")

    ) {

        alert(
            "يرجى اختيار ملف JSON تم تصديره من نظام المعلمين."
        );

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        function (e) {

            try {

                const imported =
                    JSON.parse(
                        e.target.result
                    );


                const importedData =
                    imported.data ||
                    imported;


                if (

                    !importedData ||

                    typeof importedData !==
                        "object"

                ) {

                    throw new Error(
                        "صيغة البيانات غير صحيحة"
                    );

                }


                const confirmed =
                    confirm(
                        "هل تريد استبدال البيانات الحالية بالبيانات الموجودة في الملف؟"
                    );


                if (!confirmed) {
                    return;
                }


                teachersData = {

                    absence:
                        Array.isArray(
                            importedData.absence
                        )
                            ? importedData.absence
                            : [],


                    written:
                        Array.isArray(
                            importedData.written
                        )
                            ? importedData.written
                            : [],


                    committees:
                        Array.isArray(
                            importedData.committees
                        )
                            ? importedData.committees
                            : [],


                    tardiness:
                        Array.isArray(
                            importedData.tardiness
                        )
                            ? importedData.tardiness
                            : [],


                    duty:
                        Array.isArray(
                            importedData.duty
                        )
                            ? importedData.duty
                            : [],


                    notes:
                        Array.isArray(
                            importedData.notes
                        )
                            ? importedData.notes
                            : []

                };


                saveData();

                renderAll();

                setTodayDates();


                alert(
                    "تم استيراد البيانات بنجاح."
                );


            } catch (error) {

                console.error(
                    "Import error:",
                    error
                );


                alert(
                    "تعذر قراءة الملف. تأكد أن الملف صادر من نظام متابعة المعلمين."
                );

            }

        };


    reader.readAsText(
        file,
        "UTF-8"
    );

}


/* =========================================================
   PRINT CURRENT TAB
========================================================= */

function printCurrentTab() {

    window.print();

}


/* =========================================================
   BUILD PRINT SECTION
========================================================= */

function buildPrintSection(
    title,
    data,
    columns
) {

    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        return `

            <div class="section">

                <div class="section-title">
                    ${escapeHtml(title)}
                </div>

                <div
                    style="
                        padding:15px;
                        text-align:center;
                        border:1px solid #CBD5E1;
                        color:#64748B;
                    "
                >
                    لا توجد بيانات مسجلة في هذا القسم.
                </div>

            </div>

        `;

    }


    let rows = "";


    data.forEach(
        function (item) {

            let cells = "";


            if (
                title ===
                "رصد غياب المعلمين"
            ) {

                cells = `

                    <td>
                        ${escapeHtml(
                            item.name
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            formatDateWithDay(
                                item.date
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.reason
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.formStatus
                        )}
                    </td>

                `;

            }


            else if (
                title ===
                "الأعمال الكتابية"
            ) {

                cells = `

                    <td>
                        ${escapeHtml(
                            item.name
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.type
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            formatDateWithDay(
                                item.date
                            )
                        )}
                    </td>

                `;

            }


            else if (
                title ===
                "أعمال اللجان"
            ) {

                cells = `

                    <td>
                        ${escapeHtml(
                            item.name
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.title
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.status
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.note ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.time ||
                            item.recordedTime ||
                            "-"
                        )}
                    </td>

                `;

            }


            else if (
                title ===
                "الحضور والتأخير"
            ) {

                cells = `

                    <td>
                        ${escapeHtml(
                            item.name
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            formatDateWithDay(
                                item.date
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.time ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.note ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.recordedTime ||
                            item.recordedAt ||
                            "-"
                        )}
                    </td>

                `;

            }


            else if (
                title ===
                "المناوبة اليومية"
            ) {

                cells = `

                    <td>
                        ${escapeHtml(
                            item.name
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            formatDateWithDay(
                                item.date
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.status
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.note ||
                            "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.recordedTime ||
                            item.time ||
                            "-"
                        )}
                    </td>

                `;

            }


            else if (
                title ===
                "الملاحظات الإدارية"
            ) {

                cells = `

                    <td>
                        ${escapeHtml(
                            item.name
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            formatDateWithDay(
                                item.date
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.text
                        )}
                    </td>

                `;

            }


            rows += `

                <tr>

                    ${cells}

                </tr>

            `;

        }
    );


    const headerCells =
        columns
            .map(function (column) {

                return `
                    <th>
                        ${escapeHtml(
                            column
                        )}
                    </th>
                `;

            })
            .join("");


    return `

        <div class="section">

            <div class="section-title">

                ${escapeHtml(
                    title
                )}

            </div>


            <table>

                <thead>

                    <tr>

                        ${headerCells}

                    </tr>

                </thead>


                <tbody>

                    ${rows}

                </tbody>

            </table>

        </div>

    `;

}


/* =========================================================
   PRINT FULL REPORT
========================================================= */

function printTeachersReport() {

    const now =
        new Date();


    const reportDate =
        now.toLocaleDateString(
            "ar-PS"
        );


    const reportTime =
        now.toLocaleTimeString(
            "ar-PS",
            {
                hour:
                    "2-digit",
                minute:
                    "2-digit"
            }
        );


    const totalAbsence =
        teachersData.absence.length;


    const totalWritten =
        teachersData.written.length;


    const totalCommittees =
        teachersData.committees.length;


    const totalTardiness =
        teachersData.tardiness.length;


    const totalDuty =
        teachersData.duty.length;


    const totalNotes =
        teachersData.notes.length;


    const totalCommitteeViolations =
        teachersData.committees.filter(
            item =>
                item.status ===
                "غير ملتزم"
        ).length;


    const totalDutyViolations =
        teachersData.duty.filter(
            item =>
                item.status ===
                "غير ملتزم" ||

                item.status ===
                "تأخر عن موقع المناوبة"
        ).length;


    const totalViolations =

        totalCommitteeViolations +

        totalDutyViolations +

        totalTardiness;


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=1200,height=900"
        );


    if (!printWindow) {

        alert(
            "يرجى السماح بالنوافذ المنبثقة حتى يتم فتح التقرير."
        );

        return;

    }


    printWindow.document.write(`

<!DOCTYPE html>

<html
    lang="ar"
    dir="rtl"
>

<head>

<meta charset="UTF-8">

<title>
    التقرير الإداري للمعلمين
</title>


<style>

* {
    box-sizing: border-box;
}


body {

    font-family:
        Arial,
        Tahoma,
        sans-serif;

    margin: 0;

    padding: 25px;

    color:
        #1E293B;

    background:
        #fff;

}


.header {

    text-align:
        center;

    border-bottom:
        3px solid #D97706;

    padding-bottom:
        18px;

    margin-bottom:
        25px;

}


.header h1 {

    margin:
        0 0 8px;

    font-size:
        28px;

    color:
        #0F172A;

}


.header h2 {

    margin:
        0;

    font-size:
        19px;

    color:
        #475569;

}


.header p {

    margin:
        8px 0 0;

    color:
        #64748B;

}


.summary {

    display:
        grid;

    grid-template-columns:
        repeat(4, 1fr);

    gap:
        12px;

    margin-bottom:
        25px;

}


.summary-box {

    border:
        1px solid #CBD5E1;

    border-radius:
        8px;

    padding:
        15px;

    text-align:
        center;

}


.summary-box strong {

    display:
        block;

    font-size:
        26px;

    color:
        #D97706;

    margin-bottom:
        5px;

}


.summary-box span {

    font-size:
        13px;

}


.section {

    margin-top:
        25px;

    page-break-inside:
        avoid;

}


.section-title {

    background:
        #0F172A;

    color:
        white;

    padding:
        10px 14px;

    font-size:
        18px;

    font-weight:
        bold;

    margin-bottom:
        8px;

}


table {

    width:
        100%;

    border-collapse:
        collapse;

}


th {

    background:
        #F1F5F9;

    font-weight:
        bold;

}


th,
td {

    border:
        1px solid #CBD5E1;

    padding:
        8px;

    text-align:
        center;

    font-size:
        12px;

}


.footer {

    margin-top:
        60px;

    display:
        flex;

    justify-content:
        space-between;

    border-top:
        1px solid #CBD5E1;

    padding-top:
        20px;

}


.print-button {

    position:
        fixed;

    left:
        20px;

    top:
        20px;

    border:
        none;

    border-radius:
        6px;

    background:
        #D97706;

    color:
        white;

    padding:
        10px 18px;

    cursor:
        pointer;

}


@media print {

    body {
        padding:
            10px;
    }


    .print-button {
        display:
            none;
    }


    .section {
        page-break-inside:
            avoid;
    }


    .summary {
        grid-template-columns:
            repeat(4, 1fr);
    }

}

</style>

</head>


<body>


<button
    class="print-button"
    onclick="window.print()"
>
    🖨️ طباعة
</button>


<div class="header">

    <h1>
        نظام متابعة وإدارة المعلمين
    </h1>

    <h2>
        التقرير الإداري الشامل
    </h2>

    <p>

        تاريخ التقرير:
        ${escapeHtml(
            reportDate
        )}

        |

        وقت إعداد التقرير:
        ${escapeHtml(
            reportTime
        )}

    </p>

</div>


<div class="summary">


    <div class="summary-box">

        <strong>
            ${totalAbsence}
        </strong>

        <span>
            حالات الغياب
        </span>

    </div>


    <div class="summary-box">

        <strong>
            ${totalWritten}
        </strong>

        <span>
            الأعمال الكتابية
        </span>

    </div>


    <div class="summary-box">

        <strong>
            ${totalCommittees}
        </strong>

        <span>
            أعمال اللجان
        </span>

    </div>


    <div class="summary-box">

        <strong>
            ${totalTardiness}
        </strong>

        <span>
            حالات التأخير
        </span>

    </div>


    <div class="summary-box">

        <strong>
            ${totalDuty}
        </strong>

        <span>
            سجلات المناوبة
        </span>

    </div>


    <div class="summary-box">

        <strong>
            ${totalNotes}
        </strong>

        <span>
            الملاحظات
        </span>

    </div>


    <div class="summary-box">

        <strong>
            ${totalViolations}
        </strong>

        <span>
            إجمالي الحالات والمخالفات
        </span>

    </div>


</div>


${buildPrintSection(

    "رصد غياب المعلمين",

    teachersData.absence,

    [
        "المعلم",
        "التاريخ",
        "سبب الغياب",
        "النموذج"
    ]

)}


${buildPrintSection(

    "الأعمال الكتابية",

    teachersData.written,

    [
        "المعلم",
        "نوع العمل",
        "تاريخ التسليم"
    ]

)}


${buildPrintSection(

    "أعمال اللجان",

    teachersData.committees,

    [
        "المعلم",
        "اللجنة",
        "الحالة",
        "الملاحظة",
        "وقت التسجيل"
    ]

)}


${buildPrintSection(

    "الحضور والتأخير",

    teachersData.tardiness,

    [
        "المعلم",
        "التاريخ",
        "وقت الحضور",
        "الملاحظة",
        "وقت التسجيل"
    ]

)}


${buildPrintSection(

    "المناوبة اليومية",

    teachersData.duty,

    [
        "المعلم",
        "التاريخ",
        "الحالة",
        "الملاحظة",
        "وقت التسجيل"
    ]

)}


${buildPrintSection(

    "الملاحظات الإدارية",

    teachersData.notes,

    [
        "المعلم",
        "التاريخ",
        "الملاحظة"
    ]

)}


<div class="footer">

    <div>

        توقيع مدير المدرسة:

        ............................................

    </div>


    <div>

        ختم المدرسة:

        ............................................

    </div>

</div>


</body>

</html>

    `);


    printWindow.document.close();


    setTimeout(
        function () {

            printWindow.focus();

        },
        300
    );

}


/* =========================================================
   KEYBOARD SHORTCUT
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (

            (
                event.ctrlKey ||
                event.metaKey
            ) &&

            event.key.toLowerCase() ===
                "s"

        ) {

            event.preventDefault();

            saveData();

        }

    }
);


/* =========================================================
   log out
========================================================= */

function teachersLogout() {

    const confirmed = confirm(
        "هل أنت متأكد من تسجيل الخروج؟"
    );

    if (!confirmed) {
        return;
    }

    // حذف جلسة الدخول بالكامل
    localStorage.removeItem(
        'schoolLoggedIn'
    );

    localStorage.removeItem(
        'schoolSection'
    );

    // العودة إلى صفحة تسجيل الدخول
    window.location.href = 'index.html';
}


