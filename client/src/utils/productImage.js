import cropsImage from '../assets/categories/crops.png';
import vegetablesImage from '../assets/categories/vegetables.png';
import fruitsImage from '../assets/categories/fruits.png';
import livestockImage from '../assets/categories/livestock.png';
import poultryImage from '../assets/categories/poultry.png';
import fishImage from '../assets/categories/fish.png';

const categoryImages = {
    crops: cropsImage,
    vegetables: vegetablesImage,
    fruits: fruitsImage,
    livestock: livestockImage,
    poultry: poultryImage,
    fish: fishImage
};

/**
 * Returns the default category image.
 * Handles uppercase letters, spaces, and missing categories safely.
 */
export const getCategoryImage = (category) => {
    const categoryKey = String(category || '')
        .trim()
        .toLowerCase();

    return categoryImages[categoryKey] || cropsImage;
};

/**
 * Returns the farmer's uploaded image when available.
 * Falls back to the category image when no valid product image exists.
 */
export const getProductImage = (product) => {
    const uploadedImage = String(product?.image || '').trim();

    if (uploadedImage) {
        return uploadedImage;
    }

    return getCategoryImage(product?.category);
};

export default categoryImages;
