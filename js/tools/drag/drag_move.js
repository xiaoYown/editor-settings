function defineProperty(obj, key, value, set){
	Object.defineProperty(obj, key, {
		enumerable: true,
		configurable: true,
		get: function(){
			return value
		},
		set: function(newVal, oldVal){
			if (value === newVal) {
                return
            } else {
                value = newVal
            }
			set(newVal, oldVal);
		}
	});
}
var XyDragmove = function(option){
	return new XyDragmove.prototype.init(option);
}
XyDragmove.prototype = {
	constructor: XyDragmove,
	
	/**
	 * el: 拖拽元素
	 * axis: x,y,w,h
	 * isResize: 是否启动resize
	 * isRotate: 是否启动rotate
	 */
	init: function({el, axis, isResize, isEqual, isRotate, limitSize, limitAxis, dragstart, dragmove, dragend, resizestart, resizing, resizeend, rotatestart, rotating, rotateend}){

		if( !!this.el ) return;

		this.el 	= el;
		this.resizes = [];

		/* 回调绑定 */
		this._dragstart 	= dragstart	|| function(){};
		this._dragmove  	= dragmove	|| function(){};
		this._dragend   	= dragend	|| function(){};
		this._resizestart	= resizestart || function(){};
		this._resizeend		= resizeend || function(){};
		this._resizing		= resizing || function(){};
		this._rotatestart 	= rotatestart;
		this._rotating 		= rotating;
		this._rotateend 	= rotateend;
		/* 限制绑定 */
		this.limitSize 		= {
			minW: limitSize ? limitSize.minW : 0,
			maxW: limitSize ? limitSize.maxW : 0,
			minH: limitSize ? limitSize.minH : 0,
			maxH: limitSize ? limitSize.maxH : 0,
		};
		this.limitAxis 		= limitAxis || {};
		/* 等比 */
		this.isEqual = !!isEqual;
		/* 数据初始化 */
		this.data_init();
		/* 视图绑定 */
		this.bind_view();
		/* 事件绑定 */
		this.bind_move();
		if( isResize )
			this.bind_resize();
		if( isRotate )
			this.bind_rotate();
		return this;
	},
	data_init(){
		this.el_resizes = []; 		// resizes元素
		this.el_rotate 	= null;		// rotate元素
		this.mouse 		= {};
		this.axis_bf 	= {};
		this.axis 		= {};
		this.size_bf 	= {};
		this.size 		= {};
		this.deg_bf 	= 0;
		this.deg 		= 0;
		this.deg_op 	= 0;
	},
	show(bool){
		this.is_show = bool;
		if( bool ){
			this.is_show 
			this.el.style.display = 'block';
		} else {

			this.el.style.display = 'none';
		}
	},
	bind_view(){
		let _this = this;
		defineProperty( this.axis, 'x', 0 , function(newVal, oldVal){
			_this.el.style.left = newVal + 'px';
		} );
		defineProperty( this.axis, 'y', 0, function(newVal, oldVal){
			_this.el.style.top  = newVal + 'px';
		} );
		defineProperty( this.size, 'w', 0 , function(newVal, oldVal){
			_this.el.style.width = newVal + 'px';
		} );
		defineProperty( this.size, 'h', 0, function(newVal, oldVal){
			_this.el.style.height  = newVal + 'px';
		} );
		defineProperty( this, 'is_show', false, function(newVal, oldVal){
			if( newVal ){
				_this.el.style.display = 'block';
			} else {
				_this.el.style.display = 'none';
			}
		} );
		defineProperty( this, 'deg', 0, function(newVal, oldVal){
			_this.el.style.transform = 'rotate(' + newVal + 'deg)';
		} );
	},
	bind_move: function(){
		this.el.setAttribute('draggable', true);
		this.el.addEventListener('dragstart', this.dragstart.bind(this), false);
		this.el.addEventListener('drag', this.dragmove.bind(this), false);
		this.el.addEventListener('dragend', this.dragend.bind(this), false);
	},
	off_move: function(){
		this.el.removeEventListener('dragstart', this.dragstart.bind(this), false);
		this.el.removeEventListener('drag', this.dragmove.bind(this), false);
		this.el.removeEventListener('dragend', this.dragend.bind(this), false);
	},
	bind_resize: function(){
		if( this.resizes.length > 0 ) return;

		let _this = this;

		let frag = document.createDocumentFragment(),
			resize = null,
			resizes = [
			'xy-resize-top-left',
			'xy-resize-top-center',
			'xy-resize-top-right',
			'xy-resize-middle-right',
			'xy-resize-bottom-center',
			'xy-resize-bottom-left',
			'xy-resize-middle-left',
			'xy-resize-bottom-right',
		];
		for( let i = 0, len = resizes.length; i < len; i++ ){
			resize = document.createElement('span');
			resize.className = 'xy-drag-container-resize ' + resizes[i];
			resize.setAttribute('draggable', true);
			resize.style.zIndex = i;
			this.el_resizes.push(resize);
			resize.addEventListener('dragstart', function(event){
				event.stopPropagation();
				_this.resizestart.call( _this, event, i);	
			}, false);
			resize.addEventListener('drag', function(event){
				event.stopPropagation();
				_this.resizing.call( _this, event, i);
			}, false);
			resize.addEventListener('dragend', function(event){
				event.stopPropagation();
				_this.resizeend.call( _this, event, i)
			}, false);
			frag.appendChild(resize);
		}
		this.el.appendChild(frag);
		
	},
	bind_rotate: function(){
		let rotate = document.createElement('span');
		rotate.className = 'xy-rotate';
		rotate.setAttribute('draggable', true);
		this.el_rotate = rotate;
		this.el.appendChild(rotate);

		this.el_rotate.addEventListener('dragstart', this.rotatestart.bind(this), false);
		this.el_rotate.addEventListener('drag', this.rotating.bind(this), false);
		this.el_rotate.addEventListener('dragend', this.rotateend.bind(this), false);

		let rotate_param = {
			c: parseInt(getComputedStyle(rotate).top.replace(/[^\d^\.]+/, ''), 10) - parseInt(getComputedStyle(rotate).width)/2
		};
		this.rotate_param = rotate_param;
	},
	rotatestart: function(event){
		event.stopPropagation();
		event.dataTransfer.setDragImage(shadow, 0,  0);
		this.get_center();

		this.deg_op = Math.atan( (event.clientX - this.center.x) / (this.center.y - event.clientY) )*180 / Math.PI;
	},
	rotating: function(event){
		event.stopPropagation();
		if( event.clientX == 0 && event.clientY == 0 ) return;

		let y_d = this.center.y - event.clientY,
			deg_ed = 0;

		if( y_d < 0 ){
			deg_ed = 180 - Math.atan( (event.clientX - this.center.x) / ( 0 - y_d ) )*180 / Math.PI;
		} else {
			deg_ed = Math.atan( (event.clientX - this.center.x) / y_d )*180 / Math.PI;
		}

		let deg = this.deg_bf + Math.floor(deg_ed - this.deg_op);

		this.deg = deg < 0 ? deg + 360 : deg > 360 ? deg - 360 : deg;

		this._rotating(this.deg);
	},
	rotateend(){
		this.deg_bf = this.deg;
	},
	get_center(){
		let center = {
			x: this.el.offsetLeft  + this.size.w/2,
			y: this.el.offsetTop + this.size.h/2,
		};
		this.center = center;
	},
	set_coord(coord){
		console.log(coord.deg)
		this.axis.x = coord.x;
		this.axis.y = coord.y;
		this.size.w = coord.w;
		this.size.h = coord.h;
		this.deg 	= coord.deg;
		this.set_record();
	},
	set_record: function(){
		this.axis_bf.x = this.axis.x;
		this.axis_bf.y = this.axis.y;
		this.size_bf.w = this.size.w;
		this.size_bf.h = this.size.h;
		this.deg_bf    = this.deg;
	},
	dragstart: function(event){
		event.stopPropagation();
		event.dataTransfer.setDragImage(shadow, 0,  0);
		this.mouse.x = event.clientX;
		this.mouse.y = event.clientY;

		this._dragstart(this.axis_bf);
	},
	dragmove(event){
		event.stopPropagation();
		if( event.clientX == 0 && event.clientY == 0 ) return;
		let axis = {
			x: this.axis_bf.x + ( event.clientX - this.mouse.x ),
			y: this.axis_bf.y + ( event.clientY - this.mouse.y ),
		}
		this.axis.x = axis.x;
		this.axis.y = axis.y;
		this._dragmove(axis);
	},
	dragend: function(event){
		event.stopPropagation();
		this.set_record();
		this._dragend({
			x: this.axis.x,
			y: this.axis.y,
		});
	},
	resizestart: function(event, i){
		event.stopPropagation();
		event.dataTransfer.setDragImage(shadow, 0,  0);
		this.mouse.x = event.clientX;
		this.mouse.y = event.clientY;
	},
	resizing: function(event, index){
		// 防跳动
		if( event.clientX == 0 && event.clientY == 0 ) return;
		let distance = {
				x: event.clientX - this.mouse.x,
				y: event.clientY - this.mouse.y,
			},
			axis = {
				x: this.axis_bf.x,
				y: this.axis_bf.y,
			}, 
			size = {
				w: this.size_bf.w,
				h: this.size_bf.h,
			};
		switch (index) {
			case 0:
				size = {
					w: this.size_bf.w - distance.x,
					h: this.size_bf.h - distance.y,
				};
				if( this.isEqual ){
					if( size.w < size.h ){
						size.w = size.h;
						axis = {
							x: this.axis_bf.x + distance.y,
							y: this.axis_bf.y + distance.y,
						};
					} else {
						size.h = size.w;
						axis = {
							x: this.axis_bf.x + distance.x,
							y: this.axis_bf.y + distance.x,
						};
					}
				} else {
					axis = {
						x: this.axis_bf.x + distance.x,
						y: this.axis_bf.y + distance.y,
					};
				}
				break;
			case 1:
				axis.y = this.axis_bf.y + distance.y;
				size.h = this.size_bf.h - distance.y;
				break;
			case 2:
				size = {
					w: this.size_bf.w + distance.x,
					h: this.size_bf.h - distance.y,
				};
				axis.y = this.axis_bf.y + distance.y;
				if( this.isEqual ){
					if( size.w < size.h ){
						size.w = size.h;
					} else {
						size.h = size.w;
						axis.y = this.axis_bf.y - distance.x;
					}
				}
				break;
			case 3:
				size.w = this.size_bf.w + distance.x;
				if( this.deg > 0 && this.deg < 180 ){
					let deg_b  = Math.atan(this.size_bf.h/this.size_bf.w),
						deg_b_ = Math.atan(this.size.h/this.size.w),
						deg_c  = deg_b  + this.deg_bf*180/Math.PI,
						deg_c_ = deg_b_ + this.deg_bf*180/Math.PI,
						z      = Math.sqrt((Math.pow(this.size_bf.h, 2) + Math.pow(this.size_bf.w, 2))/4),
						_z     = Math.sqrt((Math.pow(this.size.h,    2) + Math.pow(this.size.w,    2))/4);

					let coord = {
							x: this.axis_bf.x + this.size_bf.w/2 - z*Math.cos(deg_c),
							y: this.axis_bf.y + this.size_bf.h/2- z*Math.sin(deg_c),
						},
						_coord = {
							x: this.axis.x + this.size.w/2 - _z*Math.cos(deg_c_),
							y: this.axis.y + this.size.h/2 - _z*Math.sin(deg_c_),
						};

					let d = {
							x: coord.x - _coord.x,
							y: coord.y - _coord.y,
						};
					// axis.x = this.axis.x + d.x;
					axis.y = this.axis.y + d.y;
				}
				break;
			case 4:
				size.h = this.size_bf.h + distance.y;
				break;
			case 5:
				size = {
					w: this.size_bf.w - distance.x,
					h: this.size_bf.h + distance.y,
				};
				axis.x = this.axis_bf.x + distance.x;
				if( this.isEqual ){
					if( size.w < size.h ){
						size.w = size.h;
						axis.x = this.axis_bf.x - distance.y;
					} else {
						size.h = size.w;
					}
				}
				break;
			case 6:
				axis.x = this.axis_bf.x + distance.x;
				size.w = this.size_bf.w - distance.x;
				break;
			case 7:
				size = {
					w: this.size_bf.w + distance.x,
					h: this.size_bf.h + distance.y,
				};
				if( this.isEqual ){
					if( size.w < size.h ){
						size.w = size.h;
					} else {
						size.h = size.w;
					}
				}
				break;
		}
		if( size.w >= this.limitSize.minW && ( !this.limitSize.maxW || size.w <= this.limitSize.maxW) ){
			this.axis.x = axis.x;
			this.size.w = size.w;
		}
		if( size.h >= this.limitSize.minH && ( !this.limitSize.maxH || size.h <= this.limitSize.maxH) ){
			this.axis.y = axis.y;
			this.size.h = size.h;
		}
		this._resizing({
			x: this.axis.x,
			y: this.axis.y,
			w: this.size.w,
			h: this.size.h,
		});
	},
	resizeend: function(event){
		event.stopPropagation();
		this.set_record();
	},
	destroy: function(){

	}
};

XyDragmove.prototype.init.prototype = XyDragmove.prototype;
