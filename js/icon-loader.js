// icon-loader.js

// 图标类型到分辨率的映射表
const iconResolutions = {
  is32: "32x32 (1-bit Color)",         // 小图标，32x32，1位颜色
  l8mk: "32x32 (8-bit Grayscale)",     // 小图标，32x32，8位灰度
  il32: "32x32 (32-bit Color)",        // 小图标，32x32，32位颜色
  s8mk: "32x32 (8-bit with Transparency)", // 小图标，32x32，8位透明通道
  ic04: "128x128 (Black & White)",     // 中图标，128x128，黑白
  ic06: "128x128 (Color)",             // 中图标，128x128，彩色
  ic07: "128x128 (Color with Transparency)", // 中图标，128x128，带透明通道
  ic08: "256x256 (Color with Transparency)", // 大图标，256x256，带透明通道
  ic09: "512x512 (Color with Transparency)", // 更大图标，512x512，带透明通道
  ic10: "1024x1024 (Color with Transparency)", // 最大图标，1024x1024，带透明通道
  s32x: "32x32 (8-bit Grayscale with Transparency)", // 32x32，8位灰度，带透明通道
  l32x: "32x32 (1-bit with Transparency)", // 32x32，1位，带透明通道
  il256: "256x256 (32-bit Color)",     // 256x256，32位颜色
  il512: "512x512 (32-bit Color)",     // 512x512，32位颜色
  is48: "48x48 (1-bit Color)",         // 48x48，1位颜色
  il48: "48x48 (32-bit Color)",        // 48x48，32位颜色
  l48x: "48x48 (8-bit Grayscale)",     // 48x48，8位灰度
  s256: "256x256 (8-bit with Transparency)", // 256x256，8位透明通道
  s512: "512x512 (8-bit with Transparency)", // 512x512，8位透明通道
  l512: "512x512 (8-bit Grayscale)",   // 512x512，8位灰度
  il1024: "1024x1024 (32-bit Color)",  // 1024x1024，32位颜色
  s1024: "1024x1024 (8-bit with Transparency)", // 1024x1024，8位透明通道
  ic11: "128x128 (Grayscale with Transparency)", // 128x128，灰度带透明
  ic12: "256x256 (Grayscale with Transparency)", // 256x256，灰度带透明
  ic13: "512x512 (Grayscale with Transparency)", // 512x512，灰度带透明
  ic14: "1024x1024 (Grayscale with Transparency)", // 1024x1024，灰度带透明
  l1024: "1024x1024 (8-bit Grayscale)", // 1024x1024，8位灰度
  il1024: "1024x1024 (32-bit with Transparency)", // 1024x1024，32位带透明通道
};

// 格式化文件大小函数
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

