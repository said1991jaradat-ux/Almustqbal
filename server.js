const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();


/* =========================
   CORS
========================= */

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.options('*', cors());

app.use(express.json());


/* =========================
   MongoDB
========================= */

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {

    console.error(
        'خطأ: MONGO_URI غير موجود في Environment Variables'
    );

} else {

    mongoose.connect(MONGO_URI)
        .then(() => {

            console.log(
                'تم الاتصال بنجاح بـ MongoDB Atlas'
            );

        })
        .catch(error => {

            console.error(
                'خطأ في الاتصال بقاعدة البيانات:',
                error
            );

        });

}


/* =========================
   الصفحة الرئيسية
========================= */

app.get('/', (req, res) => {

    res.json({

        status: 'ok',

        message: 'السيرفر شغال بنجاح'

    });

});


/* ==================================================
   RECORDS SCHEMA
================================================== */

const recordSchema = new mongoose.Schema({

    type: {
        type: String,
        required: true
    },

    studentName: {
        type: String,
        required: true
    },

    grade: {
        type: String,
        default: ''
    },

    section: {
        type: String,
        default: ''
    },

    time: {
        type: String,
        default: ''
    },

    date: {
        type: String,
        default: ''
    },

    details: {
        type: String,
        default: ''
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});


const Record =
    mongoose.model('Record', recordSchema);


/* ==================================================
   GET RECORDS
================================================== */

app.get('/api/records', async (req, res) => {

    try {

        const records =
            await Record
                .find()
                .sort({
                    createdAt: -1
                });

        res.json(records);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                'حدث خطأ أثناء جلب السجلات'

        });

    }

});


/* ==================================================
   ADD RECORD
================================================== */

app.post('/api/records', async (req, res) => {

    try {

        const record =
            new Record({

                type: req.body.type,

                studentName:
                    req.body.studentName,

                grade:
                    req.body.grade,

                section:
                    req.body.section,

                time:
                    req.body.time,

                date:
                    req.body.date,

                details:
                    req.body.details,

                createdAt:
                    new Date()

            });


        const savedRecord =
            await record.save();


        res.status(201).json({

            success: true,

            record: savedRecord

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                'حدث خطأ أثناء حفظ السجل'

        });

    }

});


/* ==================================================
   DELETE RECORD
================================================== */

app.delete('/api/records/:id', async (req, res) => {

    try {

        const deleted =
            await Record.findByIdAndDelete(
                req.params.id
            );


        if (!deleted) {

            return res.status(404).json({

                success: false,

                message:
                    'السجل غير موجود'

            });

        }


        res.json({

            success: true,

            message:
                'تم حذف السجل'

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                'حدث خطأ أثناء حذف السجل'

        });

    }

});


/* ==================================================
   SETTINGS
================================================== */

const settingSchema =
    new mongoose.Schema({

        key: {
            type: String,
            unique: true,
            required: true
        },

        value: {
            type: String,
            required: true
        }

    });


const Setting =
    mongoose.model('Setting', settingSchema);


/* ==================================================
   PASSWORD SETTINGS
================================================== */

const DEFAULT_PASSWORD = '1234';


/* ==================================================
   GET CURRENT PASSWORD
================================================== */

async function getCurrentPassword() {

    let setting =
        await Setting.findOne({

            key: 'loginPassword'

        });


    if (!setting) {

        setting =
            await Setting.create({

                key: 'loginPassword',

                value:
                    DEFAULT_PASSWORD

            });

    }


    return setting.value;

}


/* ==================================================
   SET NEW PASSWORD
================================================== */

async function setCurrentPassword(
    newPassword
) {

    await Setting.findOneAndUpdate(

        {
            key: 'loginPassword'
        },

        {
            key: 'loginPassword',

            value:
                newPassword

        },

        {
            upsert: true,

            new: true
        }

    );

}


/* ==================================================
   LOGIN
================================================== */

app.post('/api/login', async (req, res) => {

    try {

        const password =
            String(
                req.body.password || ''
            ).trim();


        const currentPassword =
            await getCurrentPassword();


        if (
            password &&
            password === currentPassword
        ) {

            return res.json({

                success: true,

                message:
                    'تم تسجيل الدخول بنجاح'

            });

        }


        return res.status(401).json({

            success: false,

            message:
                'كلمة السر غير صحيحة'

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                'حدث خطأ أثناء تسجيل الدخول'

        });

    }

});


/* ==================================================
   FORGOT PASSWORD
   EmailJS يقوم بإرسال البريد من الواجهة الأمامية
================================================== */

app.post(
    '/api/forgot-password',
    async (req, res) => {

        try {

            const newPassword =
                Math.floor(
                    1000 +
                    Math.random() * 9000
                ).toString();


            await setCurrentPassword(
                newPassword
            );


            console.log(
                'تم إنشاء كلمة مرور جديدة'
            );


            res.json({

                success: true,

                password:
                    newPassword

            });

        } catch (error) {

            console.error(
                'Forgot password error:',
                error
            );


            res.status(500).json({

                success: false,

                message:
                    'تعذر إنشاء كلمة المرور الجديدة.'

            });

        }

    }
);


/* ==================================================
   SERVER
================================================== */

const PORT =
    process.env.PORT || 3000;


app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});
