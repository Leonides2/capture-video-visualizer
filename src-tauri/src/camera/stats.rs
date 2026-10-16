//! Métricas del pipeline de captura, resumidas una vez por segundo.

use std::time::{Duration, Instant};

use serde::Serialize;

use crate::stream_server;

const REPORT_INTERVAL: Duration = Duration::from_secs(1);

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureStats {
    /// Frames leídos de la cámara por segundo.
    pub capture_fps: f32,
    /// Frames escritos al cliente HTTP por segundo.
    pub served_fps: f32,
    /// Frames descartados porque el cliente no alcanzó a pedirlos.
    pub skipped_frames: u64,
    /// Tiempo medio de codificación JPEG (≈0 en MJPEG passthrough).
    pub encode_ms: f32,
    pub frame_kb: f32,
    pub passthrough: bool,
}

pub struct StatsWindow {
    started: Instant,
    frames: u32,
    encode_time: Duration,
    bytes: usize,
    passthrough: bool,
}

impl StatsWindow {
    pub fn new(passthrough: bool) -> Self {
        Self {
            started: Instant::now(),
            frames: 0,
            encode_time: Duration::ZERO,
            bytes: 0,
            passthrough,
        }
    }

    pub fn record(&mut self, encode_time: Duration, bytes: usize) {
        self.frames += 1;
        self.encode_time += encode_time;
        self.bytes += bytes;
    }

    /// Devuelve el resumen si ya pasó el intervalo y empieza una ventana nueva.
    pub fn take_report(&mut self) -> Option<CaptureStats> {
        let elapsed = self.started.elapsed();
        if elapsed < REPORT_INTERVAL {
            return None;
        }

        let seconds = elapsed.as_secs_f32();
        let frames = self.frames.max(1) as f32;
        let (served, skipped) = stream_server::take_delivery_counts();

        let report = CaptureStats {
            capture_fps: self.frames as f32 / seconds,
            served_fps: served as f32 / seconds,
            skipped_frames: skipped,
            encode_ms: self.encode_time.as_secs_f32() * 1000.0 / frames,
            frame_kb: self.bytes as f32 / 1024.0 / frames,
            passthrough: self.passthrough,
        };
        *self = Self::new(self.passthrough);
        Some(report)
    }
}
