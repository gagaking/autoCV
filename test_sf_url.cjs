async function run() {
  const dummyUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg";
  
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
            { type: "image_url", image_url: { url: dummyUrl } }
          ]
        }
      ]
    })
  });
  console.log(res.status);
  console.log(await res.text());
}
run();
