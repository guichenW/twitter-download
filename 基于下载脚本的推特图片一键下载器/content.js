function startDownloading() {
    const buttons = document.querySelectorAll('.tmd-down.download');
    if (buttons.length === 0) {
      // 如果找不到按钮，发送消息给 background.js
      chrome.runtime.sendMessage({
        action: 'noButtonsFound',
        message: '未找到可下载的按钮，请检查脚本支持'
      });
      return;
    }
    buttons.forEach((button, index) => {
      setTimeout(() => {
        if (button.getAttribute('title') === '下载') {
          button.click();
        }
      }, index * 1000);
    });
  }
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startDownload') {
      startDownloading();
      sendResponse({ status: '下载已开始' });
    } else if (message.action === 'getButtonCount') {
      const buttons = document.querySelectorAll('.tmd-down.download');
      sendResponse({ count: buttons.length });
    }
  });