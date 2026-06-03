async function run() {
  const dummyBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgAAZABkAAD/7AARRHVja3kAAQAEAAAAPAAA/+4ADkFkb2JlAGTAAAAAAf/bAIQABgQEBAUEBgUFBgkGBQYJCwgGBggLDAoKCwoKDBAMDAwMDAwQDA4PEA8ODBMTFBQTExwbGxscHx8fHx8fHx8fHwEHBwcNDA0YEBAYGhURFRofHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8f/8AAEQgAAQABAwERAAIRAQMRAf/EABwAAQAAAAEAAAAAAAAAAAAAAAAAAgMEBQYH/8QAHQEAQDEBAQAAAAAAAAAAAAAAAAECAwQFBhEH/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAH/xAAXEQEBAQEAAAAAAAAAAAAAAAAAAREh/9oADAMBAAIRAxEAPwC7RQAoAAAAAAaA//Z";
  
  const res = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer sk-ci037ealwgdgw6cadb3cc4hxzvm2fgfbw2clwc1gvuma1k3k",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "vendor/xiaomi/mimo-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "what is this" },
            { type: "image_url", image_url: { url: dummyBase64 } }
          ]
        }
      ]
    })
  });
  console.log(res.status);
  console.log(await res.text());
}
run();
