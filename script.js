const upload = document.getElementById("upload");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let originalImage = null;

upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    };
    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
});

function getImageCopy() {
  return new ImageData(
    new Uint8ClampedArray(originalImage.data),
    originalImage.width,
    originalImage.height
  );
}

function grayscale() {
  if (!originalImage) return;
  const imageData = getImageCopy();
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = avg;
  }
  ctx.putImageData(imageData, 0, 0);
}

function thresholding(thresh = 128) {
  if (!originalImage) return;
  const imageData = getImageCopy();
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const val = avg > thresh ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = val;
  }
  ctx.putImageData(imageData, 0, 0);
}

function invert() {
  if (!originalImage) return;
  const imageData = getImageCopy();
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  ctx.putImageData(imageData, 0, 0);
}

function blurImage() {
  if (!originalImage) return;
  const imageData = getImageCopy();
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const copy = new Uint8ClampedArray(data);
  const factor = 9;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = (y + ky) * width + (x + kx);
          const i = px * 4;
          r += copy[i];
          g += copy[i + 1];
          b += copy[i + 2];
        }
      }
      const i = (y * width + x) * 4;
      data[i] = r / factor;
      data[i + 1] = g / factor;
      data[i + 2] = b / factor;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

function edgeDetection() {
  if (!originalImage) return;
  const srcData = getImageCopy();
  const width = srcData.width;
  const height = srcData.height;
  const src = srcData.data;
  const dst = ctx.createImageData(width, height);
  const out = dst.data;
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sumX = 0;
      let sumY = 0;
      let k = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const i = ((y + ky) * width + (x + kx)) * 4;
          const gray = (src[i] + src[i + 1] + src[i + 2]) / 3;
          sumX += gx[k] * gray;
          sumY += gy[k] * gray;
          k++;
        }
      }
      const mag = Math.sqrt(sumX * sumX + sumY * sumY);
      const px = (y * width + x) * 4;
      out[px] = out[px + 1] = out[px + 2] = mag > 128 ? 255 : 0;
      out[px + 3] = 255;
    }
  }
  ctx.putImageData(dst, 0, 0);
}

function rotateImage() {
  if (!originalImage) return;

  const width = canvas.width;
  const height = canvas.height;
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  tempCanvas.width = height;
  tempCanvas.height = width;

  const img = new Image();
  img.onload = () => {
    tempCtx.translate(height / 2, width / 2);
    tempCtx.rotate(Math.PI / 2);
    tempCtx.drawImage(img, -width / 2, -height / 2);

    canvas.width = height;
    canvas.height = width;
    ctx.drawImage(tempCanvas, 0, 0);

    // ❗ originalImage-ni yangilamaymiz ❗
  };
  img.src = canvas.toDataURL();
}

function resetImage() {
  if (originalImage) {
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    ctx.putImageData(originalImage, 0, 0);
  }
}
