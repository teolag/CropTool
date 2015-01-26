
var previewCanvas = document.getElementById('previewCanvas');
var previewContext = previewCanvas.getContext('2d');



document.getElementById("btnCropDogs").addEventListener("click", function(e) {
	CropTool.open({url:'dogs.jpg', ratio:2, cropCallback:cropCallback});
});

document.getElementById("btnCropDogs2").addEventListener("click", function(e) {
	CropTool.open({url:'dogs.jpg', outWidth:500, outHeight:500, cropCallback:cropCallback});
});

document.getElementById("btnWebURL").addEventListener("click", function(e) {
	CropTool.open({
		url:'http://www2.pingpong.se/wp-content/uploads/2013/12/pingpong_klossar3-1020x350.png',
		maxWidth: 100,
		maxHeight: 100,
		cropCallback:cropCallback
	});
});

document.getElementById("uploader").addEventListener("change", function(e) {
	var files = e.target.files;
	var reader = new FileReader();
	for(var i=0; i<files.length; i++) {
		reader.onload = function(e){
			CropTool.open({
				dataUrl: reader.result,
				cropCallback:cropCallback
			});
		}
		reader.readAsDataURL(files[i]);
	}
});



function cropCallback(data) {
	console.log("crop callback", data);

	var previewImg = new Image();
	previewImg.onload = function() {
		var width = data.width;
		var height = data.height;

		if(data.outWidth < width) {
			width = data.outWidth;
			height = data.outHeight * (data.outWidth/width);
		}

		var ratio = width/height;
		if(data.maxWidth < width) {
			width = data.maxWidth;
			height = width / ratio;
		}
		if(data.maxHeight < height) {
			height = data.maxHeight;
			width = height * ratio;
		}




		previewCanvas.width = width;
		previewCanvas.height = height;
		var sourceX = data.left;
		var sourceY = data.top;
		var sourceWidth = data.width;
		var sourceHeight = data.height;
		var destWidth = width;
		var destHeight = height;
		var destX = 0;
		var destY = 0;

		previewContext.drawImage(previewImg, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
	};

	if(data.url) previewImg.src = data.url;
	if(data.dataUrl) previewImg.src = data.dataUrl;
}