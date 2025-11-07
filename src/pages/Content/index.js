import { marked } from 'marked';

let theDoc = document.body.innerText;

const container = document.createElement('div');
container.className = 'hachimi-container';
// container.setAttribute('draggable', 'true');

const textContainer = document.createElement('div');
textContainer.className = 'hachimi-text-container';
textContainer.style.display = 'none';

const avatar = document.createElement('img');
avatar.className = 'hachimi-avatar';
avatar.src = 'https://eyetracking-model.deepalgo.cn/hachimi-avatars/normal.png';

container.appendChild(textContainer);
container.appendChild(avatar);
document.body.appendChild(container);

let onKeyDown = false;

window.SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

const recognition = new window.SpeechRecognition();
recognition.lang = 'zh-CN'; // 设置语言为中文
recognition.interimResults = true; // 启用中间结果
recognition.continuous = true; // 启用连续识别

// 语音识别结果时的回调
recognition.onresult = (event) => {
  // 遍历所有识别结果
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    const transcript = result[0].transcript.trim(); // 获取识别的文本
    const isFinal = result.isFinal; // 是否为最终结果

    if (isFinal) {
      // 如果是最终结果，将句子添加到当前段落
      onClick(transcript);
    }
  }
};

document.addEventListener('keydown', function (event) {
  if (!onKeyDown && event.key === 'a' && event.ctrlKey) {
    onKeyDown = true;
    recognition.start();
    avatar.src =
      'https://eyetracking-model.deepalgo.cn/hachimi-avatars/smiled.png';
  }
});
document.addEventListener('keyup', function (event) {
  if (event.key === 'a') {
    recognition.stop();
    avatar.src =
      'https://eyetracking-model.deepalgo.cn/hachimi-avatars/normal.png';
    console.log('stop');
    onKeyDown = false;
  }
});

let fetching = false;
avatar.onclick = () => {
  const speech = new SpeechSynthesisUtterance('请按 Ctrl+A，和我说完话松手～');
  speech.pitch = 1.3;
  speechSynthesis.speak(speech);
  avatar.src =
    'https://eyetracking-model.deepalgo.cn/hachimi-avatars/speaking.png';
  speech.onend = () => {
    avatar.src =
      'https://eyetracking-model.deepalgo.cn/hachimi-avatars/normal.png';
  };
};

function onClick(text) {
  if (fetching) {
    return;
  }
  fetching = true;
  avatar.src =
    'https://eyetracking-model.deepalgo.cn/hachimi-avatars/thinking.png';
  const selected = document.getSelection()?.toString().trim();
  const speech = new SpeechSynthesisUtterance(
    (selected ? '你选中了' + selected + ',' : '') + '来让我想想～'
  );
  speech.pitch = 1.3;
  speechSynthesis.speak(speech);
  fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer sk-00291a3aacea4a0f8e5de5fa90f9d091',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant. You will analysis text below, ' +
            theDoc,
        },
        {
          role: 'system',
          content:
            'User selected  ' +
            JSON.stringify({
              pharagh: document.getSelection()?.anchorNode?.data,
              selectedText: selected,
            }),
        },
        {
          role: 'system',
          content: `Please respond in JSON format with two parts:
            1. "voice": Brief emotional response (1-2 sentences, suitable for speech synthesis, expressing empathy, encouragement, or friendliness in a cute and cheerful tone)
            2. "text": Detailed rational analysis (including specific information, steps, suggestions, etc.), and this part of the reply should not exceed 300 words.

            Response format:
            {
              "voice": "Brief emotional response",
              "text": "Detailed rational analysis (Optional)"
            }
            Important: 
            - Return ONLY the JSON object without any markdown formatting, code blocks, or \`\`\` markers around the JSON itself
            - Markdown IS allowed INSIDE the "text" field for formatting the content
            - The JSON structure must be valid and parseable`,
        },
        { role: 'user', content: text || '你好!' },
      ],
      stream: false,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      const dataJSON = JSON.parse(data?.choices?.[0]?.message?.content);
      textContainer.style.display = 'block';
      textContainer.innerHTML = marked(removeEmoji(dataJSON.text));

      const speech = new SpeechSynthesisUtterance(dataJSON.voice);
      speech.pitch = 1.5;
      speechSynthesis.speak(speech);
      avatar.src =
        'https://eyetracking-model.deepalgo.cn/hachimi-avatars/speaking.png';
      speech.onend = () => {
        avatar.src =
          'https://eyetracking-model.deepalgo.cn/hachimi-avatars/normal.png';
      };
      setTimeout(() => {
        textContainer.style.display = 'none';
      }, dataJSON.text.length * 100);
      console.log('Response:', data);
      fetching = false;
    })
    .catch((error) => {
      console.error('Error:', error);
      fetching = false;
    });
}
function removeEmoji(str) {
  return str.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF]+|[\u2600-\u27BF]/g, '');
}
function abstract() {
  fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer sk-00291a3aacea4a0f8e5de5fa90f9d091',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are a text compression tool. When a user provides you with a document, your task is to compress and summarize the key content into 500 words or less. Extract the main points, important data, and core conclusions while removing redundant information, excessive examples, and unnecessary details. Maintain the logical structure of the original text and use clear, concise language. Do not add any information that wasn't in the original document. Keep all technical terms and specific numbers accurate. Simply output the compressed version without additional commentary.`,
        },
        { role: 'user', content: theDoc },
      ],
      stream: false,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      theDoc = data?.choices?.[0]?.message?.content;
      console.log('文章摘要完成。' + theDoc);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

if (document.readyState === 'complete') {
  // 文档已经加载完成，直接执行
  abstract();
} else {
  // 文档还未加载完成，添加监听器
  window.addEventListener('load', abstract);
}
