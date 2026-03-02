use crate::models::device::DeviceInfo;
use std::process::Command;

fn get_adb_prop(device_id: &str, prop: &str) -> String {
    Command::new("adb")
        .args(["-s", device_id, "shell", "getprop", prop])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .unwrap_or_default()
}

fn parse_adb_devices() -> Vec<String> {
    let output = Command::new("adb")
        .arg("devices")
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .unwrap_or_default();

    output
        .lines()
        .skip(1)
        .filter_map(|line| {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 && parts[1] == "device" {
                Some(parts[0].to_string())
            } else {
                None
            }
        })
        .collect()
}

fn parse_fastboot_devices() -> Vec<String> {
    let output = Command::new("fastboot")
        .arg("devices")
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .unwrap_or_default();

    output
        .lines()
        .filter_map(|line| {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 && parts[1] == "fastboot" {
                Some(parts[0].to_string())
            } else {
                None
            }
        })
        .collect()
}

#[tauri::command]
pub fn detect_devices() -> Vec<DeviceInfo> {
    let mut devices = Vec::new();

    for id in parse_adb_devices() {
        let connection_type = if id.contains(':') { "tcp" } else { "usb" };
        let brand = get_adb_prop(&id, "ro.product.brand");
        let model = get_adb_prop(&id, "ro.product.model");
        let android_version = get_adb_prop(&id, "ro.build.version.release");
        let api_level = get_adb_prop(&id, "ro.build.version.sdk");

        devices.push(DeviceInfo {
            id: id.clone(),
            brand,
            model,
            android_version,
            api_level,
            connection_type: connection_type.to_string(),
            mode: "adb".to_string(),
        });
    }

    for id in parse_fastboot_devices() {
        devices.push(DeviceInfo {
            id: id.clone(),
            brand: String::new(),
            model: String::new(),
            android_version: String::new(),
            api_level: String::new(),
            connection_type: "usb".to_string(),
            mode: "fastboot".to_string(),
        });
    }

    devices
}
