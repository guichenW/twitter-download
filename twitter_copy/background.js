// 创建自定义右键菜单项
chrome.contextMenus.create({
    id: "copyImageAndUrl",
    title: "复制图片和 URL",
    contexts: ["image"],
    documentUrlPatterns: ["https://twitter.com/*", "https://x.com/*"]
  });
  
  // 监听菜单点击事件
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "copyImageAndUrl") {
      // 发送消息给内容脚本，获取图片和 URL
      chrome.tabs.sendMessage(tab.id, {
        action: "copyImageAndUrl",
        imageSrc: info.srcUrl
      });
    }
  });