import busboy from 'busboy';
import { v2 as cloudinary } from 'cloudinary';
import StampModel from '../Model/stampModel.js';
import { synchFunc } from '../Utils/SynchFunc.js';
import { ErrorHandler } from '../Utils/ErrorHandler.js';

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const createStamp = synchFunc(async (req, res) => {
  const bb = busboy({ headers: req.headers });

  const formData = {
    name: '',
    description: '',
    price: 0,
    stock: 0
  };

  const uploadPromises = [];

  bb.on('file', (fieldname, file, info) => {
    const { mimeType } = info;

    if (!mimeType.startsWith('image/')) {
      throw new ErrorHandler(400, 'Only image files are allowed!');
    }

    const chunks = [];

    file.on('data', (chunk) => chunks.push(chunk));

    const uploadPromise = new Promise((resolve, reject) => {
      file.on('end', () => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'stamps' },
          (error, result) => {
            if (error || !result) {
              reject(new ErrorHandler(500, 'Failed to upload image to Cloudinary'));
            } else {
              resolve({
                publicId: result.public_id,
                publicUrl: result.secure_url
              });
            }
          }
        );
        uploadStream.end(Buffer.concat(chunks));
      });
    });

    uploadPromises.push(uploadPromise);
  });

  bb.on('field', (fieldname, val) => {
    formData[fieldname] = ['price', 'stock'].includes(fieldname) ? Number(val) : val;
  });

  await new Promise((resolve, reject) => {
    bb.on('finish', resolve);
    bb.on('error', err => reject(new ErrorHandler(500, err.message)));
    req.pipe(bb);
  });

  if (!formData.name.trim()) throw new ErrorHandler(400, 'Stamp name is required');
  if (!formData.description.trim()) throw new ErrorHandler(400, 'Stamp description is required');
  if (formData.price < 0) throw new ErrorHandler(400, 'Price must be a positive number');
  if (formData.stock < 0) throw new ErrorHandler(400, 'Stock cannot be negative');

  let images = [];

  try {
    images = await Promise.all(uploadPromises);
    if (!images.length) throw new ErrorHandler(400, 'At least one image is required');
  } catch (error) {
    if (images.length) {
      await cloudinary.api.delete_resources(images.map(img => img.publicId));
    }
    throw error;
  }

  const newStamp = await StampModel.create({
    ...formData,
    images
  });

  res.status(201).json({
    success: true,
    message: 'Stamp created successfully',
    stamp: newStamp
  });
});

export const deleteStamp = synchFunc(async (req, res) => {
  const { id } = req.params;

  const stamp = await StampModel.findById(id);
  if (!stamp) throw new ErrorHandler(404, 'Stamp not found');

  if (stamp.images.length) {
    const publicIds = stamp.images.map(img => img.publicId);
    await cloudinary.api.delete_resources(publicIds);
  }

  await StampModel.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Stamp and associated images deleted successfully'
  });
});

export const updateStampImages = synchFunc(async (req, res) => {
  const { id } = req.params;
  const { imagesToDelete } = req.body;

  if (!Array.isArray(imagesToDelete) || !imagesToDelete.length) {
    throw new ErrorHandler(400, 'No images specified for deletion');
  }

  const stamp = await StampModel.findById(id);
  if (!stamp) throw new ErrorHandler(404, 'Stamp not found');

  const existingPublicIds = stamp.images.map(img => img.publicId);
  const invalidIds = imagesToDelete.filter(id => !existingPublicIds.includes(id));
  if (invalidIds.length) throw new ErrorHandler(400, 'Some images not found in this stamp');

  await cloudinary.api.delete_resources(imagesToDelete);

  const updatedStamp = await StampModel.findByIdAndUpdate(
    id,
    { $pull: { images: { publicId: { $in: imagesToDelete } } } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Images deleted successfully',
    stamp: updatedStamp
  });
});


