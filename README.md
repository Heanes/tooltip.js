# tooltip.js
Tooltip for web
显示更多的指定的提示信息。
## 简介
原生的元素上的title显示内容有限，且不可定制，本插件可以更加丰富的展示提示信息内容
* 可定制内容；
* 可设置显示位置，且可像素级偏移；
* 可点击后保持显示；
* 可设置显示透明度；
* 可设置显示、隐藏的动画效果；
* 可配置不同主题，以搭配不同颜色显示；

## Demo
demo样式见: [tooltip.js demo](http://cdn.heanes.com/js/tooltip.js/1.0/demo/ "tooltip.js demo")
<center>
<img src="https://github.com/Heanes/tooltip.js/blob/master/doc/static/image/tooltipDemo.gif?raw=true" alt="demo截图" />
demo截图
</center>

## Usage 使用说明
tooltip.js调用很简单，只需普通jQuery插件使用的步骤即可:
### 第一步：引入js脚本

```
// jQuery库依赖
<script type="text/javascript" src="js/jquery.min.js"></script>

// tooltip.js
<script type="text/javascript" src="js/tooltip.js"></script>
```
### 第二步：调用tooltip

```
// 默认配置
$('#someStr').tooltip();

// 自定义配置
$('#someStr').tooltip({
    delay: {
        show: 1000,                             // 显示延时
        hide: 1000                              // 隐藏延时
    },                                          // tooltip显示隐藏动画延时时间
    theme: 'default',                           // 风格样式前缀
    title: 'Tooltip',                           // tooltip内容，支持文本、dom内容。也可以从dom的data-original-title中取
    placement: 'top-center',                    // 出现的位置，top-center, top-left, top-right, left, right, bottom-left, bottom-center, bottom-right
    opacity: 1,                                 // 透明度
    enableAnimation: true,                      // 是否启用动画效果
    animation: undefined,                       // 动画效果
    /*animation: {
        show: 'fadeIn',
        hide: 'fadeOut',
    },*/                                          // 动画效果对象配置形式
    trigger: 'hover',                           // 出现的触发事件
    keepShowWhenOnTip: true,                    // 当鼠标在tip内容上时保持显示，鼠标离开则自动隐藏
    keepShowWhenClickTip: false,                // 当鼠标点击tip内容时保持显示(即使鼠标移开)，再点击一下将会取消一直显示
    cancelKeepShowWhenClickOtherPlace: false,   // 当鼠标点击非tooltip区域时取消一直显示
    positionOffset: undefined,                  // tooltip相对偏移位置，e.g:{top: 2px, left: 2px}，其值可为负数
    $container: false,                          // 放置展示tooltip的容器
    template: '<div class="tooltip-wrap" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',  // tooltip模版

    // Event
    beforeShow: undefined,                      // 显示之前
    afterShow: undefined,                       // 显示之后
    beforeHide: undefined,                      // 消失之前
    afterHide: undefined,                       // 消失之后
    onToggle: undefined,                        // 切换显隐时
});
```

## Demo
![demo截图](https://github.com/Heanes/tooltip.js/blob/master/doc/static/image/tooltipDemo.gif?raw=true)

## License
* 本项目的所有代码按照 [MIT License](https://github.com/racaljk/hosts/blob/master/LICENSE) 发布
![img-source-from-https://github.com/docker/dockercraft](https://github.com/docker/dockercraft/raw/master/docs/img/contribute.png?raw=true)
