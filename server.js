const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const app = express();

/* =========================================================
   CORS
========================================================= */

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

app.use(express.json());


/* =========================================================
   JWT AUTH
========================================================= */

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('خطأ فادح: JWT_SECRET غير موجود في Environment Variables. يجب ضبطه قبل التشغيل.');
}

function authMiddleware(req, res, next) {

    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'غير مصرح: يرجى تسجيل الدخول'
        });
    }

    try {
        jwt.verify(token, JWT_SECRET);
        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'الجلسة منتهية، يرجى تسجيل الدخول من جديد'
        });
    }
}


/* =========================================================
   RATE LIMITERS (تقليل محاولات التخمين على تسجيل الدخول)
========================================================= */

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 10,                  // 10 محاولات كحد أقصى لكل IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'محاولات كثيرة جداً، حاول مرة أخرى بعد قليل'
    }
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'محاولات كثيرة جداً، حاول مرة أخرى بعد قليل'
    }
});


/* =========================================================
   LIVE ONLINE USERS
========================================================= */

const onlineUsers = new Map();

const ONLINE_TIMEOUT = 60 * 1000;


/* إزالة المستخدمين غير النشطين */

function cleanupOnlineUsers() {

    const now = Date.now();

    for (const [clientId, lastSeen] of onlineUsers.entries()) {

        if (now - lastSeen > ONLINE_TIMEOUT) {
            onlineUsers.delete(clientId);
        }

    }

}


/* عدد المتصلين الحالي */

function getOnlineUsersCount() {

    cleanupOnlineUsers();

    return onlineUsers.size;

}


/* تنظيف دوري */

setInterval(
    cleanupOnlineUsers,
    15 * 1000
);


/* =========================================================
   HEARTBEAT
========================================================= */

app.post(
    '/api/presence/heartbeat',
    (req, res) => {

        try {

            const clientId =
                String(
                    req.body.clientId || ''
                ).trim();


            if (!clientId) {

                return res.status(400).json({

                    success: false,

                    message:
                        'clientId مطلوب'

                });

            }


            onlineUsers.set(
                clientId,
                Date.now()
            );


            return res.json({

                success: true,

                count:
                    getOnlineUsersCount()

            });

        } catch (error) {

            console.error(
                'Presence heartbeat error:',
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    'تعذر تحديث حالة الاتصال'

            });

        }

    }
);


/* =========================================================
   PRESENCE LOGOUT
========================================================= */

app.post(
    '/api/presence/logout',
    (req, res) => {

        try {

            const clientId =
                String(
                    req.body.clientId || ''
                ).trim();


            if (clientId) {

                onlineUsers.delete(
                    clientId
                );

            }


            return res.json({

                success: true,

                count:
                    getOnlineUsersCount()

            });

        } catch (error) {

            console.error(
                'Presence logout error:',
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    'تعذر تحديث حالة الخروج'

            });

        }

    }
);


/* =========================================================
   GET ONLINE COUNT
========================================================= */

app.get(
    '/api/presence/count',
    (req, res) => {

        return res.json({

            success: true,

            count:
                getOnlineUsersCount()

        });

    }
);


/* =========================================================
   MongoDB
========================================================= */

const MONGO_URI =
    process.env.MONGO_URI;


if (!MONGO_URI) {

    console.error(
        'خطأ: MONGO_URI غير موجود في Environment Variables'
    );

} else {

    mongoose
        .connect(MONGO_URI)
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


/* =========================================================
   HOME
========================================================= */

app.get(
    '/',
    (req, res) => {

        res.json({

            status: 'ok',

            message:
                'السيرفر شغال بنجاح'

        });

    }
);


/* =========================================================
   VISITORS (عداد الزوار الكلي - عام، بدون تسجيل دخول)
========================================================= */

const visitorSchema =
    new mongoose.Schema({

        clientId: {
            type: String,
            required: true,
            unique: true
        },

        firstSeen: {
            type: Date,
            default: Date.now
        }

    });


const Visitor =
    mongoose.model(
        'Visitor',
        visitorSchema
    );


/* تسجيل زائر جديد (لا يزيد العدد لو نفس المتصفح زار من قبل) */

app.post(
    '/api/visitors/register',
    async (req, res) => {

        try {

            const clientId =
                String(
                    req.body.clientId || ''
                ).trim();


            if (!clientId) {

                return res.status(400).json({

                    success: false,

                    message:
                        'clientId مطلوب'

                });

            }


            await Visitor.updateOne(

                { clientId: clientId },

                { $setOnInsert: { clientId: clientId, firstSeen: new Date() } },

                { upsert: true }

            );


            const total =
                await Visitor.countDocuments();


            return res.json({

                success: true,

                count: total

            });

        } catch (error) {

            console.error(
                'Visitor register error:',
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    'تعذر تسجيل الزيارة'

            });

        }

    }
);


