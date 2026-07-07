import fs from 'fs';

async function test() {
  const url = "https://kurtgitgit-mission17-ai.hf.space/predict";
  console.log("Pinging:", url);

  const formData = new FormData();
  formData.append('file', new Blob([Buffer.from('dummy')]), 'test.jpg');

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text.substring(0, 200));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
test();
