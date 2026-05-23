const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const GEMINI_API_KEY = 'AIzaSyACbRKveiniopfpLXXlw1DN-XsTdHULXBU';
const PAGE_ACCESS_TOKEN = 'ضعها_هنا';
const VERIFY_TOKEN = 'almisk2024';

// Webhook verification
app.get('/webhook', (req, res) => {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

// Receive messages
app.post('/webhook', async (req, res) => {
  const body = req.body;
  if (body.object === 'page') {
    for (const entry of body.entry) {
      for (const event of entry.messaging) {
        const senderId = event.sender.id;
        if (event.message) {
          if (event.message.attachments) {
            const attachment = event.message.attachments[0];
            if (attachment.type === 'image') {
              await sendMessage(senderId, '🔍 جاري تحليل بشرتك، لحظة من فضلك...');
              const imageUrl = attachment.payload.url;
              const analysis = await analyzeSkin(imageUrl);
              await sendMessage(senderId, analysis);
            }
          } else if (event.message.text) {
            await sendMessage(senderId, 'أهلاً بك في Al-Misk! 🌿\nأرسل لنا صورة وجهك وسنحلل بشرتك ونقترح المنتجات المناسبة لك.');
          }
        }
      }
    }
    res.sendStatus(200);
  }
});

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
              text: `أنت خبير متخصص في العناية بالبشرة. حلل هذه الصورة وقدم:
1. نوع البشرة (دهنية/جافة/مختلطة/حساسة/عادية)
2. المشاكل الموجودة (حبوب، بقع داكنة، احمرار، مسام واسعة، إلخ)
3. توصيات العناية المناسبة
4. نصائح عامة للعناية بهذا النوع من البشرة

اكتب الرد بالعربية بشكل ودي ومهني.`
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
    console.error('Gemini error:', error);
    return 'عذراً، حدث خطأ في تحليل الصورة. يرجى إرسال صورة واضحة للوجه.';
  }
}

async function sendMessage(recipientId, message) {
  await axios.post(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      recipient: { id: recipientId },
      message: { text: message }
    }
  );
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Al-Misk Bot running on port ${PORT}`));