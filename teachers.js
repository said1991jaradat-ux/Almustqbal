/* =========================================================
   TEACHERS MANAGEMENT
   MongoDB Version
   Compatible with server.js
========================================================= */


/* =========================================================
   API
========================================================= */

const TEACHERS_API_URL =
    'https://almustqbal.onrender.com/api/teachers';


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
   GENERAL HELPERS
========================================================= */

function getValue(id) {

    const element =
        document.getElementById(id);

    return element
        ? element.value.trim()
        : '';

}


function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.value =
            value ?? '';

    }

}


function escapeHtml(value) {

    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


function getCurrentDateTime() {

    const now =
        new Date();

    return {

        date:
            now.toLocaleDateString(
                'en-CA',
                {
                    timeZone:
                        'Asia/Gaza'
                }
            ),

        time:
            now.toLocaleTimeString(
                'ar-PS',
                {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone:
                        'Asia/Gaza'
                }
            )

    };

}


/* =========================================================
   API HELPER
========================================================= */

async function apiRequest(
    url,
    options = {}
) {

    try {

        const response =
            await fetch(
                url,
                options
            );


        let result = null;

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';


        if (
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

    } catch (error) {

        console.error(
            'Teachers API Error:',
            error
        );

        throw error;

    }

}


/* =========================================================
   NORMALIZE RECORD
========================================================= */

function normalizeTeacherRecord(
    record
) {

    if (!record) {

        return null;

    }


    const data =
        record.data &&
        typeof record.data === 'object'

            ? record.data

            : {};


    return {

        id:
            record._id ||
            record.id ||
            '',

        type:
            record.type ||
            '',

        ...data,

        createdAt:
            record.createdAt ||
            data.createdAt ||
            '',

        updatedAt:
            record.updatedAt ||
            data.updatedAt ||
            ''

    };

}


/* =========================================================
   ARRAY BY TYPE
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
   LOAD DATA FROM MONGODB
========================================================= */

async function loadData() {

    try {

        const result =
            await apiRequest(
                TEACHERS_API_URL
            );


        const records =
            Array.isArray(result)

                ? result

                : (
                    Array.isArray(
                        result?.records
                    )

                        ? result.records

                        : []
                );


        teachersData = {

            absence: [],

            written: [],

            committees: [],

            tardiness: [],

            duty: [],

            notes: []

        };


        records.forEach(
            record => {

                const item =
                    normalizeTeacherRecord(
                        record
                    );


                if (!item) {

                    return;

                }


                const arrayName =
                    getArrayName(
                        item.type
                    );


                if (
                    arrayName &&
                    teachersData[arrayName]
                ) {

                    teachersData[
                        arrayName
                    ].push(item);

                }

            }
        );


        console.log(
            'تم تحميل بيانات المعلمين من MongoDB:',
            teachersData
        );


        return true;

    } catch (error) {

        console.error(
            'تعذر تحميل بيانات المعلمين:',
            error
        );


        teachersData = {

            absence: [],

            written: [],

            committees: [],

            tardiness: [],

            duty: [],

            notes: []

        };


        alert(
            'تعذر الاتصال بقاعدة بيانات المعلمين.\n\n' +
            'تأكد من اتصال السيرفر بـ MongoDB ثم أعد تحميل الصفحة.'
        );


        return false;

    }

}


/* =========================================================
   SAVE TO MONGODB
========================================================= */

async function createTeacherRecord(
    type,
    data
) {

    const result =
        await apiRequest(
            TEACHERS_API_URL,
            {

                method:
                    'POST',

                headers: {

                    'Content-Type':
                        'application/json'

                },

                body:
                    JSON.stringify({

                        type:
                            type,

                        data:
                            data

                    })

            }
        );


    return normalizeTeacherRecord(
        result?.record ||
        result?.data ||
        result
    );

}


/* =========================================================
   UPDATE MONGODB
========================================================= */

async function updateTeacherRecord(
    id,
    data
) {

    const result =
        await apiRequest(

            `${TEACHERS_API_URL}/${encodeURIComponent(id)}`,

            {

                method:
                    'PUT',

                headers: {

                    'Content-Type':
                        'application/json'

                },

                body:
                    JSON.stringify({

                        data:
                            data

                    })

            }

        );


    return normalizeTeacherRecord(
        result?.record ||
        result?.data ||
        result
    );

}


/* =========================================================
   DELETE FROM MONGODB
========================================================= */

async function deleteTeacherRecord(
    id
) {

    return await apiRequest(

        `${TEACHERS_API_URL}/${encodeURIComponent(id)}`,

        {

            method:
                'DELETE'

        }

    );

}


/* =========================================================
   ADD / UPDATE ABSENCE
========================================================= */

async function saveAbsence(event) {

    if (event) {

        event.preventDefault();

    }


    const name =
        getValue(
            'absence-name'
        );

    const date =
        getValue(
            'absence-date'
        );

    const reason =
        getValue(
            'absence-reason'
        );

    const formStatus =
        getValue(
            'absence-form-status'
        );

    const editId =
        getValue(
            'absence-edit-id'
        );


    if (!name) {

        alert(
            'يرجى إدخال اسم المعلم'
        );

        return;

    }


    if (!date) {

        alert(
            'يرجى اختيار التاريخ'
        );

        return;

    }


    const now =
        getCurrentDateTime();


    const data = {

        name:
            name,

        date:
            date,

        reason:
            reason,

        formStatus:
            formStatus,

        recordedDate:
            now.date,

        recordedTime:
            now.time

    };


    try {

        if (editId) {

            const updated =
                await updateTeacherRecord(
                    editId,
                    data
                );


            const index =
                teachersData.absence.findIndex(
                    item =>
                        item.id === editId
                );


            if (index !== -1) {

                teachersData.absence[
                    index
                ] = updated;

            }


            alert(
                'تم تعديل سجل الغياب بنجاح'
            );

        } else {

            const saved =
                await createTeacherRecord(
                    'absence',
                    data
                );


            teachersData.absence.unshift(
                saved
            );


            alert(
                'تم حفظ غياب المعلم في MongoDB بنجاح'
            );

        }


        renderAbsence();

        updateDashboard();

        resetForm(
            'absence'
        );

    } catch (error) {

        alert(
            'تعذر حفظ سجل غياب المعلم.\n\n' +
            error.message
        );

    }

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


    setValue(
        'absence-edit-id',
        item.id
    );

    setValue(
        'absence-name',
        item.name
    );

    setValue(
        'absence-date',
        item.date
    );

    setValue(
        'absence-reason',
        item.reason
    );

    setValue(
        'absence-form-status',
        item.formStatus
    );


    const button =
        document.getElementById(
            'absence-btn'
        );


    if (button) {

        button.textContent =
            'تعديل السجل';

    }

}


/* =========================================================
   ADD / UPDATE WRITTEN
========================================================= */

async function saveWritten(event) {

    if (event) {

        event.preventDefault();

    }


    const name =
        getValue(
            'written-name'
        );

    const type =
        getValue(
            'written-type'
        );

    const date =
        getValue(
            'written-date'
        );

    const editId =
        getValue(
            'written-edit-id'
        );


    if (!name) {

        alert(
            'يرجى إدخال اسم المعلم'
        );

        return;

    }


    const now =
        getCurrentDateTime();


    const data = {

        name:
            name,

        title:
            type,

        date:
            date,

        recordedDate:
            now.date,

        recordedTime:
            now.time

    };


    try {

        if (editId) {

            const updated =
                await updateTeacherRecord(
                    editId,
                    data
                );


            const index =
                teachersData.written.findIndex(
                    item =>
                        item.id === editId
                );


            if (index !== -1) {

                teachersData.written[
                    index
                ] = updated;

            }


            alert(
                'تم تعديل العمل الكتابي بنجاح'
            );

        } else {

            const saved =
                await createTeacherRecord(
                    'written',
                    data
                );


            teachersData.written.unshift(
                saved
            );


            alert(
                'تم حفظ العمل الكتابي في MongoDB بنجاح'
            );

        }


        renderWritten();

        updateDashboard();

        resetForm(
            'written'
        );

    } catch (error) {

        alert(
            'تعذر حفظ العمل الكتابي.\n\n' +
            error.message
        );

    }

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


    setValue(
        'written-edit-id',
        item.id
    );

    setValue(
        'written-name',
        item.name
    );

    setValue(
        'written-type',
        item.title
    );

    setValue(
        'written-date',
        item.date
    );


    const button =
        document.getElementById(
            'written-btn'
        );


    if (button) {

        button.textContent =
            'تعديل السجل';

    }

}


/* =========================================================
   ADD / UPDATE COMMITTEE
========================================================= */

async function saveCommittee(event) {

    if (event) {

        event.preventDefault();

    }


    const name =
        getValue(
            'committee-name'
        );

    const title =
        getValue(
            'committee-title'
        );

    const officialBook =
        getValue(
            'committee-official-book'
        );

    const assignedWork =
        getValue(
            'committee-assigned-work'
        );

    const dueDate =
        getValue(
            'committee-due-date'
        );

    const status =
        getValue(
            'committee-status'
        );

    const note =
        getValue(
            'committee-note'
        );

    const editId =
        getValue(
            'committee-edit-id'
        );


    if (!title) {

        alert(
            'يرجى إدخال اسم اللجنة'
        );

        return;

    }


    if (!name) {

        alert(
            'يرجى إدخال اسم المعلم'
        );

        return;

    }


    if (!assignedWork) {

        alert(
            'يرجى إدخال العمل المكلف فيه'
        );

        return;

    }


    if (!dueDate) {

        alert(
            'يرجى اختيار تاريخ التسليم'
        );

        return;

    }


    const now =
        getCurrentDateTime();


    const data = {

        /*
         * الحقول الجديدة
         */

        name:
            name,

        title:
            title,

        officialBook:
            officialBook,

        assignedWork:
            assignedWork,

        dueDate:
            dueDate,

        status:
            status,

        note:
            note,

        /*
         * وقت تسجيل السجل
         */

        recordedDate:
            now.date,

        recordedTime:
            now.time

    };


    try {

        if (editId) {

            const updated =
                await updateTeacherRecord(
                    editId,
                    data
                );


            const index =
                teachersData.committees.findIndex(
                    item =>
                        item.id === editId
                );


            if (index !== -1) {

                teachersData.committees[
                    index
                ] = updated;

            }


            alert(
                'تم تعديل عمل اللجنة بنجاح'
            );

        } else {

            const saved =
                await createTeacherRecord(
                    'committee',
                    data
                );


            teachersData.committees.unshift(
                saved
            );


            alert(
                'تم حفظ عمل اللجنة في MongoDB بنجاح'
            );

        }


        renderCommittees();

        updateDashboard();

        resetForm(
            'committee'
        );

    } catch (error) {

        alert(
            'تعذر حفظ عمل اللجنة.\n\n' +
            error.message
        );

    }

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


    setValue(
        'committee-edit-id',
        item.id
    );


    setValue(
        'committee-name',
        item.name
    );


    setValue(
        'committee-title',
        item.title
    );


    /*
     * دعم السجلات الجديدة
     */

    setValue(
        'committee-official-book',
        item.officialBook
    );


    setValue(
        'committee-assigned-work',
        item.assignedWork
    );


    setValue(
        'committee-due-date',
        item.dueDate
    );


    setValue(
        'committee-status',
        item.status
    );


    setValue(
        'committee-note',
        item.note
    );


    const button =
        document.getElementById(
            'committee-btn'
        );


    if (button) {

        button.textContent =
            'تعديل عمل اللجنة';

    }

}


/* =========================================================
   ADD / UPDATE TARDINESS
========================================================= */

async function saveTardiness(event) {

    if (event) {

        event.preventDefault();

    }


    const name =
        getValue(
            'tardiness-name'
        );

    const time =
        getValue(
            'tardiness-time'
        );

    const note =
        getValue(
            'tardiness-note'
        );

    const date =
        getValue(
            'tardiness-date'
        );

    const editId =
        getValue(
            'tardiness-edit-id'
        );


    if (!name) {

        alert(
            'يرجى إدخال اسم المعلم'
        );

        return;

    }


    const now =
        getCurrentDateTime();


    const data = {

        name:
            name,

        time:
            time,

        note:
            note,

        date:
            date,

        recordedDate:
            now.date,

        recordedTime:
            now.time

    };


    try {

        if (editId) {

            const updated =
                await updateTeacherRecord(
                    editId,
                    data
                );


            const index =
                teachersData.tardiness.findIndex(
                    item =>
                        item.id === editId
                );


            if (index !== -1) {

                teachersData.tardiness[
                    index
                ] = updated;

            }


            alert(
                'تم تعديل سجل التأخير بنجاح'
            );

        } else {

            const saved =
                await createTeacherRecord(
                    'tardiness',
                    data
                );


            teachersData.tardiness.unshift(
                saved
            );


            alert(
                'تم حفظ سجل التأخير في MongoDB بنجاح'
            );

        }


        renderTardiness();

        updateDashboard();

        resetForm(
            'tardiness'
        );

    } catch (error) {

        alert(
            'تعذر حفظ سجل التأخير.\n\n' +
            error.message
        );

    }

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


    setValue(
        'tardiness-edit-id',
        item.id
    );

    setValue(
        'tardiness-name',
        item.name
    );

    setValue(
        'tardiness-time',
        item.time
    );

    setValue(
        'tardiness-note',
        item.note
    );

    setValue(
        'tardiness-date',
        item.date
    );


    const button =
        document.getElementById(
            'tardiness-btn'
        );


    if (button) {

        button.textContent =
            'تعديل السجل';

    }

}


/* =========================================================
   ADD / UPDATE DUTY
========================================================= */

async function saveDuty(event) {

    if (event) {

        event.preventDefault();

    }


    const name =
        getValue(
            'duty-name'
        );

    const status =
        getValue(
            'duty-status'
        );

    const note =
        getValue(
            'duty-note'
        );

    const date =
        getValue(
            'duty-date'
        );

    const editId =
        getValue(
            'duty-edit-id'
        );


    if (!name) {

        alert(
            'يرجى إدخال اسم المعلم'
        );

        return;

    }


    const now =
        getCurrentDateTime();


    const data = {

        name:
            name,

        status:
            status,

        note:
            note,

        date:
            date,

        recordedDate:
            now.date,

        recordedTime:
            now.time

    };


    try {

        if (editId) {

            const updated =
                await updateTeacherRecord(
                    editId,
                    data
                );


            const index =
                teachersData.duty.findIndex(
                    item =>
                        item.id === editId
                );


            if (index !== -1) {

                teachersData.duty[
                    index
                ] = updated;

            }


            alert(
                'تم تعديل سجل المناوبة بنجاح'
            );

        } else {

            const saved =
                await createTeacherRecord(
                    'duty',
                    data
                );


            teachersData.duty.unshift(
                saved
            );


            alert(
                'تم حفظ سجل المناوبة في MongoDB بنجاح'
            );

        }


        renderDuty();

        updateDashboard();

        resetForm(
            'duty'
        );

    } catch (error) {

        alert(
            'تعذر حفظ سجل المناوبة.\n\n' +
            error.message
        );

    }

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


    setValue(
        'duty-edit-id',
        item.id
    );

    setValue(
        'duty-name',
        item.name
    );

    setValue(
        'duty-status',
        item.status
    );

    setValue(
        'duty-note',
        item.note
    );

    setValue(
        'duty-date',
        item.date
    );


    const button =
        document.getElementById(
            'duty-btn'
        );


    if (button) {

        button.textContent =
            'تعديل السجل';

    }

}


/* =========================================================
   ADD / UPDATE NOTES
========================================================= */

async function saveNotes(event) {

    if (event) {

        event.preventDefault();

    }


    const name =
        getValue(
            'notes-name'
        );

    const date =
        getValue(
            'notes-date'
        );

    const text =
        getValue(
            'notes-text'
        );

    const editId =
        getValue(
            'notes-edit-id'
        );


    if (!name) {

        alert(
            'يرجى إدخال اسم المعلم'
        );

        return;

    }


    if (!text) {

        alert(
            'يرجى إدخال الملاحظة'
        );

        return;

    }


    const now =
        getCurrentDateTime();


    const data = {

        name:
            name,

        date:
            date,

        text:
            text,

        recordedDate:
            now.date,

        recordedTime:
            now.time

    };


    try {

        if (editId) {

            const updated =
                await updateTeacherRecord(
                    editId,
                    data
                );


            const index =
                teachersData.notes.findIndex(
                    item =>
                        item.id === editId
                );


            if (index !== -1) {

                teachersData.notes[
                    index
                ] = updated;

            }


            alert(
                'تم تعديل الملاحظة بنجاح'
            );

        } else {

            const saved =
                await createTeacherRecord(
                    'notes',
                    data
                );


            teachersData.notes.unshift(
                saved
            );


            alert(
                'تم حفظ الملاحظة في MongoDB بنجاح'
            );

        }


        renderNotes();

        updateDashboard();

        resetForm(
            'notes'
        );

    } catch (error) {

        alert(
            'تعذر حفظ الملاحظة.\n\n' +
            error.message
        );

    }

}


/* =========================================================
   EDIT NOTES
========================================================= */

function editNotes(id) {

    const item =
        teachersData.notes.find(
            record =>
                record.id === id
        );


    if (!item) {

        return;

    }


    setValue(
        'notes-edit-id',
        item.id
    );

    setValue(
        'notes-name',
        item.name
    );

    setValue(
        'notes-date',
        item.date
    );

    setValue(
        'notes-text',
        item.text
    );


    const button =
        document.getElementById(
            'notes-btn'
        );


    if (button) {

        button.textContent =
            'تعديل الملاحظة';

    }

}


/* =========================================================
   DELETE RECORD
========================================================= */

async function deleteRecord(
    type,
    id
) {

    if (!id) {

        return;

    }


    const confirmed =
        confirm(
            'هل أنت متأكد من حذف هذا السجل؟'
        );


    if (!confirmed) {

        return;

    }


    try {

        await deleteTeacherRecord(
            id
        );


        const arrayName =
            getArrayName(
                type
            );


        if (
            arrayName &&
            teachersData[arrayName]
        ) {

            teachersData[arrayName] =
                teachersData[
                    arrayName
                ].filter(
                    item =>
                        item.id !== id
                );

        }


        renderAll();


        alert(
            'تم حذف السجل بنجاح'
        );

    } catch (error) {

        alert(
            'تعذر حذف السجل.\n\n' +
            error.message
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
                    لا توجد سجلات
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        teachersData.absence
            .map(
                (item) => `

                <tr>

                    <td>
                        ${escapeHtml(item.name)}
                    </td>

                    <td>
                        ${escapeHtml(item.date)}
                    </td>

                    <td>
                        ${escapeHtml(item.reason)}
                    </td>

                    <td>
                        ${escapeHtml(item.formStatus)}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="editAbsence('${item.id}')"
                        >
                            تعديل
                        </button>

                        <button
                            type="button"
                            onclick="deleteRecord('absence','${item.id}')"
                        >
                            حذف
                        </button>

                    </td>

                </tr>

            `
            )
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
                    لا توجد سجلات
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        teachersData.written
            .map(
                (item) => `

                <tr>

                    <td>
                        ${escapeHtml(item.name)}
                    </td>

                    <td>
                        ${escapeHtml(item.title)}
                    </td>

                    <td>
                        ${escapeHtml(item.date)}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="editWritten('${item.id}')"
                        >
                            تعديل
                        </button>

                        <button
                            type="button"
                            onclick="deleteRecord('written','${item.id}')"
                        >
                            حذف
                        </button>

                    </td>

                </tr>

            `
            )
            .join('');

}


/* =========================================================
   RENDER COMMITTEES
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
                <td colspan="8">
                    لا توجد سجلات
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        teachersData.committees
            .map(
                item => `

                <tr>

                    <!-- اسم اللجنة -->

                    <td>
                        ${escapeHtml(item.title || '')}
                    </td>


                    <!-- اسم المعلم -->

                    <td>
                        ${escapeHtml(item.name || '')}
                    </td>


                    <!-- الكتاب الرسمي -->

                    <td>
                        ${escapeHtml(item.officialBook || '')}
                    </td>


                    <!-- العمل المكلف -->

                    <td>
                        ${escapeHtml(item.assignedWork || '')}
                    </td>


                    <!-- تاريخ التسليم -->

                    <td>
                        ${escapeHtml(item.dueDate || '')}
                    </td>


                    <!-- الحالة -->

                    <td>
                        ${escapeHtml(item.status || '')}
                    </td>


                    <!-- الملاحظات -->

                    <td>
                        ${escapeHtml(item.note || '')}
                    </td>


                    <!-- الإجراءات -->

                    <td>

                        <button
                            type="button"
                            onclick="editCommittee('${item.id}')"
                        >
                            تعديل
                        </button>

                        <button
                            type="button"
                            onclick="deleteRecord('committee','${item.id}')"
                        >
                            حذف
                        </button>

                    </td>

                </tr>

            `
            )
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
                    لا توجد سجلات
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        teachersData.tardiness
            .map(
                (item) => `

                <tr>

                    <td>
                        ${escapeHtml(item.name)}
                    </td>

                    <td>
                        ${escapeHtml(item.date)}
                    </td>

                    <td>
                        ${escapeHtml(item.time)}
                    </td>

                    <td>
                        ${escapeHtml(item.note)}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="editTardiness('${item.id}')"
                        >
                            تعديل
                        </button>

                        <button
                            type="button"
                            onclick="deleteRecord('tardiness','${item.id}')"
                        >
                            حذف
                        </button>

                    </td>

                </tr>

            `
            )
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
                    لا توجد سجلات
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        teachersData.duty
            .map(
                (item) => `

                <tr>

                    <td>
                        ${escapeHtml(item.name)}
                    </td>

                    <td>
                        ${escapeHtml(item.date)}
                    </td>

                    <td>
                        ${escapeHtml(item.status)}
                    </td>

                    <td>
                        ${escapeHtml(item.note)}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="editDuty('${item.id}')"
                        >
                            تعديل
                        </button>

                        <button
                            type="button"
                            onclick="deleteRecord('duty','${item.id}')"
                        >
                            حذف
                        </button>

                    </td>

                </tr>

            `
            )
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
                    لا توجد سجلات
                </td>
            </tr>
        `;

        return;

    }


    tbody.innerHTML =
        teachersData.notes
            .map(
                (item) => `

                <tr>

                    <td>
                        ${escapeHtml(item.name)}
                    </td>

                    <td>
                        ${escapeHtml(item.date)}
                    </td>

                    <td>
                        ${escapeHtml(item.text)}
                    </td>

                    <td>

                        <button
                            type="button"
                            onclick="editNotes('${item.id}')"
                        >
                            تعديل
                        </button>

                        <button
                            type="button"
                            onclick="deleteRecord('notes','${item.id}')"
                        >
                            حذف
                        </button>

                    </td>

                </tr>

            `
            )
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

}


/* =========================================================
   RESET FORM
========================================================= */

function resetForm(
    type
) {

    let formId = '';

    let editId = '';

    let buttonId = '';


    switch (type) {

        case 'absence':

            formId =
                'absence-form';

            editId =
                'absence-edit-id';

            buttonId =
                'absence-btn';

            break;


        case 'written':

            formId =
                'written-form';

            editId =
                'written-edit-id';

            buttonId =
                'written-btn';

            break;


        case 'committee':

            formId =
                'committees-form';

            editId =
                'committee-edit-id';

            buttonId =
                'committee-btn';

            break;


        case 'tardiness':

            formId =
                'tardiness-form';

            editId =
                'tardiness-edit-id';

            buttonId =
                'tardiness-btn';

            break;


        case 'duty':

            formId =
                'duty-form';

            editId =
                'duty-edit-id';

            buttonId =
                'duty-btn';

            break;


        case 'notes':

            formId =
                'notes-form';

            editId =
                'notes-edit-id';

            buttonId =
                'notes-btn';

            break;

    }


    const form =
        document.getElementById(
            formId
        );


    if (form) {

        form.reset();

    }


    const edit =
        document.getElementById(
            editId
        );


    if (edit) {

        edit.value = '';

    }


    const button =
        document.getElementById(
            buttonId
        );


    if (button) {

        if (
            type === 'notes'
        ) {

            button.textContent =
                'حفظ الملاحظة';

        } else if (
            type === 'committee'
        ) {

            button.textContent =
                'حفظ عمل اللجنة';

        } else {

            button.textContent =
                'حفظ';

        }

    }


    /*
     * إعادة تاريخ اللجنة إلى تاريخ اليوم
     */

    if (type === 'committee') {

        const field =
            document.getElementById(
                'committee-due-date'
            );

        if (field) {

            field.value =
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
   TAB SWITCHING
========================================================= */

function switchTab(tabName) {

    document
        .querySelectorAll('.tab-content')
        .forEach(tab => {

            tab.classList.remove('active');

        });


    document
        .querySelectorAll('.nav-btn')
        .forEach(button => {

            button.classList.remove('active');

        });


    const target =
        document.getElementById(
            `tab-${tabName}`
        );


    if (target) {

        target.classList.add('active');

    }


    const buttons =
        document.querySelectorAll(
            '.nav-btn'
        );


    buttons.forEach(button => {

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

    const absence =
        teachersData.absence.length;


    const written =
        teachersData.written.length;


    const tardiness =
        teachersData.tardiness.length;


    const issues =
        teachersData.committees.length +
        teachersData.duty.length +
        teachersData.notes.length;


    const statAbsence =
        document.getElementById(
            'stat-absence'
        );


    const statWritten =
        document.getElementById(
            'stat-written'
        );


    const statTardiness =
        document.getElementById(
            'stat-tardiness'
        );


    const statIssues =
        document.getElementById(
            'stat-issues'
        );


    if (statAbsence) {

        statAbsence.textContent =
            absence;

    }


    if (statWritten) {

        statWritten.textContent =
            written;

    }


    if (statTardiness) {

        statTardiness.textContent =
            tardiness;

    }


    if (statIssues) {

        statIssues.textContent =
            issues;

    }


    if (
        typeof Chart ===
        'undefined'
    ) {

        return;

    }


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

                    type:
                        'doughnut',

                    data: {

                        labels: [
                            'غياب',
                            'بدون غياب'
                        ],

                        datasets: [{

                            data: [

                                absence,

                                Math.max(
                                    0,
                                    1
                                )

                            ]

                        }]

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false

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

                    type:
                        'doughnut',

                    data: {

                        labels: [
                            'أعمال كتابية',
                            'أخرى'
                        ],

                        datasets: [{

                            data: [

                                written,

                                Math.max(
                                    0,
                                    1
                                )

                            ]

                        }]

                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false

                    }

                }

            );

    }

}


/* =========================================================
   EXPORT DATA
========================================================= */

function exportData() {

    const data =
        JSON.stringify(
            teachersData,
            null,
            2
        );


    const blob =
        new Blob(
            [data],
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
        'teachers-management-backup.json';


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();

    URL.revokeObjectURL(
        url
    );

}


/* =========================================================
   IMPORT BUTTON
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


/* =========================================================
   IMPORT DATA
========================================================= */

async function importData(
    event
) {

    const file =
        event?.target?.files?.[0];


    if (!file) {

        return;

    }


    try {

        const text =
            await file.text();


        const imported =
            JSON.parse(
                text
            );


        const arrays = {

            absence:
                Array.isArray(
                    imported.absence
                )
                    ? imported.absence
                    : [],

            written:
                Array.isArray(
                    imported.written
                )
                    ? imported.written
                    : [],

            committees:
                Array.isArray(
                    imported.committees
                )
                    ? imported.committees
                    : [],

            tardiness:
                Array.isArray(
                    imported.tardiness
                )
                    ? imported.tardiness
                    : [],

            duty:
                Array.isArray(
                    imported.duty
                )
                    ? imported.duty
                    : [],

            notes:
                Array.isArray(
                    imported.notes
                )
                    ? imported.notes
                    : []

        };


        const total =
            arrays.absence.length +
            arrays.written.length +
            arrays.committees.length +
            arrays.tardiness.length +
            arrays.duty.length +
            arrays.notes.length;


        if (total === 0) {

            alert(
                'ملف الاستيراد لا يحتوي على بيانات.'
            );

            return;

        }


        const confirmed =
            confirm(
                `سيتم استيراد ${total} سجل إلى قاعدة بيانات المعلمين.\n\n` +
                'سيتم إضافة السجلات الجديدة دون حذف السجلات الحالية.\n\n' +
                'هل تريد المتابعة؟'
            );


        if (!confirmed) {

            return;

        }


        const groups = [

            {
                type:
                    'absence',

                records:
                    arrays.absence
            },

            {
                type:
                    'written',

                records:
                    arrays.written
            },

            {
                type:
                    'committee',

                records:
                    arrays.committees
            },

            {
                type:
                    'tardiness',

                records:
                    arrays.tardiness
            },

            {
                type:
                    'duty',

                records:
                    arrays.duty
            },

            {
                type:
                    'notes',

                records:
                    arrays.notes
            }

        ];


        let importedCount =
            0;


        for (
            const group
            of groups
        ) {

            for (
                const item
                of group.records
            ) {

                const data =
                    {
                        ...item
                    };


                delete data.id;

                delete data._id;

                delete data.type;

                delete data.createdAt;

                delete data.updatedAt;


                /*
                 * دعم السجلات القديمة والجديدة
                 *
                 * لا نحذف أي حقل من بيانات اللجنة.
                 */

                await createTeacherRecord(
                    group.type,
                    data
                );


                importedCount++;

            }

        }


        await loadData();

        renderAll();


        alert(
            `تم استيراد ${importedCount} سجل بنجاح إلى MongoDB.`
        );


    } catch (error) {

        console.error(
            'Import error:',
            error
        );


        alert(
            'تعذر استيراد البيانات.\n\n' +
            error.message
        );

    }


    if (event?.target) {

        event.target.value =
            '';

    }

}


/* =========================================================
   PRINT REPORT
========================================================= */

function printTeachersReport() {

    const now =
        new Date();


    const reportDate =
        now.toLocaleDateString(
            'ar-PS',
            {
                year:
                    'numeric',

                month:
                    'long',

                day:
                    'numeric',

                timeZone:
                    'Asia/Gaza'
            }
        );


    const section =
        (
            title,
            headers,
            rows
        ) => {

            if (
                !rows ||
                rows.length === 0
            ) {

                return `
                    <section>
                        <h2>${title}</h2>
                        <p>لا توجد سجلات.</p>
                    </section>
                `;

            }


            return `

                <section>

                    <h2>
                        ${title}
                    </h2>

                    <table>

                        <thead>

                            <tr>

                                ${headers
                                    .map(
                                        header =>
                                            `<th>${header}</th>`
                                    )
                                    .join('')
                                }

                            </tr>

                        </thead>

                        <tbody>

                            ${rows.join('')}

                        </tbody>

                    </table>

                </section>

            `;

        };


    const absenceRows =
        teachersData.absence.map(
            (item, index) => `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHtml(item.name)}
                    </td>

                    <td>
                        ${escapeHtml(item.date)}
                    </td>

                    <td>
                        ${escapeHtml(item.reason)}
                    </td>

                    <td>
                        ${escapeHtml(item.formStatus)}
                    </td>

                </tr>

            `
        );


    const writtenRows =
        teachersData.written.map(
            (item, index) => `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHtml(item.name)}
                    </td>

                    <td>
                        ${escapeHtml(item.title)}
                    </td>

                    <td>
                        ${escapeHtml(item.date)}
                    </td>

                </tr>

            `
        );


    /*
     * تقرير أعمال اللجان الجديد
     */

    const committeeRows =
        teachersData.committees.map(
            (item, index) => `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHtml(item.title || '')}
                    </td>

                    <td>
                        ${escapeHtml(item.name || '')}
                    </td>

                    <td>
                        ${escapeHtml(item.officialBook || '')}
                    </td>

                    <td>
                        ${escapeHtml(item.assignedWork || '')}
                    </td>

                    <td>
                        ${escapeHtml(item.dueDate || '')}
                    </td>

                    <td>
                        ${escapeHtml(item.status || '')}
                    </td>

                    <td>
                        ${escapeHtml(item.note || '')}
                    </td>

                </tr>

            `
        );


    const tardinessRows =
        teachersData.tardiness.map(
            (item, index) => `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHtml(item.name)}
                    </td>

                    <td>
                        ${escapeHtml(item.time)}
                    </td>

                    <td>
                        ${escapeHtml(item.date)}
                    </td>

                    <td>
                        ${escapeHtml(item.note)}
                    </td>

                </tr>

            `
        );


    const dutyRows =
        teachersData.duty.map(
            (item, index) => `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHtml(item.name)}
                    </td>

                    <td>
                        ${escapeHtml(item.status)}
                    </td>

                    <td>
                        ${escapeHtml(item.date)}
                    </td>

                    <td>
                        ${escapeHtml(item.note)}
                    </td>

                </tr>

            `
        );


    const notesRows =
        teachersData.notes.map(
            (item, index) => `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHtml(item.name)}
                    </td>

                    <td>
                        ${escapeHtml(item.date)}
                    </td>

                    <td>
                        ${escapeHtml(item.text)}
                    </td>

                </tr>

            `
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

    body {

        font-family:
            Arial,
            Tahoma,
            sans-serif;

        direction:
            rtl;

        margin:
            30px;

        color:
            #222;

    }

    h1 {

        text-align:
            center;

        margin-bottom:
            5px;

    }

    .date {

        text-align:
            center;

        margin-bottom:
            30px;

        color:
            #666;

    }

    h2 {

        background:
            #f1f1f1;

        padding:
            10px;

        border-right:
            5px solid #333;

        margin-top:
            30px;

    }

    table {

        width:
            100%;

        border-collapse:
            collapse;

        margin-top:
            10px;

    }

    th,
    td {

        border:
            1px solid #aaa;

        padding:
            8px;

        text-align:
            center;

    }

    th {

        background:
            #eeeeee;

    }

    .summary {

        display:
            grid;

        grid-template-columns:
            repeat(4, 1fr);

        gap:
            10px;

        margin-bottom:
            20px;

    }

    .card {

        border:
            1px solid #ccc;

        padding:
            15px;

        text-align:
            center;

    }

    .number {

        font-size:
            25px;

        font-weight:
            bold;

    }

    @media print {

        body {

            margin:
                10mm;

        }

        h2 {

            break-after:
                avoid;

        }

        table {

            break-inside:
                auto;

        }

        tr {

            break-inside:
                avoid;

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

    ${escapeHtml(reportDate)}

</div>


<div class="summary">

    <div class="card">

        <div>
            الغياب
        </div>

        <div class="number">
            ${teachersData.absence.length}
        </div>

    </div>


    <div class="card">

        <div>
            الأعمال الكتابية
        </div>

        <div class="number">
            ${teachersData.written.length}
        </div>

    </div>


    <div class="card">

        <div>
            التأخير
        </div>

        <div class="number">
            ${teachersData.tardiness.length}
        </div>

    </div>


    <div class="card">

        <div>
            اللجان والملاحظات
        </div>

        <div class="number">

            ${
                teachersData.committees.length +
                teachersData.duty.length +
                teachersData.notes.length
            }

        </div>

    </div>

</div>


${section(
    'رصد غياب المعلمين',

    [
        '#',
        'اسم المعلم',
        'التاريخ',
        'السبب',
        'حالة النموذج'
    ],

    absenceRows
)}


${section(
    'الأعمال الكتابية',

    [
        '#',
        'اسم المعلم',
        'نوع العمل',
        'التاريخ'
    ],

    writtenRows
)}


${section(
    'أعمال اللجان',

    [
        '#',
        'اسم اللجنة',
        'اسم المعلم',
        'الكتاب الرسمي',
        'عمل مكلف فيه',
        'تاريخ التسليم',
        'الحالة',
        'ملاحظات'
    ],

    committeeRows
)}


${section(
    'الحضور والتأخير',

    [
        '#',
        'اسم المعلم',
        'وقت التأخير',
        'التاريخ',
        'ملاحظات'
    ],

    tardinessRows
)}


${section(
    'المناوبة اليومية',

    [
        '#',
        'اسم المعلم',
        'الحالة',
        'التاريخ',
        'ملاحظات'
    ],

    dutyRows
)}


${section(
    'الملاحظات الإدارية',

    [
        '#',
        'اسم المعلم',
        'التاريخ',
        'الملاحظة'
    ],

    notesRows
)}


<script>

    window.onload =
        function() {

            window.print();

        };

</script>

</body>

</html>

`;


    const printWindow =
        window.open(
            '',
            '_blank'
        );


    if (!printWindow) {

        alert(
            'يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.'
        );

        return;

    }


    printWindow.document.open();

    printWindow.document.write(
        html
    );

    printWindow.document.close();

}


/* =========================================================
   BACK TO SECTION SELECTION
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


/* =========================================================
   LOGOUT
========================================================= */

function teachersLogout() {

    localStorage.removeItem(
        'schoolLoggedIn'
    );


    localStorage.removeItem(
        'schoolSection'
    );


    window.location.href =
        'index.html';

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    async function() {

        console.log(
            'بدء تحميل نظام إدارة المعلمين...'
        );


        const loaded =
            await loadData();


        if (loaded) {

            renderAll();

        }


        /* =================================================
           IMPORT INPUT
        ================================================= */

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


        /* =================================================
           DEFAULT DATES
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


        console.log(
            'تم تشغيل نظام إدارة المعلمين'
        );

    }
);


/* =========================================================
   PREVENT OLD LOCAL SAVE SHORTCUT
========================================================= */

document.addEventListener(
    'keydown',
    function(event) {

        if (
            (
                event.ctrlKey ||
                event.metaKey
            ) &&
            event.key.toLowerCase() === 's'
        ) {

            /*
             * لا نستخدم localStorage للحفظ.
             * كل عملية حفظ تتم مباشرة في MongoDB.
             */

            event.preventDefault();

        }

    }
);
