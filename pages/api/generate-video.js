// story2video-web/pages/api/generate-video.js

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
      // 假设调用一个生成视频的函数
      const videoUrl = `http://example.com/generated-video.mp4?prompt=${encodeURIComponent(prompt)}`;

      res.status(200).json({ success: true, videoUrl });
    } catch (error) {
      res.status(500).json({ error: 'Error generating video' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}