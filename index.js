const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const TELEGRAM_TOKEN = '7964600505:AAHhZO3Apd5Y2sMd4XCVyGs8haGMDQ8C9yA';
const GEMINI_API_KEY = 'AIzaSyACbRKveiniopfpLXXlw1DN-XsTdHULXBU';

app.post('/webhook', async (req, res) => {
  const body = req.body;
  res.sendStatus(200);
  
  if (!body.message) return;
  
  const chatId = body.message.chat.id;
  const message = body.message;
  
  if (message.photo) {
    await sendMessage(chatId, '🔍 جاري تحليل بشرتك، لحظة من فضلك...');
    const fileId = message.photo[message.photo.length - 1].file_id;
    const fileUrl = await getFileUrl(fileId);
    const analysis = await analyzeSkin(fileUrl);
    await sendMessage(chatId, analysis);
  } else {
    await sendMessage(chatId, `أهلاً بك في Al-Misk! 🌿\n\nأرسل لنا صورة وجهك وسنحلل بشرتك ونقترح المنتجات المناسبة لك.`);
  }
});

async function getFileUrl(fileId) {
  const res = await axios.get(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`);
  const filePath = res.data.result.file_path;
  return `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`;
}

async function analyzeSkin(imageUrl) {
  try {
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBase64 = Buffer.from(imageResponse.data).toString('base64');
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [
            {
              text: `أنت خبير متخصص في العناية بالبشرة لمتجر Al-Misk. حلل هذه الصورة وقدم:
1. نوع البشرة (دهنية/جافة/مختلطة/حساسة/عادية)
2. المشاكل الموجودة (حبوب، بقع داكنة، احمرار، مسام واسعة، إلخ)
3. توصيات العناية المناسبة
4. نصائح عامة

اكتب الرد بالعربية بشكل ودي ومهني وأضف في النهاية: "تواصل معنا للحصول على المنتجات المناسبة لبشرتك 🌿"`
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageBase64
              }
            }
          ]
        }]
      }
    );
    
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error:', error.message);
    return 'عذراً، حدث خطأ. يرجى إرسال صورة واضحة للوجه.';
  }
}

async function sendMessage(chatId, text) {
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    chat_id: chatId,
    text: text
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Al-Misk Bot running on port ${PORT}`));