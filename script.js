// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: magic;
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: magic;

const files = FileManager.local()
const widget = new ListWidget()

const BASE_PATH = '/var/mobile/Library/Mobile Documents/iCloud~dk~simonbs~Scriptable/Documents/'
// 背景图片配置，目录同级放一个和脚本名一样的 png 图片
const BACKGROUND_IMAGE_NAME = `${Script.name()}.png`
// 行间距
const LINE_HEIGHT = 5

const finalPath = BASE_PATH + BACKGROUND_IMAGE_NAME

// 组件内容配置
const widgetOptions = [
  {
    content: getDateInfo(),
    fontSize: 26,
    opacity: 0.8
  },
  {
    content: 'Enjoy the rest of your day.',
    fontColor: '#e6e6e6',
    regular: true,
    opacity: 0.7,
    fontSize: 13
  },
  {
    content: getYearProgress(),
    fontFamily: 'Menlo',
    fontColor: '#6886c5',
    regular: true,
    fontSize: 12,
  },
  {
    content: getBatteryInfo(),
    fontFamily: 'Menlo',
    fontColor: '#c4fb6d',
    regular: true,
    fontSize: 12,
  },
  {
    content: getWorkText(),
    fontSize: 16,
    opacity: 0.7
  },
  {
    content: await getDxyHealthCalendar(),
    fontSize: 16,
    opacity: 0.7
  }
]

if (config.runsInWidget) {
  // 渲染组件内容
  renderWidget(widgetOptions)
  setWidgetBackground()
  // 小组件初始化
  Script.setWidget(widget)
  Script.complete()
} else {
  generateBackground()
}


/**
 * 渲染方法
 * @param {*} options 
 * @param options.content 文本内容
 * @param options.fontFamily 文本字体
 * @param options.fontSize 文本大小
 * @param options.fontColor 文本颜色
 * @param options.regular 是否使用细字体
 * @param options.opacity 不透明度
 */
function renderWidget(options = []) {
  options.forEach(option => {
    const {content = '', fontFamily = '', fontSize = 14, fontColor = '#ffffff', regular = false, opacity = 1} = option
    const curText = widget.addText(content)
    curText.font = fontFamily ? 
      new Font(fontFamily, fontSize) : 
      Font[regular ? 'regularSystemFont' : 'boldSystemFont'](fontSize)
    curText.textOpacity = (opacity)
    curText.textColor = new Color(fontColor)
    widget.addSpacer(LINE_HEIGHT)
  })
}

/**
 * 设置背景图片
 */
function setWidgetBackground() {
  if (files.fileExists(finalPath)) {
    widget.backgroundImage = files.readImage(finalPath)
  }
}

/**
 * 获取电池信息
 */
function getBatteryInfo() {
  let batteryText = '电力 '
  // 是否在充电
  const isCharging = Device.isCharging()
  // 充电等级
  const batteryLevel = Math.round(Device.batteryLevel() * 100)
  
  // 显示电量进度
  const juice = "▓".repeat(Math.floor(batteryLevel / 10)); 
  const used = "░".repeat(10 - juice.length);
  batteryText += `${juice}${used} `

  // 显示电量值
  batteryText += `${batteryLevel}% `
  
  // 电量状态提示语枚举
  const batteryTextMap = {
    '0~10': "电量将耗尽,再不充电我就关机了!", //当电量少于10%
    '10~20': "电量就剩不到20%了,尽快充电!", //当电量在10-20%
    '20~30': "电量就快用完,赶紧充电!", //当电量在20-30%
    '30~40': "电量用了大半了,尽快充电啦!", //当电量在30-40%
    '40~50': "电量用了一半,有时间就充电啦!", //当电量在40-50%
    '50~70': "电量还有大半呢,不用着急充电!", //当电量在50-70%
    '70~80': "电量充足,不出远门没有问题!", //当电量在70-80%
    '80~100': "电量充足,很有安全感!!!" //当电量在80-100%
  }
  if (isCharging) {
    batteryText += batteryLevel < 100 ? "正在充电中⚡️⚡️⚡️" : "已充满电!请拔下电源!⚡️"
  } else {
    batteryText += utilIsInArea(batteryTextMap, batteryLevel)
  }

  return batteryText
}

