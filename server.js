const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

// إعداد CORS بشكل صريح يسمح لكل الطلبات ويرد بشكل صحيح على preflight (OPTIONS)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// مهم: يتيح لـ Express الرد تلقائيًا على أي طلب OPTIONS (preflight) بأي مسار
app.options('*', cors());

app.use(express.json());

// رابط الاتصال بقاعدة البيانات
const MONGO_URI = "mongodb+srv://said1991jaradat_db_user:1234@cluster0.3pblq2x.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log('تم الاتصال بنجاح بـ MongoDB Atlas'))
  .catch(err => console.error('خطأ في الاتصال بقاعدة البيانات:', err));

// نقطة فحص بسيطة للتأكد أن السيرفر شغال بدون الحاجة لقاعدة البيانات
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'السيرفر شغال' });
});

/* ================= سجلات الانضباط ================= */

const recordSchema = new mongoose.Schema({
  type: String,
  studentName: String,
  grade: String,
  section: String,
  time: String,
  date: String,
  details: String,
  createdAt: { type: Date, default: Date.now }
});

const Record = mongoose.model('Record', recordSchema);

app.get('/api/records', async (req, res) => {
  try {
    const records = await Record.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/records', async (req, res) => {
  try {
    const newRecord = new Record(req.body);
    const savedRecord = await newRecord.save();
    res.json(savedRecord);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/records/:id', async (req, res) => {
  try {
    await Record.findByIdAndDelete(req.params.id);
    res.json({ message: 'تم الحذف بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= إدارة كلمة المرور ================= */

const settingSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: String
});

const Setting = mongoose.model('Setting', settingSchema);

const DEFAULT_PASSWORD = "1234";
const RECOVERY_EMAIL = "sameer.m.musleh@gmail.com";

async function getCurrentPassword() {
  let setting = await Setting.findOne({ key: 'loginPassword' });
  if (!setting) {
    setting = await Setting.create({ key: 'loginPassword', value: DEFAULT_PASSWORD });
  }
  return setting.value;
}

async function setCurrentPassword(newPassword) {
  await Setting.findOneAndUpdate(
    { key: 'loginPassword' },
    { value: newPassword },
    { upsert: true }
  );
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// دالة إرسال الإيميل
async function sendRecoveryEmail(recipientEmail, password) {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: 'كلمة المرور الجديدة - نظام إدارة الانضباط المدرسي',
    text: `مرحبًا،\n\nكلمة المرور الجديدة لتسجيل الدخول لنظام إدارة الانضباط المدرسي هي:\n\n${password}\n\nالرجاء عدم مشاركتها مع أي شخص آخر.`
  });
}

app.post('/api/login', async (req, res) => {
  try {
    const { password } = req.body;
    const currentPassword = await getCurrentPassword();

    if (password === currentPassword) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'كلمة المرور غير صحيحة' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'حدث خطأ بالسيرفر' });
  }
});

// مسار نسيت كلمة المرور الموحد والسليم
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || email.trim().toLowerCase() !== RECOVERY_EMAIL.toLowerCase()) {
      return res.json({ success: false, message: 'البريد الإلكتروني غير صحيح' });
    }

    const newPassword = String(Math.floor(1000 + Math.random() * 9000));

    await setCurrentPassword(newPassword);

    await sendRecoveryEmail(RECOVERY_EMAIL, newPassword);

    res.json({ success: true, message: 'تم إرسال كلمة مرور جديدة إلى بريدك الإلكتروني' });
  } catch (err) {
    console.error('خطأ في إرسال الإيميل:', err);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إرسال الإيميل، حاول لاحقًا' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`الخادم يعمل على البورت ${PORT}`);
});
