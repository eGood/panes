(function($, exports){

    var Panes = function(ele, direction){
        if(!(this instanceof Panes)){
            return new Panes(ele, direction);
        }
        // this will lock scrolling
        this.locked = null;
        this.current = 1;
        this.position = 0;
        this.direction = (direction === "horizontal") ? 1 : 0 ;
        this.ele = ele;
        this.els = ele.find("> *");
        this.top = (this.direction) ? ele.position().left : ele.position().top;
        this.view = (this.direction) ? this.els.outerWidth(true) : this.els.outerHeight(true);
        this.threshold = (this.view / 10);
        this.animating = 0;
        this.max = this.els.length;
        this.touch = (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) ?
            true : false;
        this.transform = (function () {
            var b = document.body || document.documentElement,
                s = b.style,
                p = 'transform',v;
            if(typeof s[p] == 'string') {return p; }
            // Tests for vendor specific prop
            v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'];
            p = p.charAt(0).toUpperCase() + p.substr(1);
            for(var i=0; i<v.length; i++) {
                if(typeof s[v[i] + p] == 'string') { return v[i] + p; }
            }
            return (direction) ? "top" : "left";
        }());
        this.transition = (function () {
            var b = document.body || document.documentElement,
                s = b.style,
                p = 'transition',v;
            if(typeof s[p] == 'string') {return p; }
            // Tests for vendor specific prop
            v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'];
            p = p.charAt(0).toUpperCase() + p.substr(1);
            for(var i=0; i<v.length; i++) {
                if(typeof s[v[i] + p] == 'string') { return v[i] + p; }
            }
            return null;
        }());
        this.prefixed = (this.transition) ? 
            "-" + this.transform.split(/tran/i).join("-tran").toLowerCase() : 
            null;
        this.ele.css(this.transform, this.Css(0));
        this.eleTop = this.Css(ele);
        this.move = (/transform/.test(this.transform)) ? "animate" : "css";
        this.axis = (this.direction) ? "width" : "height" ;
        this.page = (this.direction) ? "pageX" : "pageY" ;
    
        this.init();
    
    };

    Panes.prototype.lock = function(){
        this.locked = true;
        //bounce it back to current position
        //this.goto(this.current);
    };

    Panes.prototype.speed = null;

    Panes.prototype.Css = function(value){
        if(value instanceof jQuery){
            if(!(/transform/i.test(this.transform))){
                return value.css(this.transform);
            }
            if(this.direction){
                return parseFloat(value.css(this.transform).split(/\(/)[1].split(/\,/)[4]);
            }
            // also need to detect direction here
            return parseFloat(value.css(this.transform).split(/\(/)[1].split(/\,/).pop());
        }

        if(!(/transform/i.test(this.transform))){
            return value;
        }

        if(this.direction){
            return "translate3d(" + ((/px/.test(value)) ? value : value + "px") + ",0,0)";
        }
        // also need to detect direction here
        return "translate3d(0," + ((/px/.test(value)) ? value : value + "px") + ",0)";
    };

    Panes.prototype.goto = function(integer, time){
        var obj = {};
        var that = this;
        var changed;

        if(this.current !== integer){
            changed = true;
        }
        this.prev = this.current;
        integer = parseFloat(integer);
        if(integer < 1 || integer > this.max) return false;
        this.current = integer;
        obj[this.transform] = this.Css(-(this.view-2)*(integer-1));
        if(this.transition){
            obj[this.transition] =  that.prefixed + " " + time + "s ease-out 0s";
        }
        this.animating = 1;
        this.ele[this.move](obj);
        setTimeout(function(){  
            that.animating = 0;
            that.ele.removeClass('animate');
            if(that.onChange && changed) that.onChange(that.current, that.els.length);
        },500);
    };  

    Panes.prototype.events = function(){
        var that = this;

        this.clock = function(){
            var distance = that.position;
            setTimeout(function(){
                distance = that.position - distance;
                // check speed every ten milliseconds
                that.speed = distance / 50;
            },50);
        };

        this.drag = function(e){
            e.preventDefault(); 
            if(that.start && !that.animating && !that.locked){       
                var y = e.originalEvent.touches[0][that.page];
                var differnce = (y - that.top) - that.start;
                var change =  differnce + that.eleTop;

                if(that.onScroll) that.onScroll(differnce);
             
                that.ele.css(that.transform, that.Css(change));
                that.position = differnce;
            }
        };

        this.dragend = function(e){

            clearInterval(that.timer);

            if(!that.locked){

                if(that.onScrollStop) that.onScrollStop();
                var speed = ((that.speed < 0) ? that.speed * -1 : that.speed );
                var distance = ((this.position < 0) ? this.position * -1 : this.position );
                var time = (speed) ? ((this.view - distance) / speed) / 1000  : ".5";

                if((that.position > that.threshold || (time < 0.5 && this.position > 0)) && that.current !== 1){
                    if(time > 0.5){
                        time = 0.5;
                    }
                    that.goto(that.current - 1, time);
                }else if((that.position < (that.threshold * -1) || (time < 0.5 && this.position < 0)) && that.current !== that.max){
                    if(time > 0.5){
                        time = 0.5;
                    }
                    that.goto(that.current + 1, time);
                }else{
                    that.goto(that.current, 0.5);
                }
            }
        };

        this.touchStart = function(e){
            that.time = 0;
            that.timer = setInterval(that.clock, 50);
            that.position = 0;

            var obj = {};
            if(that.transition){
                obj[that.transition] = "none";
            }

            e.preventDefault();
            that.start = e.originalEvent.touches[0][that.page] - that.top;
            that.eleTop = that.Css(that.ele);
            that.ele.css(obj).bind('touchmove', that.drag);
        };

        this.touchEnd = function(e){
            if(!that.animating){
                e.preventDefault();
                that.start = null;
                that.dragend();
                that.ele.unbind('touchmove', that.drag);
            }
        };

    };

    Panes.prototype.listen = function(){
        this.ele.on("touchstart", this.touchStart);
        this.ele.on("touchend", this.touchEnd);
    };  

    Panes.prototype.init = function(){
        //check direction then set height
        var obj = {};
        obj[this.axis] = (this.els.length * this.view ) + 'px';
        this.ele.css(obj);
        this.events();
        this.listen();
    };

    exports.Panes = Panes;

}(jQuery, this));