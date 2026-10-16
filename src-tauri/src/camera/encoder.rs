//! Conversión de frames de la cámara a JPEG.
//!
//! MJPEG se reenvía sin tocar. YUYV y NV12 se reordenan a YCbCr intercalado y se
//! comprimen directamente, sin pasar por RGB.

use bytes::Bytes;
use jpeg_encoder::{ColorType, Encoder, SamplingFactor};
use nokhwa::{utils::FrameFormat, Buffer};

pub struct FrameEncoder {
    quality: u8,
    /// Buffer reutilizado entre frames para la conversión a YCbCr.
    scratch: Vec<u8>,
    last_size: usize,
}

impl FrameEncoder {
    pub fn new(quality: u8) -> Self {
        Self {
            quality,
            scratch: Vec::new(),
            last_size: 0,
        }
    }

    pub fn encode(&mut self, frame: &Buffer) -> Result<Bytes, String> {
        let resolution = frame.resolution();
        let (width, height) = (resolution.width() as usize, resolution.height() as usize);
        let data = frame.buffer();

        let (pixels, color, sampling) = match frame.source_frame_format() {
            FrameFormat::MJPEG => return Ok(frame.buffer_bytes()),
            FrameFormat::YUYV => {
                yuyv_to_ycbcr(data, width, height, &mut self.scratch)?;
                (
                    self.scratch.as_slice(),
                    ColorType::Ycbcr,
                    SamplingFactor::F_2_1,
                )
            }
            FrameFormat::NV12 => {
                nv12_to_ycbcr(data, width, height, &mut self.scratch)?;
                (
                    self.scratch.as_slice(),
                    ColorType::Ycbcr,
                    SamplingFactor::F_2_2,
                )
            }
            FrameFormat::GRAY => (data, ColorType::Luma, SamplingFactor::F_1_1),
            FrameFormat::RAWRGB => (data, ColorType::Rgb, SamplingFactor::F_2_2),
            FrameFormat::RAWBGR => (data, ColorType::Bgr, SamplingFactor::F_2_2),
        };

        let mut out = Vec::with_capacity(self.last_size);
        let mut encoder = Encoder::new(&mut out, self.quality);
        encoder.set_sampling_factor(sampling);
        encoder
            .encode(pixels, to_u16(width)?, to_u16(height)?, color)
            .map_err(|e| format!("JPEG encoding failed: {e}"))?;

        self.last_size = out.len();
        Ok(Bytes::from(out))
    }
}

fn to_u16(value: usize) -> Result<u16, String> {
    u16::try_from(value).map_err(|_| format!("Frame dimension {value} exceeds JPEG limits"))
}

fn check_len(data: &[u8], expected: usize, format: &str) -> Result<(), String> {
    if data.len() < expected {
        return Err(format!(
            "{format} frame too short: {} bytes, expected {expected}",
            data.len()
        ));
    }
    Ok(())
}

/// YUYV (Y0 U Y1 V) -> YCbCr 4:4:4 intercalado; el encoder vuelve a submuestrear a 4:2:2.
fn yuyv_to_ycbcr(src: &[u8], width: usize, height: usize, out: &mut Vec<u8>) -> Result<(), String> {
    let expected = width * height * 2;
    check_len(src, expected, "YUYV")?;

    out.resize(width * height * 3, 0);
    for (px, dst) in src[..expected].chunks_exact(4).zip(out.chunks_exact_mut(6)) {
        let [y0, u, y1, v] = [px[0], px[1], px[2], px[3]];
        dst.copy_from_slice(&[y0, u, v, y1, u, v]);
    }
    Ok(())
}

/// NV12 (plano Y + plano UV intercalado a 4:2:0) -> YCbCr 4:4:4 intercalado.
fn nv12_to_ycbcr(src: &[u8], width: usize, height: usize, out: &mut Vec<u8>) -> Result<(), String> {
    if !width.is_multiple_of(2) || !height.is_multiple_of(2) {
        return Err(format!("NV12 frame with odd dimensions {width}x{height}"));
    }
    let luma_len = width * height;
    check_len(src, luma_len + luma_len / 2, "NV12")?;

    out.resize(luma_len * 3, 0);
    let (y_plane, uv_plane) = src.split_at(luma_len);
    for row in 0..height {
        let y_row = &y_plane[row * width..][..width];
        let uv_row = &uv_plane[(row / 2) * width..][..width];
        let dst_row = &mut out[row * width * 3..][..width * 3];

        for ((y, uv), dst) in y_row
            .chunks_exact(2)
            .zip(uv_row.chunks_exact(2))
            .zip(dst_row.chunks_exact_mut(6))
        {
            dst.copy_from_slice(&[y[0], uv[0], uv[1], y[1], uv[0], uv[1]]);
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use nokhwa::utils::Resolution;

    const JPEG_SOI: [u8; 2] = [0xFF, 0xD8];

    #[test]
    fn yuyv_expands_shared_chroma() {
        let mut out = Vec::new();
        yuyv_to_ycbcr(&[10, 20, 30, 40], 2, 1, &mut out).unwrap();
        assert_eq!(out, [10, 20, 40, 30, 20, 40]);
    }

    #[test]
    fn nv12_expands_shared_chroma_across_rows() {
        // 2x2: Y plane + one UV pair shared by the four pixels.
        let src = [1, 2, 3, 4, 50, 60];
        let mut out = Vec::new();
        nv12_to_ycbcr(&src, 2, 2, &mut out).unwrap();
        assert_eq!(out, [1, 50, 60, 2, 50, 60, 3, 50, 60, 4, 50, 60]);
    }

    #[test]
    fn rejects_truncated_frames() {
        let mut out = Vec::new();
        assert!(yuyv_to_ycbcr(&[0; 3], 2, 1, &mut out).is_err());
        assert!(nv12_to_ycbcr(&[0; 5], 2, 2, &mut out).is_err());
    }

    #[test]
    fn mjpeg_is_passed_through() {
        let payload = [0xFF, 0xD8, 1, 2, 3, 0xFF, 0xD9];
        let frame = Buffer::new(Resolution::new(2, 2), &payload, FrameFormat::MJPEG);
        let jpeg = FrameEncoder::new(80).encode(&frame).unwrap();
        assert_eq!(jpeg.as_ref(), payload);
    }

    #[test]
    fn raw_formats_produce_jpeg() {
        let cases = [
            (FrameFormat::YUYV, vec![128; 16 * 16 * 2]),
            (FrameFormat::NV12, vec![128; 16 * 16 * 3 / 2]),
            (FrameFormat::GRAY, vec![128; 16 * 16]),
            (FrameFormat::RAWRGB, vec![128; 16 * 16 * 3]),
        ];
        let mut encoder = FrameEncoder::new(80);
        for (format, data) in cases {
            let frame = Buffer::new(Resolution::new(16, 16), &data, format);
            let jpeg = encoder.encode(&frame).unwrap();
            assert_eq!(jpeg[..2], JPEG_SOI, "{format:?}");
        }
    }
}
