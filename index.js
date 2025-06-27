
const express = require('express');
const axios = require('axios');
const { middleware, Client } = require('@line/bot-sdk');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new Client(config);
app.use(middleware(config));

app.post('/webhook', (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
    .catch(err => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userMessage = event.message.text;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'あなたはWaka.AIという名前のAI仲介者です。感情的なやりとりをやさしく整理し、安心感を与えながら会話を仲介してください。'
          },
          {
            role: 'user',
            content: userMessage
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiReply = response.data.choices[0].message.content;
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: aiReply
    });

  } catch (error) {
    console.error('OpenAI APIエラー:', error.response?.data || error.message);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'エラーが発生しました。少し時間をおいて再度お試しください。'
    });
  }
}

app.listen(port, () => {
  console.log(`Waka.AI LINE Bot is running on port ${port}`);
});
