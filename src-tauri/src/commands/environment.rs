use serde::Serialize;
use std::process::Command;

#[derive(Serialize, Clone, Debug)]
pub struct EnvironmentStatus {
    pub adb: bool,
    pub java: bool,
    pub git: bool,
    pub fastboot: bool,
    pub adb_version: Option<String>,
    pub java_version: Option<String>,
    pub git_version: Option<String>,
    pub fastboot_version: Option<String>,
}

fn run_command(cmd: &str, args: &[&str]) -> Option<String> {
    Command::new(cmd)
        .args(args)
        .output()
        .ok()
        .and_then(|o| {
            let out = String::from_utf8_lossy(&o.stdout).to_string();
            let err = String::from_utf8_lossy(&o.stderr).to_string();
            let combined = if out.trim().is_empty() { err } else { out };
            combined.lines().next().map(|s| s.trim().to_string())
        })
        .filter(|s| !s.is_empty())
}

#[tauri::command]
pub fn check_environment() -> EnvironmentStatus {
    let adb_ver = run_command("adb", &["version"]);
    let java_ver = run_command("java", &["-version"]);
    let git_ver = run_command("git", &["--version"]);
    let fastboot_ver = run_command("fastboot", &["--version"]);

    EnvironmentStatus {
        adb: adb_ver.is_some(),
        java: java_ver.is_some(),
        git: git_ver.is_some(),
        fastboot: fastboot_ver.is_some(),
        adb_version: adb_ver,
        java_version: java_ver,
        git_version: git_ver,
        fastboot_version: fastboot_ver,
    }
}
