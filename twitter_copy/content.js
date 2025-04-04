function getImageUrl() {
  const modal = document.querySelector('div[aria-modal="true"]');
  if (modal) {
    const modalLink = modal.querySelector('a[href*="/photo/"]');
    if (modalLink) {
      console.log('[Twitter Image Copier] 发现模态框图片链接:', modalLink.href);
      return modalLink.href;
    }
  }
  console.log('[Twitter Image Copier] 使用当前页面URL:', window.location.href);
  return window.location.href;
}

async function copyImageAndUrl(imageSrc) {
  try {
    console.log('[Twitter Image Copier] 开始处理图片:', imageSrc);

    // 第一步：获取图片数据
    const response = await fetch(imageSrc);
    const blob = await response.blob();
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = URL.createObjectURL(blob);
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // 将图片转为 PNG Blob（更广泛支持）
    const imageBlob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png', 1.0); // 使用 PNG 格式
    });
    console.log('[Twitter Image Copier] 图片 Blob 创建成功，大小:', imageBlob.size);

    // 第二步：获取 URL
    const currentUrl = getImageUrl();
    console.log('[Twitter Image Copier] 获取到 URL:', currentUrl);

    // 第三步：构造富文本（用于支持图片+URL的粘贴）
    const imageBase64 = canvas.toDataURL('image/png', 1.0); // 用于 HTML
    const htmlContent = `
      <div>
        <img src="${imageBase64}" alt="Twitter Image" style="max-width: 100%;">
        <br>
        <a href="${currentUrl}">${currentUrl}</a>
      </div>
    `;

    // 创建剪贴板项
    const clipboardItem = new ClipboardItem({
      'image/png': imageBlob, // 使用 PNG 代替 JPEG
      'text/html': new Blob([htmlContent], { type: 'text/html' }), // 富文本：图片+URL
      'text/plain': new Blob([currentUrl], { type: 'text/plain' }) // 纯文本：仅 URL
    });

    console.log('[Twitter Image Copier] 剪贴板项创建成功');
    await navigator.clipboard.write([clipboardItem]);
    console.log('[Twitter Image Copier] 剪贴板写入成功');

    // 调试剪贴板内容（可选）
    setTimeout(async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'clipboard-read' });
        if (permission.state === 'granted') {
          const clipboardData = await navigator.clipboard.read();
          console.log('[DEBUG] 剪贴板类型:', clipboardData[0].types);
        }
      } catch (debugError) {
        console.warn('[DEBUG] 剪贴板调试失败:', debugError);
      }
    }, 1000);

    showCopySuccess();
  } catch (error) {
    console.error('[Twitter Image Copier] Error:', error);
    showCopySuccess(`失败: ${error.message}`);
  }
}

// 接收背景脚本消息
function messageHandler(message, sender, sendResponse) {
  if (message.action === "copyImageAndUrl") {
    console.log('[Twitter Image Copier] 收到后台消息:', message);
    copyImageAndUrl(message.imageSrc);
  }
}

// 先移除旧的监听器再添加新的
chrome.runtime.onMessage.removeListener(messageHandler);
chrome.runtime.onMessage.addListener(messageHandler);

// 显示复制成功提示
function showCopySuccess(message = '✓ Image and URL copied') {
  const notice = document.createElement('div');
  notice.textContent = message;
  notice.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    z-index: 9999;
  `;
  document.body.appendChild(notice);
  setTimeout(() => notice.remove(), 3000);
}