/**
 * 获取今年的进度
 */
function getYearProgress() {
  let yearText = '全年 '

  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const end = new Date(now.getFullYear() + 1, 0, 1)
  const yearPassed = (now - start)
  const yearALL = (end - start)
  const yearPercent = Math.round(yearPassed / yearALL * 100)

  // 显示进度
  const passed = '▓'.repeat(Math.floor(yearPercent / 10));
  const left = '░'.repeat(10 - passed.length);
  yearText += `${passed}${left} `

  // 年进度信息
  yearText += `${yearPercent}% `

  // 年进度标语
  yearText += '今天过的咋样？'
  return yearText
}

/**
 * 获取日期信息
 */
function getDateInfo() {
  let dateText = ''
  const now = new Date();
  const weekday = now.getDay()
  const weekdayMap = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];

  dateText += `${now.getMonth() + 1}月`
  dateText += `${now.getDate()}日 · `
  dateText += `${weekdayMap[weekday]}`

  return dateText
}

/**
 * 获取工作日信息
 */
function getWorkText() {
  let dateText = '搬砖提醒：'
  const now = new Date();
  const weekday = now.getDay()

  if (weekday === 0) {
    dateText += `🙈 明天要上班凹～`
  } else if (weekday < 5) {
    dateText += `💼 离休息还有 ${5 - weekday} 天!`
  } else if (weekday === 5) {
    dateText += `🎉 周五! 你懂的!`
  } else {
    dateText += `💃 及时行乐～`
  }

  return dateText
}

/**
 * 获取丁香医生健康日历
 */
async function getDxyHealthCalendar() {
  const url = 'https://dxy.com/app/i/ask/discover/todayfeed/healthcalendar'
  const {data} = await fetchApi(url)
  return '健康日历：' + (data && data.items && data.items[0].title || '暂时获取不到数据~')
}

/**
 * 判断是否在区域里
 * @param {*} area 
 * @param {*} value 
 */
function utilIsInArea(area, value) {
  const matched = Object.keys(area).find(key => {
    const [strat, end] = key.split('~')
    return value > strat && value <= end
  })
  return area[matched]
}

/**
 * 获取接口数据
 * @param {*} url 
 */
async function fetchApi(url) {
  try {
    const api = new Request(url);
    return await api.loadJSON();
  } catch(err) {
    return {}
  }
}

/**
 * ========================================
 * 以下代码为背景图生成
 * ========================================
 */

/**
 * 生成背景图
 */
