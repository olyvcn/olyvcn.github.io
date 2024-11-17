// as-icon-fetcher.js

const ENTITY = "software"
const COUNTRY = "CN"
const LANG = "zh"
const LIMIT = "1"

document.addEventListener("DOMContentLoaded", () => {
  function getAppId(appUrl) {
    // 从 URL 中提取应用 ID
    const appIdMatch = appUrl.match(/\/id(\d+)/);
    if (!appIdMatch) {
      console.error("AS ICON FETCHER DEBUG: Invalid app URL:", appUrl);
      return;
    }
  
    return appIdMatch[1];
  }
  
  function jsonpRequest(url, callbackNamePrefix = 'iconCallback') {
  
    function sanitize(input) {
      if (typeof input === 'string') {
        return input.replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<[^>]*>?/gm, '');
      }
      return input;
    }
  
    function cleanObject(obj) {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitize(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          cleanObject(obj[key]);
        }
      }
    }
  
    return new Promise((resolve, reject) => {
      // 动态生成唯一的回调函数名称
      const callback = `${callbackNamePrefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  
      // 动态创建 <script> 元素
      const script = document.createElement('script');
  
      // 设置回调函数到全局
      window[callback] = (data) => {
        try {
          cleanObject(data);
          // 将数据转为 JSON 字符串，再尝试解析
          const jsonString = JSON.stringify(data);  // 将数据转为 JSON 字符串
          const parsedData = JSON.parse(jsonString); // 尝试解析数据，验证其合法性
  
          // 如果解析成功并且是对象或数组，认为是有效的 JSON
          if (typeof parsedData === 'object' && parsedData !== null) {
            resolve(parsedData); // 返回数据
          } else {
            throw new Error('Data is not a valid JSON object');
          }
        } catch (error) {
          reject(error);
        } finally {
          // 清理资源
          delete window[callback];
          document.body.removeChild(script);
        }
      };
  
      // 监听错误
      script.onerror = () => {
        reject(new Error('JSONP request failed'));
        delete window[callback];
        document.body.removeChild(script);
      };
  
      // 拼接 URL 并添加到文档中
      script.src = `${url}${url.includes('?') ? '&' : '?'}callback=${callback}`;
      document.body.appendChild(script);
    });
  }

  // 加载图标并设置背景
  const loadIcon = async (div) => {
    const appUrl = div.getAttribute("app-url");

    if (!appUrl) {
      console.error("AS ICON FETCHER DEBUG: No URL provided in data-url attribute:", div);
      return;
    }

    const appId = getAppId(appUrl)
    console.log("AS ICON FETCHER DEBUG: AppId:", appId);

    // 直接使用 appId 作为缓存键
    const cachedIcon = localStorage.getItem(appId);

    if (cachedIcon) {
      // 如果缓存中有图标 URL，直接使用
      console.log(`AS ICON FETCHER DEBUG: Using cached icon for: ${cachedIcon}`);
      div.style.backgroundImage = `url(${cachedIcon})`;
      return;
    }

    const url = `https://itunes.apple.com/lookup?id=${appId}&entity=${ENTITY}&country=${COUNTRY}&lang=${LANG}&limit=${LIMIT}`
    console.log(`AS ICON FETCHER DEBUG: Fetch url: ${url}`);

    try {
      const response = await jsonpRequest(url);
      const data = response.results
      if (data.length > 0) {
        console.log("AS ICON FETCHER DEBUG: Response data:", data);
        const iconUrl = data[0].artworkUrl512; // 获取高清图标
        // 设置背景图并缓存图标 URL
        div.style.backgroundImage = `url(${iconUrl})`;
        localStorage.setItem(appId, iconUrl);
        console.log(`AS ICON FETCHER DEBUG: Icon cached, key: ${appId} value: ${iconUrl}`);
      } else {
        console.error("AS ICON FETCHER DEBUG: App not found!");
      }
    } catch (error) {
      console.error("AS ICON FETCHER DEBUG: Error fetching app data:", error);
    }
  };

  document.querySelectorAll(".as-icon-container").forEach(loadIcon);
});