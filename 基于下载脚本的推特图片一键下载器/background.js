let customFolder = 'DefaultFolder';
let pendingDownloads = 0; // 使用计数器替代布尔标志，跟踪待处理的下载数量

// 设置下载文件夹路径
function setDownloadPath(downloadItem) {
  const today = new Date().toISOString().slice(0, 10);
  const folderName = customFolder === 'DefaultFolder' ? `推特下载/${today}` : customFolder;
  const newFilename = `${folderName}/${downloadItem.filename}`;
  return { filename: newFilename, conflictAction: 'uniquify' };
}

// 触发下载
function triggerDownload() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'startDownload' }, (response) => {
      if (response && response.status === '下载已开始') {
        // 获取页面上的下载按钮数量
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getButtonCount' }, (countResponse) => {
          if (countResponse && countResponse.count > 0) {
            // 设置待处理的下载数量
            pendingDownloads = countResponse.count;
            console.log(`设置待处理下载数量: ${pendingDownloads}`);
          } else {
            // 如果无法获取确切数量，设置一个较大的值
            pendingDownloads = 20;
            console.log('无法获取按钮数量，设置默认值');
          }
        });
      }
      console.log(response ? response.status : '无响应');
    });
  });
}

// 监听下载事件，处理扩展触发的下载
chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  // 检查是否有待处理的下载
  if (pendingDownloads > 0) {
    // 设置下载路径
    const today = new Date().toISOString().slice(0, 10);
    const folderName = customFolder === 'DefaultFolder' ? `推特下载/${today}` : customFolder;
    
    // 确保downloadItem.filename不为空
    if (!downloadItem.filename) {
      console.error('下载项的文件名为空');
      suggest({ filename: `${folderName}/未命名文件_${Date.now()}`, conflictAction: 'uniquify' });
      pendingDownloads--;
      return;
    }
    
    const newFilename = `${folderName}/${downloadItem.filename}`;
    
    // 使用suggest回调函数设置文件名
    suggest({
      filename: newFilename,
      conflictAction: 'uniquify'
    });
    
    // 减少待处理的下载数量
    pendingDownloads--;
    console.log(`处理下载完成，剩余待处理数量: ${pendingDownloads}`);
  } else {
    // 对于非扩展触发的下载，使用浏览器默认行为
    suggest({ filename: downloadItem.filename || '未命名文件', conflictAction: 'uniquify' });
  }
})

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'setFolder') {
    customFolder = message.folder;
    sendResponse({ status: '文件夹已设置' });
  } else if (message.action === 'startDownload') {
    triggerDownload();
    sendResponse({ status: '下载已触发' });
  } else if (message.action === 'noButtonsFound') {
    // 当找不到按钮时，发送提示
    chrome.runtime.sendMessage({
      action: 'showAlert',
      message: '未找到可下载的内容，请尝试以下步骤：\n0.下载过的文件不会重复下载&如果需全部下载，需滑动滚轮加载出全部内容\n1. 安装油猴插件：https://chromewebstore.google.com/detail/篡改猴/dhdgffkkebhmkfjojejmpbldmpobfkfo\n   （无法访问？请开启科学上网）\n2. 安装 Twitter 图片下载工具脚本：https://greasyfork.org/zh-CN/scripts/423001-twitter-media-downloader/feedback'
    });
  }
});

// 由于有popup.html，action.onClicked不会触发，此监听器已移除
// 如果需要在图标点击时触发下载，请在popup.js中实现

// 监听下载开始事件
chrome.downloads.onCreated.addListener((downloadItem) => {
  // 记录下载信息
  console.log(`下载已创建: ${downloadItem.filename}, 剩余待处理: ${pendingDownloads}`);
});