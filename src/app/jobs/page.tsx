'use client';  // 
import React, { useState } from 'react';

const VideoGenerationPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [prompt, setPrompt] = useState('');

  // 提交生成视频请求
  const handleGenerateVideo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();

      if (data.success) {
        setVideoUrl(data.videoUrl);
      } else {
        alert('视频生成失败: ' + data.error);
      }
    } catch (error) {
      alert('生成视频时出现错误: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>生成你的短剧与漫画视频</h2>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="请输入你的Prompt"
      />
      <button onClick={handleGenerateVideo} disabled={isLoading}>
        {isLoading ? '生成中...' : '生成视频'}
      </button>

      {videoUrl && (
        <div>
          <h3>生成的视频：</h3>
          <video width="320" height="240" controls>
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
};

export default VideoGenerationPage;