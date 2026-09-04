import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import type { MediaFile } from '../store/useStore';

let ffmpegInstance: FFmpeg | null = null;

/**
 * Get or create the FFmpeg instance with CDN-loaded core
 */
const getFFmpeg = async (): Promise<FFmpeg> => {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
    
    // Load FFmpeg core from CDN
    await ffmpegInstance.load({
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
      wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
    });
    
    console.log('FFmpeg core loaded successfully');
  }
  
  return ffmpegInstance;
};

/**
 * Render a test video from the first image in the catalog
 * Creates a 3-second MP4 video at 30fps from a single image
 */
export const renderTestVideo = async (mediaFiles: MediaFile[]): Promise<void> => {
  try {
    if (!mediaFiles || mediaFiles.length === 0) {
      throw new Error('No media files found in catalog. Please upload images first.');
    }
    
    const firstImage = mediaFiles[0];
    console.log(`Rendering test video from: ${firstImage.name}`);
    
    // Get FFmpeg instance
    const ffmpeg = await getFFmpeg();
    
    // Write the image file to FFmpeg's virtual file system
    const inputFilename = 'input.jpg';
    const outputFilename = 'output.mp4';
    
    // Use fetchFile to convert the File object for FFmpeg
    const imageData = await fetchFile(firstImage.file);
    await ffmpeg.writeFile(inputFilename, imageData);
    
    console.log('Image written to FFmpeg virtual file system');
    
    // Execute FFmpeg command to create a 3-second video from the image
    // -loop 1: Loop the input image
    // -i input.jpg: Input file
    // -c:v libx264: Use H.264 codec
    // -t 3: Duration of 3 seconds
    // -pix_fmt yuv420p: Pixel format for compatibility
    // -r 30: Frame rate of 30fps
    await ffmpeg.exec([
      '-loop', '1',
      '-i', inputFilename,
      '-c:v', 'libx264',
      '-t', '3',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      outputFilename
    ]);
    
    console.log('FFmpeg encoding complete');
    
    // Read the output file from FFmpeg's virtual file system
    const outputData = await ffmpeg.readFile(outputFilename);
    
    // Create a Blob from the output data
    // FileData is Uint8Array | string, ensure we have Uint8Array for Blob
    const blob = outputData instanceof Uint8Array 
      ? new Blob([outputData], { type: 'video/mp4' })
      : new Blob([new TextEncoder().encode(outputData as string)], { type: 'video/mp4' });
    
    // Create a download URL and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vignette_test_${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    console.log('Test video downloaded successfully');
    
    // Clean up FFmpeg virtual file system
    await ffmpeg.deleteFile(inputFilename);
    await ffmpeg.deleteFile(outputFilename);
    
  } catch (error: any) {
    console.error('FFmpeg render error:', error);
    throw new Error(`Video render failed: ${error.message}`);
  }
};

/**
 * Reset the FFmpeg instance (useful for cleanup or reinitialization)
 */
export const resetFFmpeg = (): void => {
  if (ffmpegInstance) {
    ffmpegInstance = null;
    console.log('FFmpeg instance reset');
  }
};
