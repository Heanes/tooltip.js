/**
 * @doc tooltip
 * @author Heanes
 * @time 2018-06-07 11:27:48 周四
 */
;(function($, window, document, undefined) {
    "use strict";
    var tooltip = 'tooltip';
    var version = '1.0.0';

    var _tooltip = window.tooltip;

    var _default = {
        title: 'Tooltip',                           // tooltip内容，支持文本、dom内容。也可以从dom的data-original-title中取
        enableHtml: false,                          // tooltip内容，是否支持html
        placement: 'top-center',                    // 出现的位置，top-center, top-left, top-right, left, right, bottom-left, bottom-center, bottom-right
        autoAdaptPlacement: true,                   // 是否自适应位置
        theme: 'default',                           // 风格样式前缀
        opacity: 1,                                 // 透明度
        enableAnimation: true,                      // 是否启用动画效果
        //delay: 1000,                              // 动画延时，单位为毫秒
        delay: {
            show: 1000,                             // 显示延时
            hide: 1000                              // 隐藏延时
        },                                          // tooltip显示隐藏动画延时时间，对象表示形式
        animation: undefined,                       // 动画效果
        /*animation: {
            show: 'fadeIn',
            hide: 'fadeOut',
        },*/                                        // 动画效果对象配置形式
        trigger: 'hover',                           // 出现的触发事件
        keepShowWhenOnTip: true,                    // 当鼠标在tip内容上时保持显示，鼠标离开则取消保持显示
        keepShowWhenClickTip: false,                // 当鼠标点击tip内容时保持显示(即使鼠标移开)，再点击一下将会取消保持显示
        cancelKeepShowWhenClickOtherPlace: false,   // 当鼠标点击非tooltip区域时取消一直显示
        positionOffset: undefined,                  // tooltip相对偏移位置，e.g:{top: 2px, left: 2px}，其值可为负数
        $container: $('body'),                      // 放置展示tooltip的容器
        template: '<div class="tooltip-wrap" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',  // tooltip模版

        // Event
        beforeShow: undefined,                      // 显示之前
        afterShow: undefined,                       // 显示之后
        beforeHide: undefined,                      // 消失之前
        afterHide: undefined,                       // 消失之后
        onToggle: undefined,                        // 切换显隐时
    };

    $.fn.extend({
        animateCss: function(animationName, callback) {
            var animationEnd = (function(el) {
                var animations = {
                    animation: 'animationend',
                    OAnimation: 'oAnimationEnd',
                    MozAnimation: 'mozAnimationEnd',
                    WebkitAnimation: 'webkitAnimationEnd',
                };

                for (var t in animations) {
                    if (el.style[t] !== undefined) {
                        return animations[t];
                    }
                }
            })(document.createElement('div'));

            this.addClass('animated ' + animationName).one(animationEnd, function() {
                $(this).removeClass('animated ' + animationName);

                if (typeof callback === 'function') callback();
            });

            return this;
        },
    });

    /**
     * @doc 展示额外信息的tooltip
     * 1. 显隐逻辑
     *    1.1 鼠标进入/鼠标点击形式的展现tip
     *    1.2 鼠标离开，tip自动隐藏
     *    1.3 鼠标进入tip，tip不自动隐藏；鼠标离开tip且不在目标dom上，tip继续自动隐藏
     *    1.4 鼠标单击tip，tip不自动隐藏，鼠标离开(不单击)，tip也一直显示
     * 2. 展示内容
     *    2.1 option设置title，可以是纯文本也可以是html
     *    2.2 dom标签中的原生title属性，或者添加的data-original-title属性
     * 3. 展示位置
     *    3.1 option设置placement，可以实现这几个位置的展示：
     *                              top-center-中上方，top-left-中左方，top-right-中右方，
     *                              left-左侧，right-右侧，
     *                              bottom-left-左下方，bottom-center-中下方，bottom-right-右下方
     *    3.2 考虑自动适应展示位置(如果边缘超出屏幕区域)
     * @param element
     * @param options
     * @returns {{options: *, init: *, destroy: *, refreshOption: *}}
     * @constructor
     */
    var Tooltip = function (element, options) {
        this._defaults  = this.getDefaults();
        this.options    = null;
        this.$element   = null;
        this.inState    = null;

        this.init(element, options);

        return {
            // Options (public access)
            options: this.options,

            // Method
            // Initialize / destroy methods
            init:           $.proxy(this.init, this),           // 初始化
            destroy:        $.proxy(this.destroy, this),        // 销毁
            refreshOption:  $.proxy(this.refreshOption, this),  // 刷新option
            show:           $.proxy(this.show, this),           // 显示
            hide:           $.proxy(this.hide, this),           // 隐藏
            toggle:         $.proxy(this.toggle, this),         // 交替切换

            tip:            $.proxy(this.tip, this),            // 获取tip内容
            title:          $.proxy(this.title, this),          // 获取title内容
            getDefaults:    $.proxy(this.getDefaults, this),    // 获取默认options

        };
    };

    /**
     * @doc 版本号
     * @type {string}
     */
    Tooltip.V = Tooltip.VERSION = version;

    /**
     * @doc 默认选项
     * @type Object
     */
    Tooltip.DEFAULTS = _default;

    /**
     * @doc 初始化
     * @returns {Tooltip}
     */
    Tooltip.prototype.init = function (element, options) {
        this.$element = $(element);
        this.$el_ = this.$element.clone(true);  // 保留一份原始dom

        this.options = this.getOptions(options);

        // 初始化状态
        this.inState = {
            show: false,        // tip显示状态
            click: false,       // 元素点击
            hover: false,       // 元素hover
            keepShow: false,    // tip是不是一直在展示
            tipClick: false,    // tip本身被点击
            tipHover: false,    // tip本身被鼠标hover
        };
        // 保存计时器
        this.timer = {
            timerDetach : undefined
        };

        // 保存UId
        this.tipUId = undefined;
        // 保存tip的位置信息
        this.tipPosition = {};
        this.animation = undefined;

        this.bindEvent();

        this.fixTitle();

        return this;
    };

    /**
     * @doc 获取options
     * @param options
     * @returns {void | {}}
     */
    Tooltip.prototype.getOptions = function (options) {
        return this.handleToStandardOption(options);
    };

    /**
     * @doc 处理为合法的标准option
     * @param options
     * @returns {void | {}}
     */
    Tooltip.prototype.handleToStandardOption = function (options) {
        var defaultOption = this.getDefaults();
        options = $.extend({}, defaultOption, this.$element.data(), options);
        if (options.delay) {
            if(typeof options.delay === 'number'){
                options.delay = {
                    show: options.delay,
                    hide: options.delay
                };
            }
            if(typeof options.delay === 'object'){
                options.delay = $.extend({}, defaultOption.delay, options.delay);
            }
        }
        return options;
    };

    /**
     * @doc 刷新option
     * @param options
     * @returns {Tooltip}
     */
    Tooltip.prototype.refreshOption = function (options) {
        this.options = $.extend(true, {}, this.options, options);
        this.getOptions(this.options);

        this.destroy();
        this.init();
        return this;
    };

    /**
     * @doc 销毁插件功能
     * @returns {Tooltip}
     */
    Tooltip.prototype.destroy = function () {
        this.$element.html(this.$el_.html());
        return this;
    };

    /**
     * @doc 绑定事件
     * @returns {Tooltip}
     */
    Tooltip.prototype.bindEvent = function () {
        var $element = this.$element;

        var triggers = this.options.trigger.split(' ');

        for (var i = triggers.length; i--;) {
            var trigger = triggers[i];

            if (trigger === 'click') {
                $element.off('click.' + this.type).on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this));
            } else if (trigger !== 'manual') {
                var eventIn  = trigger === 'hover' ? 'mouseenter' : 'focusin';
                var eventOut = trigger === 'hover' ? 'mouseleave' : 'focusout';

                $element.off(eventIn  + '.' + this.type).on(eventIn  + '.' + this.type, this.options.selector, $.proxy(this.enter, this));
                $element.off(eventOut  + '.' + this.type).on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this));
            }
        }

        if(this.options.keepShowWhenOnTip || this.options.keepShowWhenClickTip){
            this.bindTipEvent();
        }

        return this;
    };

    /**
     * @doc tip上的事件
     * @returns {Tooltip}
     */
    Tooltip.prototype.bindTipEvent = function () {
        // 如果鼠标在tooltip内容上面，则不保持显示。
        var $tip = this.tip();
        var _this = this;
        if(this.options.keepShowWhenOnTip){
            $tip.on('mouseenter', function (event) {
                _this.inState.show      =
                _this.inState.keepShow  =
                _this.inState.tipHover  = true;
                $tip.stop(true);
                _this.setStyle();
                $tip.show();
            });

            // 鼠标离开tooltip后，恢复原有的动作。
            $tip.on('mouseleave', function (event) {
                _this.inState.tipHover = false;
                if(!_this.inState.tipClick){
                    _this.inState.keepShow = false;
                    if(_this.inState.show){
                        _this.inState.show = false;
                        _this.hide();
                    }
                }
            });
        }

        if(this.options.keepShowWhenClickTip){
            $tip.on('click', function (event) {
                if(!_this.inState.tipClick){
                    _this.inState.show      =
                    _this.inState.tipClick  =
                    _this.inState.keepShow  = true;
                    $tip.stop(true).show();
                    _this.setStyle();
                }else{
                    _this.inState.tipClick  =
                    _this.inState.keepShow  = false;
                    if(_this.inState.show && !_this.inState.tipHover){
                        $tip.detach();
                    }
                }
            });
        }
        // 在非tooltip区域点击鼠标，触发隐藏
        if(_this.options.cancelKeepShowWhenClickOtherPlace){
            $('body').on('click', function (event) {
                if(_this.inState.show){
                    var $target = $(event.target);
                    var tipUId = _this.getTipUId();
                    if(!$target.is(_this.$element) && !$target.is($tip) && !$target.closest('#' + tipUId).is($tip)){
                        if(_this.inState.tipClick){
                            _this.inState.tipClick = false;
                            _this.inState.keepShow = false;
                            if(!_this.inState.tipHover){
                                _this.hide();
                            }
                        }
                    }
                }
            });
        }
        return this;
    };

    /**
     * @doc 鼠标进入
     * @returns {Tooltip}
     */
    Tooltip.prototype.enter = function () {
        this.inState.hover = true;
        this.show();
        this.$element.trigger('enter');
        return this;
    };

    /**
     * @doc 鼠标离开
     * @returns {Tooltip}
     */
    Tooltip.prototype.leave = function () {
        this.inState.hover = false;
        if(!this.inState.keepShow){
            this.hide();
        }
        this.$element.trigger('leave');
        return this;
    };

    /**
     * @doc 交替显示隐藏
     * @returns {Tooltip}
     */
    Tooltip.prototype.toggle = function (options) {
        options = options || this.options;

        this.$element.trigger('tooltip.toggle');
        var $tip = this.tip();
        if(options.onToggle && typeof options.onToggle === 'function'){
            options.onToggle($tip);
        }

        if(this.inState.show){
            this.inState.show = false;
            this.inState.click = false;
            this.hide();
        }else{
            this.inState.show = true;
            this.inState.click = true;
            this.show();
        }
        return this;
    };

    /**
     * 显示tooltip
     * @returns {Tooltip}
     */
    Tooltip.prototype.show = function (options) {
        options = options || this.options;
        this.$element.trigger('tooltip.beforeShow');

        var $tip = this.tip();
        $tip.detach();
        var tipUId = this.tipUId ||this.getUID(tooltip);
        this.tipUId = tipUId;
        $tip.attr('id', tipUId);

        this.setContent();
        if(options.$container){
            options.$container.append($tip);
        }else{
            $('body').append($tip);
        }
        this.setStyle();
        this.setPosition();

        // 显示之前的事件处理
        if(options.beforeShow && typeof options.beforeShow === 'function'){
            options.beforeShow($tip);
        }

        this.inState.show = true;
        this.showWithAnimation();

        this.$element.trigger('tooltip.show');

        // 显示之后的事件处理
        if(options.afterShow && typeof options.afterShow === 'function'){
            options.afterShow($tip);
        }
        return this;
    };

    /**
     * 设置tooltip额外样式
     * @returns {Tooltip}
     */
    Tooltip.prototype.setStyle = function ($element, options) {
        $element = this.$element;
        options = options || this.options;
        var opacity = $element.attr('data-tooltip-opacity') || options.opacity || this.getDefaults().opacity;
        var $tip = this.tip();
        $tip.addClass('tooltip-theme-' + this.options.theme);
        $tip.css({opacity: opacity});
        return this;
    };

    /**
     * 显示tooltip
     * @returns {Tooltip}
     */
    Tooltip.prototype.showWithAnimation = function ($element, options) {
        options = options || this.options;
        $element = $element || this.tip();
        if(options.enableAnimation){
            $element.stop(true).fadeIn(this.options.delay.show);
            if(options.animation && typeof options.animation === 'object'){
                $element.animateCss(options.animation.show);
            }
        }else{
            $element.stop(true).show();
        }
    };

    /**
     * @doc 隐藏tooltip
     * @returns {Tooltip}
     */
    Tooltip.prototype.hide = function (options) {
        options = options || this.options;
        this.inState.show = false;

        this.$element.trigger('tooltip.beforeHide');
        var $tip = this.tip();
        if(options.beforeHide && typeof options.beforeHide === 'function'){
            options.beforeHide($tip);
        }
        this.hideTipAction();

        this.$element.trigger('tooltip.hide');

        if(options.afterHide && typeof options.afterHide === 'function'){
            options.afterHide($tip);
        }
        //console.log(this.inState);
        return this;
    };

    /**
     * @doc tip上的事件
     * @returns {Tooltip}
     */
    Tooltip.prototype.hideTipAction = function () {
        var $tip = this.tip();
        this.setStyle();
        this.hideWithAnimation();

        var _this = this;
        //console.log('inStatus :' + JSON.stringify(_this.inState));
        if(_this.options.enableAnimation){
            //console.log('_this.timer.timerDetach: ' + _this.timer.timerDetach);
            // 清除之前的延时动作。避免隐藏动画被冲掉
            clearTimeout(_this.timer.timerDetach);
            _this.timer.timerDetach = setTimeout(function () {
                //console.log('setTimeout inStatus: ' + JSON.stringify(_this.inState));
                //console.log('-----------');
                if(!_this.inState.hover && !_this.inState.keepShow){
                    $tip.detach();
                    _this.inState.keepShow = false;
                    //console.log('-----------detached-----------');
                }
            }, this.options.delay.hide);
        }else{
            if(!_this.inState.hover && !_this.inState.keepShow){
                $tip.detach();
                _this.inState.keepShow = false;
            }
        }
        return this;
    };

    /**
     * 显示tooltip
     * @returns {Tooltip}
     */
    Tooltip.prototype.hideWithAnimation = function ($element, options) {
        options = options || this.options;
        $element = $element || this.tip();
        if(options.enableAnimation){
            $element.stop(true).fadeOut(this.options.delay.hide);
            var animation = this.getAnimation();
            if(animation && typeof animation === 'object'){
                $element.animateCss(options.animation.hide);
            }
        }else{
            $element.stop(true).show();
        }
    };

    /**
     * @doc 获取元素位置
     * @param $element
     * @returns {*}
     */
    Tooltip.prototype.getElementPosition = function ($element) {
        $element = $element || this.$element;
        var el     = $element[0];

        var isBody = el.tagName.toUpperCase() === 'BODY';

        var elRect    = el.getBoundingClientRect();
        if (elRect.width == null) {
            // width and height are missing in IE8, so compute them manually; see https://github.com/twbs/bootstrap/issues/14093
            elRect = $.extend({}, elRect, { width: elRect.right - elRect.left, height: elRect.bottom - elRect.top })
        }
        var isSvg = window.SVGElement && el instanceof window.SVGElement;
        // Avoid using $.offset() on SVGs since it gives incorrect results in jQuery 3.
        // See https://github.com/twbs/bootstrap/issues/20280
        var elOffset  = isBody ? { top: 0, left: 0 } : (isSvg ? null : $element.offset());
        var scroll    = { scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop() };
        var outerDims = isBody ? { width: $(window).width(), height: $(window).height() } : null;

        return $.extend({}, elRect, scroll, outerDims, elOffset)
    };

    /**
     * @doc 设置位置
     * @returns {Tooltip}
     */
    Tooltip.prototype.setPosition = function ($element, position) {
        $element = $element || this.tip();
        position = position || this.getElementPosition();

        var tipSize = this.getElementSize($element);

        this.placement = this.getPlacement();
        var positionSuitable = this.getSuitablePosition(this.placement, position, tipSize.width, tipSize.height);

        var options = this.options;
        // 位置偏移
        if(options.positionOffset && typeof options.positionOffset === 'object'){
            positionSuitable = this.setPositionOffset($element, positionSuitable);
        }
        this.tipPosition = positionSuitable;

        // 位置确定后，再确定一下位置是否"合适"，不合适则修正
        if(options.autoAdaptPlacement){
            this.setPositionAutoAdapt(this.$element, position, tipSize);
        }

        $element.css({top: this.tipPosition.top, left: this.tipPosition.left});
        $element.addClass('tooltip-placement-' + this.placement);

        return this;
    };

    /**
     * @doc 自动设置合适的位置
     * @param $element
     * @param position
     * @param tipSize
     * @returns {*}
     */
    Tooltip.prototype.setPositionAutoAdapt = function ($element, position, tipSize) {
        $element = $element || this.$element;
        // 0. 优先使用用户指定的位置，若不适应，则使用上方的位置，再使用右侧的位置，再使用下方位置，再使用左侧位置
        // 判断方式：1.对于$element本身；2.对于tip
        // 1. left值过于小，则说明太靠左侧。此时不能设置left位置，
        // 2. right值(left值+元素宽度)大于容器宽度，则说明太靠右侧
        // 3. top值小于0，则说明太靠顶部
        // 4. bottom(top值+元素高度)大于容器宽度，则说明太靠底部
        position = position || this.getElementPosition($element);
        var tipPosition = this.tipPosition;
        var adaptFlag = false;
        var placement = this.placement;
        var outerPosition = this.getElementPosition($('body'));
        console.log('outerPosition', outerPosition);
        this.placement = placement === 'top'    && position.top     - tipSize.height    < outerPosition.top     ? 'bottom'  :
                         placement === 'bottom' && position.bottom  + tipSize.height    > outerPosition.bottom  ? 'top'     :
                         placement === 'left'   && position.left    - tipSize.width     < outerPosition.left    ? 'right'   :
                         placement === 'right'  && position.right   + tipSize.width     > outerPosition.right   ? 'left'    : placement;
        this.tipPosition = this.getSuitablePosition(this.placement, position, tipSize.width, tipSize.height);
        // 箭头偏移
        return this;
    };

    /**
     * @doc 设置位置偏移
     * @param $element
     * @param position
     * @returns {Tooltip}
     */
    Tooltip.prototype.setPositionOffset = function ($element, position) {
        var options = this.options;
        position = position || this.getTipPosition();

        return this.calculatePositionOffset(position, parseInt(options.positionOffset.left), parseInt(options.positionOffset.top));
    };

    /**
     * @doc 获取元素位置
     * @param $element
     * @returns {*}
     */
    Tooltip.prototype.getPlacement = function ($element) {
        var o  = this.options;
        $element = $element || this.$element;
        return $element.attr('data-tooltip-placement') || $element.attr('tooltip-placement') || o.placement;
    };

    /**
     * @doc 获取元素宽高大小，注意，此时不包含外边距
     * @param $element
     * @returns {{width: *, height: *}}
     */
    Tooltip.prototype.getElementSize = function ($element) {
        $element = $element || this.tip();
        return {
            width: $element.outerWidth(),
            height: $element.outerHeight(),
        }
    };

    /**
     * @doc 获取tooltip适宜的位置
     * @param placement
     * @param position
     * @param actualWidth
     * @param actualHeight
     * @returns {{top: *, left: *}}
     */
    Tooltip.prototype.getSuitablePosition = function (placement, position, actualWidth, actualHeight) {
        var positionSuitable = $.extend({}, position);
        switch (placement){
            case 'top' || 'top-center':
                positionSuitable.top = this.calculatePositionOffset(position, null, actualHeight).top;
                positionSuitable.left = this.calculatePositionOffset(position, (actualWidth - position.width) / 2, null).left;
                break;
            case 'left':
                positionSuitable.top = this.calculatePositionOffset(position, null, (actualHeight - position.height) / 2).top;
                positionSuitable.left = this.calculatePositionOffset(position, actualWidth, null).left;
                break;
            case 'right':
                positionSuitable.top = this.calculatePositionOffset(position, null, (actualHeight - position.height) / 2).top;
                positionSuitable.left = this.calculatePositionOffset(position, -position.width, null).left;
                break;
            case 'bottom' || 'bottom-center':
                positionSuitable.top = this.calculatePositionOffset(position, null, - position.height).top;
                positionSuitable.left = this.calculatePositionOffset(position, (actualWidth - position.width) / 2, null).left;
                break;
            case 'top-left':
                positionSuitable.top = this.calculatePositionOffset(position, null, actualHeight).top;
                positionSuitable.left = this.calculatePositionOffset(position, actualWidth / 2, null).left;
                break;
            case 'top-right':
                positionSuitable.top = this.calculatePositionOffset(position, null, actualHeight).top;
                positionSuitable.left = this.calculatePositionOffset(position, - (position.width - actualWidth / 2), null).left;
                break;
            case 'bottom-left':
                positionSuitable.top = this.calculatePositionOffset(position, null, - position.height).top;
                positionSuitable.left = this.calculatePositionOffset(position, actualWidth / 2, null).left;
                break;
            case 'bottom-right':
                positionSuitable.top = this.calculatePositionOffset(position, null, - position.height).top;
                positionSuitable.left = this.calculatePositionOffset(position, - (position.width - actualWidth / 2), null).left;
                break;
            default:
                positionSuitable.top = this.calculatePositionOffset(position, null, actualHeight).top;
                positionSuitable.left = this.calculatePositionOffset(position, (actualWidth - position.width) / 2, null).left
        }
        return positionSuitable;
    };

    /**
     * @doc
     * @returns {Tooltip}
     */
    Tooltip.prototype.calculatePositionOffset = function (position, actualWidth, actualHeight) {
        var positionNew = $.extend({}, position);
        positionNew.top =  actualHeight ? parseInt(position.top) - parseInt(actualHeight) : parseInt(position.top);
        positionNew.left = actualWidth ? parseInt(position.left) - parseInt(actualWidth) : parseInt(position.left);
        return positionNew;
    };

    /**
     * @doc 取得tooltip dom
     * @returns {*|HTMLElement}
     */
    Tooltip.prototype.tip = function () {
        if (!this.$tip) {
            this.$tip = $(this.options.template);
            if (this.$tip.length !== 1) {
                throw new Error(this.type + ' `template` option must consist of exactly 1 top-level element!');
            }
        }
        return this.$tip;
    };

    /**
     * @doc 获取默认选项
     * @returns Object
     */
    Tooltip.prototype.getTipPosition = function () {
        return this.tipPosition;
    };

    /**
     * @doc 获取动画效果
     * @returns {Tooltip}
     */
    Tooltip.prototype.getAnimation = function (options) {
        if(!this.animation){
            options = options || this.options;
            var animation = undefined;
            if(options.animation && typeof options.animation === 'object'){
                animation = options.animation;
            }
            var $element = this.$element;
            var showAnimation = $element.attr('data-tooltip-animation-show') || $element.attr('data-tooltip-animation') || undefined;
            var hideAnimation = $element.attr('data-tooltip-animation-hide') || $element.attr('data-tooltip-animation') || undefined;
            animation = ((showAnimation && hideAnimation) ? {show: showAnimation, hide: hideAnimation}: undefined) || animation;
            this.animation = animation;
        }
        return this.animation;
    };

    /**
     * @doc 获取tip的IDs
     * @returns Object
     */
    Tooltip.prototype.getTipUId = function () {
        return this.tipUId;
    };

    /**
     * @doc 获取展示内容
     * @returns {*}
     */
    Tooltip.prototype.title = function () {
        var title;
        var $e = this.$element;
        var o  = this.options;

        title = $e.attr('title') || $e.attr('data-original-title') || (typeof o.title === 'function' ? o.title.call($e[0]) :  o.title) || 'Tooltip';

        return title;
    };

    /**
     * @doc 使用了tooltip后，消除原生的tittle显示，使原来的tittle属性为空。
     * @returns {Tooltip}
     */
    Tooltip.prototype.fixTitle = function () {
        var $e = this.$element;
        if ($e.attr('title') || typeof $e.attr('data-original-title') !== 'string') {
            $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
        }
        return this;
    };

    /**
     * @doc 设置tooltip内容
     * @returns {Tooltip}
     */
    Tooltip.prototype.setContent = function () {
        var $tip  = this.tip();
        var title = this.title();

        $tip.find('.tooltip-inner')[this.options.enableHtml ? 'html' : 'text'](title);
        $tip.attr('class', '').addClass('tooltip-wrap');
        //$tip.removeClass('fade in top bottom left right top-center top-left top-right bottom-left bottom-center bottom-right');
        return this;
    };

    /**
     * @doc 三角形
     * @returns {*|number|{}}
     */
    Tooltip.prototype.arrow = function () {
        return (this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow'));
    };

    /**
     * @doc 获取默认选项
     * @returns Object
     */
    Tooltip.prototype.getDefaults = function () {
        return Tooltip.DEFAULTS;
    };

    /**
     * @doc 获取随机唯一id
     * @param prefix
     * @returns {*}
     */
    Tooltip.prototype.getUID = function (prefix) {
        do prefix += ~~(Math.random() * 1000000);
        while (document.getElementById(prefix));
        return prefix;
    };

    /* --------------------------- 开发用内部功能函数 --------------------------- */
    function logError(message) {
        if(window.console){
            window.console.error(message);
        }
    }

    /**
     * @doc 加载插件到jquery
     * @param options
     * @param args
     * @returns {undefined|*}
     */
    $.fn[tooltip] = function (options, args) {
        var result = undefined;
        this.each(function () {
            var $this = $(this);
            var _this = $.data(this, tooltip);
            if (typeof options === 'string') {
                if (!_this) {
                    logError('Not initialized, can not call method : ' + options);
                }
                else if (!$.isFunction(_this[options]) || options.charAt(0) === '_') {
                    logError('No such method : ' + options);
                }
                else {
                    if (options === 'destroy') {
                        $this.removeData(tooltip);
                    }
                    if (!(args instanceof Array)) {
                        args = [ args ];
                    }
                    result = _this[options].apply(_this, args);
                }
            }
            else if (typeof options === 'boolean') {
                result = _this;
            }
            else {
                $.data(this, tooltip, new Tooltip(this, $.extend(true, {}, options)));
            }
        });
        return result || this;
    };

    $.fn.tooltip.Constructor = Tooltip;
    $.fn.tooltip.defaults = Tooltip.DEFAULTS;

})(jQuery, window, document);