/* جلب العدد الكلي للزوار */

app.get(
    '/api/visitors/count',
    async (req, res) => {

        try {

            const total =
                await Visitor.countDocuments();


            return res.json({

                success: true,

                count: total

            });

        } catch (error) {

            console.error(
                'Visitor count error:',
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    'تعذر جلب عدد الزوار'

            });

        }

    }
);


/* =========================================================
   RECORD SCHEMA
========================================================= */

const recordSchema =
    new mongoose.Schema({

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
    mongoose.model(
        'Record',
        recordSchema
    );


/* =========================================================
   GET RECORDS
========================================================= */

app.get(
    '/api/records',
    authMiddleware,
    async (req, res) => {

        try {

            const records =
                await Record
                    .find()
                    .sort({
                        createdAt: -1
                    });


            res.json(
                records
            );

        } catch (error) {

            console.error(
                error
            );


            res.status(500).json({

                success: false,

                message:
                    'حدث خطأ أثناء جلب السجلات'

            });

        }

    }
);


/* =========================================================
   ADD RECORD
========================================================= */

app.post(
    '/api/records',
    authMiddleware,
    async (req, res) => {

        try {

            const record =
                new Record({

                    type:
                        req.body.type,

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

                record:
                    savedRecord

            });

        } catch (error) {

            console.error(
                error
            );


            res.status(500).json({

                success: false,

                message:
                    'حدث خطأ أثناء حفظ السجل'

            });

        }

    }
);


/* =========================================================
   DELETE RECORD
========================================================= */

app.delete(
    '/api/records/:id',
    authMiddleware,
    async (req, res) => {

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

            console.error(
                error
            );


            res.status(500).json({

                success: false,

                message:
                    'حدث خطأ أثناء حذف السجل'

            });

        }

    }
);


/* =========================================================
   TEACHERS RECORDS SCHEMA
========================================================= */

const teacherRecordSchema =
    new mongoose.Schema({

        type: {
            type: String,
            required: true
        },

        data: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },

        createdAt: {
            type: Date,
            default: Date.now
        },

        updatedAt: {
            type: Date,
            default: Date.now
        }

    });


const TeacherRecord =
    mongoose.model(
        'TeacherRecord',
        teacherRecordSchema
    );


/* =========================================================
   GET TEACHER RECORDS
========================================================= */

app.get(
    '/api/teachers',
    authMiddleware,
    async (req, res) => {

        try {

            const records =
                await TeacherRecord
                    .find()
                    .sort({
                        createdAt: -1
                    });


            return res.json(
                records
            );

        } catch (error) {

            console.error(
                'Get teacher records error:',
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    'حدث خطأ أثناء جلب بيانات المعلمين'

            });

        }

    }
);


/* =========================================================
   ADD TEACHER RECORD
========================================================= */

app.post(
    '/api/teachers',
    authMiddleware,
    async (req, res) => {

        try {

            const type =
                String(
                    req.body.type || ''
                ).trim();


            const data =
                req.body.data;


            if (!type) {

                return res.status(400).json({

                    success: false,

                    message:
                        'نوع سجل المعلم مطلوب'

                });

            }


            if (
                !data ||
                typeof data !== 'object'
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'بيانات سجل المعلم مطلوبة'

                });

            }


            const record =
                new TeacherRecord({

                    type: type,

                    data: data,

                    createdAt:
                        new Date(),

                    updatedAt:
                        new Date()

                });


            const savedRecord =
                await record.save();


            return res.status(201).json({

                success: true,

                record:
                    savedRecord

            });

        } catch (error) {

            console.error(
                'Add teacher record error:',
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    'حدث خطأ أثناء حفظ بيانات المعلم'

            });

        }

    }
);


/* =========================================================
   UPDATE TEACHER RECORD
========================================================= */

app.put(
    '/api/teachers/:id',
    authMiddleware,
    async (req, res) => {

        try {

            const data =
                req.body.data;


            if (
                !data ||
                typeof data !== 'object'
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        'بيانات التعديل مطلوبة'

                });

            }


            const updatedRecord =
                await TeacherRecord.findByIdAndUpdate(

                    req.params.id,

                    {

                        data: data,

                        updatedAt:
                            new Date()

                    },

                    {

                        new: true,

                        runValidators: true

                    }

                );


            if (!updatedRecord) {

                return res.status(404).json({

                    success: false,

                    message:
                        'سجل المعلم غير موجود'

                });

            }


            return res.json({

                success: true,

                record:
                    updatedRecord

            });

        } catch (error) {

            console.error(
                'Update teacher record error:',
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    'حدث خطأ أثناء تعديل بيانات المعلم'

            });

        }

    }
);


