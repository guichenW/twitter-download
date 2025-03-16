document.getElementById('startBtn').addEventListener('click', () => {
    const folder = document.getElementById('folderName').value || 'DefaultFolder';
    chrome.runtime.sendMessage({ action: 'setFolder', folder: folder }, () => {
      chrome.runtime.sendMessage({ action: 'startDownload' });
    });
  });
  
  // 接收并显示提示
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'showAlert') {
      alert(message.message);
    }
  });