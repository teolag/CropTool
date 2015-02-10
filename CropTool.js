var CropTool = (function() {
	var main, area, image, box, boxResizer, info,
	cropData, zoom,
	cropCallback, cancelCallback,
	mouseDown, touchStart, downSize, action, startValue,

	btnOk, btnCancel,

	useRatio,


	open = function(s) {
		cropData = {};

		imageCreate(s);
		if(!image) return;

		createTool();

		if(s.ratio > 0) {
			cropData.ratio = s.ratio;
			useRatio = true;
		} else {
			useRatio = false;
		}

		if(s.maxWidth) cropData.maxWidth = s.maxWidth;
		if(s.maxHeight) cropData.maxHeight = s.maxHeight;

		if(s.outWidth) cropData.outWidth = s.outWidth;
		if(s.outHeight) cropData.outHeight = s.outHeight;

		if(s.outWidth && s.outHeight) {
			var r = s.outWidth / s.outHeight;
			if(s.ratio && s.ratio !== r) {
				console.log("Ratio conflict with out width and height");
				return;
			}
			cropData.ratio = r;
			useRatio = true;
		}

		cropCallback = s.onCrop;
		cancelCallback = s.onCancel;

		addEventListener("keydown", keyHandler, false);
		addEventListener("resize", fixLayout, false);

	},

	createTool = function(s) {
		main = document.createElement("div");
		main.classList.add("CropTool");

		area = document.createElement("div");
		area.classList.add("area");

		box = document.createElement("div");
		box.classList.add("box");
		box.addEventListener("dblclick", doCrop, false);
		addEventListener("mousedown", cropHandler, false);
		addEventListener("touchstart", cropHandler, false);

		boxResizer = document.createElement("div");
		boxResizer.classList.add("boxResizer");
		boxResizer.addEventListener("mousedown", cropHandler, false);
		boxResizer.addEventListener("touchstart", cropHandler, false);

		info = document.createElement("div");
		info.classList.add("info");


		btnOk = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		btnOk.classList.add("icon", "icon-ok");
		var btnOkUse = document.createElementNS("http://www.w3.org/2000/svg", "use");
		//btnOkUse.setAttributeNS("http://www.w3.org/1999/xlink", "href", "http://xio.se/projects/croptool/CropTool.svg#icon-ok");
		btnOk.appendChild(btnOkUse);
		btnOk.addEventListener("click", clickOk, false);
		btnOk.addEventListener("touchend", clickOk, false);

		btnCancel = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		btnCancel.classList.add("icon", "icon-cancel");
		var btnCancelUse = document.createElementNS("http://www.w3.org/2000/svg", "use");
		//btnCancelUse.setAttributeNS("http://www.w3.org/1999/xlink", "href", "http://xio.se/projects/croptool/CropTool.svg#icon-cancel");
		btnCancel.appendChild(btnCancelUse);
		btnCancel.addEventListener("click", clickCancel, false);
		btnCancel.addEventListener("touchend", clickCancel, false);

		main.appendChild(area);
		main.appendChild(btnOk);
		main.appendChild(btnCancel);
		document.body.appendChild(main);
	},

	imageCreate = function(s) {
		if(s.url) {
			image = new Image();
			image.src = s.url;
			cropData.url = s.url;
			console.debug("load from url", s.url);
		} else if(s.dataUrl) {
			image = new Image();
			image.src = s.dataUrl;
			cropData.dataUrl = s.dataUrl;
			console.debug("load from dataUrl", s.dataUrl);
		} else {
			console.warn("Either url or dataUrl must be defined to crop an image");
			return;
		}
		image.classList.add("image");
		image.addEventListener("load", imageLoaded, false);
	},

	imageLoaded = function() {
		cropData.originalWidth = image.width;
		cropData.originalHeight = image.height;
		area.appendChild(image);
		area.appendChild(box);
		area.appendChild(info);
		box.appendChild(boxResizer);

		bestFit();
		fixLayout();
	},

	bestFit = function() {
		cropData.left = 0;
		cropData.top = 0;
		cropData.width = cropData.originalWidth;
		cropData.height = cropData.originalHeight;

		if(useRatio) {
			if(cropData.width/cropData.height > cropData.ratio) {
				cropData.width = cropData.height*cropData.ratio;
				cropData.left = (cropData.originalWidth-cropData.width)/2;
			} else {
				cropData.height = cropData.width/cropData.ratio;
				cropData.top = (cropData.originalHeight-cropData.height)/2;
			}
		}
		updateBox();
	},

	fixLayout = function() {
		zoom = Math.min(
			(window.innerWidth * 0.9)/cropData.originalWidth,
			(window.innerHeight * 0.9)/cropData.originalHeight,
			1
		);
		image.width = Math.round(cropData.originalWidth * zoom);
		image.height = Math.round(cropData.originalHeight * zoom);

		area.style.height = image.height + "px";
		area.style.width = image.width + "px";
		area.style.left = Math.round((window.innerWidth-image.width)/2)+"px";
		area.style.top = Math.round((window.innerHeight-image.height)/2)+"px";

		updateBox();
	},

	updateBox = function() {
		box.style.top = Math.round(cropData.top*zoom) + "px";
		box.style.left = Math.round(cropData.left*zoom) + "px";
		box.style.width = Math.round(cropData.width*zoom) + "px";
		box.style.height = Math.round(cropData.height*zoom) + "px";

		/*
		boxResizer.style.top = (box.offsetTop + box.offsetHeight - 5) + "px";
		boxResizer.style.left = (box.offsetLeft + box.offsetWidth - 5) + "px";
		*/

		info.style.top = (box.offsetTop + box.offsetHeight + 1) + "px";
		info.style.right = (image.width - box.offsetLeft - box.offsetWidth + 7) + "px";
		info.textContent = cropData.width + " x " + cropData.height;

		if(cropData.width<cropData.outWidth || cropData.height<cropData.outHeight) {
			info.style.color = "#a44";
		} else {
			info.style.color = "";
		}

	},

	keyHandler = function(e) {
		var KEY_ESC = 27,
			KEY_ENTER = 13,
			KEY_SPACE = 32,
			KEY_LEFT = 37,
			KEY_UP = 38,
			KEY_RIGHT = 39,
			KEY_DOWN = 40
		;

		switch(e.which) {
			case KEY_ESC:
			cancel();
			break;

			case KEY_ENTER:
			doCrop();
			break;
		}

	},

	cropHandler = function(e) {
		//console.log("event", e.type, e.target);

		if(e.type === "mousedown" || e.type === "touchstart") {
			if(e.type === "mousedown") {
				mouseDown = {x: e.pageX, y: e.pageY};
				addEventListener("mouseup", cropHandler, false);
				addEventListener("mousemove", cropHandler, false);
				if(e.target===box) {
					action="move";
				} else if(e.target===boxResizer) {
					action="resize";
				}
			} else if(e.type === "touchstart") {
				//console.log("touchstart", e);
				touchStart = getTouchInfo(e);
				action="gesture";
				if(e.touches.length===1) {
					addEventListener("touchend", cropHandler, false);
					addEventListener("touchmove", cropHandler, false);
				}
			}
			startValue = {x: cropData.left, y: cropData.top, w: cropData.width, h: cropData.height};
			e.preventDefault();
		} else if(e.type === "mouseup") {
			action = null;
			removeEventListener("mouseup", cropHandler, false);
			removeEventListener("mousemove", cropHandler, false);
		} else if(e.type === "touchend") {
			//console.log("touchend", e);
			touchStart = getTouchInfo(e);
			startValue = {x: cropData.left, y: cropData.top, w: cropData.width, h: cropData.height};
			if(e.touches.length===0) {
				action = null;
				//console.log("alltouchend", e);
				removeEventListener("touchend", cropHandler, false);
				removeEventListener("touchmove", cropHandler, false);
			}
		} else if(e.type === "mousemove" || e.type === "touchmove") {
			var dx, dy, dw, dh;

			if(e.type === "mousemove") {
				var mouseNow = {x: e.pageX, y: e.pageY};
				if(action==="move") {
					dx = mouseNow.x - mouseDown.x;
					dy = mouseNow.y - mouseDown.y;
				} else {
					dw = mouseNow.x - mouseDown.x;
					dh = mouseNow.y - mouseDown.y;
				}
			} else if(e.type === "touchmove") {
				var touchNow = getTouchInfo(e);

				dx = touchNow.x - touchStart.x;
				dy = touchNow.y - touchStart.y;
				dw = (touchNow.w - touchStart.w)/1;
				dh = (touchNow.h - touchStart.h)/1;


				//console.log("dy", dy, "dh", dh);

				dy-=dh/2;
				dx-=dw/2;
			}

			if(dx || dy) {
				var x = Math.round(startValue.x + dx/zoom);
				var y = Math.round(startValue.y + dy/zoom);
				var w = cropData.width;
				var h = cropData.height;

				if(y<0) y = 0;
				if(x<0) x = 0;
				if(y+h>cropData.originalHeight) y = cropData.originalHeight-h;
				if(x+w>cropData.originalWidth) x = cropData.originalWidth-w;

				cropData.left = x;
				cropData.top = y;

			}
			if(dw || dh) {
				var w = startValue.w + dw/zoom;
				var h = startValue.h + dh/zoom;

				var minW = 20/zoom;
				var minH = 20/zoom;

				var maxW = cropData.originalWidth-cropData.left;
				var maxH = cropData.originalHeight-cropData.top;

				if(useRatio) {
					var p = {x:w, y:h};
					var r = cropData.ratio;
					var m = p.y + p.x*r;
					/*
					x/r = m - x*r
					m = x(1/r + r)
					x = m / (1/r + r)
					*/
					w = m / (r + 1/r);
					h = w/r;

					if(r > 1) {
						minW = minH*r;
					} else {
						minH = minW/r;
					}
				}

				if(w<minW) w = minW;
				if(h<minH) h = minH;

				if(h>maxH) {
					h = maxH;
					if(useRatio) {
						w = maxH*r;
					}
				}
				if(w>maxW) {
					w = maxW;
					if(useRatio) {
						h = maxW/r;
					}
				}

				cropData.width = Math.round(w);
				cropData.height = Math.round(h);
			}
			updateBox();
		}
	},


	clickOk = function(e) {
		doCrop();
	},

	clickCancel = function(e) {
		cancel();
	},


	getTouchInfo = function(e) {
		var maxX=0, minX=100000, maxY=0, minY=100000;
		for(var i=0; i<e.touches.length; i++) {
			var t = e.touches[i];
			maxX = Math.max(maxX, t.pageX);
			minX = Math.min(minX, t.pageX);
			maxY = Math.max(maxY, t.pageY);
			minY = Math.min(minY, t.pageY);
		}
		//info.textContent = Math.round(minX) + ", " + Math.round(maxX);
		//info.textContent = Math.round(minY) + ", " + Math.round(maxY);
		return {
			x: (minX+maxX)/2,
			y: (minY+maxY)/2,
			w: Math.abs(minX-maxX),
			h: Math.abs(minY-maxY)
		};
	},

	doCrop = function() {
		if(cropCallback) {
			cropCallback(cropData);
		}
		close();
	},

	cancel = function() {
		if(cancelCallback) {
			cancelCallback();
		}
		close();
	},

	close = function() {
		removeEventListener("resize", fixLayout, false);
		removeEventListener("keypress", keyHandler, false);
		removeEventListener("mousedown", cropHandler, false);
		removeEventListener("touchstart", cropHandler, false);
		document.body.removeChild(main);
	};

	return {
		open: open
	}
}());