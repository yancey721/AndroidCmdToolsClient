use serde::Serialize;

#[derive(Serialize, Clone, Debug)]
pub struct DeviceInfo {
    pub id: String,
    pub brand: String,
    pub model: String,
    pub android_version: String,
    pub api_level: String,
    pub connection_type: String,
    pub mode: String,
}
