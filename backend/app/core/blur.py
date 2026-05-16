import cv2
import numpy as np

def apply_blur(image_path: str, output_path: str, bboxes: list, blur_strength: int = 51):
    """
    Applies Gaussian blur to specific bounding boxes in an image.
    bboxes format: [[x, y, w, h], ...] (Standardized format)
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image at {image_path}")

    for (x, y, w, h) in bboxes:
        # Boundary checks
        img_h, img_w = img.shape[:2]
        x_min, x_max = max(0, x), min(img_w, x + w)
        y_min, y_max = max(0, y), min(img_h, y + h)

        if x_max > x_min and y_max > y_min:
            roi = img[y_min:y_max, x_min:x_max]
            ksize = (blur_strength, blur_strength)
            blurred_roi = cv2.GaussianBlur(roi, ksize, 0)
            img[y_min:y_max, x_min:x_max] = blurred_roi

    cv2.imwrite(output_path, img)
    return output_path
