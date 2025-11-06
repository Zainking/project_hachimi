import { marked } from 'marked';

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
avatar.onclick = onClick;

function onClick(text) {
  if (fetching) {
    return;
  }
  fetching = true;
  avatar.src =
    'https://eyetracking-model.deepalgo.cn/hachimi-avatars/thinking.png';
  const speech = new SpeechSynthesisUtterance('来让我想想～');
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
            document.body.innerText,
        },
        {
          role: 'system',
          content:
            'User selected  ' +
            JSON.stringify({
              pharagh: document.getSelection()?.anchorNode?.data,
              selectedText: document.getSelection()?.toString().trim(),
            }),
        },
        {
          role: 'system',
          content: `Please respond in JSON format with two parts:
            1. "voice": Brief emotional response (1-2 sentences, suitable for speech synthesis, expressing empathy, encouragement, or friendliness in a cute and cheerful tone)
            2. "text": Detailed rational analysis (including specific information, steps, suggestions, etc.)

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