/* =========================================================
   DELETE TEACHER RECORD
========================================================= */

app.delete(
    '/api/teachers/:id',
    authMiddleware,
    async (req, res) => {

        try {

            const deleted =
                await TeacherRecord
                    .findByIdAndDelete(
                        req.params.id
                    );


            if (!deleted) {

                return res.status(404).json({

                    success: false,

                    message:
                        'سجل المعلم غير موجود'

                });

            }


            return res.json({

                success: true,

                message:
                    'تم حذف سجل المعلم بنجاح'

            });

        } catch (error) {

            console.error(
                'Delete teacher record error:',
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    'حدث خطأ أثناء حذف سجل المعلم'

            });

        }

    }
);

/* =========================================================
   SETTINGS
========================================================= */

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
    mongoose.model(
        'Setting',
        settingSchema
    );


/* =========================================================
   PASSWORD
========================================================= */

const DEFAULT_PASSWORD =
    '1234';

const SALT_ROUNDS = 10;


/* يرجع الهاش المخزّن لكلمة المرور، وينشئ واحد افتراضي (مشفّر) لو ما موجود */

async function getCurrentPasswordHash() {

    let setting =
        await Setting.findOne({

            key:
                'loginPassword'

        });


    if (!setting) {

        const defaultHash =
            await bcrypt.hash(
                DEFAULT_PASSWORD,
                SALT_ROUNDS
            );

        setting =
            await Setting.create({

                key:
                    'loginPassword',

                value:
                    defaultHash

            });

    }


    return setting.value;

}


/* يتحقق من كلمة مرور مُدخلة مقابل الهاش المخزّن */

async function verifyPassword(
    plainPassword
) {

    const currentHash =
        await getCurrentPasswordHash();

    return bcrypt.compare(
        plainPassword,
        currentHash
    );

}


/* يشفّر ويخزّن كلمة مرور جديدة */

async function setCurrentPassword(
    newPassword
) {

    const newHash =
        await bcrypt.hash(
            newPassword,
            SALT_ROUNDS
        );

    await Setting.findOneAndUpdate(

        {
            key:
                'loginPassword'
        },

        {
            key:
                'loginPassword',

            value:
                newHash
        },

        {
            upsert:
                true,

            new:
                true
        }

    );

}


/* =========================================================
   LOGIN
========================================================= */

app.post(
    '/api/login',
    loginLimiter,
    async (req, res) => {

        try {

            const password =
                String(
                    req.body.password || ''
                ).trim();


            const isValid =
                password &&
                await verifyPassword(password);


            if (isValid) {

                const token =
                    jwt.sign(
                        { role: 'school-staff' },
                        JWT_SECRET,
                        { expiresIn: '12h' }
                    );

                return res.json({

                    success:
                        true,

                    message:
                        'تم تسجيل الدخول بنجاح',

                    token:
                        token

                });

            }


            return res.status(401).json({

                success:
                    false,

                message:
                    'كلمة السر غير صحيحة'

            });

        } catch (error) {

            console.error(
                error
            );


            res.status(500).json({

                success:
                    false,

                message:
                    'حدث خطأ أثناء تسجيل الدخول'

            });

        }

    }
);


/* =========================================================
   SECURITY QUESTION
========================================================= */

const FAVORITE_NUMBER =
    process.env.FAVORITE_NUMBER ||
    '7';


/* =========================================================
   FORGOT PASSWORD
========================================================= */

app.post(
    '/api/forgot-password',
    forgotPasswordLimiter,
    async (req, res) => {

        try {

            const answer =
                String(
                    req.body.answer || ''
                ).trim();


            if (!answer) {

                return res.status(400).json({

                    success:
                        false,

                    message:
                        'يرجى إدخال الإجابة'

                });

            }


            if (
                answer !==
                String(
                    FAVORITE_NUMBER
                ).trim()
            ) {

                return res.status(401).json({

                    success:
                        false,

                    message:
                        'الإجابة غير صحيحة'

                });

            }


            const newPassword =
                Math.floor(
                    1000 +
                    Math.random() *
                    9000
                ).toString();


            await setCurrentPassword(
                newPassword
            );


            console.log(
                'تم التحقق من سؤال الأمان وإنشاء كلمة مرور جديدة'
            );


            return res.json({

                success:
                    true,

                password:
                    newPassword

            });

        } catch (error) {

            console.error(
                'Forgot password error:',
                error
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    'تعذر معالجة طلب استعادة كلمة المرور'

            });

        }

    }
);


/* =========================================================
   SERVER
========================================================= */

const PORT =
    process.env.PORT ||
    3000;


app.listen(
    PORT,
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);
