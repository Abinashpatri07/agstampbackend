import busboy from "busboy";
import StampModel from "../Model/stampModel.js"
import { synchFunc } from "../Utils/SynchFunc.js";
import { v2 as cloudinary } from 'cloudinary';
import CarouselModel from "../Model/CarouselModel.js";

export const allStamps = synchFunc(async (_, res) => {
    const stamps = await StampModel.find();
    res.status(201).json({ success:true, stamps });
});


export const singleStamp = synchFunc(async (req, res) => {
    const {id} = req.params; 
    const stamp = await StampModel.findById(id);
    res.status(201).json({ success:true, stamp });
});


export const updateStamp = synchFunc(async (req, res) => {
  const bb = busboy({ headers: req.headers });
  const { id } = req.params;

  const formData = {};
  const fields = {};
  const files = [];
  const uploadPromises = [];

  bb.on('file', (fieldname, file, info) => {
    const { mimeType } = info;

    const chunks = [];
    file.on('data', (chunk) => chunks.push(chunk));

    const uploadPromise = new Promise((resolve, reject) => {
      file.on('end', () => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'stamps' },
          (error, result) => {
            if (error || !result) {
              reject(new ErrorHandler(500, 'Cloudinary upload failed'));
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

    files.push({
      fieldname,
      filename: info.filename,
      mimeType: info.mimeType,
    });
  });

  bb.on('field', (fieldname, val) => {
    fields[fieldname] = val;

    if (fieldname === 'removedImages' || fieldname === 'existingImages') {
      try {
        formData[fieldname] = JSON.parse(val);
      } catch {
        formData[fieldname] = [];
      }
    } else {
      formData[fieldname] = ['price', 'stock', 'active'].includes(fieldname)
        ? (fieldname === 'active' ? val === 'true' : Number(val))
        : val;
    }
  });

  await new Promise((resolve, reject) => {
    bb.on('finish', resolve);
    bb.on('error', err => reject(new ErrorHandler(500, err.message)));
    req.pipe(bb);
  });

  const existingStamp = await StampModel.findById(id);
  if (!existingStamp) throw new ErrorHandler(404, 'Stamp not found');

  // Delete removed images from Cloudinary
  if (formData.removedImages?.length) {
    await cloudinary.api.delete_resources(formData.removedImages);
    existingStamp.images = existingStamp.images.filter(
      img => !formData.removedImages.includes(img.publicId)
    );
  }

  // Upload new images
  const uploadedImages = await Promise.all(uploadPromises);
  if (uploadedImages.length) {
    existingStamp.images.push(...uploadedImages);
  }

  // Update only provided fields
  const updatableFields = ['name', 'description', 'price', 'stock', 'active', 'beginDate'];
  updatableFields.forEach(field => {
    if (formData[field] !== undefined) {
      existingStamp[field] = formData[field];
    }
  });

  await existingStamp.save();

  res.status(200).json({
    success: true,
    message: 'Stamp updated successfully',
    stamp: existingStamp
  });
});

export const allCarousel = synchFunc(async (_, res) => {
  const Carousels = await CarouselModel.find();
  res.status(201).json({ success:true, Carousels });
});

export const singleCarousel = synchFunc(async (req, res) => {
  const {id} = req.params; 
  const carousel = await CarouselModel.findById(id);
  res.status(201).json({ success:true, carousel });
});
