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
    stock: 0,
    beginDate: '',
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
                publicUrl: result.secure_url,
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
    if (['price', 'stock'].includes(fieldname)) {
      formData[fieldname] = Number(val);
    } else {
      formData[fieldname] = val;
    }
  });

  await new Promise((resolve, reject) => {
    bb.on('finish', resolve);
    bb.on('error', (err) => reject(new ErrorHandler(500, err.message)));
    req.pipe(bb);
  });

  // Validations
  if (!formData.name.trim()) throw new ErrorHandler(400, 'Stamp name is required');
  if (!formData.description.trim()) throw new ErrorHandler(400, 'Stamp description is required');
  if (formData.price < 0) throw new ErrorHandler(400, 'Price must be a positive number');
  if (formData.stock < 0) throw new ErrorHandler(400, 'Stock cannot be negative');

  if (!formData.beginDate) {
    throw new ErrorHandler(400, 'Begin date is required');
  }

  const beginDateParsed = new Date(formData.beginDate);
  if (isNaN(beginDateParsed.getTime())) {
    throw new ErrorHandler(400, 'Invalid begin date format');
  }

  let images = [];

  try {
    images = await Promise.all(uploadPromises);
    if (!images.length) throw new ErrorHandler(400, 'At least one image is required');
  } catch (error) {
    if (images.length) {
      await cloudinary.api.delete_resources(images.map((img) => img.publicId));
    }
    throw error;
  }

  const newStamp = await StampModel.create({
    ...formData,
    beginDate: beginDateParsed,
    images,
  });

  res.status(201).json({
    success: true,
    message: 'Stamp created successfully',
    stamp: newStamp,
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

  const stamps = await StampModel.find();

  res.status(200).json({
    success: true,
    stamps,
    message: 'Stamp and associated images deleted successfully'
  });
});