document.addEventListener("DOMContentLoaded", () => {
  const iconContainers = document.querySelectorAll(".icon-container[data-icon-url]");
  console.log(`ICON LOADER DEBUG: Found ${iconContainers.length} icon containers.`);

  function parseICNS(buffer) {
    console.log("ICON LOADER DEBUG: Starting to parse ICNS file...");
    const dataView = new DataView(buffer);
    const magic = dataView.getUint32(0);

    console.log(`ICON LOADER DEBUG: Magic header: 0x${magic.toString(16)}`);
    if (magic !== 0x69636E73) {
      console.error("ICON LOADER DEBUG: Invalid ICNS file: Magic header mismatch.");
      throw new Error("Invalid ICNS file");
    }

    const fileSize = dataView.getUint32(4);
    console.log(`ICON LOADER DEBUG: File size: ${formatFileSize(fileSize)}`);

    let offset = 8;
    while (offset < fileSize) {
      const iconType = String.fromCharCode(
        dataView.getUint8(offset),
        dataView.getUint8(offset + 1),
        dataView.getUint8(offset + 2),
        dataView.getUint8(offset + 3)
      );

      const iconSize = dataView.getUint32(offset + 4);
      const resolution = iconResolutions[iconType] || "Unknown resolution";

      console.log(
        `ICON LOADER DEBUG: Found icon type: ${iconType}, resolution: ${resolution}, size: ${formatFileSize(iconSize)}, at offset: ${offset}`
      );

      if (iconType === "ic07" || iconType === "ic08" || iconType === "ic09" || iconType === "ic10") {
        console.log(`ICON LOADER DEBUG: Using icon type: ${iconType}`);
        const pngData = buffer.slice(offset + 8, offset + iconSize);
        console.log("ICON LOADER DEBUG: Extracted PNG data.");
        return URL.createObjectURL(new Blob([pngData], { type: "image/png" }));
      }

      offset += iconSize;
    }

    console.error("ICON LOADER DEBUG: No suitable icon found in ICNS file.");
    throw new Error("No suitable icon found in ICNS file");
  }

  // 解析 ICO 文件并返回最佳图像的 URL
  function parseICO(arrayBuffer) {
    const dataView = new DataView(arrayBuffer);

    // 检查文件头
    const reserved = dataView.getUint16(0, true); // 前两个字节，必须为 0
    const type = dataView.getUint16(2, true);    // 标识，1 为 ICO
    const count = dataView.getUint16(4, true);   // 图像数量

    if (reserved !== 0 || type !== 1 || count < 1) {
      console.error("ICON LOADER DEBUG: Invalid ICO file format.");
      return null;
    }

    console.log(`ICON LOADER DEBUG: ICO file contains ${count} image(s).`);

    // 解析图像目录并选择最佳图像
    let bestImage = null;
    for (let i = 0; i < count; i++) {
      const offset = 6 + i * 16; // 每个目录占 16 字节
      const width = dataView.getUint8(offset) || 256; // 0 表示 256
      const height = dataView.getUint8(offset + 1) || 256;
      const iconSize = dataView.getUint32(offset + 8, true);
      const imageOffset = dataView.getUint32(offset + 12, true);

      console.log(
        `ICON LOADER DEBUG: Found icon resolution: ${width}x${height}, size: ${formatFileSize(iconSize)}, at offset: ${imageOffset}`
      );
      if (!bestImage || width > bestImage.width) {
        bestImage = { width, height, size: iconSize, offset: imageOffset };
      }
    }

    if (!bestImage) {
      console.error("ICON LOADER DEBUG: No valid images found in the ICO file.");
      return null;
    }

    console.log(`ICON LOADER DEBUG: Selected best icon: ${bestImage.width}x${bestImage.height}, offset: ${bestImage.offset}`);

    // 提取最佳图像数据
    const imageData = new Uint8Array(arrayBuffer, bestImage.offset, bestImage.size);
    const blob = new Blob([imageData], { type: "image/png" }); // 大多数 ICO 使用 PNG 数据
    return URL.createObjectURL(blob);
  }

  async function setIconBackground(div) {
    const iconUrl = div.getAttribute("data-icon-url");
    console.log(`ICON LOADER DEBUG: Processing icon container with URL: ${iconUrl}`);

    // 检查缓存中是否已有解析结果
    const cachedIconBase64 = localStorage.getItem(iconUrl);
    if (cachedIconBase64) {
      console.log("ICON LOADER DEBUG: Using cached icon (Base64):");
      div.style.backgroundImage = `url(data:image/png;base64,${cachedIconBase64})`;
      return;
    }

    try {
      console.log(`ICON LOADER DEBUG: Fetching icon file from ${iconUrl}`);
      const response = await fetch(iconUrl);
      if (!response.ok) {
        console.error(`ICON LOADER DEBUG: Failed to fetch icon: HTTP ${response.status}`);
        throw new Error(`Failed to fetch icon: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log(`ICON LOADER DEBUG: Fetched ${formatFileSize(arrayBuffer.byteLength)} of data from ${iconUrl}`);

      // 判断文件后缀，调用对应的解析函数
      const imageUrl = iconUrl.endsWith(".icns")
        ? parseICNS(arrayBuffer) // 解析 ICNS 文件
        : iconUrl.endsWith(".ico")
          ? parseICO(arrayBuffer)  // 解析 ICO 文件
          : null;

      if (imageUrl) {
        console.log(`ICON LOADER DEBUG: Parsed image URL: ${imageUrl}`);
      } else {
        throw new Error("Unsupported file format or no valid icon found.");
      }

      // 将图标数据转换为 Base64 编码
      const base64Image = await convertToBase64(imageUrl);
      console.log("ICON LOADER DEBUG: Converted image to Base64.");

      // 将 Base64 数据存储到 localStorage
      localStorage.setItem(iconUrl, base64Image);

      div.style.backgroundImage = `url(data:image/png;base64,${base64Image})`;
      console.log("ICON LOADER DEBUG: Icon applied successfully to container.");
    } catch (err) {
      console.error(`ICON LOADER DEBUG: Error processing icon URL (${iconUrl}):`, err);
    }
  }

  // 将图片 URL 转换为 Base64
  async function convertToBase64(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  iconContainers.forEach((div) => {
    console.log(`ICON LOADER DEBUG: Starting to process div:`, div);
    setIconBackground(div);
  });
});