async function generateBackground() {
  // 确定用户是否有了屏幕截图。
  let message = "以下是【透明背景】生成步骤，如果你没有屏幕截图请退出，并返回主屏幕长按进入编辑模式。滑动到最右边的空白页截图。然后重新运行！";
  let exitOptions = ["继续(已有截图)", "退出(没有截图)"];
  let shouldExit = await generateAlert(message, exitOptions);
  if (shouldExit) return;

  // 获取屏幕截图并确定手机大小。
  let img = await Photos.fromLibrary();
  let height = img.size.height;
  let phone = phoneSizes()[height];
  if (!phone) {
    message = "您似乎选择了非iPhone屏幕截图的图像，或者不支持您的iPhone。请使用其他图像再试一次!";
    await generateAlert(message, ["好的！我现在去截图"]);
    return;
  }

  // 提示窗口小部件的大小和位置。
  message = "您想要创建什么尺寸的小部件？";
  let sizes = ["Small", "Medium", "Large"];
  let size = await generateAlert(message, sizes);
  let widgetSize = sizes[size];

  message = "您想它在什么位置？";
  message += height == 1136 ? " (请注意，您的设备仅支持两行小部件，因此中间和底部选项相同。)" : "";

  // 根据手机大小确定图像裁剪。
  let crop = { w: "", h: "", x: "", y: "" };
  if (widgetSize == "Small") {
    crop.w = phone.small;
    crop.h = phone.small;
    let positions = [
      "Top left",
      "Top right",
      "Middle left",
      "Middle right",
      "Bottom left",
      "Bottom right",
    ];
    let position = await generateAlert(message, positions);
    let keys = positions[position].toLowerCase().split(" ");
    crop.y = phone[keys[0]];
    crop.x = phone[keys[1]];
  } else if (widgetSize == "Medium") {
    crop.w = phone.medium;
    crop.h = phone.small;

    // Medium and large widgets have a fixed x-value.
    crop.x = phone.left;
    let positions = ["Top", "Middle", "Bottom"];
    let position = await generateAlert(message, positions);
    let key = positions[position].toLowerCase();
    crop.y = phone[key];
  } else if (widgetSize == "Large") {
    crop.w = phone.medium;
    crop.h = phone.large;
    crop.x = phone.left;
    let positions = ["Top", "Bottom"];
    let position = await generateAlert(message, positions);

    // Large widgets at the bottom have the "middle" y-value.
    crop.y = position ? phone.middle : phone.top;
  }

  // Crop image and finalize the widget.
  // 裁剪图像并完成小部件。
  let imgCrop = cropImage(img, new Rect(crop.x, crop.y, crop.w, crop.h));

  // TODO：暂时去掉导出在 Scriptable 中使用
  // message = "您的小部件背景已准备就绪。您想在Scriptable的小部件中使用它还是导出图像？";
  // const exportPhotoOptions = ["在Scriptable中使用", "导出图像"];
  // const exportPhoto = await generateAlert(message, exportPhotoOptions);

  // if (exportPhoto) {
  //   Photos.save(imgCrop);
  // } else {
  //   files.writeImage(finalPath, imgCrop);
  // }

  files.writeImage(finalPath, imgCrop);
  await generateAlert('图片已生成到 icloud 中', ['好的'])
  Script.complete();
}

/**
 * 使用提供的选项数组生成提示
 * @param {*} message 
 * @param {*} options 
 */
async function generateAlert(message, options) {
  let alert = new Alert();
  alert.message = message;

  for (const option of options) {
    alert.addAction(option);
  }

  let response = await alert.presentAlert();
  return response;
}

/**
 * 将图像裁剪为指定的矩形。
 * @param {*} img 
 * @param {*} rect 
 */
function cropImage(img, rect) {
  let draw = new DrawContext();
  draw.size = new Size(rect.width, rect.height);

  draw.drawImageAtPoint(img, new Point(-rect.x, -rect.y));
  return draw.getImage();
}

/**
 * 所有支持的手机上小部件的像素大小和位置
 */
function phoneSizes() {
  let phones = {
    // iPhone Xs Max \ iPhone 11 Pro Max
    2688: {
      small: 507,
      medium: 1080,
      large: 1137,
      left: 81,
      right: 654,
      top: 228,
      middle: 858,
      bottom: 1488,
    },
    // iPhone Xr \ iPhone 11
    1792: {
      small: 338,
      medium: 720,
      large: 758,
      left: 54,
      right: 436,
      top: 160,
      middle: 580,
      bottom: 1000,
    },
    // iPhone X/XS \ iPhone 11 Pro
    2436: {
      small: 465,
      medium: 987,
      large: 1035,
      left: 69,
      right: 591,
      top: 213,
      middle: 783,
      bottom: 1353,
    },
    // iPhone 6P/7P/8P
    2208: {
      small: 471,
      medium: 1044,
      large: 1071,
      left: 99,
      right: 672,
      top: 114,
      middle: 696,
      bottom: 1278,
    },
    // iPhone 6\7\8\SE(4.7)
    1334: {
      small: 296,
      medium: 642,
      large: 648,
      left: 54,
      right: 400,
      top: 60,
      middle: 412,
      bottom: 764,
    },
    // iPhone SE \ iPod Touch 5th generation and later
    1136: {
      small: 282,
      medium: 584,
      large: 622,
      left: 30,
      right: 332,
      top: 59,
      middle: 399,
      bottom: 399,
    },
    // iPhone Xr 特别版
    1624: {
      small: 310,
      medium: 658,
      large: 690,
      left: 46,
      right: 394,
      top: 142,
      middle: 522,
      bottom: 902,
    },
  };
  return phones;
}
