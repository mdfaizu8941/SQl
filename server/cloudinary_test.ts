import { v2 as cloudinary } from 'cloudinary';

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: 'stinjyee',
  api_key: '685772169732352',
  api_secret: 'S3s55JFT5i2mcR8lY_PkUKlrxkM'
});

async function run() {
  try {
    // 2. Upload an image
    console.log("Uploading image...");
    const uploadResult = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      { public_id: 'cloudinary_onboarding_sample' }
    );
    
    console.log("\n--- Upload Successful ---");
    console.log("Secure URL:", uploadResult.secure_url);
    console.log("Public ID:", uploadResult.public_id);

    // 3. Get image details
    console.log("\n--- Image Details ---");
    console.log("Width:", uploadResult.width);
    console.log("Height:", uploadResult.height);
    console.log("Format:", uploadResult.format);
    console.log("File Size (bytes):", uploadResult.bytes);

    // 4. Transform the image
    // f_auto: Automatically selects the most efficient image format based on the user's browser.
    // q_auto: Automatically adjusts the image quality to reduce file size without visible degradation.
    const transformedUrl = cloudinary.url('cloudinary_onboarding_sample', {
      fetch_format: 'auto',
      quality: 'auto'
    });

    console.log("\n--- Transformation Successful ---");
    console.log("Done! Click link below to see optimized version of the image. Check the size and the format.");
    console.log(transformedUrl);

  } catch (error) {
    console.error("Error during Cloudinary operations:", error);
  }
}

run();
