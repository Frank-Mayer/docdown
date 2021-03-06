import { Size } from "../../data/pageSize";

const pixelToPoint = (pixel: number): number => {
  return pixel * 0.75;
};

type imageData = {
  size: Size;
  dataUrl: string;
};
const imageDataCache = new Map<string, imageData>();
export const getImageData = (image: string): Promise<imageData> =>
  new Promise((resolve, reject) => {
    const isAlreadyDataUrl = image.startsWith("data:image");

    if (imageDataCache.has(image)) {
      resolve(imageDataCache.get(image) as imageData);
      return;
    }

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject("Could not get canvas context");
      }

      ctx!.drawImage(img, 0, 0);

      if (isAlreadyDataUrl) {
        resolve({
          size: new Size(pixelToPoint(img.width), pixelToPoint(img.height)),
          dataUrl: image,
        });
      } else {
        const data: imageData = {
          size: new Size(pixelToPoint(img.width), pixelToPoint(img.height)),
          dataUrl: canvas.toDataURL("image/jpeg", 0.9),
        };

        imageDataCache.set(image, data);
        resolve(data);
      }

      // cleanup
      img.onload = null;
      img.remove();
    };

    img.src = image;
  });
